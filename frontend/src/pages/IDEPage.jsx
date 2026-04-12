import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { useParams, useNavigate } from "react-router-dom";
import ProjectTerminal from "../components/ProjectTerminal";
import FileTree from "../components/FileTree";
import Editor from "../components/Editor";
import FileIcon from "../components/FileIcon";
import { formatCode } from "../services/formatterService";
import { AppData } from "../context/AppContext";
import { Panel, Group, Separator } from "react-resizable-panels";

const ResizeHandle = ({ direction = "vertical", className = "" }) => (
  <Separator
    className={`
      flex items-center justify-center transition-all duration-300 ease-in-out
      ${direction === "horizontal" ? "h-1.5 w-full cursor-row-resize" : "w-1.5 h-full cursor-col-resize"}
      group
      ${className}
    `}
  >
    <div className={`
      transition-all duration-300
      ${direction === "horizontal" ? "w-12 h-[2px] rounded-full group-hover:w-24 group-hover:bg-brand-cyan group-hover:shadow-[0_0_8px_rgba(34,211,238,0.4)] bg-white/10" : "h-12 w-[2px] rounded-full group-hover:h-24 group-hover:bg-brand-cyan group-hover:shadow-[0_0_8px_rgba(34,211,238,0.4)] bg-white/10"}
    `} />
  </Separator>
);

export default function IDEPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [tabs, setTabs] = useState([]);
  const [tabContents, setTabContents] = useState({});
  const [dirtyTabs, setDirtyTabs] = useState({});
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isCreating, setIsCreating] = useState(null);
  const [selectedPath, setSelectedPath] = useState("");
  const [refreshTree, setRefreshTree] = useState(0);
  const { user } = AppData();

  const refreshRef = useRef(refreshTree);

  useEffect(() => {
    if (refreshRef.current !== refreshTree) {
      refreshRef.current = refreshTree;
      if (!project) return;
      tabs.forEach(async (path) => {
        if (!dirtyTabs[path]) {
          try {
            const res = await fetch(`/api/projects/${project._id}/file?path=${encodeURIComponent(path)}`);
            if (res.ok) {
              const data = await res.json();
              setTabContents(prev => {
                if (prev[path] !== data.content) return { ...prev, [path]: data.content };
                return prev;
              });
            }
          } catch (e) {}
        }
      });
    }
  }, [refreshTree, project, tabs, dirtyTabs]);

  const [sidebarPosition, setSidebarPosition] = useState(user?.settings?.sidebarPosition || 'left');
  const [panelPosition, setPanelPosition] = useState(user?.settings?.panelPosition || 'right');
  const [panelOpen, setPanelOpen] = useState(true);
  const [zenMode, setZenMode] = useState(false);
  const [layoutMenuOpen, setLayoutMenuOpen] = useState(false);
  const [terminalWidth, setTerminalWidth] = useState(300);
  const [terminalHeight, setTerminalHeight] = useState(300);

  useEffect(() => {
    if (user?.settings) {
      if (user.settings.sidebarPosition) setSidebarPosition(user.settings.sidebarPosition);
      if (user.settings.panelPosition) setPanelPosition(user.settings.panelPosition);
    }
  }, [user?.settings]);

  const updateLayoutSetting = async (key, value) => {
    try {
      await fetch('/api/v1/settings', {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (error) {
      console.error("Error updating layout setting:", error);
    }
  };
  
  const switchTab = (newPath) => {
    if (activeTab === newPath) return;
    if (activeTab && dirtyTabs[activeTab] && user?.settings?.autoSave) {
        handleFileSave(activeTab);
    }
    setActiveTab(newPath);
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  useEffect(() => {
    if (!user?.settings?.autoSave || !activeTab || !dirtyTabs[activeTab]) return;
    const timer = setTimeout(() => {
        handleFileSave(activeTab);
    }, 5000);
    return () => clearTimeout(timer);
  }, [tabContents[activeTab], activeTab, user?.settings?.autoSave]);


  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
        setUserId(data.project.owner);
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      navigate("/dashboard");
    }
  };

  const handleFileSelect = async (filePath) => {
    if (!project) return;
    const isMultiTab = user?.settings?.multiTabs;
    if (isMultiTab && tabs.includes(filePath)) {
        switchTab(filePath);
        return;
    }
    if (activeTab && dirtyTabs[activeTab] && user?.settings?.autoSave) {
        handleFileSave(activeTab);
    }
    try {
      const response = await fetch(
        `/api/projects/${project._id}/file?path=${encodeURIComponent(filePath)}`
      );
      if (response.ok) {
        const data = await response.json();
        if (isMultiTab) {
            setTabs(prev => [...prev, filePath]);
            setTabContents(prev => ({ ...prev, [filePath]: data.content }));
            setActiveTab(filePath);
        } else {
            setTabs([filePath]);
            setTabContents({ [filePath]: data.content });
            setDirtyTabs({});
            setActiveTab(filePath);
        }
      }
    } catch (error) {
      console.error("Error loading file:", error);
    }
  };

  const closeTab = (e, filePath) => {
    e.stopPropagation();
    if (dirtyTabs[filePath] && user?.settings?.autoSave) {
        handleFileSave(filePath);
    }
    const newTabs = tabs.filter(t => t !== filePath);
    setTabs(newTabs);
    const newContents = { ...tabContents };
    delete newContents[filePath];
    setTabContents(newContents);
    const newDirty = { ...dirtyTabs };
    delete newDirty[filePath];
    setDirtyTabs(newDirty);
    if (activeTab === filePath) {
        setActiveTab(newTabs.length > 0 ? newTabs[newTabs.length - 1] : null);
    }
  };

  const handleFileSave = async (targetPath = activeTab, immediateContent = null) => {
    if (!project || !targetPath) return;
    try {
      let contentToSave = immediateContent !== null ? immediateContent : tabContents[targetPath];
      
      // Apply "Format on Save"
      if (user?.settings?.formatOnSave) {
        contentToSave = await formatCode(contentToSave, targetPath);
      }

      await fetch(`/api/projects/${project._id}/file`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: targetPath, content: contentToSave }),
      });
      if (immediateContent !== null) {
          setTabContents(prev => ({...prev, [targetPath]: immediateContent}));
      }
      setDirtyTabs(prev => ({ ...prev, [targetPath]: false }));
    } catch (error) {
      console.error("Error saving file:", error);
    }
  };

  const handleDeletePath = async (item) => {
    if (!project) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete ${item.name}?`);
    if (!confirmDelete) return;
    try {
      const response = await fetch(`/api/projects/${project._id}/path`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: item.path }),
      });
      if (response.ok) {
        const itemPath = item.path;
        setTabs(prev => prev.filter(t => !t.startsWith(itemPath + "/") && t !== itemPath));
        setTabContents(prev => {
            const next = { ...prev };
            for (const path in prev) {
                if (path.startsWith(itemPath + "/") || path === itemPath) delete next[path];
            }
            return next;
        });
        if (activeTab?.startsWith(itemPath + "/") || activeTab === itemPath) setActiveTab(null);
        setRefreshTree(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error deleting path:", error);
    }
  };

  const handleRenamePath = async (item, newName) => {
    if (!project) return;
    const oldPath = item.path;
    const pathParts = oldPath.split("/");
    pathParts.pop();
    const newPath = pathParts.length > 0 ? `${pathParts.join("/")}/${newName}` : newName;
    try {
      const response = await fetch(`/api/projects/${project._id}/rename`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPath, newPath }),
      });
      if (response.ok) {
        setTabs(prev => prev.map(t => {
            if (t === oldPath) return newPath;
            if (t.startsWith(oldPath + "/")) return t.replace(oldPath, newPath);
            return t;
        }));
        setTabContents(prev => {
            const next = { ...prev };
            for (const path in prev) {
                if (path === oldPath) {
                    next[newPath] = prev[oldPath]; delete next[oldPath];
                } else if (path.startsWith(oldPath + "/")) {
                    const nextPath = path.replace(oldPath, newPath);
                    next[nextPath] = prev[path]; delete next[path];
                }
            }
            return next;
        });
        if (activeTab === oldPath) setActiveTab(newPath);
        else if (activeTab?.startsWith(oldPath + "/")) setActiveTab(activeTab.replace(oldPath, newPath));
        setRefreshTree(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error renaming path:", error);
    }
  };

  const handleMovePath = async (oldPath, newPath) => {
    if (!project) return;
    try {
      const response = await fetch(`/api/projects/${project._id}/move`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPath, newPath }),
      });
      if (response.ok) {
        setTabs(prev => prev.map(t => {
            if (t === oldPath) return newPath;
            if (t.startsWith(oldPath + "/")) return t.replace(oldPath, newPath);
            return t;
        }));
        setTabContents(prev => {
            const next = { ...prev };
            for (const path in prev) {
                if (path === oldPath) {
                    next[newPath] = prev[oldPath]; delete next[oldPath];
                } else if (path.startsWith(oldPath + "/")) {
                    const nextPath = path.replace(oldPath, newPath);
                    next[nextPath] = prev[path]; delete next[path];
                }
            }
            return next;
        });
        if (activeTab === oldPath) setActiveTab(newPath);
        else if (activeTab?.startsWith(oldPath + "/")) setActiveTab(activeTab.replace(oldPath, newPath));
        setRefreshTree(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error moving path:", error);
    }
  };

  const handlePathSelect = (path, isFolder) => {
    if (isFolder) setSelectedPath(path);
    else {
      const parts = path.split('/');
      parts.pop();
      setSelectedPath(parts.join('/'));
    }
  };

  const handleInitiateCreate = (type, path) => {
    setSelectedPath(path || "");
    setIsCreating(type);
  };

  const handleCreateFile = async (fileName) => {
    try {
      const fullPath = selectedPath ? `${selectedPath}/${fileName}` : fileName;
      const response = await fetch(`/api/projects/${project._id}/file`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: fullPath, content: "" }),
      });
      if (response.ok) {
        setIsCreating(null);
        setRefreshTree(prev => prev + 1);
        // Automatically open the newly created file
        handleFileSelect(fullPath);
      }
    } catch (error) {
      console.error("Error creating file:", error);
    }
  };

  const handleCreateFolder = async (folderName) => {
    try {
      const fullPath = selectedPath ? `${selectedPath}/${folderName}` : folderName;
      await fetch(`/api/projects/${project._id}/folder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: fullPath }),
      });
      setIsCreating(null);
      setRefreshTree(prev => prev + 1);
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  const handleRunProject = async () => {
    if (!project) return;

    // Apply "Format before Run"
    if (user?.settings?.formatBeforeRun && activeTab) {
      await handleFileSave(activeTab);
    }

    if (user?.settings?.autoSave) {
        for (const path in dirtyTabs) {
            if (dirtyTabs[path]) await handleFileSave(path);
        }
    }
    
    // Instead of always project.entryPoint, try to run activeTab if it's executable!
    let targetFile = activeTab || project.entryPoint;
    if (!targetFile) return;

    let targetLanguage = project.language;
    
    if (activeTab) {
       const ext = activeTab.split('.').pop().toLowerCase();
       if (ext === 'js' || ext === 'jsx' || ext === 'ts') targetLanguage = "javascript";
       else if (ext === 'py') targetLanguage = "python";
       else if (ext === 'c') targetLanguage = "c";
       else if (ext === 'cpp') targetLanguage = "cpp";
       else if (ext === 'java') targetLanguage = "java";
       else targetFile = project.entryPoint; // Fallback to entry point
    }

    let command = "";
    switch(targetLanguage) {
      case "javascript": command = `node ${targetFile}`; break;
      case "python": command = `python ${targetFile}`; break;
      case "c": command = `gcc ${targetFile} -o program && ./program`; break;
      case "cpp": command = `g++ ${targetFile} -o program && ./program`; break;
      case "java": 
        const base = targetFile.split("/").pop().replace(".java", "");
        command = `javac ${targetFile} && java ${base}`; 
        break;
      default: 
        command = `echo "No executor set for ${targetFile}"`;
    }

    // Open panel if hidden, then dispatch — terminal is always mounted so WS is ready
    if (!panelOpen) setPanelOpen(true);
    window.dispatchEvent(new CustomEvent("terminal-input", { detail: command + "\r" }));
  };

  if (!project) {
    return (
        <div className="h-screen w-full bg-neutral-950 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-brand-purple/20 border-t-brand-cyan rounded-full animate-spin mb-4"></div>
            <p className="text-neutral-400 font-medium">Provisioning workspace environment...</p>
        </div>
    );
  }



  return (
    <div className="h-screen w-full flex flex-col bg-[#0a0a0a] text-neutral-300 font-sans overflow-hidden">
      <header className="h-[52px] bg-[#141414] border-b border-white/5 flex items-center justify-between px-4 z-50 shrink-0">
        <div className="flex items-center gap-3">
          <button className="p-1.5 rounded hover:bg-white/10 text-neutral-400 hover:text-white" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Icon icon="codicon:menu" className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center"><span className="font-bold text-white text-[10px]">W</span></div>
            <h1 className="font-semibold text-white/90 text-sm truncate max-w-[200px]">{project.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeTab && (
            <button onClick={handleRunProject} className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 bg-brand-cyan text-black hover:bg-brand-cyan/90 shadow-lg shadow-brand-cyan/20 transition-all active:scale-95`}>
              <Icon icon="codicon:play" className="w-3.5 h-3.5" />
              Run File
            </button>
          )}

          {(user?.settings?.autoSave === false || user?.settings?.autoSave === undefined) && (
            <button
               onClick={() => handleFileSave()}
               className={`
                 px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95
                 ${activeTab && dirtyTabs[activeTab] ? 'bg-brand-purple text-white hover:bg-brand-purple/90 shadow-lg shadow-brand-purple/20' : 'bg-white/5 text-neutral-500 cursor-default'}
               `}
               disabled={!activeTab || !dirtyTabs[activeTab]}
               title="Save File"
            >
               <Icon icon="codicon:save" className="w-3.5 h-3.5" />
               <span className="hidden sm:inline">Save</span>
            </button>
          )}

          <div className="hidden sm:flex items-center border-x border-white/5 px-2 mx-1 relative">
            <button 
              onClick={() => setLayoutMenuOpen(!layoutMenuOpen)}
              className={`p-1.5 rounded hover:bg-white/10 transition-all duration-300 group relative ${layoutMenuOpen ? 'text-brand-cyan bg-white/5 rotate-90' : 'text-neutral-400'}`}
              title="Layout Settings"
            >
              <Icon icon="codicon:settings-gear" className="w-4 h-4" />
            </button>

            <div className={`flex items-center gap-1 transition-all duration-500 ease-out ${layoutMenuOpen ? 'max-w-[200px] opacity-100 ml-2 overflow-visible' : 'max-w-0 opacity-0 ml-0 overflow-hidden'}`}>
              <button 
                className={`p-1.5 rounded hover:bg-white/10 transition-colors group relative ${zenMode ? 'text-brand-cyan bg-white/5' : 'text-neutral-400'}`}
                onClick={() => setZenMode(!zenMode)}
                title="Zen Mode"
              >
                <Icon icon="codicon:screen-full" className="w-4 h-4" />
              </button>
              <button 
                className="p-1.5 rounded hover:bg-white/10 text-neutral-400 transition-colors group relative"
                onClick={() => {
                  const newPos = sidebarPosition === 'left' ? 'right' : 'left';
                  setSidebarPosition(newPos);
                  updateLayoutSetting('sidebarPosition', newPos);
                }}
                title="Swap Sidebar Side"
              >
                <Icon icon="codicon:layout-sidebar-left" className="w-4 h-4" />
              </button>
              <button 
                className="p-1.5 rounded hover:bg-white/10 text-neutral-400 transition-colors group relative"
                onClick={() => {
                  const newPos = panelPosition === 'right' ? 'bottom' : 'right';
                  setPanelPosition(newPos);
                  updateLayoutSetting('panelPosition', newPos);
                  setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
                }}
                title="Swap Terminal Side"
              >
                <Icon icon="codicon:editor-layout" className="w-4 h-4" />
              </button>
              <button 
                className={`p-1.5 rounded hover:bg-white/10 transition-colors group relative ${panelOpen ? 'text-brand-purple' : 'text-neutral-500'}`}
                onClick={() => setPanelOpen(!panelOpen)}
                title="Toggle Terminal"
              >
                <Icon icon="codicon:terminal" className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button onClick={() => navigate("/dashboard")} className="p-1.5 rounded hover:bg-white/10 text-neutral-400 flex items-center gap-1.5 text-xs">
            <Icon icon="codicon:home" className="w-4 h-4" />
            Dashboard
          </button>
        </div>
      </header>

      <div className={`flex-1 flex min-h-0 relative ${sidebarPosition === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
        {sidebarOpen && !zenMode && (
          <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setSidebarOpen(false)} />
        )}

        {sidebarOpen && !zenMode && (
          <div className={`bg-[#141414] z-20 md:relative fixed inset-y-0 w-[85%] md:w-[280px] shrink-0 border-white/5 ${sidebarPosition === 'left' ? 'left-0 border-r' : 'right-0 border-l'} transition-all`}>
            <div className="h-full flex flex-col">
              <div className="h-10 flex items-center justify-between px-4 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Explorer</h3>
                    {selectedPath && (
                        <button onClick={() => setSelectedPath("")} className="text-[10px] bg-white/5 hover:bg-white/10 px-1.5 py-0.5 rounded text-neutral-400 hover:text-white transition-all flex items-center gap-1">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg> Root
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-1">
                  <button className={`p-1 rounded hover:bg-white/10 ${isCreating === 'file' ? 'text-brand-cyan' : 'text-neutral-400'}`} onClick={() => setIsCreating(isCreating === 'file' ? null : 'file')}>
                    <Icon icon="codicon:new-file" className="w-4 h-4" />
                  </button>
                  <button className={`p-1 rounded hover:bg-white/10 ${isCreating === 'folder' ? 'text-brand-cyan' : 'text-neutral-400'}`} onClick={() => setIsCreating(isCreating === 'folder' ? null : 'folder')}>
                    <Icon icon="codicon:new-folder" className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                <FileTree 
                    projectId={project._id} onFileSelect={handleFileSelect} onPathSelect={handlePathSelect}
                    onRename={handleRenamePath} onMove={handleMovePath} onDelete={handleDeletePath}
                    onCreate={(name, type) => type === 'folder' ? handleCreateFolder(name) : handleCreateFile(name)}
                    onInitiateCreate={handleInitiateCreate}
                    onCancelCreate={() => setIsCreating(null)} isCreating={isCreating}
                    selectedPath={selectedPath} refreshTrigger={refreshTree} 
                    activeFile={activeTab}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0 relative">
          <div className="absolute inset-0 flex flex-col min-h-0 bg-[#0a0a0a]">
            <div className="flex shrink-0 bg-[#252526] overflow-x-auto custom-scrollbar tabs-container">
              {tabs.map((path) => {
                const isDirty = dirtyTabs[path] && (user?.settings?.autoSave === false || user?.settings?.autoSave === undefined);
                const isActive = activeTab === path;
                const fileName = path.split("/").pop();
                return (
                <div 
                  key={path} 
                  onClick={() => switchTab(path)} 
                  className={`flex items-center px-3 h-[35px] border-r border-[#1e1e1e] cursor-pointer min-w-[120px] max-w-[220px] text-[13px] group shrink-0 ${isActive ? 'bg-[#1e1e1e] border-t-[1px] border-t-brand-cyan text-white' : 'bg-[#2d2d2d] border-t-[1px] border-t-transparent text-[#969696] hover:bg-[#2b2d30]'}`}
                >
                  <FileIcon name={fileName} className="w-3.5 h-3.5 mr-2" />
                  <span className="truncate flex-1 font-sans tracking-wide leading-none pt-0.5">{fileName}</span>
                  <button 
                     onClick={(e) => closeTab(e, path)} 
                     className={`ml-2 flex items-center justify-center w-[18px] h-[18px] rounded hover:bg-white/10 ${isActive ? 'text-white' : 'text-[#969696]'}`}
                  >
                    {isDirty ? (
                      <>
                        <Icon icon="codicon:circle-filled" className="w-2.5 h-2.5 text-white group-hover:hidden" />
                        <Icon icon="codicon:close" className="w-3.5 h-3.5 hidden group-hover:block" />
                      </>
                    ) : (
                      <Icon icon="codicon:close" className={`w-3.5 h-3.5 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                    )}
                  </button>
                </div>
              )})}
            </div>
            <div className="flex-1 relative min-h-0">
              {activeTab ? <Editor key={activeTab} filePath={activeTab} content={tabContents[activeTab]} onChange={(v) => { setTabContents(p => ({...p, [activeTab]: v})); if (!dirtyTabs[activeTab]) setDirtyTabs(p => ({...p, [activeTab]: true})); }} onSave={(val) => handleFileSave(activeTab, val)} settings={user?.settings} /> : <div className="absolute inset-0 flex items-center justify-center text-neutral-500 italic">Select a file to start coding</div>}
            </div>
          </div>

          {/* Terminal panel — always mounted so WS stays connected; only visibility toggles */}
          {userId && (
            <div 
              className="flex flex-col shadow-[0_0_15px_rgba(0,0,0,0.3)]"
              style={{ 
                  ...((panelPosition === "bottom") ? { bottom: 0, left: 0, right: 0, height: terminalHeight, borderTopWidth: 1 } : { top: 0, bottom: 0, right: 0, width: terminalWidth, borderLeftWidth: 1 }),
                  borderColor: "rgba(255,255,255,0.05)",
                  position: "absolute", 
                  zIndex: panelOpen && !zenMode ? 20 : -1,
                  backgroundColor: "#141414",
                  visibility: panelOpen && !zenMode ? "visible" : "hidden",
                  pointerEvents: panelOpen && !zenMode ? "auto" : "none",
              }}
            >
              {/* Custom Resize Handle — only interactive when visible */}
              {panelOpen && !zenMode && (
                <div 
                    className={`absolute bg-transparent hover:bg-brand-cyan/50 transition-colors z-30 ${panelPosition === "bottom" ? "top-0 left-0 right-0 h-1.5 cursor-row-resize -mt-[3px]" : "top-0 bottom-0 left-0 w-1.5 cursor-col-resize -ml-[3px]"}`}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        const startPos = panelPosition === "bottom" ? e.clientY : e.clientX;
                        const startSize = panelPosition === "bottom" ? terminalHeight : terminalWidth;
                        const cover = document.createElement('div');
                        cover.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;cursor:' + (panelPosition === "bottom" ? "row-resize" : "col-resize");
                        document.body.appendChild(cover);
                        const onMouseMove = (moveEvent) => {
                            if (panelPosition === "bottom") {
                                const delta = startPos - moveEvent.clientY;
                                setTerminalHeight(Math.max(100, Math.min(window.innerHeight - 100, startSize + delta)));
                            } else {
                                const delta = startPos - moveEvent.clientX;
                                setTerminalWidth(Math.max(200, Math.min(window.innerWidth - 100, startSize + delta)));
                            }
                        };
                        const onMouseUp = () => {
                            document.body.removeChild(cover);
                            window.removeEventListener("mousemove", onMouseMove);
                            window.removeEventListener("mouseup", onMouseUp);
                            window.dispatchEvent(new Event('resize'));
                        };
                        window.addEventListener("mousemove", onMouseMove);
                        window.addEventListener("mouseup", onMouseUp);
                    }}
                />
              )}

              <div className="flex shrink-0 bg-[#181818] border-b border-white/5 items-center px-2 z-10">
                <div className="flex-1 py-1.5 px-2 text-[10px] font-bold uppercase text-brand-cyan text-left tracking-wider">Terminal</div>
                <button
                  title="Clear Terminal"
                  onClick={() => window.dispatchEvent(new CustomEvent("terminal-clear"))}
                  className="p-1 rounded text-neutral-500 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                >
                  <Icon icon="codicon:clear-all" className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 relative bg-[#1e1e1e] min-h-0">
                <ProjectTerminal userId={userId} projectId={project._id} onTreeUpdate={() => setRefreshTree(p => p + 1)} settings={user?.settings} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
