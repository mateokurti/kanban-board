"use client"
import { useEffect, useMemo, useState } from 'react'
import { getProjects } from '../lib/api/projects'
import { createTask } from '../lib/api/tasks'
import { getTeams } from '../lib/api/teams'

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High', tone: '#ff6b6b', icon: '⚡' },
  { value: 'medium', label: 'Medium', tone: '#ffb347', icon: '⚖️' },
  { value: 'low', label: 'Low', tone: '#4ecdc4', icon: '🌱' },
]

export default function TaskForm({ onCreated }){
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [teamId, setTeamId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [teams, setTeams] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [metaLoading, setMetaLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function hydrate(){
      setMetaLoading(true)
      try {
        const [teamsData, projectsData] = await Promise.all([getTeams(), getProjects()])
        if (!cancelled){
          setTeams(teamsData)
          setProjects(projectsData)
        }
      } catch (err){
        if (!cancelled){
          setError(err.message || 'Failed to load teams or projects')
        }
      } finally {
        if (!cancelled){
          setMetaLoading(false)
        }
      }
    }
    hydrate()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!projectId) return
    const match = projects.find(project => project._id === projectId)
    if (!match){
      setProjectId('')
      return
    }
    if (!teamId && (match.teamIds || []).length > 0){
      setProjectId('')
      return
    }
    if (teamId && match.teamIds?.length && !match.teamIds.includes(teamId)){
      setProjectId('')
    }
  }, [teamId, projectId, projects])

  const availableProjects = useMemo(() => {
    if (!teamId){
      return projects.filter(project => (project.teamIds || []).length === 0)
    }
    return projects.filter(project => {
      const ids = Array.isArray(project.teamIds) ? project.teamIds : []
      return ids.length === 0 || ids.includes(teamId)
    })
  }, [projects, teamId])

  const selectedTeam = teamId ? teams.find(team => team._id === teamId) : null

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    setLoading(true)
    try{
      const created = await createTask({
        title,
        description,
        priority,
        status: 'todo',
        teamId: teamId || null,
        projectId: projectId || null
      })
      setTitle('')
      setDescription('')
      setPriority('medium')
      setTeamId('')
      setProjectId('')
      if (onCreated) {
        await onCreated(created)
      }
    }catch(err){
      console.error('Error creating task:', err)
      setError(err.message || 'Failed to create task. Please try again.')
    }finally{
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'var(--jira-bg-card)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '6px',
      padding: '20px',
      marginBottom: '24px',
      boxShadow: '0 12px 30px rgba(0,0,0,0.35)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div>
          <p style={{
            margin: 0,
            fontSize: '12px',
            letterSpacing: '0.08em',
            color: 'var(--jira-text-secondary)',
            textTransform: 'uppercase'
          }}>New Work Item</p>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 600,
            margin: '4px 0 0 0',
            color: 'var(--jira-text-primary)'
          }}>Create Issue</h2>
        </div>
        <div style={{
          display: 'flex',
          gap: '6px',
          alignItems: 'center',
          color: 'var(--jira-text-secondary)',
          fontSize: '13px'
        }}>
          <span style={{ fontSize: '18px' }}>⚙️</span>
          <span>All fields autosave once submitted</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--jira-text-secondary)',
              marginBottom: '6px'
            }}>
              Summary *
            </label>
            <input
              className="input"
              placeholder="Capture the core outcome or user story"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              style={{ fontSize: '15px', padding: '10px 12px' }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--jira-text-secondary)',
              marginBottom: '6px'
            }}>
              Description
            </label>
            <textarea
              className="input"
              rows={4}
              placeholder="Add acceptance criteria, links, or implementation notes..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ width: '100%', fontSize: '14px', padding: '10px 12px', resize: 'vertical' }}
            />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '12px'
          }}>
            <div style={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px',
              padding: '12px'
            }}>
              <p style={{
                margin: '0 0 8px 0',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--jira-text-secondary)'
              }}>Priority</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {PRIORITY_OPTIONS.map((option) => {
                  const active = option.value === priority
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPriority(option.value)}
                      style={{
                        flex: 1,
                        borderRadius: '5px',
                        border: active ? `1px solid ${option.tone}` : '1px solid rgba(255,255,255,0.15)',
                        backgroundColor: active ? `${option.tone}33` : 'rgba(255,255,255,0.04)',
                        color: active ? option.tone : 'var(--jira-text-primary)',
                        padding: '10px 8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: active ? `0 4px 12px ${option.tone}35` : 'none'
                      }}
                      aria-pressed={active}
                    >
                      <span style={{ marginRight: '4px' }}>{option.icon}</span>
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--jira-text-secondary)',
                marginBottom: '6px'
              }}>
                Team
              </label>
              <select
                className="input"
                value={teamId}
                onChange={e => setTeamId(e.target.value)}
                style={{ width: '100%', fontSize: '14px', padding: '10px 12px' }}
              >
                <option value="">Unassigned</option>
                {teams.map(team => (
                  <option key={team._id} value={team._id}>{team.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--jira-text-secondary)',
                marginBottom: '6px'
              }}>
                Project
              </label>
              <select
                className="input"
                value={projectId}
                onChange={e=>setProjectId(e.target.value)}
                style={{ width: '100%', fontSize: '14px', padding: '10px 12px' }}
                disabled={metaLoading}
              >
                <option value="">Unassigned</option>
                {availableProjects.map(project => (
                  <option key={project._id} value={project._id}>{project.name}</option>
                ))}
              </select>
              {selectedTeam && availableProjects.length === 0 && (
                <p style={{
                  margin: '6px 0 0 0',
                  fontSize: '12px',
                  color: 'var(--jira-text-secondary)'
                }}>
                  No projects belong to this team yet.
                </p>
              )}
              {!selectedTeam && availableProjects.length === 0 && projects.length > 0 && (
                <p style={{
                  margin: '6px 0 0 0',
                  fontSize: '12px',
                  color: 'var(--jira-text-secondary)'
                }}>
                  Select a team to surface relevant projects.
                </p>
              )}
            </div>
          </div>

          {(teamId || projectId) && (
            <div style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
              fontSize: '12px'
            }}>
              {teamId && (
                <span style={{
                  padding: '6px 10px',
                  borderRadius: '999px',
                  background: 'rgba(79,165,255,0.15)',
                  color: '#4fa5ff'
                }}>
                  Team: {teams.find(team => team._id === teamId)?.name || 'Unknown'}
                </span>
              )}
              {projectId && (
                <span style={{
                  padding: '6px 10px',
                  borderRadius: '999px',
                  background: 'rgba(255,215,0,0.15)',
                  color: '#ffd700'
                }}>
                  Project: {projects.find(project => project._id === projectId)?.name || 'Unknown'}
                </span>
              )}
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: '16px'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--jira-text-secondary)' }}>
              ⏱️ Estimated time to fill: under 1 min
            </div>
            <button
              type="submit"
              className="btn"
              disabled={loading}
              style={{ minWidth: '120px' }}
            >
              {loading ? 'Creating...' : 'Create task'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
