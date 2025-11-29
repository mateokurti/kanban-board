"use client";

export default function TableView({ tasks = [] }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "#ff7875";
      case "medium":
        return "#ffc069";
      case "low":
        return "#91d5ff";
      default:
        return "#91d5ff";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high":
        return "🔴";
      case "medium":
        return "🟠";
      case "low":
        return "🔵";
      default:
        return "🔵";
    }
  };

  return (
    <div
      style={{
        background: "var(--jira-bg-card)",
        border: "1px solid var(--jira-border)",
        borderRadius: "3px",
        overflow: "hidden",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr
            style={{
              background: "var(--jira-bg-main)",
              borderBottom: "2px solid var(--jira-border)",
            }}
          >
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--jira-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              ID
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--jira-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Title
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--jira-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Priority
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--jira-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Status
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--jira-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Created
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td
                colSpan="5"
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "var(--jira-text-secondary)",
                  fontSize: "14px",
                }}
              >
                No tasks found
              </td>
            </tr>
          ) : (
            tasks.map((task, index) => (
              <tr
                key={task._id}
                style={{
                  borderBottom: "1px solid var(--jira-border)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <td
                  style={{
                    padding: "12px 16px",
                    fontSize: "13px",
                    color: "var(--jira-text-secondary)",
                  }}
                >
                  #{index + 1}
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    fontSize: "14px",
                    color: "var(--jira-text-primary)",
                    fontWeight: "500",
                  }}
                >
                  <div>{task.title}</div>
                  {task.description && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--jira-text-secondary)",
                        marginTop: "4px",
                        maxWidth: "400px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {task.description}
                    </div>
                  )}
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                  }}
                >
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 8px",
                      borderRadius: "3px",
                      fontSize: "13px",
                      background: `${getPriorityColor(task.priority)}20`,
                      color: getPriorityColor(task.priority),
                      fontWeight: "500",
                    }}
                  >
                    <span>{getPriorityIcon(task.priority)}</span>
                    <span style={{ textTransform: "capitalize" }}>
                      {task.priority}
                    </span>
                  </div>
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      borderRadius: "3px",
                      fontSize: "12px",
                      fontWeight: "500",
                      background:
                        task.status === "done"
                          ? "#52c41a20"
                          : task.status === "in-progress"
                          ? "#1890ff20"
                          : "#00000020",
                      color:
                        task.status === "done"
                          ? "#52c41a"
                          : task.status === "in-progress"
                          ? "#1890ff"
                          : "var(--jira-text-secondary)",
                      textTransform: "capitalize",
                    }}
                  >
                    {task.status === "in-progress" ? "In Progress" : task.status}
                  </span>
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    fontSize: "13px",
                    color: "var(--jira-text-secondary)",
                  }}
                >
                  {task.createdAt ? formatDate(task.createdAt) : "N/A"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
