"use client";
import { useState } from "react";

export default function Header({ onAddNew, onSearch, activeView, onViewChange }) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-tabs">
          <button
            className={`header-tab ${activeView === "add" ? "active" : ""}`}
            onClick={onAddNew}
          >
            <span className="add-icon">+</span>
            <span>Add new</span>
          </button>
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
      </div>
    </header>
  );
}
