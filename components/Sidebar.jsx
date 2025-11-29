"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function Sidebar({ onTeamChange }) {
  const { data: session } = useSession();
  const [teams, setTeams] = useState([]);
  const [activeTeam, setActiveTeam] = useState(null);
  const [showTeamInput, setShowTeamInput] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  // Load teams from localStorage on mount or when user changes
  useEffect(() => {
    if (!session?.user?.email) {
      // No user logged in, reset teams
      setTeams([]);
      setActiveTeam(null);
      return;
    }

    const teamsKey = `kanban-teams-${session.user.email}`;
    const activeTeamKey = `kanban-active-team-${session.user.email}`;

    const savedTeams = localStorage.getItem(teamsKey);
    const savedActiveTeam = localStorage.getItem(activeTeamKey);

    if (savedTeams) {
      try {
        const parsedTeams = JSON.parse(savedTeams);
        setTeams(parsedTeams);
      } catch (e) {
        console.error("Failed to parse saved teams", e);
      }
    }

    if (savedActiveTeam) {
      setActiveTeam(savedActiveTeam);
    }
  }, [session?.user?.email]); // Re-run when user changes

  // Save teams to localStorage whenever they change
  useEffect(() => {
    if (!session?.user?.email) return;

    const teamsKey = `kanban-teams-${session.user.email}`;

    if (teams.length > 0) {
      localStorage.setItem(teamsKey, JSON.stringify(teams));
    }
  }, [teams, session?.user?.email]);

  // Save active team to localStorage whenever it changes
  useEffect(() => {
    if (!session?.user?.email) return;

    const activeTeamKey = `kanban-active-team-${session.user.email}`;

    if (activeTeam !== null) {
      localStorage.setItem(activeTeamKey, activeTeam);
    } else {
      localStorage.removeItem(activeTeamKey);
    }
  }, [activeTeam, session?.user?.email]);

  const projects = [
    {
      name: "Projects",
      items: [{ name: "Task Board", icon: "📋", active: true }],
    },
  ];

  const handleAddTeam = () => {
    if (newTeamName.trim()) {
      const newTeam = { name: newTeamName.trim() };
      setTeams([...teams, newTeam]);
      setNewTeamName("");
      setShowTeamInput(false);
      // Auto-select the newly added team
      setActiveTeam(newTeam.name);
      if (onTeamChange) {
        onTeamChange(newTeam.name);
      }
    }
  };

  const handleDeleteTeam = (teamName) => {
    setTeams(teams.filter((team) => team.name !== teamName));
    // If deleting active team, reset active team
    if (activeTeam === teamName) {
      setActiveTeam(null);
      if (onTeamChange) {
        onTeamChange(null);
      }
    }
  };

  const handleSelectTeam = (teamName) => {
    setActiveTeam(teamName);
    if (onTeamChange) {
      onTeamChange(teamName);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">K</div>
          <span className="logo-text">Kanban Board</span>
          <button className="dropdown-btn" type="button">
            ▼
          </button>
        </div>
      </div>

      <div className="sidebar-content">
        <button className="sidebar-item sidebar-item-primary" type="button">
          <span className="sidebar-icon">👤</span>
          <span>My work</span>
        </button>

        {/* Teams section */}
        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <span>▼</span>
            <span>Teams</span>
            <button
              className="add-btn"
              type="button"
              onClick={() => setShowTeamInput(true)}
            >
              +
            </button>
          </div>

          <div className="sidebar-section-content">
            {showTeamInput && (
              <div
                style={{
                  padding: "8px 12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  margin: "4px 0",
                  borderRadius: "3px",
                }}
              >
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddTeam();
                    } else if (e.key === "Escape") {
                      setShowTeamInput(false);
                      setNewTeamName("");
                    }
                  }}
                  placeholder="Team name"
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    fontSize: "13px",
                    background: "#253858",
                    border: "1px solid #4a5f7f",
                    borderRadius: "3px",
                    color: "#ffffff",
                    outline: "none",
                    marginBottom: "8px",
                    fontFamily: "inherit",
                  }}
                />
                <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTeamInput(false);
                      setNewTeamName("");
                    }}
                    style={{
                      padding: "4px 12px",
                      fontSize: "12px",
                      background: "transparent",
                      color: "#8993a4",
                      border: "1px solid #4a5f7f",
                      borderRadius: "3px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddTeam}
                    style={{
                      padding: "4px 12px",
                      fontSize: "12px",
                      background: "#0052cc",
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer",
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
            {teams.map((team) => (
              <div
                key={team.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px 12px",
                }}
              >
                <button
                  className={`sidebar-item ${
                    activeTeam === team.name ? "active" : ""
                  }`}
                  type="button"
                  onClick={() => handleSelectTeam(team.name)}
                  style={{ flex: 1, padding: "6px 8px", justifyContent: "flex-start" }}
                >
                  <span>{team.name}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTeam(team.name);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--jira-text-secondary)",
                    cursor: "pointer",
                    fontSize: "16px",
                    padding: "0 4px",
                  }}
                  title="Delete team"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Projects section */}
        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <span>▼</span>
            <span>Projects</span>
            <button className="add-btn" type="button">
              +
            </button>
          </div>

          <div className="sidebar-section-content">
            {projects.map((group, idx) => (
              <div key={idx}>
                {group.name && (
                  <div className="project-group-header">
                    <span className="folder-icon">📁</span>
                    <span>{group.name}</span>
                    <button className="dropdown-btn-sm" type="button">
                      ▼
                    </button>
                  </div>
                )}

                {group.items.map((project) => (
                  <button
                    key={project.name}
                    className={`sidebar-item sidebar-subitem ${
                      project.active ? "active" : ""
                    }`}
                    type="button"
                  >
                    <span className="project-icon">{project.icon}</span>
                    <span>{project.name}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      
      
    </aside>
  );
}
