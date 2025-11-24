
"use client";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import KanbanBoard from "../components/KanbanBoard";
import TaskForm from "../components/TaskForm";
import { getTasks } from "../lib/api/tasks";

export default function Page() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTasks();
      setTasks(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const getUsername = () =>
    session?.user?.name ? session.user.name : "User";

  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    done: tasks.filter((t) => t.status === "done").length,
    high: tasks.filter((t) => t.priority === "high").length,
    medium: tasks.filter((t) => t.priority === "medium").length,
    low: tasks.filter((t) => t.priority === "low").length,
  };

  const progressPercent =
    stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="page-shell">
      <div className="page-container">
        <div className="main-layout">
          {/* Left side - Kanban Board */}
          <section className="kanban-section">
            <header className="page-header">
              <h1 className="page-title">Task Board</h1>
              <p className="page-subtitle">Manage and track your tasks</p>
            </header>

            <TaskForm onCreated={fetchTasks} />

            {loading && <div className="loading">Loading tasks...</div>}
            {error && <div className="error-message">{error}</div>}
            {!loading && (
              <KanbanBoard tasks={tasks} onMoved={fetchTasks} />
            )}
          </section>

          {/* Right side - Dashboard */}
          <aside className="dashboard-section">
            <div className="welcome-card">
              <h2 className="welcome-title">
                Hello, {getUsername()}! <span className="wave">👋</span>
              </h2>
              <p className="welcome-text">
                Welcome back to your workspace. Here's an overview of your
                tasks.
              </p>

              <div className="dashboard-stats">
                <div className="stat-item">
                  <div className="stat-value-large">{stats.total}</div>
                  <div className="stat-label-large">Total Tasks</div>
                </div>

                <div className="stats-grid">
                  <div className="stat-mini stat-mini--open">
                    <div className="stat-mini-value">{stats.todo}</div>
                    <div className="stat-mini-label">Open</div>
                  </div>
                  <div className="stat-mini stat-mini--progress">
                    <div className="stat-mini-value">{stats.inProgress}</div>
                    <div className="stat-mini-label">In Progress</div>
                  </div>
                  <div className="stat-mini stat-mini--done">
                    <div className="stat-mini-value">{stats.done}</div>
                    <div className="stat-mini-label">Done</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="priority-card">
              <h3 className="card-title">Priority Breakdown</h3>
              <div className="priority-list">
                <div className="priority-item">
                  <div className="priority-dot priority-dot--high" />
                  <span className="priority-text">High Priority</span>
                  <span className="priority-count">{stats.high}</span>
                </div>
                <div className="priority-item">
                  <div className="priority-dot priority-dot--medium" />
                  <span className="priority-text">Medium Priority</span>
                  <span className="priority-count">{stats.medium}</span>
                </div>
                <div className="priority-item">
                  <div className="priority-dot priority-dot--low" />
                  <span className="priority-text">Low Priority</span>
                  <span className="priority-count">{stats.low}</span>
                </div>
              </div>
            </div>

            {stats.total > 0 && (
              <div className="progress-card">
                <h3 className="card-title">Overall Progress</h3>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="progress-text">
                  {progressPercent}% Complete
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
