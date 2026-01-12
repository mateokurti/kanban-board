"use client";

import { useState } from "react";
import { updateProject, deleteProject } from "../lib/api/projects";

export default function ProjectSettingsModal({ project, teams, onClose, onUpdate, onDelete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(project.name);
  const [selectedTeamIds, setSelectedTeamIds] = useState(project.teamIds || []);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateProject(project._id, {
        name: name.trim(),
        teamIds: selectedTeamIds,
      });
      setSuccess("Project updated successfully");
      setEditMode(false);
      onUpdate?.();
    } catch (err) {
      setError(err.message || "Failed to update project");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      await deleteProject(project._id);
      onDelete?.();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to delete project");
      setLoading(false);
    }
  };

  const toggleTeam = (teamId) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleCancel = () => {
    setName(project.name);
    setSelectedTeamIds(project.teamIds || []);
    setEditMode(false);
    setError(null);
  };

  const projectTeams = teams.filter((t) => project.teamIds?.includes(t._id));

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#1e2936",
          borderRadius: "6px",
          width: "90%",
          maxWidth: "500px",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #2d3a4b",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "18px", color: "#fff" }}>
            Project: {project.name}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#8993a4",
              fontSize: "24px",
              cursor: "pointer",
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "20px" }}>
          {error && (
            <div
              style={{
                padding: "10px 12px",
                background: "#d32f2f22",
                border: "1px solid #d32f2f",
                borderRadius: "4px",
                color: "#ff6b6b",
                fontSize: "13px",
                marginBottom: "16px",
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              style={{
                padding: "10px 12px",
                background: "#4caf5022",
                border: "1px solid #4caf50",
                borderRadius: "4px",
                color: "#81c784",
                fontSize: "13px",
                marginBottom: "16px",
              }}
            >
              {success}
            </div>
          )}

          {showDeleteConfirm ? (
            <div>
              <h3 style={{ fontSize: "14px", color: "#8993a4", marginBottom: "12px" }}>
                Delete Project
              </h3>
              <div
                style={{
                  padding: "12px",
                  background: "#d32f2f22",
                  border: "1px solid #d32f2f",
                  borderRadius: "4px",
                  marginBottom: "16px",
                }}
              >
                <p style={{ color: "#ff6b6b", fontSize: "14px", margin: "0 0 8px 0" }}>
                  Are you sure you want to delete this project?
                </p>
                <p style={{ color: "#8993a4", fontSize: "13px", margin: 0 }}>
                  Tasks in this project will not be deleted, but they will no longer be associated with this project.
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    fontSize: "14px",
                    background: "transparent",
                    color: "#8993a4",
                    border: "1px solid #4a5f7f",
                    borderRadius: "4px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    fontSize: "14px",
                    background: "#d32f2f",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {loading ? "Deleting..." : "Delete Project"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "14px", color: "#8993a4", marginBottom: "12px" }}>
                  Project Information
                </h3>

                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "12px", color: "#8993a4", marginBottom: "6px" }}>
                    Project Name
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        fontSize: "14px",
                        background: "#253858",
                        border: "1px solid #4a5f7f",
                        borderRadius: "4px",
                        color: "#ffffff",
                        outline: "none",
                        fontFamily: "inherit",
                      }}
                      autoFocus
                    />
                  ) : (
                    <div style={{ fontSize: "14px", color: "#fff", lineHeight: "1.8" }}>
                      {project.name}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "12px", color: "#8993a4", marginBottom: "6px" }}>
                    Teams
                  </label>
                  {editMode ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {teams.length === 0 ? (
                        <div style={{ color: "#8993a4", fontSize: "13px" }}>
                          No teams available
                        </div>
                      ) : (
                        teams.map((team) => (
                          <label
                            key={team._id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "10px 12px",
                              background: selectedTeamIds.includes(team._id)
                                ? "#0052cc33"
                                : "#253858",
                              border: selectedTeamIds.includes(team._id)
                                ? "1px solid #4c9aff"
                                : "1px solid #4a5f7f",
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedTeamIds.includes(team._id)}
                              onChange={() => toggleTeam(team._id)}
                              style={{ cursor: "pointer" }}
                            />
                            <span style={{ color: "#fff", fontSize: "14px" }}>
                              {team.name}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {projectTeams.length === 0 ? (
                        <div style={{ color: "#8993a4", fontSize: "13px" }}>
                          No teams assigned
                        </div>
                      ) : (
                        projectTeams.map((team) => (
                          <span
                            key={team._id}
                            style={{
                              padding: "4px 12px",
                              fontSize: "12px",
                              background: "#0052cc33",
                              color: "#4c9aff",
                              borderRadius: "12px",
                            }}
                          >
                            {team.name}
                          </span>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#8993a4", marginBottom: "6px" }}>
                    Created
                  </label>
                  <div style={{ fontSize: "14px", color: "#fff" }}>
                    {project.createdAt
                      ? new Date(project.createdAt).toLocaleDateString()
                      : "N/A"}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: "16px",
                  borderTop: "1px solid #2d3a4b",
                }}
              >
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    padding: "10px 16px",
                    fontSize: "14px",
                    background: "transparent",
                    color: "#ff6b6b",
                    border: "1px solid #ff6b6b",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Delete
                </button>
                {editMode ? (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      style={{
                        padding: "10px 16px",
                        fontSize: "14px",
                        background: "transparent",
                        color: "#8993a4",
                        border: "1px solid #4a5f7f",
                        borderRadius: "4px",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      style={{
                        padding: "10px 16px",
                        fontSize: "14px",
                        background: loading ? "#555" : "#0052cc",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditMode(true)}
                    style={{
                      padding: "10px 16px",
                      fontSize: "14px",
                      background: "#0052cc",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Edit Project
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
