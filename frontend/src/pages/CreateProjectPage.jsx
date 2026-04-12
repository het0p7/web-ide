import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppData } from "../context/AppContext";

export default function CreateProjectPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = AppData();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, language }),
      });
      if (response.ok) {
        const data = await response.json();
        navigate(`/ide/${data.project._id}`);
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

  const programmingLanguages = [
    { id: "javascript", name: "JavaScript", icon: "JS", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
    { id: "python", name: "Python", icon: "PY", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
    { id: "java", name: "Java", icon: "JA", color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
    { id: "cpp", name: "C++", icon: "C++", color: "text-blue-600 bg-blue-600/10 border-blue-600/20" },
    { id: "c", name: "C", icon: "C", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col font-sans relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand-cyan/10 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none"></div>
      
      {/* Navbar Minimal */}
      <nav className="border-b border-white/5 bg-black/20 backdrop-blur-md relative z-20">
        <div className="w-full mx-auto px-6 h-20 flex items-center justify-between">
          <button 
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Back to Dashboard
          </button>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="glass-card max-w-xl w-full rounded-3xl p-10 animate-slide-up">
          <div className="mb-8 text-center">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-brand-purple to-brand-cyan rounded-2xl flex items-center justify-center shadow-lg shadow-brand-purple/20 mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Workspace</h2>
            <p className="text-neutral-400">Initialize a new secure coding sandbox.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Project Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g., my-awesome-app"
                className="glass-input w-full rounded-xl py-3.5 px-4 text-white text-lg font-medium"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe what this project does..."
                rows="2"
                className="glass-input w-full rounded-xl py-3.5 px-4 text-white text-md font-medium resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-3">Programming Language</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {programmingLanguages.map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => setLanguage(lang.id)}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                      language === lang.id 
                        ? 'bg-white/10 border-brand-cyan ring-1 ring-brand-cyan shadow-lg shadow-brand-cyan/20 scale-105' 
                        : 'bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold border ${lang.color}`}>
                      {lang.icon}
                    </div>
                    <span className={`text-sm font-medium ${language === lang.id ? 'text-white' : 'text-neutral-400'}`}>
                      {lang.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !name}
              className="btn-primary w-full py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium flex justify-center items-center gap-2 shadow-2xl mt-8"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  Initializing container...
                </>
              ) : "Launch Workspace"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
