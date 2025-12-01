"use client";

import { useState, useEffect, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { updateTask, deleteTask } from "../lib/api/tasks";

export default function KanbanBoardNew({ tasks = [], onMoved }) {
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "medium",
  });
  const [activeId, setActiveId] = useState(null);
  const [optimisticUpdates, setOptimisticUpdates] = useState({});
  const pendingUpdates = useRef(new Set());

  // Clean up optimistic updates when server state matches
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
  );

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
      return displayTasks.filter((t) => t.status === "todo" && !t.scheduled);
    }

    if (uiCol === "scheduled") {
      // Scheduled column shows todo tasks that ARE scheduled
      return displayTasks.filter((t) => t.status === "todo" && t.scheduled);
    }

    const dbStatus = getDbStatus(uiCol);
    return displayTasks.filter((t) => t.status === dbStatus);
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

    // Optimistic update
    pendingUpdates.current.add(task._id);
    setOptimisticUpdates((prev) => ({
      ...prev,
      [task._id]: { ...prev[task._id], ...updateData },
    }));

    try {
      await updateTask(task._id, updateData);
      pendingUpdates.current.delete(task._id);
      // Don't refetch - optimistic update stays until auto-cleanup
    } catch (err) {
      alert(err.message);
      pendingUpdates.current.delete(task._id);
      setOptimisticUpdates((prev) => {
        const next = { ...prev };
        delete next[task._id];
        return next;
      });
      if (onMoved) onMoved(); // Only revert on error
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
    // Optimistic update
    pendingUpdates.current.add(id);
    setOptimisticUpdates((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...editForm },
    }));
    setEditingTask(null);

    try {
      await updateTask(id, editForm);
      pendingUpdates.current.delete(id);
      // Don't refetch - optimistic update stays until auto-cleanup
    } catch (err) {
      alert(err.message);
      pendingUpdates.current.delete(id);
      setOptimisticUpdates((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (onMoved) onMoved(); // Only revert on error
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this task?")) return;

    // Optimistic delete
    pendingUpdates.current.add(id);
    setOptimisticUpdates((prev) => ({
      ...prev,
      [id]: { ...prev[id], deleted: true },
    }));

    try {
      await deleteTask(id);
      pendingUpdates.current.delete(id);
      // Don't refetch - optimistic update stays until auto-cleanup
    } catch (err) {
      alert(err.message);
      pendingUpdates.current.delete(id);
      setOptimisticUpdates((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (onMoved) onMoved(); // Only revert on error
    }
  }

  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTask = displayTasks.find((t) => t._id === active.id);
    if (!activeTask) return;

    // Determine which column the task was dropped on
    let targetColumn = over.id;

    // If dropped on another task, get that task's column
    if (targetColumn.startsWith("task-")) {
      const targetTask = displayTasks.find((t) => t._id === over.id);
      if (targetTask) {
        // Determine the UI column for the target task
        if (targetTask.status === "todo" && targetTask.scheduled) {
          targetColumn = "scheduled";
        } else if (targetTask.status === "todo") {
          targetColumn = "new-task";
        } else if (targetTask.status === "in-progress") {
          targetColumn = "in-progress";
        } else {
          targetColumn = "completed";
        }
      }
    }

    // Get the current UI column of the active task
    const activeUiColumn =
      activeTask.status === "todo" && activeTask.scheduled
        ? "scheduled"
        : activeTask.status === "todo"
        ? "new-task"
        : activeTask.status === "in-progress"
        ? "in-progress"
        : "completed";

    // Only update if the column changed
    if (targetColumn !== activeUiColumn) {
      const newDbStatus = getDbStatus(targetColumn);
      const updateData = { status: newDbStatus };

      // Handle scheduled flag based on destination column
      if (targetColumn === "scheduled") {
        updateData.scheduled = true;
      } else if (targetColumn === "new-task") {
        updateData.scheduled = false;
      } else {
        updateData.scheduled = false;
      }

      // Optimistic update
      pendingUpdates.current.add(activeTask._id);
      setOptimisticUpdates((prev) => ({
        ...prev,
        [activeTask._id]: { ...prev[activeTask._id], ...updateData },
      }));

      // Then update on server in background
      try {
        await updateTask(activeTask._id, updateData);
        pendingUpdates.current.delete(activeTask._id);
        // Don't refetch - optimistic update stays until auto-cleanup
      } catch (err) {
        // On error, revert to server state
        alert(err.message);
        pendingUpdates.current.delete(activeTask._id);
        setOptimisticUpdates((prev) => {
          const next = { ...prev };
          delete next[activeTask._id];
          return next;
        });
        if (onMoved) onMoved(); // Only revert on error
      }
    }
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  const activeTask = activeId
    ? displayTasks.find((t) => t._id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="kanban-board-new">
        {columns.map((col) => {
          const columnTasks = getTasksForColumn(col.key);

          return (
            <DroppableColumn key={col.key} id={col.key}>
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
                      <DraggableTask key={task._id} id={task._id} task={task}>
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
                      </DraggableTask>
                    );
                  })
                )}
              </div>
            </DroppableColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div
            className="task-card-new task-card-dragging"
            style={{
              borderLeft: `3px solid ${
                activeTask.priority === "high"
                  ? "#ff7875"
                  : activeTask.priority === "medium"
                  ? "#ffc069"
                  : "#91d5ff"
              }`,
            }}
          >
            <div className="task-card-user">
              <div
                className="task-avatar"
                style={{
                  backgroundColor: "#667eea",
                }}
              >
                {activeTask.title.charAt(0).toUpperCase()}
              </div>
              <h4 className="task-card-title-new">{activeTask.title}</h4>
            </div>
            {activeTask.description && (
              <p className="task-card-description-new">
                {activeTask.description}
              </p>
            )}
            <div className="task-labels">
              <span
                className={`task-label ${
                  activeTask.priority === "high"
                    ? "task-label-asap"
                    : activeTask.priority === "medium"
                    ? "task-label-feedback"
                    : "task-label-blocked"
                }`}
              >
                {activeTask.priority}
              </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Droppable Column Component
function DroppableColumn({ children, id }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column-new ${isOver ? "kanban-column-over" : ""}`}
    >
      {children}
    </div>
  );
}

// Draggable Task Component
function DraggableTask({ children, id, task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useDraggable({
    id,
    data: task,
  });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}
