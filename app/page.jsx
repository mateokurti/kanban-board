"use client";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Header from "../components/Header";
import KanbanBoardNew from "../components/KanbanBoardNew";
import Sidebar, { MY_WORK, SHOW_ALL_TEAMS, UNASSIGNED_PROJECT } from "../components/Sidebar";
import TableView from "../components/TableView";
import TaskModal from "../components/TaskModal";
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
    const matchesActiveProject = Boolean(activeProject && activeProject !== UNASSIGNED_PROJECT && task.projectId === activeProject);
    const isUnassignedProject = activeProject === UNASSIGNED_PROJECT;

    const teamMatches = (() => {
      if (activeTeam === SHOW_ALL_TEAMS) return true;
      if (activeTeam === MY_WORK) {
        // Show only tasks in teams where user is a member
        if (!session?.user?.id) return false;
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

    if (isUnassignedProject) {
      // Show tasks that have the active team but NO project
      return task.teamId === activeTeam && (task.projectId === null || task.projectId === undefined);
    }

    if (activeProject) {
      const projectlessVisible =
        activeTeam !== SHOW_ALL_TEAMS &&
        (task.projectId === null || task.projectId === undefined);
      if (!matchesActiveProject && !projectlessVisible) {
        return false;
      }
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
      <Sidebar onTeamChange={handleTeamChange} onProjectChange={handleProjectChange} />
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
              {activeView === "kanban" ? (
                <KanbanBoardNew tasks={filteredTasks} onMoved={fetchTasks} />
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

        <TaskModal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          initialTeam={activeTeam !== SHOW_ALL_TEAMS ? activeTeam : ""}
          initialProject={activeProject || ""}
          onTaskCreated={() => fetchTasks(true)}
        />
      </div>
    </div>
  );
}
