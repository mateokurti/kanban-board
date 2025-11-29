"use client";

import { useState } from "react";
import { updateTask, deleteTask } from "../lib/api/tasks";

export default function KanbanBoardNew({ tasks = [], onMoved }) {
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "medium",
  });

  // UI Columns
  const columns = [
    { key: "new-task", title: "New task", dbStatus: "todo" },
    { key: "scheduled", title: "To do", dbStatus: "todo" }, // purely visual
    { key: "in-progress", title: "In progress", dbStatus: "in-progress" },
    { key: "completed", title: "Completed", dbStatus: "done" },
  ];

  // Avatar colors
  const avatarColors = [
    "#ff6b6b",
    "#4ecdc4",
    "#45b7d1",
    "#96ceb4",
    "#ffeaa7",
    "#a29bfe",
  ];

  const getAvatarColor = (i) => avatarColors[i % avatarColors.length];

  // Convert UI column → DB value
  function getDbStatus(uiCol) {
    if (uiCol === "new-task" || uiCol === "scheduled") return "todo";
    if (uiCol === "in-progress") return "in-progress";
    if (uiCol === "completed") return "done";
  }

  // Get all tasks that map to a UI column
  function getTasksForColumn(uiCol) {
    if (uiCol === "new-task") {
      // New task column shows todo tasks that are NOT scheduled
      return tasks.filter((t) => t.status === "todo" && !t.scheduled);
    }

    if (uiCol === "scheduled") {
      // Scheduled column shows todo tasks that ARE scheduled
      return tasks.filter((t) => t.status === "todo" && t.scheduled);
    }

    const dbStatus = getDbStatus(uiCol);
    return tasks.filter((t) => t.status === dbStatus);
  }

  // === Option B Movement ===
  function getNextColumn(uiCol) {
    if (uiCol === "new-task") return "scheduled";
    if (uiCol === "scheduled") return "in-progress";
    if (uiCol === "in-progress") return "completed";
    return null;
  }

  function getPrevColumn(uiCol) {
    if (uiCol === "completed") return "in-progress";
    if (uiCol === "in-progress") return "scheduled";
    if (uiCol === "scheduled") return "new-task";
    return null;
  }

  // Move a task forward/backward
  async function moveTask(task, uiCol) {
    const newDbStatus = getDbStatus(uiCol);
    const updateData = { status: newDbStatus };

    // Handle scheduled flag based on destination column
    if (uiCol === "scheduled") {
      // Moving to scheduled column
      updateData.scheduled = true;
    } else if (uiCol === "new-task") {
      // Moving to new-task column
      updateData.scheduled = false;
    } else {
      // Moving to in-progress or completed - clear scheduled flag
      updateData.scheduled = false;
    }

    try {
      await updateTask(task._id, updateData);
      if (onMoved) onMoved();
    } catch (err) {
      alert(err.message);
    }
  }

  // Editing
  function startEdit(task) {
    setEditingTask(task._id);
    setEditForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority || "medium",
    });
  }

  function cancelEdit() {
    setEditingTask(null);
    setEditForm({ title: "", description: "", priority: "medium" });
  }

  async function saveEdit(id) {
    try {
      await updateTask(id, editForm);
      setEditingTask(null);
      if (onMoved) onMoved();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this task?")) return;

    try {
      await deleteTask(id);
      if (onMoved) onMoved();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="kanban-board-new">
      {columns.map((col) => {
        const columnTasks = getTasksForColumn(col.key);

        return (
          <div key={col.key} className="kanban-column-new">
            {/* Column Header */}
            <div className="kanban-column-header-new">
              <h3 className="kanban-column-title-new">{col.title}</h3>
              <span className="kanban-column-count-new">
                {columnTasks.length}
              </span>
            </div>

            {/* Column Body */}
            <div className="kanban-column-body-new">
              {columnTasks.length === 0 ? (
                <div className="kanban-empty-new">No tasks</div>
              ) : (
                columnTasks.map((task, idx) => {
                  // Determine UI column for the task
                  const uiColumn =
                    task.status === "todo" && task.scheduled
                      ? "scheduled"
                      : task.status === "todo"
                      ? "new-task"
                      : task.status === "in-progress"
                      ? "in-progress"
                      : "completed";

                  return (
                    <div key={task._id}>
                      {/* Edit Mode */}
                      {editingTask === task._id ? (
                        <div className="task-card-edit">
                          <input
                            className="task-edit-input"
                            value={editForm.title}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                title: e.target.value,
                              })
                            }
                          />
                          <textarea
                            className="task-edit-textarea"
                            value={editForm.description}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                description: e.target.value,
                              })
                            }
                            rows={3}
                          />
                          <select
                            className="task-edit-select"
                            value={editForm.priority}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                priority: e.target.value,
                              })
                            }
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>

                          <div className="task-edit-actions">
                            <button
                              className="btn-save"
                              onClick={() => saveEdit(task._id)}
                            >
                              Save
                            </button>
                            <button
                              className="btn-cancel"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* View Mode */
                        <div
                          className="task-card-new"
                          style={{
                            borderLeft: `3px solid ${
                              task.priority === "high"
                                ? "#ff7875"
                                : task.priority === "medium"
                                ? "#ffc069"
                                : "#91d5ff"
                            }`,
                          }}
                        >
                          {/* Top: Avatar + Title */}
                          <div className="task-card-user">
                            <div
                              className="task-avatar"
                              style={{
                                backgroundColor: getAvatarColor(idx),
                              }}
                            >
                              {task.title.charAt(0).toUpperCase()}
                            </div>

                            <h4 className="task-card-title-new">
                              {task.title}
                            </h4>
                          </div>

                          {/* Description */}
                          {task.description && (
                            <p className="task-card-description-new">
                              {task.description}
                            </p>
                          )}

                          {/* Priority Badge */}
                          <div className="task-labels">
                            <span
                              className={`task-label ${
                                task.priority === "high"
                                  ? "task-label-asap"
                                  : task.priority === "medium"
                                  ? "task-label-feedback"
                                  : "task-label-blocked"
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>

                          {/* Task Actions */}
                          <div className="task-card-actions">
                            {/* Move Backward */}
                            {getPrevColumn(uiColumn) && (
                              <button
                                className="task-action-btn"
                                onClick={() =>
                                  moveTask(task, getPrevColumn(uiColumn))
                                }
                              >
                                ←
                              </button>
                            )}

                            {/* Move Forward */}
                            {getNextColumn(uiColumn) && (
                              <button
                                className="task-action-btn task-action-btn-primary"
                                onClick={() =>
                                  moveTask(task, getNextColumn(uiColumn))
                                }
                              >
                                →
                              </button>
                            )}

                            {/* Edit */}
                            <button
                              className="task-action-btn"
                              onClick={() => startEdit(task)}
                            >
                              ✎
                            </button>

                            {/* Delete */}
                            <button
                              className="task-action-btn task-action-btn-danger"
                              onClick={() => handleDelete(task._id)}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
