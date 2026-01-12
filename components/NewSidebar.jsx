"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { createProject, getProjects } from "../lib/api/projects";
import { createTeam, getTeams } from "../lib/api/teams";
import TeamInfoModal from "./TeamInfoModal";
import TeamMembersModal from "./TeamMembersModal";
import ProjectSettingsModal from "./ProjectSettingsModal";

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
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedTeamForInfo, setSelectedTeamForInfo] = useState(null);
  const [selectedTeamForMembers, setSelectedTeamForMembers] = useState(null);
  const [selectedProjectForSettings, setSelectedProjectForSettings] = useState(null);

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

  const selectProject = (id) => {
    setActiveNav("all");
    onTeamChange?.(SHOW_ALL_TEAMS);
    setActiveProject(id);
    onProjectChange?.(id);
  };

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
    if (!newProjectName.trim()) return;
    try {
      await createProject({ name: newProjectName.trim(), teamIds: [] });
      setNewProjectName("");
      setShowAddProject(false);
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

      <div className="ns-section">
        {/* Teams Section */}
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
          </div>
        ))}

        <button
          className={`ns-project-btn ${activeNav === UNASSIGNED_TEAM ? 'active' : ''}`}
          onClick={() => selectTeam(UNASSIGNED_TEAM)}
          style={{ marginTop: '8px' }}
        >
          <span className="ns-proj-dot" style={{ background: '#f85149' }}></span>
          Unassigned Teams
        </button>

        {/* Projects Section */}
        <div className="ns-section-header" style={{ marginTop: '20px' }}>
          <span className="ns-section-title">Projects</span>
          <button className="ns-add-btn" onClick={() => setShowAddProject(!showAddProject)} title="Add project">
            +
          </button>
        </div>

        {showAddProject && (
          <div className="ns-add-form">
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
              <button className="ns-btn" onClick={() => { setShowAddProject(false); setNewProjectName(""); }}>Cancel</button>
            </div>
          </div>
        )}

        {projects.length === 0 && !showAddProject && <div className="ns-empty">No projects</div>}
        {projects.map((proj) => (
          <div key={proj._id} className="ns-project-row">
            <button
              className={`ns-project-btn ${activeProject === proj._id ? "active" : ""}`}
              onClick={() => selectProject(proj._id)}
            >
              <span className="ns-proj-dot"></span>
              {proj.name}
            </button>
            <button
              className="ns-action-btn ns-project-action"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedProjectForSettings(proj);
              }}
              title="Project settings"
            >
              ⚙
            </button>
          </div>
        ))}

        <button
          className={`ns-project-btn ${activeProject === UNASSIGNED_PROJECT ? 'active' : ''}`}
          onClick={() => selectProject(UNASSIGNED_PROJECT)}
          style={{ marginTop: '8px' }}
        >
          <span className="ns-proj-dot" style={{ background: '#f85149' }}></span>
          Unassigned Projects
        </button>
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
      {selectedProjectForSettings && (
        <ProjectSettingsModal
          project={selectedProjectForSettings}
          teams={teams}
          onClose={() => setSelectedProjectForSettings(null)}
          onUpdate={() => fetchData()}
          onDelete={() => {
            setActiveProject(null);
            onProjectChange?.(null);
            fetchData();
          }}
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
