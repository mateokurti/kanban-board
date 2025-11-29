"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createTask } from "../../lib/api/tasks";

export default function NewTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamId = searchParams.get("team");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

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
        teamId: teamId || null
      });
      router.push("/");
    } catch (err) {
      console.error("Error creating task:", err);
      setError(err.message || "Failed to create task. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--jira-bg-main)",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <button
            onClick={() => router.push("/")}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--jira-text-secondary)",
              cursor: "pointer",
              fontSize: "14px",
              padding: "8px 0",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            ← Back to board
          </button>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "600",
              margin: "0",
              color: "var(--jira-text-primary)",
            }}
          >
            Create New Task
          </h1>
        </div>

        {/* Form Card */}
        <div
          style={{
            background: "var(--jira-bg-card)",
            border: "2px solid var(--jira-border)",
            borderRadius: "3px",
            padding: "32px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "24px",
              }}
            >
              {/* Title Field */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "var(--jira-text-primary)",
                    marginBottom: "8px",
                  }}
                >
                  Summary *
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="What needs to be done?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    fontSize: "16px",
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
                    color: "var(--jira-text-primary)",
                    marginBottom: "8px",
                  }}
                >
                  Description
                </label>
                <textarea
                  className="input"
                  rows={6}
                  placeholder="Add more details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: "100%",
                    fontSize: "14px",
                    resize: "vertical",
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
                    color: "var(--jira-text-primary)",
                    marginBottom: "8px",
                  }}
                >
                  Priority
                </label>
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                    className="input"
                    style={{
                      width: "100%",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "16px" }}>
                        {priority === "high" ? "🔴" : priority === "medium" ? "🟠" : "🔵"}
                      </span>
                      <span>
                        {priority === "high" ? " High" : priority === "medium" ? " Medium" : " Low"}
                      </span>
                    </span>
                    <span>▼</span>
                  </button>

                  {showPriorityDropdown && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: "0",
                        width: "100%",
                        background: "var(--jira-bg-card)",
                        border: "1px solid var(--jira-border)",
                        borderRadius: "3px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                        zIndex: 1000,
                      }}
                    >
                      <div
                        style={{
                          padding: "8px",
                          borderBottom: "1px solid var(--jira-border)",
                        }}
                      >
                        <input
                          type="text"
                          placeholder="Find Priorities..."
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            fontSize: "13px",
                            background: "var(--jira-bg-main)",
                            border: "1px solid var(--jira-border)",
                            borderRadius: "3px",
                            color: "var(--jira-text-primary)",
                            outline: "none",
                          }}
                        />
                      </div>

                      <div style={{ padding: "4px 0" }}>
                        {["high", "medium", "low"].map((p) => (
                          <div
                            key={p}
                            onClick={() => {
                              setPriority(p);
                            }}
                            style={{
                              padding: "8px 12px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              background:
                                priority === p
                                  ? "rgba(255, 255, 255, 0.05)"
                                  : "transparent",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                "rgba(255, 255, 255, 0.05)";
                            }}
                            onMouseLeave={(e) => {
                              if (priority !== p) {
                                e.currentTarget.style.background = "transparent";
                              }
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={priority === p}
                              readOnly
                              style={{
                                width: "16px",
                                height: "16px",
                                cursor: "pointer",
                              }}
                            />
                            <span style={{ fontSize: "16px" }}>
                              {p === "high" ? "🔴" : p === "medium" ? "🟠" : "🔵"}
                            </span>
                            <span
                              style={{
                                fontSize: "14px",
                                color: "var(--jira-text-primary)",
                              }}
                            >
                              {p === "high" ? " High" : p === "medium" ? " Medium" : " Low"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  className="error-message"
                  style={{
                    padding: "12px",
                    borderRadius: "3px",
                  }}
                >
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                  paddingTop: "200px",
                }}
              >
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  style={{
                    padding: "8px 20px",
                    fontSize: "14px",
                    fontWeight: "500",
                    borderRadius: "3px",
                    border: "1px solid var(--jira-border)",
                    background: "transparent",
                    color: "var(--jira-text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn"
                  style={{
                    padding: "8px 24px",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  {loading ? "Creating..." : "Create Task"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
