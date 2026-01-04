"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Header from "../components/Header";
import KanbanBoardNew from "../components/KanbanBoardNew";
import Sidebar, { SHOW_ALL_TEAMS } from "../components/Sidebar";
import TableView from "../components/TableView";
import { getTasks } from "../lib/api/tasks";

export default function Page() {
  const router = useRouter();
  const { data: session } = useSession();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeView, setActiveView] = useState("kanban");
  const [activeTeam, setActiveTeam] = useState(SHOW_ALL_TEAMS);
  const [activeProject, setActiveProject] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState([]);

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
      const data = await getTasks();
      setTasks(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message);
      setTasks([]);
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
    const matchesActiveProject = Boolean(activeProject && task.projectId === activeProject);

    const teamMatches = (() => {
      if (activeTeam === SHOW_ALL_TEAMS) return true;
      if (matchesActiveProject && activeTeam !== null) return true;
      if (activeTeam === null) {
        return task.teamId === null || task.teamId === undefined;
      }
      return (
        task.teamId === activeTeam ||
        task.teamId === null ||
        task.teamId === undefined
      );
    })();

    if (!teamMatches) {
      return false;
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
          onAddNew={() => {
            const params = new URLSearchParams();
            if (activeTeam && activeTeam !== SHOW_ALL_TEAMS) {
              params.set("team", activeTeam);
            }
            if (activeProject) {
              params.set("project", activeProject);
            }
            const query = params.toString();
            router.push(`/new-task${query ? `?${query}` : ""}`);
          }}
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
      </div>
    </div>
  );
}
