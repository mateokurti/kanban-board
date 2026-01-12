"use client";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

export default function Header({ onAddNew, onSearch, activeView, onViewChange }) {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery("");
      if (onSearch) {
        onSearch("");
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-tabs">
          {(userRole === 'admin' || userRole === 'project_manager') && (
            <button
              className={`header-tab ${activeView === "add" ? "active" : ""}`}
              onClick={onAddNew}
            >
              <span className="add-icon">+</span>
              <span>Add new</span>
            </button>
          )}
        </div>

        <div className="header-views">
          <button className="view-icon-btn">
            <span className="view-icon">☰</span>
          </button>
          <button
            className={`view-btn ${activeView === "table" ? "active" : ""}`}
            onClick={() => onViewChange && onViewChange("table")}
          >
            <span className="view-icon">≡</span>
            <span>Table view</span>
          </button>
          <button
            className={`view-btn ${activeView === "kanban" ? "active" : ""}`}
            onClick={() => onViewChange && onViewChange("kanban")}
          >
            <span className="view-icon">▦</span>
            <span>Kanban board</span>
          </button>
          <button
            className={`view-btn ${activeView === "analytics" ? "active" : ""}`}
            onClick={() => onViewChange && onViewChange("analytics")}
          >
            <span className="view-icon">📊</span>
            <span>Analytics</span>
          </button>
        </div>
      </div>

      <div className="header-right">
        {showSearch ? (
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={handleSearchChange}
            autoFocus
            style={{
              padding: "6px 12px",
              borderRadius: "3px",
              border: "1px solid var(--jira-border)",
              background: "var(--jira-bg-card)",
              color: "var(--jira-text-primary)",
              fontSize: "14px",
              outline: "none",
              minWidth: "200px",
            }}
          />
        ) : null}
        <button className="icon-btn" onClick={toggleSearch}>
          <span>Search</span>
        </button>
        
        {session?.user && (
          <div ref={userMenuRef} style={{ position: "relative" }}>
            <button
              className="icon-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 12px",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "#0052cc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                {session.user.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <span style={{ fontSize: "14px", marginRight: "8px" }}>{session.user.name}</span>
            </button>
            
            {showUserMenu && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  right: 0,
                  background: "#ffffff",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  minWidth: "200px",
                  boxShadow: "var(--shadow-lg)",
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--jira-border)",
                  }}
                >
                  <div style={{ fontWeight: "600", fontSize: "14px" }}>
                    {session.user.name}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--jira-text-secondary)",
                      marginTop: "4px",
                    }}
                  >
                    {session.user.email}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#0052cc",
                      marginTop: "6px",
                      padding: "2px 8px",
                      background: "#e3f2ff",
                      borderRadius: "3px",
                      display: "inline-block",
                      textTransform: "capitalize",
                    }}
                  >
                    {(userRole || 'member').replace('_', ' ')}
                  </div>
                </div>
                <button
                  onClick={() => signOut()}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    background: "transparent",
                    border: "none",
                    color: "var(--jira-text-primary)",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#f8fafc";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "transparent";
                  }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
