import { useState } from "react";
import "../styles/FileModal.css";

export default function FileModal({ title, onClose, onSubmit, initialValue = "" }) {
  const [name, setName] = useState(initialValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name);
      setName("");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {title.toLowerCase().includes("rename") ? "Rename" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
