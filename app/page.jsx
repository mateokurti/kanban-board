"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import KanbanBoardNew from "../components/KanbanBoardNew";
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
  const [activeTeam, setActiveTeam] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState([]);

  // Load active team from localStorage on mount or when user changes
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

    // Background sync every 10 seconds (silent, no loading state)
    const interval = setInterval(() => {
      fetchTasks(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchTasks]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleTeamChange = (teamName) => {
    setActiveTeam(teamName);
  };

  const handlePriorityFilter = (priorities) => {
    setPriorityFilter(priorities);
  };

  const filteredTasks = tasks.filter((task) => {
    // Filter by team first
    if (activeTeam !== null) {
      // If a team is selected, only show tasks that belong to that team
      if (task.teamId !== activeTeam) {
        return false;
      }
    } else {
      // If no team is selected, only show tasks with no team (teamId is null or undefined)
      if (task.teamId !== null && task.teamId !== undefined) {
        return false;
      }
    }

    // Filter by priority
    if (priorityFilter.length > 0) {
      if (!priorityFilter.includes(task.priority)) {
        return false;
      }
    }

    // Then filter by search query
    if (!searchQuery || searchQuery.trim() === "") return true;
    const query = searchQuery.toLowerCase().trim();
    const titleMatch = task.title && task.title.toLowerCase().includes(query);
    const descMatch =
      task.description && task.description.toLowerCase().includes(query);
    return titleMatch || descMatch;
  });

  return (
    <div className="app-layout">
      <Sidebar onTeamChange={handleTeamChange} />
      <div className="main-content">
        <Header
          onAddNew={() => {
            const url = activeTeam
              ? `/new-task?team=${encodeURIComponent(activeTeam)}`
              : "/new-task";
            router.push(url);
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

        {/* Mobile Bottom Navigation */}
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
