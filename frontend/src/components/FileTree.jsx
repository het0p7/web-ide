import { useState, useEffect, useRef } from "react";
import FileIcon, { FolderIcon } from "./FileIcon";


export default function FileTree({ 
  projectId, 
  onFileSelect, 
  onPathSelect, 
  onRename, 
  onMove,
  onDelete,
  onInitiateCreate,
  onCreate, // (name, type)
  onCancelCreate,
  selectedPath, 
  refreshTrigger,
  isCreating, // 'file' | 'folder' | null
  activeFile // Sync active tab highlighting
}) {
  const [tree, setTree] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, node: null });
  const [editingPath, setEditingPath] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [newEntryValue, setNewEntryValue] = useState("");
  const [draggedItemPath, setDraggedItemPath] = useState(null);
  const [dragTargetNode, setDragTargetNode] = useState(null);
  const [isRootDrag, setIsRootDrag] = useState(false);
  const isFirstLoad = useRef(true);

  // Determine which folder should show the "New Item" input
  let targetParentPath = ""; 
  if (selectedPath) {
    targetParentPath = selectedPath;
  }

  // Auto-expand the target folder when creation begins
  useEffect(() => {
    if (isCreating && targetParentPath) {
        setExpanded(prev => ({ ...prev, [targetParentPath]: true }));
    }
  }, [isCreating, targetParentPath]);

  // Auto-expand parent folders of the currently active file and collapse others
  useEffect(() => {
    if (activeFile) {
      const parts = activeFile.split('/');
      parts.pop(); // Remove the filename
      
      if (parts.length > 0) {
        setExpanded(() => {
          const next = {};
          let currentPath = "";
          
          for (const part of parts) {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            next[currentPath] = true;
          }
          
          return next;
        });
      } else {
        setExpanded({}); // Active file is at the root level
      }
    } else {
        setExpanded({}); // No active file
    }
  }, [activeFile]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu({ visible: false, x: 0, y: 0, node: null });
    window.addEventListener("click", handleClickOutside);
    window.addEventListener("contextmenu", handleClickOutside); // Close if right-click elsewhere
    return () => {
      window.removeEventListener("click", handleClickOutside);
      window.removeEventListener("contextmenu", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchTree = async () => {
      if (isFirstLoad.current) {
        setLoading(true);
      }
      try {
        const response = await fetch(`/api/projects/${projectId}/tree`);
        if (response.ok) {
          const data = await response.json();
          // Sort tree: folders first, then files alphabetically
          const sortTree = (nodes) => {
            nodes.sort((a, b) => {
              const aIsFolder = !!a.children;
              const bIsFolder = !!b.children;
              if (aIsFolder && !bIsFolder) return -1;
              if (!aIsFolder && bIsFolder) return 1;
              return a.name.localeCompare(b.name);
            });
            nodes.forEach(node => {
              if (node.children) sortTree(node.children);
            });
            return nodes;
          };
          setTree(sortTree(data.tree || []));
        }
      } catch (error) {
        console.error("Error fetching tree:", error);
      } finally {
        if (isFirstLoad.current) {
          setLoading(false);
          isFirstLoad.current = false;
        }
      }
    };
    if (projectId) fetchTree();
  }, [projectId, refreshTrigger]);

  const toggleExpanded = (path) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const handleNodeClick = (item) => {
    const isFolder = !!item.children;
    
    // Update selected context path for creation
    if (onPathSelect) {
      onPathSelect(item.path, isFolder);
    }

    if (isFolder) {
      toggleExpanded(item.path);
    } else {
      if (onFileSelect) onFileSelect(item.path);
    }
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Position menu offset from cursor
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      node: item
    });
  };

  const handleDragStart = (e, item) => {
    e.stopPropagation();
    e.dataTransfer.setData("text/plain", item.path);
    e.dataTransfer.effectAllowed = "move";
    setDraggedItemPath(item.path);

    // Subtle ghost image adjustment could go here, but native browser 
    // thumbnail is adequate for now
  };

  const handleDragEnd = (e) => {
    e.stopPropagation();
    setDraggedItemPath(null);
    setDragTargetNode(null);
    setIsRootDrag(false);
  };

  const isInvalidDrop = (sourcePath, targetPath) => {
    if (!sourcePath) return false; // If external drag, allow (tho we skip processing)
    if (sourcePath === targetPath) return true; // Dropping on itself or its own parent
    if (targetPath.startsWith(sourcePath + "/")) return true; // Dropping into its children
    return false;
  };

  const handleDragOver = (e, item) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    // Determine the logical parent folder where it would actually land
    let targetParentPath = item.path;
    if (!item.children) {
        const parts = item.path.split('/');
        parts.pop();
        targetParentPath = parts.join('/');
    }

    if (draggedItemPath && isInvalidDrop(draggedItemPath, targetParentPath)) {
        e.dataTransfer.dropEffect = "none";
        setDragTargetNode(null);
        return;
    }

    e.dataTransfer.dropEffect = "move";
    setDragTargetNode(item.path);
    setIsRootDrag(false);
  };

  const handleDragLeave = (e, item) => {
    e.stopPropagation();
    if (dragTargetNode === item.path) {
        setDragTargetNode(null);
    }
  };

  const handleDrop = (e, targetItem) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedItemPath(null);
    setDragTargetNode(null);
    setIsRootDrag(false);

    const sourcePath = e.dataTransfer.getData("text/plain");
    if (!sourcePath) return;

    let newParentPath = "";
    if (targetItem) {
        if (!!targetItem.children) {
            newParentPath = targetItem.path;
        } else {
            const parts = targetItem.path.split('/');
            parts.pop();
            newParentPath = parts.join('/');
        }
    }

    if (sourcePath === newParentPath) return;
    if (newParentPath.startsWith(sourcePath + "/")) return; 

    const itemName = sourcePath.split("/").pop();
    const newPath = newParentPath ? `${newParentPath}/${itemName}` : itemName;
    
    if (sourcePath !== newPath && onMove) {
        onMove(sourcePath, newPath);
    }
  };

  const renderNewEntryInput = (depth) => (
    <div 
        className="flex items-center w-full py-1.5 px-2 bg-brand-cyan/5"
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
    >
        <span className="w-5 h-3 mr-2 inline-block"></span>
        {isCreating === 'folder'
          ? <FolderIcon name="" isOpen={false} className="w-4 h-4 mr-3" />
          : <FileIcon name={newEntryValue} className="w-4 h-4 mr-3 shrink-0" />}
        <input
            autoFocus
            className="flex-1 bg-brand-cyan/20 text-white text-[13px] outline-none border border-brand-cyan/50 rounded px-1 min-w-0"
            placeholder={isCreating === 'folder' ? "Folder name..." : "File name..."}
            value={newEntryValue}
            onChange={(e) => setNewEntryValue(e.target.value)}
            onBlur={() => {
                if (newEntryValue.trim()) {
                    onCreate(newEntryValue.trim(), isCreating);
                } else {
                    onCancelCreate();
                }
                setNewEntryValue("");
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    if (newEntryValue.trim()) {
                        onCreate(newEntryValue.trim(), isCreating);
                    } else {
                        onCancelCreate();
                    }
                    setNewEntryValue("");
                } else if (e.key === "Escape") {
                    onCancelCreate();
                    setNewEntryValue("");
                }
            }}
            onClick={(e) => e.stopPropagation()}
        />
    </div>
  );

  const renderTree = (items, depth = 0, currentPath = "") => {
    const list = items.map((item) => {
      const isExpanded = expanded[item.path];
      const isFolder = !!item.children;
      const isActive = activeFile === item.path && !isFolder;
      const isDragTarget = dragTargetNode === item.path;
      const isSelected = selectedPath === item.path;

      return (
        <div key={item.path}>
          <div
            onClick={() => handleNodeClick(item)}
            onContextMenu={(e) => handleContextMenu(e, item)}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, item)}
            onDragLeave={(e) => handleDragLeave(e, item)}
            onDrop={(e) => handleDrop(e, item)}
            className={`
              flex items-center w-full py-1.5 px-2 cursor-pointer select-none group transition-all duration-200
              ${isDragTarget ? (isFolder ? 'bg-brand-cyan/25 ring-1 ring-inset ring-brand-cyan relative z-10' : 'bg-brand-cyan/15 border-b border-b-brand-cyan relative z-10') : ''}
              ${isActive && !isDragTarget ? 'bg-brand-cyan/10 text-brand-cyan/90 border-r-2 border-brand-cyan' : ''}
              ${isSelected && !isActive && !isDragTarget ? 'bg-white/5 text-white ring-1 ring-inset ring-white/10' : ''}
              ${!isActive && !isSelected && !isDragTarget ? 'text-neutral-400 hover:bg-white/5 hover:text-white' : ''}
            `}
            style={{ paddingLeft: `${depth * 20 + 12}px` }}
          >
            {isFolder && (
              <span className={`transition-transform duration-200 mr-1 text-white/60 group-hover:text-white/100 ${isExpanded ? 'rotate-90' : ''}`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </span>
            )}
            {!isFolder && <span className="w-5 h-3 mr-2 inline-block"></span>}
            {isFolder
              ? <FolderIcon name={item.name} isOpen={isExpanded} className="w-4 h-4 mr-3 transition-transform group-hover:scale-110" />
              : <FileIcon name={item.name} className="w-4 h-4 mr-3 transition-transform group-hover:scale-110" />}
            {editingPath === item.path ? (
                <input
                    autoFocus
                    className="flex-1 bg-brand-cyan/20 text-white text-[13px] outline-none border border-brand-cyan/50 rounded px-1 min-w-0"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onBlur={() => {
                        if (editingValue.trim() && editingValue !== item.name) {
                            onRename(item, editingValue);
                        }
                        setEditingPath(null);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            if (editingValue.trim() && editingValue !== item.name) {
                                onRename(item, editingValue);
                            }
                            setEditingPath(null);
                        } else if (e.key === "Escape") {
                            setEditingPath(null);
                        }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => {
                        // Smart selection: select filename but not extension
                        const lastDotIndex = editingValue.lastIndexOf('.');
                        if (lastDotIndex > 0 && !item.children) {
                            e.target.setSelectionRange(0, lastDotIndex);
                        } else {
                            e.target.select();
                        }
                    }}
                />
            ) : (
                <span className={`text-[13px] truncate tracking-wide ${isActive || isSelected ? 'font-medium' : ''}`}>{item.name}</span>
            )}
          </div>
          
          <div
            className={`overflow-hidden transition-all duration-300 origin-top`}
            style={{ maxHeight: isExpanded ? '1000px' : '0px', opacity: isExpanded ? 1 : 0 }}
          >
            {item.children && isExpanded && (
                <>
                    {/* Render inline creation input inside this folder if it's the target */}
                    {isCreating && targetParentPath === item.path && renderNewEntryInput(depth + 1)}
                    {renderTree(item.children, depth + 1, item.path)}
                </>
            )}
          </div>
        </div>
      );
    });

    return list;
  };

  return (
    <div 
       className={`w-full h-full pb-4 text-sm font-sans transition-colors duration-200 ${isRootDrag ? 'bg-brand-cyan/5 border-t border-t-brand-cyan/20' : ''}`}
       onDragOver={(e) => { 
           e.preventDefault(); 
           if (draggedItemPath) {
               e.dataTransfer.dropEffect = "move";
               setIsRootDrag(true);
               setDragTargetNode(null);
           }
       }}
       onDragLeave={() => setIsRootDrag(false)}
       onDrop={(e) => handleDrop(e, null)}
    >
      {loading && tree.length === 0 ? (
        <div className="flex flex-col space-y-2 p-3 opacity-50">
           <div className="w-3/4 h-4 bg-white/10 rounded animate-pulse"></div>
           <div className="w-1/2 h-4 bg-white/10 rounded animate-pulse ml-4"></div>
           <div className="w-2/3 h-4 bg-white/10 rounded animate-pulse ml-4"></div>
        </div>
      ) : (
        <>
            {/* Render inline creation input at root if no folder selected or root is target */}
            {isCreating && !targetParentPath && renderNewEntryInput(0)}
            {renderTree(tree)}
        </>
      )}
      {!loading && tree.length === 0 && (
        <div className="p-4 text-center text-xs text-neutral-500 italic">
          Workspace is empty
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.visible && (
        <div 
          className="fixed z-[100] bg-[#1a1a1a]/90 border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-1.5 min-w-[180px] backdrop-blur-xl animate-in fade-in zoom-in duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking menu itself
        >
          <div className="px-3 py-1 mb-1 border-b border-white/5">
             <p className="text-[10px] uppercase font-bold text-neutral-500 truncate">{contextMenu.node.name}</p>
          </div>
          
          <button 
            className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:bg-brand-cyan/20 hover:text-brand-cyan transition-all flex items-center gap-2 group/item"
            onClick={() => {
                setEditingPath(contextMenu.node.path);
                setEditingValue(contextMenu.node.name);
                setContextMenu({ visible: false, x: 0, y: 0, node: null });
            }}
          >
            <svg className="w-3.5 h-3.5 text-neutral-500 group-hover/item:text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            Rename
          </button>
          
          {!!contextMenu.node.children && (
            <>
               <button 
                 className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:bg-brand-cyan/20 hover:text-brand-cyan transition-all flex items-center gap-2 group/item"
                 onClick={() => {
                   if (onInitiateCreate) onInitiateCreate('file', contextMenu.node.path);
                   setContextMenu({ visible: false, x: 0, y: 0, node: null });
                 }}
               >
                 <svg className="w-3.5 h-3.5 text-neutral-500 group-hover/item:text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                 New File
               </button>
               <button 
                 className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:bg-brand-cyan/20 hover:text-brand-cyan transition-all flex items-center gap-2 group/item"
                 onClick={() => {
                   if (onInitiateCreate) onInitiateCreate('folder', contextMenu.node.path);
                   setContextMenu({ visible: false, x: 0, y: 0, node: null });
                 }}
               >
                 <svg className="w-3.5 h-3.5 text-neutral-500 group-hover/item:text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg>
                 New Folder
               </button>
            </>
          )}
          
          <button 
            className="w-full text-left px-3 py-2 text-xs text-red-400/80 hover:bg-red-500/20 hover:text-red-400 transition-all flex items-center gap-2 group/item"
            onClick={() => {
                if (onDelete) onDelete(contextMenu.node);
                setContextMenu({ visible: false, x: 0, y: 0, node: null });
            }}
          >
            <svg className="w-3.5 h-3.5 text-red-500/40 group-hover/item:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}