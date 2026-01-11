"use client";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Dashboard from "../components/Dashboard";
import Header from "../components/Header";
import ModernKanbanBoard from "../components/ModernKanbanBoard";
import ModernTaskModal from "../components/ModernTaskModal";
import NewSidebar, { MY_WORK, SHOW_ALL_TEAMS, UNASSIGNED_PROJECT, UNASSIGNED_TEAM } from "../components/NewSidebar";
import TableView from "../components/TableView";
import { getTasks } from "../lib/api/tasks";

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeView, setActiveView] = useState("kanban");
  const [activeTeam, setActiveTeam] = useState(SHOW_ALL_TEAMS);
  const [activeProject, setActiveProject] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    if (!session?.user?.email) {
      setActiveTeam(null);
      return;
    }

    const activeTeamKey = `kanban-active-team-${session.user.email}`;
    const savedActiveTeam = localStorage.getItem(activeTeamKey);
    if (savedActiveTeam) {
      setActiveTeam(savedActiveTeam);
    } else {
      setActiveTeam(null);
    }
  }, [session?.user?.email]);

  const fetchTasks = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [tasksData, teamsData] = await Promise.all([
        getTasks(),
        fetch('/api/teams').then(res => res.json())
      ]);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setTeams(Array.isArray(teamsData) ? teamsData : []);
      setError(null);
    } catch (err) {
      setError(err.message);
      setTasks([]);
      setTeams([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();

    const interval = setInterval(() => {
      fetchTasks(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchTasks]);

  // Refetch tasks when returning from new-task page
  useEffect(() => {
    const refreshParam = searchParams.get('refresh');
    if (refreshParam) {
      fetchTasks();
      // Clean up URL without the refresh param
      router.replace('/');
    }
  }, [searchParams, fetchTasks, router]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleTeamChange = (teamId) => {
    if (teamId === null) {
      setActiveTeam(null);
      return;
    }
    setActiveTeam(teamId ?? SHOW_ALL_TEAMS);
  };

  const handleProjectChange = (projectId) => {
    setActiveProject(projectId || null);
  };

  const handlePriorityFilter = (priorities) => {
    setPriorityFilter(priorities);
  };

  const filteredTasks = tasks.filter((task) => {
    // If a project is selected, only show tasks for that project
    if (activeProject === UNASSIGNED_PROJECT) {
      // Show tasks with no project assigned
      return task.projectId === null || task.projectId === undefined;
    } else if (activeProject) {
      // Show tasks assigned to the selected project
      return task.projectId === activeProject;
    }

    // No project filter, apply team and other filters
    const matchesActiveProject = Boolean(activeProject && activeProject !== UNASSIGNED_PROJECT && task.projectId === activeProject);

    const teamMatches = (() => {
      if (activeTeam === SHOW_ALL_TEAMS) return true;
      if (activeTeam === UNASSIGNED_TEAM) {
        // Show tasks with no team assigned
        return task.teamId === null || task.teamId === undefined;
      }
      if (activeTeam === MY_WORK) {
        // Show tasks assigned to the user OR in teams where user is a member
        if (!session?.user?.id) return false;
        
        // Check if task is directly assigned to user
        const isAssignedToUser = task.assignedTo === session.user.id || task.assignedTo?._id === session.user.id;
        if (isAssignedToUser) return true;
        
        // Check if user is in the task's team
        if (!task.teamId) return false;
        const team = teams.find(t => t._id === task.teamId);
        if (!team) return false;
        // Check if user is owner or member
        const isOwner = team.userId === session.user.id;
        const isMember = team.members?.some(m => m.userId?._id === session.user.id || m.userId === session.user.id);
        return isOwner || isMember;
      }
      if (matchesActiveProject && activeTeam !== null) return true;
      if (activeTeam === null) {
        return task.teamId === null || task.teamId === undefined;
      }
      // When a specific team is selected, only show tasks assigned to that team
      return task.teamId === activeTeam;
    })();

    if (!teamMatches) {
      return false;
    }

    if (priorityFilter.length > 0 && !priorityFilter.includes(task.priority)) {
      return false;
    }

    if (!searchQuery || searchQuery.trim() === "") return true;
    const query = searchQuery.toLowerCase().trim();
    const titleMatch = task.title && task.title.toLowerCase().includes(query);
    const descMatch =
      task.description && task.description.toLowerCase().includes(query);
    return titleMatch || descMatch;
  });

  return (
    <div className="app-layout">
      <NewSidebar onTeamChange={handleTeamChange} onProjectChange={handleProjectChange} />
      <div className="main-content">
        <Header
          onAddNew={() => setShowTaskModal(true)}
          onSearch={handleSearch}
          activeView={activeView}
          onViewChange={setActiveView}
          onPriorityFilter={handlePriorityFilter}
        />
        <div className="content-area">
          {loading && <div className="loading">Loading tasks...</div>}
          {error && <div className="error-message">{error}</div>}
          {!loading && (
            <>
              {activeView === "analytics" ? (
                <Dashboard tasks={filteredTasks} teams={teams} />
              ) : activeView === "kanban" ? (
                <ModernKanbanBoard tasks={filteredTasks} onMoved={fetchTasks} />
              ) : (
                <TableView tasks={filteredTasks} />
              )}
            </>
          )}
        </div>

        <div className="mobile-bottom-nav">
          <div className="mobile-nav-items">
            <button className="mobile-nav-item">
              <span className="mobile-nav-icon">📅</span>
              <span>Schedule</span>
            </button>
            <button className="mobile-nav-item active">
              <span className="mobile-nav-icon">▦</span>
              <span>Tasks</span>
            </button>
            <button className="mobile-add-btn">+</button>
            <button className="mobile-nav-item">
              <span className="mobile-nav-icon">📝</span>
              <span>Notes</span>
            </button>
            <button className="mobile-nav-item">
              <span className="mobile-nav-icon">⋯</span>
              <span>More</span>
            </button>
          </div>
        </div>

        <ModernTaskModal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          initialTeam={activeTeam !== SHOW_ALL_TEAMS && activeTeam !== MY_WORK && activeTeam !== UNASSIGNED_TEAM ? activeTeam : ""}
          initialProject={activeProject && activeProject !== UNASSIGNED_PROJECT ? activeProject : ""}
          onTaskCreated={() => fetchTasks(true)}
        />
      </div>
    </div>
  );
}
