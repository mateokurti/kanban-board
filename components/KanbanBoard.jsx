"use client"
import { useState } from 'react'
import { updateTask, deleteTask } from '../lib/api/tasks'

export default function KanbanBoard({ tasks = [], onMoved }){
  const [editingTask, setEditingTask] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', priority: '' })

  const columns = [
    { key: 'todo', title: 'OPEN', color: '#5E6C84', emoji: '📋' },
    { key: 'in-progress', title: 'IN PROGRESS', color: '#0052CC', emoji: '⚡' },
    { key: 'done', title: 'DONE', color: '#00875A', emoji: '✅' }
  ]

  async function move(task, toStatus){
    try{
      await updateTask(task._id, { status: toStatus })
      if (onMoved) onMoved()
    }catch(err){
      alert(err.message)
    }
  }

  async function handleDelete(taskId){
    if (!confirm('Are you sure you want to delete this issue?')) return
    try{
      await deleteTask(taskId)
      if (onMoved) onMoved()
    }catch(err){
      alert(err.message)
    }
  }

  function startEdit(task){
    setEditingTask(task._id)
    setEditForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority
    })
  }

  async function saveEdit(taskId){
    try{
      await updateTask(taskId, editForm)
      setEditingTask(null)
      if (onMoved) onMoved()
    }catch(err){
      alert(err.message)
    }
  }

  return (
    <div className="kanban">
      {columns.map(col => {
        const columnTasks = tasks.filter(t => t.status === col.key)

        return (
          <div key={col.key} className="column">
            <div className="column-header">
              <div className="column-title">
                <span className="column-emoji">{col.emoji}</span>
                <h3>{col.title}</h3>
              </div>
              <span className="column-count" style={{ background: col.color }}>
                {columnTasks.length}
              </span>
            </div>

            {columnTasks.length === 0 ? (
              <div className="empty-state">
                <span style={{ fontSize: '32px', opacity: 0.3 }}>{col.emoji}</span>
                <p>No tasks yet</p>
              </div>
            ) : (
              columnTasks.map(t => (
                <div key={t._id} className="task-card">
                  {editingTask === t._id ? (
                    <div className="task-edit-form">
                      <input
                        className="input"
                        value={editForm.title}
                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                        style={{ width: '100%', marginBottom: '8px' }}
                      />
                      <textarea
                        className="input"
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        rows={2}
                        style={{ width: '100%', marginBottom: '8px' }}
                      />
                      <select
                        className="input"
                        value={editForm.priority}
                        onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                        style={{ width: '100%', marginBottom: '8px' }}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                      <div className="task-actions">
                        <button className="btn small" onClick={() => saveEdit(t._id)}>Save</button>
                        <button className="btn secondary small" onClick={() => setEditingTask(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="task-header">
                        <div className="task-title">{t.title}</div>
                        <span className={`priority-badge-new priority-${t.priority}`}>
                          {t.priority === 'high' && '🔴'}
                          {t.priority === 'medium' && '🟡'}
                          {t.priority === 'low' && '🔵'}
                        </span>
                      </div>

                      {t.description && (
                        <div className="task-description">
                          {t.description}
                        </div>
                      )}

                      <div className="task-footer">
                        <div className="task-actions">
                          {col.key !== 'todo' && (
                            <button
                              className="btn-icon"
                              onClick={() => move(t, col.key === 'done' ? 'in-progress' : 'todo')}
                              title="Move back"
                            >
                              ←
                            </button>
                          )}
                          {col.key !== 'done' && (
                            <button
                              className="btn-icon btn-icon-primary"
                              onClick={() => move(t, col.key === 'todo' ? 'in-progress' : 'done')}
                              title="Move forward"
                            >
                              →
                            </button>
                          )}
                          <button
                            className="btn-icon"
                            onClick={() => startEdit(t)}
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button
                            className="btn-icon btn-icon-danger"
                            onClick={() => handleDelete(t._id)}
                            title="Delete"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        )
      })}
    </div>
  )
}
