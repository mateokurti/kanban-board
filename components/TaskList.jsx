"use client";
import { useState } from "react";
import {
  deleteTask as apiDelete,
  updateTask as apiUpdate,
} from "../lib/api/tasks";

export default function TaskList({ tasks = [], onUpdated }) {
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  function startEdit(task) {
    setEditingId(task._id);
    setEditValues({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
    });
  }

  function cancel() {
    setEditingId(null);
    setEditValues({});
  }

  async function save(id) {
    try {
      const updated = await apiUpdate(id, editValues);
      if (onUpdated) onUpdated(updated);
      cancel();
    } catch (err) {
      alert(err.message);
    }
  }

  async function remove(id) {
    if (!confirm("Delete this task?")) return;
    try {
      await apiDelete(id);
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="task-list">
      {tasks.map((t) => (
        <article
          key={t._id}
          className={`task-card task-card--${t.priority || "medium"}`}
        >
          {editingId === t._id ? (
            <div className="task-card-edit">
              <input
                className="task-input"
                value={editValues.title}
                onChange={(e) =>
                  setEditValues({ ...editValues, title: e.target.value })
                }
                placeholder="Task title"
              />
              <textarea
                className="task-textarea"
                rows={2}
                value={editValues.description}
                onChange={(e) =>
                  setEditValues({
                    ...editValues,
                    description: e.target.value,
                  })
                }
                placeholder="Description (optional)"
              />

              <div className="task-edit-footer">
                <select
                  className="task-select"
                  value={editValues.priority}
                  onChange={(e) =>
                    setEditValues({
                      ...editValues,
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
                    className="btn btn-primary"
                    onClick={() => save(t._id)}
                  >
                    Save
                  </button>
                  <button className="btn btn-ghost" onClick={cancel}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="task-card-view">
              <div className="task-card-header">
                <h3 className="task-card-title">{t.title}</h3>
                <span
                  className={`task-card-priority task-card-priority--${
                    t.priority || "medium"
                  }`}
                >
                  {t.priority}
                </span>
              </div>

              {t.description && (
                <p className="task-card-description">{t.description}</p>
              )}

              <div className="task-card-footer">
                <button
                  className="btn btn-ghost"
                  onClick={() => startEdit(t)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => remove(t._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
