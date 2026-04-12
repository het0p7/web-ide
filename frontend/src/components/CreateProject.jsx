import { useState } from "react";

export default function CreateProject({ onProjectCreated }) {
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, language }),
      });
      if (response.ok) {
        const data = await response.json();
        onProjectCreated(data.project, data.project.owner);
      } else {
        alert("Failed to create project");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error creating project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: "#2d2d2d",
      padding: "40px",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
      maxWidth: "400px",
      width: "100%"
    }}>
      <h2 style={{ marginTop: 0, color: "#ffffff" }}>Create New Project</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px", color: "#cccccc" }}>Project Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #555",
              borderRadius: "4px",
              backgroundColor: "#1e1e1e",
              color: "#ffffff",
              fontSize: "16px"
            }}
          />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px", color: "#cccccc" }}>Language:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #555",
              borderRadius: "4px",
              backgroundColor: "#1e1e1e",
              color: "#ffffff",
              fontSize: "16px"
            }}
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="c">C</option>
            <option value="cpp">C++</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: loading ? "#555" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Creating..." : "Create Project"}
        </button>
      </form>
    </div>
  );
}