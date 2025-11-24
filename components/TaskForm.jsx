"use client"
import { useState } from 'react'
import { createTask } from '../lib/api/tasks'

export default function TaskForm({ onCreated }){
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    if (!title.trim()) return setError('Title is required')
    setLoading(true)
    try{
      const created = await createTask({ title, description, priority, status: 'todo' })
      setTitle('')
      setDescription('')
      setPriority('medium')
      if (onCreated) onCreated(created)
    }catch(err){
      setError(err.message)
    }finally{setLoading(false)}
  }

  return (
    <div style={{
      background: 'var(--jira-bg-card)',
      border: '2px solid var(--jira-border)',
      borderRadius: '3px',
      padding: '16px',
      marginBottom: '24px',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <h2 style={{
        fontSize: '16px',
        fontWeight: '600',
        margin: '0 0 16px 0',
        color: 'var(--jira-text-primary)'
      }}>
        Create Issue
      </h2>

      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--jira-text-secondary)',
              marginBottom: '4px'
            }}>
              Summary *
            </label>
            <input
              className="input"
              placeholder="What needs to be done?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--jira-text-secondary)',
              marginBottom: '4px'
            }}>
              Description
            </label>
            <textarea
              className="input"
              rows={3}
              placeholder="Add more details..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--jira-text-secondary)',
                marginBottom: '4px'
              }}>
                Priority
              </label>
              <select
                className="input"
                value={priority}
                onChange={e => setPriority(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn"
              disabled={loading}
              style={{
                minWidth: '100px'
              }}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
      </form>
    </div>
  )
}
