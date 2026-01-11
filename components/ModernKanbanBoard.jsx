"use client";

import { useEffect, useRef, useState } from "react";
import { deleteTask, updateTask } from "../lib/api/tasks";

const COLUMNS = [
  {
    id: "todo",
    title: "To Do",
    status: "todo",
    icon: "📋",
    color: "#8b5cf6",
    bgColor: "#f5f3ff"
  },
  {
    id: "in-progress",
    title: "In Progress",
    status: "in-progress",
    icon: "⚡",
    color: "#3b82f6",
    bgColor: "#eff6ff"
  },
  {
    id: "completed",
    title: "Completed",
    status: "done",
    icon: "✓",
    color: "#10b981",
    bgColor: "#f0fdf4"
  }
];

export default function ModernKanbanBoard({ tasks = [], onMoved }) {
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    assignedTo: ""
  });
  const [editTeamMembers, setEditTeamMembers] = useState([]);
  const [optimisticUpdates, setOptimisticUpdates] = useState({});
  const pendingUpdates = useRef(new Set());

  // Clean up optimistic updates when server state arrives
  useEffect(() => {
    setOptimisticUpdates((prev) => {
      const next = { ...prev };
      let changed = false;

      Object.keys(next).forEach((taskId) => {
        const serverTask = tasks.find((t) => t._id === taskId);
        const optimistic = next[taskId];

        // If deleted and not in server list, clear it
        if (optimistic.deleted && !serverTask) {
          delete next[taskId];
          changed = true;
          return;
        }

        // If server state matches optimistic update, clear it
        if (serverTask && !optimistic.deleted) {
          let matches = true;
          Object.keys(optimistic).forEach((key) => {
            if (serverTask[key] !== optimistic[key]) {
              matches = false;
            }
          });
          if (matches) {
            delete next[taskId];
            changed = true;
          }
        }
      });

      return changed ? next : prev;
    });
  }, [tasks]);

  // Apply optimistic updates to tasks
  const displayTasks = tasks
    .map((task) => {
      const update = optimisticUpdates[task._id];
      return update ? { ...task, ...update } : task;
    })
    .filter((task) => !optimisticUpdates[task._id]?.deleted);

  const getTasksForColumn = (columnId) => {
    const column = COLUMNS.find(c => c.id === columnId);
    if (!column) return [];

    return displayTasks.filter(task => {
      return task.status === column.status;
    });
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedTask) return;

    const column = COLUMNS.find(c => c.id === columnId);
    if (!column) return;

    const updates = {
      status: column.status,
      scheduled: false
    };

    // Optimistic update
    pendingUpdates.current.add(draggedTask._id);
    setOptimisticUpdates((prev) => ({
      ...prev,
      [draggedTask._id]: { ...prev[draggedTask._id], ...updates },
    }));

    try {
      await updateTask(draggedTask._id, updates);
      pendingUpdates.current.delete(draggedTask._id);
      // Silent refresh in background
      if (onMoved) setTimeout(() => onMoved(), 100);
    } catch (err) {
      console.error("Failed to move task:", err);
      alert(err.message);
      pendingUpdates.current.delete(draggedTask._id);
      // Revert optimistic update on error
      setOptimisticUpdates((prev) => {
        const next = { ...prev };
        delete next[draggedTask._id];
        return next;
      });
    }

    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const startEdit = async (task) => {
    setEditingTask(task._id);
    setEditForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority || "medium",
      assignedTo: task.assignedTo?._id || task.assignedTo || ""
    });

    // Load team members if task has a team
    if (task.teamId) {
      try {
        const response = await fetch('/api/teams');
        const data = await response.json();
        const team = data.teams?.find(t => t._id === task.teamId);
        setEditTeamMembers(team?.members || []);
      } catch (err) {
        console.error('Failed to load team members:', err);
        setEditTeamMembers([]);
      }
    } else {
      setEditTeamMembers([]);
    }
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditForm({ title: "", description: "", priority: "medium", assignedTo: "" });
    setEditTeamMembers([]);
  };

  const saveEdit = async (taskId) => {
    // Optimistic update
    pendingUpdates.current.add(taskId);
    setOptimisticUpdates((prev) => ({
      ...prev,
      [taskId]: { ...prev[taskId], ...editForm },
    }));
    setEditingTask(null);

    try {
      await updateTask(taskId, editForm);
      pendingUpdates.current.delete(taskId);
    } catch (err) {
      alert(err.message);
      pendingUpdates.current.delete(taskId);
      setOptimisticUpdates((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      if (onMoved) onMoved();
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm("Delete this task?")) return;
    
    // Optimistic delete
    pendingUpdates.current.add(taskId);
    setOptimisticUpdates((prev) => ({
      ...prev,
      [taskId]: { ...prev[taskId], deleted: true },
    }));

    try {
      await deleteTask(taskId);
      pendingUpdates.current.delete(taskId);
    } catch (err) {
      alert(err.message);
      pendingUpdates.current.delete(taskId);
      setOptimisticUpdates((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      if (onMoved) onMoved();
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "#ef4444";
      case "medium": return "#f59e0b";
      case "low": return "#3b82f6";
      default: return "#6b7280";
    }
  };

  const getPriorityBg = (priority) => {
    switch (priority) {
      case "high": return "#fef2f2";
      case "medium": return "#fffbeb";
      case "low": return "#eff6ff";
      default: return "#f9fafb";
    }
  };

  return (
    <div className="modern-kanban">
      <div className="modern-kanban-container">
        {COLUMNS.map((column) => {
          const columnTasks = getTasksForColumn(column.id);
          const isOver = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              className={`modern-kanban-column ${isOver ? "drag-over" : ""}`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="modern-kanban-header" style={{ borderLeftColor: column.color }}>
                <div className="modern-kanban-header-left">
                  <span className="modern-kanban-icon">{column.icon}</span>
                  <h3 className="modern-kanban-title">{column.title}</h3>
                </div>
                <span className="modern-kanban-count" style={{ 
                  backgroundColor: column.bgColor,
                  color: column.color
                }}>
                  {columnTasks.length}
                </span>
              </div>

              {/* Tasks */}
              <div className="modern-kanban-tasks">
                {columnTasks.length === 0 ? (
                  <div className="modern-kanban-empty">
                    <span style={{ fontSize: "32px", opacity: 0.3 }}>{column.icon}</span>
                    <p>No tasks</p>
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task._id}
                      className={`modern-task-card ${draggedTask?._id === task._id ? "dragging" : ""}`}
                      draggable={editingTask !== task._id}
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                    >
                      {editingTask === task._id ? (
                        /* Edit Mode */
                        <div className="modern-task-edit">
                          <input
                            className="modern-task-input"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            placeholder="Task title"
                          />

                          <textarea
                            className="modern-task-textarea"
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            placeholder="Description"
                            rows={3}
                          />
                          
                          <select
                            className="modern-task-select"
                            value={editForm.priority}
                            onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                          >
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority</option>
                            <option value="urgent">Urgent Priority</option>
                          </select>
                          
                          <select
                            className="modern-task-select"
                            value={editForm.assignedTo}
                            onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
                          >
                            <option value="">Unassigned</option>
                            {editTeamMembers.map((member) => {
                              const memberId = typeof member.userId === 'string' ? member.userId : member.userId?._id;
                              const memberName = member.name || member.userId?.name || member.email || "Unknown";
                              return (
                                <option key={memberId} value={memberId}>
                                  {memberName} ({member.role})
                                </option>
                              );
                            })}
                          </select>
                          
                          {editTeamMembers.length === 0 && (
                            <div style={{ fontSize: '12px', color: '#8b949e', marginTop: '-8px' }}>
                              Assign a team to this task to assign users
                            </div>
                          )}
                          
                          <div className="modern-task-actions">
                            <button className="modern-btn modern-btn-primary" onClick={() => saveEdit(task._id)}>
                              Save
                            </button>
                            <button className="modern-btn modern-btn-secondary" onClick={cancelEdit}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* View Mode */
                        <>
                          <div className="modern-task-header">
                            <div 
                              className="modern-task-priority"
                              style={{
                                backgroundColor: getPriorityBg(task.priority),
                                color: getPriorityColor(task.priority)
                              }}
                            >
                              <span className="modern-task-priority-dot" style={{ backgroundColor: getPriorityColor(task.priority) }} />
                              {task.priority || "medium"}
                            </div>
                            <div className="modern-task-menu">
                              <button className="modern-task-menu-btn" onClick={() => startEdit(task)}>
                                ✎
                              </button>
                              <button 
                                className="modern-task-menu-btn modern-task-delete" 
                                onClick={() => handleDelete(task._id)}
                              >
                                ×
                              </button>
                            </div>
                          </div>

                          <h4 className="modern-task-title">{task.title}</h4>
                          
                          {task.description && (
                            <p className="modern-task-description">{task.description}</p>
                          )}

                          <div className="modern-task-footer">
                            {task.assignedTo && (
                              <div className="modern-task-assignee">
                                <div className="modern-task-avatar">
                                  {(task.assignedTo.name || task.assignedTo.email || "U").charAt(0).toUpperCase()}
                                </div>
                                <span className="modern-task-assignee-name">
                                  {task.assignedTo.name || task.assignedTo.email}
                                </span>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
