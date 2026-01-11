"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { createProject, getProjects } from "../lib/api/projects";
import { createTeam, getTeams } from "../lib/api/teams";
import TeamInfoModal from "./TeamInfoModal";
import TeamMembersModal from "./TeamMembersModal";

export const SHOW_ALL_TEAMS = "__SHOW_ALL_TEAMS__";
export const MY_WORK = "__MY_WORK__";
export const UNASSIGNED_PROJECT = "__UNASSIGNED_PROJECT__";
export const UNASSIGNED_TEAM = "__UNASSIGNED_TEAM__";

export default function NewSidebar({ onTeamChange, onProjectChange }) {
  const { data: session } = useSession();
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeNav, setActiveNav] = useState("all");
  const [activeProject, setActiveProject] = useState(null);
  const [openTeams, setOpenTeams] = useState({});
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showAddProjectForTeam, setShowAddProjectForTeam] = useState(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedTeamForInfo, setSelectedTeamForInfo] = useState(null);
  const [selectedTeamForMembers, setSelectedTeamForMembers] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [t, p] = await Promise.all([getTeams(), getProjects()]);
      setTeams(t || []);
      setProjects(p || []);
    } catch (e) {
      console.error(e);
    }
  };

  const selectNav = (key) => {
    setActiveNav(key);
    setActiveProject(null);
    if (key === "my") {
      onTeamChange?.(MY_WORK);
    } else if (key === "all") {
      onTeamChange?.(SHOW_ALL_TEAMS);
    }
    onProjectChange?.(null);
  };

  const selectTeam = (id) => {
    setActiveNav(id);
    setActiveProject(null);
    onTeamChange?.(id);
    onProjectChange?.(null);
  };

  const toggleTeam = (id) => {
    setOpenTeams((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectProject = (id) => {
    // Selecting a project from the global Projects list should not leave a team highlighted.
    // We switch to All Tasks and filter by the selected project.
    setActiveNav("all");
    onTeamChange?.(SHOW_ALL_TEAMS);
    setActiveProject(id);
    onProjectChange?.(id);
  };

  const selectTeamProject = (teamId, projectId) => {
    // Selecting a project within a team should keep the team selected.
    setActiveNav(teamId);
    onTeamChange?.(teamId);
    setActiveProject(projectId);
    onProjectChange?.(projectId);
  };

  const teamProjects = (teamId) => projects.filter((p) => p.teamIds?.includes(teamId));

  const initials = (name) => {
    if (!name) return "?";
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleAddTeam = async () => {
    if (!newTeamName.trim()) return;
    try {
      await createTeam({ name: newTeamName.trim() });
      setNewTeamName("");
      setShowAddTeam(false);
      await fetchData();
    } catch (e) {
      alert(e.message || "Failed to create team");
    }
  };

  const handleAddProject = async () => {
    if (!newProjectName.trim() || !showAddProjectForTeam) return;
    try {
      await createProject({ name: newProjectName.trim(), teamIds: [showAddProjectForTeam] });
      setNewProjectName("");
      setShowAddProjectForTeam(null);
      await fetchData();
    } catch (e) {
      alert(e.message || "Failed to create project");
    }
  };

  return (
    <div className="ns">
      {/* Logo */}
      <div className="ns-logo">
        <span className="ns-logo-icon">◈</span>
        <span className="ns-logo-text">Kanban Board</span>
      </div>

      {/* User */}
      {session?.user && (
        <div className="ns-user">
          <div className="ns-avatar">{initials(session.user.name)}</div>
          <div className="ns-user-info">
            <div className="ns-user-name">{session.user.name}</div>
            <div className="ns-user-email">{session.user.email}</div>
          </div>
          <button className="ns-logout" onClick={() => signOut()} title="Sign out">
            ⏻
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="ns-nav">
        <button
          className={`ns-nav-btn ${activeNav === "my" ? "active" : ""}`}
          onClick={() => selectNav("my")}
        >
          <span className="ns-icon">◉</span>
          My Work
        </button>
        <button
          className={`ns-nav-btn ${activeNav === "all" ? "active" : ""}`}
          onClick={() => selectNav("all")}
        >
          <span className="ns-icon">▦</span>
          All Tasks
        </button>
      </nav>

      {/* Teams */}
      <div className="ns-section">
        <div className="ns-section-header">
          <span className="ns-section-title">Teams</span>
          <button className="ns-add-btn" onClick={() => setShowAddTeam(!showAddTeam)} title="Add team">
            +
          </button>
        </div>
        
        {showAddTeam && (
          <div className="ns-add-form">
            <input
              type="text"
              className="ns-input"
              placeholder="Team name..."
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTeam()}
              autoFocus
            />
            <div className="ns-form-actions">
              <button className="ns-btn ns-btn-primary" onClick={handleAddTeam}>Add</button>
              <button className="ns-btn" onClick={() => { setShowAddTeam(false); setNewTeamName(""); }}>Cancel</button>
            </div>
          </div>
        )}
        
        {teams.length === 0 && !showAddTeam && <div className="ns-empty">No teams</div>}
        {teams.map((team) => (
          <div key={team._id} className="ns-team">
            <div className="ns-team-row">
              <button
                className="ns-toggle"
                onClick={() => toggleTeam(team._id)}
              >
                {openTeams[team._id] ? "▾" : "▸"}
              </button>
              <button
                className={`ns-team-btn ${activeNav === team._id ? "active" : ""}`}
                onClick={() => selectTeam(team._id)}
              >
                <span className="ns-team-dot" style={{ background: stringToColor(team.name) }}></span>
                <span className="ns-team-name">{team.name}</span>
              </button>
              <div className="ns-team-actions">
                <button
                  className="ns-action-btn"
                  onClick={() => setSelectedTeamForInfo(team)}
                  title="Team info"
                >
                  ⓘ
                </button>
                <button
                  className="ns-action-btn"
                  onClick={() => setSelectedTeamForMembers(team)}
                  title="Manage members"
                >
                  👥
                </button>
              </div>
            </div>
            {openTeams[team._id] && (
              <div className="ns-projects">
                {teamProjects(team._id).map((proj) => (
                  <button
                    key={proj._id}
                    className={`ns-project-btn ${activeProject === proj._id ? "active" : ""}`}
                    onClick={() => selectTeamProject(team._id, proj._id)}
                  >
                    <span className="ns-proj-dot"></span>
                    {proj.name}
                  </button>
                ))}
                
                {showAddProjectForTeam === team._id ? (
                  <div className="ns-add-form" style={{ marginTop: '4px' }}>
                    <input
                      type="text"
                      className="ns-input"
                      placeholder="Project name..."
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddProject()}
                      autoFocus
                    />
                    <div className="ns-form-actions">
                      <button className="ns-btn ns-btn-primary" onClick={handleAddProject}>Add</button>
                      <button className="ns-btn" onClick={() => { setShowAddProjectForTeam(null); setNewProjectName(""); }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button 
                    className="ns-add-project-btn"
                    onClick={() => setShowAddProjectForTeam(team._id)}
                  >
                    <span>+</span> Add Project
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Unassigned Teams & Projects */}
        <div style={{ marginTop: '12px' }}>
          <button
            className={`ns-project-btn ${activeNav === UNASSIGNED_TEAM ? 'active' : ''}`}
            onClick={() => selectTeam(UNASSIGNED_TEAM)}
          >
            <span className="ns-proj-dot" style={{ background: '#f85149' }}></span>
            Unassigned Teams
          </button>
          
          <button
            className={`ns-project-btn ${activeProject === UNASSIGNED_PROJECT ? 'active' : ''}`}
            onClick={() => selectProject(UNASSIGNED_PROJECT)}
            style={{ marginTop: '4px' }}
          >
            <span className="ns-proj-dot" style={{ background: '#f85149' }}></span>
            Unassigned Projects
          </button>
        </div>
      </div>

      {/* Modals */}
      {selectedTeamForInfo && (
        <TeamInfoModal
          team={selectedTeamForInfo}
          onClose={() => setSelectedTeamForInfo(null)}
          onUpdate={() => fetchData()}
        />
      )}
      {selectedTeamForMembers && (
        <TeamMembersModal
          team={selectedTeamForMembers}
          onClose={() => setSelectedTeamForMembers(null)}
          onUpdate={() => fetchData()}
        />
      )}
    </div>
  );
}

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 55%)`;
}
