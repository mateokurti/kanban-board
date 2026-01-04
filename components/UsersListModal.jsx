"use client";

import { useEffect, useState } from "react";
import { getUsers } from "../lib/api/users";

export default function UsersListModal({ onClose, onSelectUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (err) {
        setError(err.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#1e2936",
          borderRadius: "6px",
          width: "90%",
          maxWidth: "600px",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
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
            All Registered Users
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

        <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "20px", color: "#8993a4" }}>
              Loading users...
            </div>
          )}

          {error && (
            <div
              style={{
                padding: "10px 12px",
                background: "#d32f2f22",
                border: "1px solid #d32f2f",
                borderRadius: "4px",
                color: "#ff6b6b",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          {!loading && !error && users.length === 0 && (
            <div style={{ textAlign: "center", padding: "20px", color: "#8993a4" }}>
              No users found
            </div>
          )}

          {!loading && !error && users.length > 0 && (
            <>
              <div style={{ fontSize: "12px", color: "#8993a4", marginBottom: "12px" }}>
                {users.length} user{users.length !== 1 ? "s" : ""} registered
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {users.map((user) => (
                  <div
                    key={user._id}
                    style={{
                      padding: "12px",
                      background: "#253858",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      border: "1px solid #4a5f7f",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#2d4461";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#253858";
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "#0052cc",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "14px",
                        fontWeight: "600",
                        flexShrink: 0,
                      }}
                    >
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", color: "#fff", fontWeight: "500" }}>
                        {user.name}
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#8993a4",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {user.email}
                      </div>
                    </div>
                    <button
                      onClick={() => onSelectUser(user.email)}
                      style={{
                        padding: "6px 14px",
                        fontSize: "12px",
                        background: "#0052cc",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        whiteSpace: "nowrap",
                        fontWeight: "500",
                      }}
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
