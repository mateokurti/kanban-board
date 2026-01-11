"use client";
import { useEffect, useState } from "react";
import { getProjects } from "../lib/api/projects";
import { createTask } from "../lib/api/tasks";
import { getTeams } from "../lib/api/teams";

export default function ModernTaskModal({ isOpen, onClose, initialTeam, initialProject, onTaskCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("todo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(initialTeam || "");
  const [selectedProject, setSelectedProject] = useState(initialProject || "");
  const [assignedTo, setAssignedTo] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (initialTeam) setSelectedTeam(initialTeam);
      if (initialProject) setSelectedProject(initialProject);
    }
  }, [isOpen, initialTeam, initialProject]);

  useEffect(() => {
    if (selectedTeam) {
      loadTeamMembers();
    } else {
      setTeamMembers([]);
      setAssignedTo("");
    }
  }, [selectedTeam, teams]);

  const loadData = async () => {
    try {
      const [teamsData, projectsData] = await Promise.all([getTeams(), getProjects()]);
      setTeams(teamsData || []);
      setProjects(projectsData || []);
    } catch (err) {
      setError(err.message || "Failed to load data");
    }
  };

  const loadTeamMembers = () => {
    const team = teams.find(t => t._id === selectedTeam);
    if (team) {
      setTeamMembers(team.members || []);
    }
  };

  const availableProjects = selectedTeam
    ? projects.filter(p => p.teamIds?.includes(selectedTeam) || !p.teamIds?.length)
    : projects.filter(p => !p.teamIds?.length);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    try {
      await createTask({
        title: title.trim(),
        description: description.trim(),
        priority,
        status,
        teamId: selectedTeam || null,
        projectId: selectedProject || null,
        assignedTo: assignedTo || null,
        dueDate: dueDate || null
      });

      // Reset form
      setTitle("");
      setDescription("");
      setPriority("medium");
      setStatus("todo");
      setSelectedTeam(initialTeam || "");
      setSelectedProject(initialProject || "");
      setAssignedTo("");
      setDueDate("");
      setError(null);

      if (onTaskCreated) onTaskCreated();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="mtm-overlay" onClick={onClose}>
      <div className="mtm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mtm-header">
          <h2 className="mtm-title">Create New Task</h2>
          <button className="mtm-close" onClick={onClose} title="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mtm-form">
          {error && (
            <div className="mtm-error">
              <span className="mtm-error-icon">⚠</span>
              {error}
            </div>
          )}

          <div className="mtm-field">
            <label className="mtm-label">
              Task Title <span className="mtm-required">*</span>
            </label>
            <input
              type="text"
              className="mtm-input"
              placeholder="Enter task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="mtm-field">
            <label className="mtm-label">Description</label>
            <textarea
              className="mtm-textarea"
              placeholder="Add task description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="mtm-row">
            <div className="mtm-field mtm-field-half">
              <label className="mtm-label">Priority</label>
              <div className="mtm-priority-grid">
                {["low", "medium", "high", "urgent"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`mtm-priority-btn mtm-priority-${p} ${priority === p ? "active" : ""}`}
                    onClick={() => setPriority(p)}
                  >
                    <span className="mtm-priority-dot"></span>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mtm-field mtm-field-half">
              <label className="mtm-label">Status</label>
              <select
                className="mtm-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div className="mtm-row">
            <div className="mtm-field mtm-field-half">
              <label className="mtm-label">Team</label>
              <select
                className="mtm-select"
                value={selectedTeam}
                onChange={(e) => {
                  setSelectedTeam(e.target.value);
                  setSelectedProject("");
                }}
              >
                <option value="">No team</option>
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mtm-field mtm-field-half">
              <label className="mtm-label">Project</label>
              <select
                className="mtm-select"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                disabled={!selectedTeam && availableProjects.length === 0}
              >
                <option value="">No project</option>
                {availableProjects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mtm-row">
            <div className="mtm-field mtm-field-half">
              <label className="mtm-label">Assign To</label>
              <select
                className="mtm-select"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                disabled={!selectedTeam}
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member.userId?._id || member.userId} value={member.userId?._id || member.userId}>
                    {member.userId?.name || member.userId?.email || "Unknown"}
                  </option>
                ))}
              </select>
            </div>

            <div className="mtm-field mtm-field-half">
              <label className="mtm-label">Due Date</label>
              <input
                type="date"
                className="mtm-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="mtm-actions">
            <button
              type="button"
              className="mtm-btn mtm-btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="mtm-btn mtm-btn-primary"
              disabled={loading || !title.trim()}
            >
              {loading ? (
                <>
                  <span className="mtm-spinner"></span>
                  Creating...
                </>
              ) : (
                "Create Task"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
