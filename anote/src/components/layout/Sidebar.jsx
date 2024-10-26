import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight, ChevronDown, PlusSquare, Edit2, Trash2 } from 'lucide-react';
import { FileService } from '../../services/fileService';

const EXPANDED_PATHS_KEY = 'anote_expanded_paths';

const Sidebar = ({ workspace, onPageSelect, currentPath }) => {
  const [pages, setPages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [renamingPage, setRenamingPage] = useState(null);
  const [newPageParentPath, setNewPageParentPath] = useState('');
  const [expandedPaths, setExpandedPaths] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(EXPANDED_PATHS_KEY) || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (workspace) {
      loadPages();
    }
  }, [workspace]);

  useEffect(() => {
    localStorage.setItem(EXPANDED_PATHS_KEY, JSON.stringify(expandedPaths));
  }, [expandedPaths]);

  const loadPages = async () => {
    try {
      const pagesStructure = await FileService.listPages(workspace);
      setPages(pagesStructure);
    } catch (error) {
      console.error('Error loading pages:', error);
    }
  };

  const handleDragStart = (e, item, path) => {
    setDraggedItem({ item, path });
    e.dataTransfer.effectAllowed = 'move';
    // Add a subtle visual feedback
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
    setDropTarget(null);
  };

  const handleDragOver = (e, targetPath) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedItem?.path === targetPath) return;

    // Only allow dropping into directories
    const targetIsDirectory = pages.find(p => p.path === targetPath)?.type === 'directory';
    if (!targetIsDirectory) return;

    e.dataTransfer.dropEffect = 'move';
    setDropTarget(targetPath);
  };

  const handleDrop = async (e, targetPath) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedItem || draggedItem.path === targetPath) {
      setDropTarget(null);
      return;
    }

    try {
      // Handle file drops from the system
      if (e.dataTransfer.types.includes('Files')) {
        const files = Array.from(e.dataTransfer.files);
        for (const file of files) {
          if (file.type.startsWith('image/')) {
            // Handle image files
            await FileService.saveAssetFile(workspace, file.name, URL.createObjectURL(file));
          } else {
            // Handle other files
            await FileService.saveFile(workspace, {
              name: file.name,
              type: file.type,
              size: file.size,
              data: await file.arrayBuffer()
            });
          }
        }
      } else {
        // Handle internal drag and drop
        const newPath = `${targetPath}/${draggedItem.item.name}`;
        await FileService.movePage(workspace, draggedItem.path, newPath);

        // Automatically expand the target directory
        setExpandedPaths(prev => ({
          ...prev,
          [targetPath]: true
        }));
      }

      await loadPages();
    } catch (error) {
      console.error('Error handling drop:', error);
    }

    setDraggedItem(null);
    setDropTarget(null);
  };
  const handleDelete = async (path) => {
    if (window.confirm(`Are you sure you want to delete "${path}"?`)) {
      try {
        await FileService.deletePage(workspace, path);
        // If we're deleting the current page, clear it
        if (currentPath === path) {
          onPageSelect(null);
        }
        await loadPages();
      } catch (error) {
        console.error('Error deleting page:', error);
      }
    }
  };

  const handleRename = async (oldPath, newName) => {
    try {
      await FileService.renamePage(workspace, oldPath, newName);
      await loadPages();
  
      // Update current path if we renamed the current page
      if (currentPath === oldPath) {
        // Calculate the new path properly
        const pathParts = oldPath.split('/');
        pathParts[pathParts.length - 1] = newName; // Replace last part with new name
        const newPath = pathParts.join('/');
        onPageSelect(newPath);
      }
      setRenamingPage(null);
    } catch (error) {
      console.error('Error renaming page:', error);
    }
  };

  const PageItem = ({ page, level = 0, parentPath = '' }) => {
    const fullPath = parentPath ? `${parentPath}/${page.name}` : page.name;
    const isExpanded = expandedPaths[fullPath];
    const isDropTarget = dropTarget === fullPath;

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, page, fullPath)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOver(e, fullPath)}
        onDrop={(e) => handleDrop(e, fullPath)}
        className={`
          relative group
          ${isDropTarget ? 'bg-blue-50 border-2 border-blue-200 rounded' : ''}
        `}
      >
        <div
          className={`
            flex items-center px-2 py-1 rounded-md hover:bg-gray-100
            ${currentPath === fullPath ? 'bg-blue-50' : ''}
          `}
          style={{ paddingLeft: `${level * 1.5}rem` }}
        >
          <button
            onClick={() => {
              setExpandedPaths(prev => ({
                ...prev,
                [fullPath]: !prev[fullPath]
              }));
            }}
            className="p-1 hover:bg-gray-200 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {renamingPage === fullPath ? (
            <form
              className="flex-1"
              onSubmit={(e) => {
                e.preventDefault();
                const newName = e.target.name.value.trim();
                if (newName && newName !== page.name) {
                  handleRename(fullPath, newName);
                } else {
                  setRenamingPage(null);
                }
              }}
            >
              <input
                name="name"
                defaultValue={page.name}
                className="w-full px-2 py-1 text-sm border rounded"
                autoFocus
                onBlur={() => setRenamingPage(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setRenamingPage(null);
                  }
                }}
              />
            </form>
          ) : (
            <span
              onClick={() => onPageSelect(fullPath)}
              className="flex-1 px-2 py-1 cursor-pointer truncate"
            >
              {page.name}
            </span>
          )}

          <div className="opacity-0 group-hover:opacity-100 flex items-center">
            <button
              onClick={() => setRenamingPage(fullPath)}
              className="p-1 hover:bg-gray-200 rounded"
              title="Rename"
            >
              <Edit2 className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => handleDelete(fullPath)}
              className="p-1 hover:bg-gray-200 rounded"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => {
                setIsCreatingPage(true);
                setNewPageParentPath(fullPath);
                setExpandedPaths(prev => ({
                  ...prev,
                  [fullPath]: true
                }));
              }}
              className="p-1 hover:bg-gray-200 rounded"
              title="Add subpage"
            >
              <PlusSquare className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div>
            {/* Show page creation dialog for this directory */}
            {isCreatingPage && newPageParentPath === fullPath && (
              <div style={{ paddingLeft: `${(level + 1) * 1.5}rem` }}>
                <PageCreationDialog parentPath={fullPath} />
              </div>
            )}

            {page.children?.map((child) => (
              <PageItem
                key={child.name}
                page={child}
                level={level + 1}
                parentPath={fullPath}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const createNewPage = async (name, parentPath = '') => {
    try {
      const fullPath = parentPath ? `${parentPath}/${name}` : name;
      await FileService.createPage(workspace, fullPath);
      await loadPages();
      onPageSelect(fullPath);

      // Expand parent path if it exists
      if (parentPath) {
        setExpandedPaths(prev => ({
          ...prev,
          [parentPath]: true
        }));
      }
    } catch (error) {
      console.error('Error creating page:', error);
    }
    setIsCreatingPage(false);
    setNewPageParentPath('');
  };

  const PageCreationDialog = ({ parentPath = '' }) => {
    const [pageName, setPageName] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      if (pageName.trim()) {
        createNewPage(pageName.trim(), parentPath);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="p-2">
        <input
          type="text"
          value={pageName}
          onChange={(e) => setPageName(e.target.value)}
          placeholder="Page name..."
          className="w-full px-2 py-1 text-sm border rounded"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsCreatingPage(false);
              setNewPageParentPath('');
            }
          }}
        />
      </form>
    );
  };
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen overflow-hidden flex flex-col">
      <div className="p-4 flex items-center justify-between">
        <h2 className="font-semibold text-lg">Workspace</h2>
        <button
          onClick={() => {
            setIsCreatingPage(true);
            setNewPageParentPath('');
          }}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {pages.map((page) => (
          <PageItem key={page.name} page={page} />
        ))}
        {pages.length === 0 && (
          <div className="text-center text-gray-500 mt-4">
            No pages yet. Create one to get started!
          </div>
        )}
      </div>
    </div>
  );



};

export default Sidebar;