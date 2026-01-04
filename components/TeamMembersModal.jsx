"use client";

import { useState } from "react";
import { addTeamMember } from "../lib/api/teams";

const ROLES = ["Member", "Tech Lead", "QA"];

export default function TeamMembersModal({ team, onClose, onUpdate }) {
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("Member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleAddMember = async () => {
    if (!memberEmail.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedTeam = await addTeamMember(team._id, memberEmail.trim(), memberRole);
      setSuccess(`User ${memberEmail} added successfully as ${memberRole}! Email notification sent.`);
      setMemberEmail("");
      setMemberRole("Member");
      onUpdate?.(updatedTeam);
    } catch (err) {
      setError(err.message || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

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
            Manage Team: {team.name}
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

          <div>
            <h3 style={{ fontSize: "14px", color: "#8993a4", marginBottom: "12px" }}>
              Add New Member
            </h3>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#8993a4", marginBottom: "6px" }}>
                Email Address
              </label>
              <input
                type="email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddMember();
                  }
                }}
                placeholder="Enter user email"
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
              />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#8993a4", marginBottom: "6px" }}>
                Role
              </label>
              <select
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value)}
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
                  cursor: "pointer",
                }}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddMember}
              disabled={loading || !memberEmail.trim()}
              style={{
                width: "100%",
                padding: "10px 16px",
                fontSize: "14px",
                background: loading || !memberEmail.trim() ? "#555" : "#0052cc",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading || !memberEmail.trim() ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {loading ? "Adding..." : "Add Member"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
