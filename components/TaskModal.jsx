"use client";
import { useEffect, useMemo, useState } from "react";
import { getProjects } from "../lib/api/projects";
import { createTask } from "../lib/api/tasks";
import { getTeams } from "../lib/api/teams";

export default function TaskModal({ isOpen, onClose, initialTeam, initialProject, onTaskCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(initialTeam || "");
  const [selectedProject, setSelectedProject] = useState(initialProject || "");
  const [metaLoading, setMetaLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      let cancelled = false;
      async function loadCollections() {
        setMetaLoading(true);
        try {
          const [teamsData, projectsData] = await Promise.all([getTeams(), getProjects()]);
          if (cancelled) return;
          setTeams(teamsData);
          setProjects(projectsData);
        } catch (err) {
          if (!cancelled) {
            setError(err.message || "Failed to load teams or projects");
          }
        } finally {
          if (!cancelled) {
            setMetaLoading(false);
          }
        }
      }

      loadCollections();
      return () => {
        cancelled = true;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialTeam) setSelectedTeam(initialTeam);
  }, [initialTeam]);

  useEffect(() => {
    if (initialProject) setSelectedProject(initialProject);
  }, [initialProject]);

  useEffect(() => {
    if (!selectedTeam) return;
    if (!teams.some((team) => team._id === selectedTeam)) {
      setSelectedTeam("");
    }
  }, [selectedTeam, teams]);

  useEffect(() => {
    if (!selectedProject) return;
    const project = projects.find((item) => item._id === selectedProject);
    if (!project) {
      setSelectedProject("");
      return;
    }
    if (!selectedTeam) {
      if ((project.teamIds || []).length === 1) {
        setSelectedTeam(project.teamIds[0]);
        return;
      }
      if ((project.teamIds || []).length > 0) {
        setSelectedProject("");
      }
      return;
    }
    if (project.teamIds?.length && !project.teamIds.includes(selectedTeam)) {
      setSelectedProject("");
    }
  }, [selectedProject, projects, selectedTeam]);

  const availableProjects = useMemo(() => {
    if (!selectedTeam) {
      return projects.filter((project) => (project.teamIds || []).length === 0);
    }
    return projects.filter((project) => {
      const ids = Array.isArray(project.teamIds) ? project.teamIds : [];
      return ids.length === 0 || ids.includes(selectedTeam);
    });
  }, [projects, selectedTeam]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setLoading(true);
    try {
      await createTask({
        title,
        description,
        priority,
        status: "todo",
        teamId: selectedTeam || null,
        projectId: selectedProject || null
      });
      
      // Reset form
      setTitle("");
      setDescription("");
      setPriority("medium");
      setSelectedTeam(initialTeam || "");
      setSelectedProject(initialProject || "");
      setError(null);
      
      if (onTaskCreated) {
        onTaskCreated();
      }
      onClose();
    } catch (err) {
      console.error("Error creating task:", err);
      setError(err.message || "Failed to create task. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleClose = () => {
    // Reset form
    setTitle("");
    setDescription("");
    setPriority("medium");
    setSelectedTeam(initialTeam || "");
    setSelectedProject(initialProject || "");
    setError(null);
    setShowPriorityDropdown(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: "20px",
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "8px",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 32px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              margin: 0,
              color: "#1f2937",
            }}
          >
            Create New Task
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "24px",
              color: "#6b7280",
              cursor: "pointer",
              padding: "0",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#f3f4f6";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "transparent";
            }}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div
            style={{
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            {/* Summary Field */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#1f2937",
                  marginBottom: "8px",
                }}
              >
                Summary *
              </label>
              <input
                type="text"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{
                  width: "100%",
                  fontSize: "14px",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  outline: "none",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6";
                  e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#d1d5db";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Description Field */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#1f2937",
                  marginBottom: "8px",
                }}
              >
                Description
              </label>
              <textarea
                rows={4}
                placeholder="Add more details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: "100%",
                  fontSize: "14px",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6";
                  e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#d1d5db";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Priority Field */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#1f2937",
                  marginBottom: "8px",
                }}
              >
                Priority
              </label>
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                  style={{
                    width: "100%",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    textAlign: "left",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    background: "#ffffff",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#3b82f6";
                    e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#d1d5db";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "16px" }}>
                      {priority === "high" ? "🔴" : priority === "medium" ? "🟠" : "🔵"}
                    </span>
                    <span style={{ color: "#1f2937" }}>
                      {priority === "high" ? "High" : priority === "medium" ? "Medium" : "Low"}
                    </span>
                  </span>
                  <span style={{ color: "#6b7280" }}>▼</span>
                </button>

                {showPriorityDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: "0",
                      width: "100%",
                      background: "#ffffff",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                      zIndex: 1000,
                    }}
                  >
                    <div style={{ padding: "4px 0" }}>
                      {["high", "medium", "low"].map((p) => (
                        <div
                          key={p}
                          onClick={() => {
                            setPriority(p);
                            setShowPriorityDropdown(false);
                          }}
                          style={{
                            padding: "10px 14px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            background: priority === p ? "#f3f4f6" : "transparent",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#f9fafb";
                          }}
                          onMouseLeave={(e) => {
                            if (priority !== p) {
                              e.currentTarget.style.background = "transparent";
                            } else {
                              e.currentTarget.style.background = "#f3f4f6";
                            }
                          }}
                        >
                          <span style={{ fontSize: "16px" }}>
                            {p === "high" ? "🔴" : p === "medium" ? "🟠" : "🔵"}
                          </span>
                          <span
                            style={{
                              fontSize: "14px",
                              color: "#1f2937",
                              fontWeight: priority === p ? "600" : "400",
                            }}
                          >
                            {p === "high" ? "High" : p === "medium" ? "Medium" : "Low"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Team Field */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#1f2937",
                  marginBottom: "8px",
                }}
              >
                Team
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                style={{
                  width: "100%",
                  fontSize: "14px",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  outline: "none",
                  background: "#ffffff",
                  color: "#1f2937",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6";
                  e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#d1d5db";
                  e.target.style.boxShadow = "none";
                }}
              >
                <option value="">Unassigned</option>
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project Field */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#1f2937",
                  marginBottom: "8px",
                }}
              >
                Project (optional)
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                style={{
                  width: "100%",
                  fontSize: "14px",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  outline: "none",
                  background: "#ffffff",
                  color: "#1f2937",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
                disabled={metaLoading}
                onFocus={(e) => {
                  if (!metaLoading) {
                    e.target.style.borderColor = "#3b82f6";
                    e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#d1d5db";
                  e.target.style.boxShadow = "none";
                }}
              >
                <option value="">Unassigned</option>
                {availableProjects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {selectedTeam && availableProjects.length === 0 && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginTop: "6px",
                  }}
                >
                  Select a team to see its projects.
                </div>
              )}
              {!selectedTeam && availableProjects.length === 0 && projects.length > 0 && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginTop: "6px",
                  }}
                >
                  Select a team to see its projects.
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "6px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  fontSize: "14px",
                }}
              >
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "20px 32px",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: "500",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                background: "#ffffff",
                color: "#374151",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#f9fafb";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#ffffff";
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "10px 24px",
                fontSize: "14px",
                fontWeight: "500",
                borderRadius: "6px",
                border: "none",
                background: loading ? "#93c5fd" : "#3b82f6",
                color: "#ffffff",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.background = "#2563eb";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.background = "#3b82f6";
                }
              }}
            >
              {loading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
