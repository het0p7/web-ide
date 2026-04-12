import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppData } from "../context/AppContext";
import { ProjectCardSkeleton } from "../components/Skeleton";

export default function Dashboard() {
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("recent");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedTrashProjects, setSelectedTrashProjects] = useState(new Set());
  const navigate = useNavigate();
  const { isAuth, user, logout } = AppData();

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    // Clear selections when changing tabs
    setSelectedTrashProjects(new Set());
  }, [activeTab]);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setAllProjects(data.projects || []);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      // Intentionally adding a tiny delay to show off the cool skeleton loader if network is too fast
      setTimeout(() => setLoading(false), 800);
    }
  };

  const toggleStar = async (projectId, e) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/projects/${projectId}/star`, { method: "PATCH" });
      if (response.ok) {
        setAllProjects(allProjects.map(p => p._id === projectId ? { ...p, isStarred: !p.isStarred } : p));
      }
    } catch (error) {
      console.error("Error toggling star:", error);
    }
  };

  const trashProject = async (projectId, e) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/projects/${projectId}/trash`, { method: "PATCH" });
      if (response.ok) {
        setAllProjects(allProjects.map(p => p._id === projectId ? { ...p, isTrashed: true } : p));
      }
    } catch (error) {
      console.error("Error trashing project:", error);
    }
  };

  const restoreProject = async (projectId, e) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/projects/${projectId}/restore`, { method: "PATCH" });
      if (response.ok) {
        setAllProjects(allProjects.map(p => p._id === projectId ? { ...p, isTrashed: false } : p));
      }
    } catch (error) {
      console.error("Error restoring project:", error);
    }
  };

  const permanentDelete = async (projectId, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this project? This cannot be undone.")) return;
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setAllProjects(allProjects.filter(p => p._id !== projectId));
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const handleSelectTrashProject = (projectId, e) => {
    e?.stopPropagation();
    setSelectedTrashProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const handleSelectAllTrash = () => {
    const trashedIds = allProjects.filter(p => p.isTrashed).map(p => p._id);
    if (selectedTrashProjects.size === trashedIds.length) {
      setSelectedTrashProjects(new Set());
    } else {
      setSelectedTrashProjects(new Set(trashedIds));
    }
  };

  const bulkRestore = async () => {
    if (selectedTrashProjects.size === 0) return;
    setLoading(true);
    try {
      const promises = Array.from(selectedTrashProjects).map(id => 
        fetch(`/api/projects/${id}/restore`, { method: "PATCH" })
      );
      await Promise.all(promises);
      setAllProjects(allProjects.map(p => selectedTrashProjects.has(p._id) ? { ...p, isTrashed: false } : p));
      setSelectedTrashProjects(new Set());
    } catch (error) {
      console.error("Bulk restore failed:", error);
    } finally { setLoading(false); }
  };

  const bulkDelete = async () => {
    if (selectedTrashProjects.size === 0) return;
    if (!confirm(`Are you sure you want to permanently delete ${selectedTrashProjects.size} projects? This cannot be undone.`)) return;
    setLoading(true);
    try {
       const promises = Array.from(selectedTrashProjects).map(id => 
        fetch(`/api/projects/${id}`, { method: "DELETE" })
      );
      await Promise.all(promises);
      setAllProjects(allProjects.filter(p => !selectedTrashProjects.has(p._id)));
      setSelectedTrashProjects(new Set());
    } catch (error) {
       console.error("Bulk delete failed:", error);
    } finally { setLoading(false); }
  };

  const emptyTrash = async () => {
    const trashedIds = allProjects.filter(p => p.isTrashed).map(p => p._id);
    if (trashedIds.length === 0) return;
    if (!confirm(`Are you sure you want to completely empty the trash (${trashedIds.length} projects)? This cannot be undone.`)) return;
    setLoading(true);
    try {
      const promises = trashedIds.map(id => 
        fetch(`/api/projects/${id}`, { method: "DELETE" })
      );
      await Promise.all(promises);
      setAllProjects(allProjects.filter(p => !p.isTrashed));
      setSelectedTrashProjects(new Set());
    } catch (error) {
      console.error("Empty trash failed:", error);
    } finally { setLoading(false); }
  };

  const openProject = (projectId, isTrashed, e) => {
    if (isTrashed) {
        if (activeTab === 'trash') handleSelectTrashProject(projectId, e);
        return; 
    }
    navigate(`/ide/${projectId}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Generate colorful initials for default avatar
  const getInitials = (name) => {
    if (!name) return "U";
    return name.slice(0, 2).toUpperCase();
  };

  // Filter logic
  let displayProjects = allProjects.filter(p => {
    // 1. Tab filtering
    if (activeTab === 'trash') return p.isTrashed;
    if (p.isTrashed) return false;
    if (activeTab === 'starred') return p.isStarred;
    return true;
  }).filter(p => {
    // 2. Search filtering
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(query) || (p.description && p.description.toLowerCase().includes(query));
  });

  // Sort logic
  if (activeTab === 'recent') {
    displayProjects.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    displayProjects = displayProjects.slice(0, 6);
  } else {
    // Sorting for All/Starred/Trash
    displayProjects.sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
        if (sortBy === 'alphabetical') return a.name.localeCompare(b.name);
        return 0;
    });
  }

  const tabs = [
    { id: 'recent', label: 'Recent Projects' },
    { id: 'all', label: 'All Projects' },
    { id: 'starred', label: 'Starred' },
    { id: 'trash', label: 'Trash' }
  ];

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col font-sans">
      {/* Navbar */}
      <nav className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-40">
        <div className="w-full mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center shadow-lg shadow-brand-purple/20">
              <span className="font-bold text-white text-lg">W</span>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
              Workspace
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate("/create-project")}
              className="btn-primary px-5 py-2.5 rounded-xl text-sm hidden sm:flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              New Project
            </button>
            
            <div className="flex items-center gap-3 pl-6 border-l border-white/10">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-medium text-white">{user?.name || "Developer"}</span>
                <button onClick={handleLogout} className="text-xs text-neutral-500 hover:text-brand-cyan transition-colors">Sign out</button>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-10 h-10 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-brand-cyan font-bold hover:border-brand-purple transition-all"
                >
                  {getInitials(user?.name)}
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
                    <div className="absolute right-0 mt-3 w-48 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in translate-y-0">
                      <button 
                        onClick={() => { navigate("/profile"); setShowUserMenu(false); }}
                        className="w-full px-4 py-2.5 text-left text-sm text-neutral-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        Your Profile
                      </button>
                      <button 
                        onClick={() => { navigate("/settings"); setShowUserMenu(false); }}
                        className="w-full px-4 py-2.5 text-left text-sm text-neutral-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        Settings
                      </button>
                      <div className="h-px bg-white/5 my-1 mx-2"></div>
                      <button 
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full mx-auto px-6 py-10 relative">
        <div className="absolute top-20 right-20 w-[500px] h-[500px] bg-brand-purple/10 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none"></div>

        <div className="absolute top-20 right-20 w-[500px] h-[500px] bg-brand-purple/10 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none"></div>


        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 relative z-10">
            {/* Tabs */}
            <div className="flex space-x-1 border-b border-white/10 overflow-x-auto scbar-none flex-1 w-full md:w-auto">
                {tabs.map(tab => (
                    <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
                    className={`px-5 py-3.5 text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
                        activeTab === tab.id 
                        ? 'border-brand-purple text-white bg-brand-purple/5' 
                        : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                    }`}
                    >
                    {tab.label}
                    {tab.id === 'trash' && allProjects.filter(p => p.isTrashed).length > 0 && (
                        <span className="ml-2 bg-neutral-800 text-xs px-2 py-0.5 rounded-md text-neutral-300">
                        {allProjects.filter(p => p.isTrashed).length}
                        </span>
                    )}
                    </button>
                ))}
            </div>

            {/* Search and Sort (Only show if not in 'recent' or if there are projects) */}
            {activeTab !== 'recent' && (
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        <input 
                            type="text" 
                            placeholder={`Search ${activeTab} projects...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-neutral-900 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-purple/50 transition-colors"
                        />
                    </div>
                    <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-neutral-900 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-neutral-400 focus:outline-none focus:border-brand-purple/50 transition-colors appearance-none cursor-pointer"
                    >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="alphabetical">A-Z</option>
                    </select>
                </div>
            )}
        </div>

        {/* Bulk Action Bar for Trash */}
        {activeTab === 'trash' && allProjects.filter(p => p.isTrashed).length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between bg-neutral-900/50 border border-white/5 rounded-2xl p-4 mb-6 relative z-10 gap-4">
            <div className="flex items-center gap-3">
              <button 
                  onClick={handleSelectAllTrash}
                  className="w-5 h-5 rounded border border-white/20 flex items-center justify-center hover:border-brand-cyan transition-colors"
                  title="Select All"
              >
                  {selectedTrashProjects.size === allProjects.filter(p => p.isTrashed).length && (
                      <svg className="w-3.5 h-3.5 text-brand-cyan" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                  )}
              </button>
              <span className="text-sm font-medium text-neutral-300">
                {selectedTrashProjects.size} selected
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {selectedTrashProjects.size > 0 && (
                <>
                  <button onClick={bulkRestore} className="px-4 py-2 bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 group">
                    <svg className="w-4 h-4 transition-transform group-active:scale-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
                    Restore
                  </button>
                  <button onClick={bulkDelete} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 group">
                    <svg className="w-4 h-4 transition-transform group-active:scale-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    Delete
                  </button>
                </>
              )}
              {selectedTrashProjects.size === 0 && (
                <button onClick={emptyTrash} className="px-4 py-2 bg-neutral-800 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/20 rounded-lg text-sm font-semibold transition-colors">
                  Empty Trash
                </button>
              )}
            </div>
          </div>
        )}

        {/* Projects Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            {[1, 2, 3, 4, 5, 6].map((it) => (
              <ProjectCardSkeleton key={it} />
            ))}
          </div>
        ) : displayProjects.length === 0 ? (
          <div className="glass-card rounded-3xl p-16 text-center border-dashed border-2 border-white/10 flex flex-col items-center justify-center relative z-10 animate-fade-in">
            <div className="w-20 h-20 mb-6 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center shadow-inner">
              <svg className="w-10 h-10 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {activeTab === 'trash' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />}
                {activeTab === 'starred' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />}
                {(activeTab === 'recent' || activeTab === 'all') && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />}
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">
              {activeTab === 'trash' ? 'Trash is empty' : 
               activeTab === 'starred' ? 'No starred projects' : 'No projects found'}
            </h3>
            <p className="text-neutral-400 mb-8 max-w-md">
              {activeTab === 'trash' ? 'Items you delete will appear here.' : 
               activeTab === 'starred' ? 'Star projects to easily find them later.' : 
               'You haven\'t created any coding environments yet. Create a new sandbox to get started writing code.'}
            </p>
            {activeTab !== 'trash' && activeTab !== 'starred' && (
              <button
                onClick={() => navigate("/create-project")}
                className="btn-primary px-8 py-3.5 rounded-full font-medium"
              >
                Initialize Workspace
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 animate-fade-in">
            {displayProjects.map((project) => (
              <div 
                key={project._id} 
                onClick={(e) => openProject(project._id, project.isTrashed, e)}
                className={`glass-card rounded-2xl p-6 border transition-all flex flex-col group ${!project.isTrashed ? 'hover:border-brand-purple/30 border-white/5 cursor-pointer active:scale-[0.98]' : (selectedTrashProjects.has(project._id) ? 'border-brand-cyan bg-brand-cyan/5 cursor-pointer' : 'border-white/5 opacity-80 hover:opacity-100 cursor-pointer')}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3 max-w-[70%]">
                    {project.isTrashed && activeTab === 'trash' && (
                        <button 
                            onClick={(e) => handleSelectTrashProject(project._id, e)}
                            className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${selectedTrashProjects.has(project._id) ? 'bg-brand-cyan border-brand-cyan text-black' : 'border-white/20 hover:border-brand-cyan'}`}
                        >
                            {selectedTrashProjects.has(project._id) && (
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                            )}
                        </button>
                    )}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow-inner shrink-0 ${
                      project.language === 'python' ? 'bg-blue-600' :
                      project.language === 'node' || project.language === 'javascript' ? 'bg-yellow-500' :
                      project.language === 'java' ? 'bg-orange-500' :
                      project.language === 'cpp' || project.language === 'c' ? 'bg-blue-800' :
                      'bg-neutral-800'
                    }`}>
                      {project.language ? project.language.substring(0, 1).toUpperCase() : 'C'}
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold line-clamp-1 transition-colors ${!project.isTrashed ? 'text-white group-hover:text-brand-cyan' : 'text-neutral-300 line-through'}`}>
                        {project.name}
                      </h3>
                      <p className="text-xs text-neutral-500">{project.language || "code"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {!project.isTrashed && (
                      <>
                        <button
                          onClick={(e) => toggleStar(project._id, e)}
                          className={`p-2 rounded-lg transition-all ${project.isStarred ? 'text-yellow-500' : 'text-neutral-500 hover:bg-white/10 hover:text-yellow-400 opacity-0 group-hover:opacity-100'}`}
                          title={project.isStarred ? "Unstar" : "Star project"}
                        >
                          <svg className="w-5 h-5" fill={project.isStarred ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                        </button>
                        <button
                          onClick={(e) => trashProject(project._id, e)}
                          className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-500/10 text-neutral-500 hover:text-red-400 transition-all"
                          title="Move to trash"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </>
                    )}
                    
                    {project.isTrashed && (
                      <>
                        <button
                          onClick={(e) => restoreProject(project._id, e)}
                          className="p-2 text-brand-cyan hover:bg-brand-cyan/10 rounded-lg transition-all"
                          title="Restore"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
                        </button>
                        <button
                          onClick={(e) => permanentDelete(project._id, e)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Permanently Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-neutral-400 line-clamp-2 mb-6 flex-1">
                  {project.description || "No description provided."}
                </p>
                
                <div className="flex justify-between items-center text-xs font-medium text-neutral-500 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {new Date(project.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  {!project.isTrashed && (
                    <div className="flex items-center gap-2 group-hover:text-brand-cyan transition-colors">
                      Open <span className="translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
