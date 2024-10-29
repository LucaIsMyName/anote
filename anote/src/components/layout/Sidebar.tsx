import React, { useState, useEffect } from "react";
import { FolderPlus, PanelRightClose, Plus, ChevronRight, ChevronDown, Edit2, Trash2, PanelRightOpen } from "lucide-react";
import { FileService } from "../../services/FileService.ts";

const EXPANDED_PATHS_KEY = "anote_expanded_paths";
const SIDEBAR_WIDTH_KEY = "sidebar_width";
const SIDEBAR_OPEN_KEY = "sidebar_open";

interface SidebarProps {
  workspace: string;
  onPageSelect: (path: string) => void;
  currentPath: string;
  onPageNameChange: (oldName: string, newName: string) => void;
}
const PageCreationDialog = ({ workspace, parentPath = "", onSubmit, onClose }) => {
  const [pageName, setPageName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pageName.trim()) {
      onSubmit(pageName.trim());
      setPageName("");
    }
  };

  return (
    <div className="px-4 py-2 border-t">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={pageName}
          onChange={(e) => setPageName(e.target.value)}
          placeholder="Enter page name..."
          className="w-full px-2 py-1 text-sm border rounded"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              onClose();
            }
          }}
          onBlur={() => {
            // Small delay to allow form submission
            setTimeout(() => {
              if (!pageName.trim()) {
                onClose();
              }
            }, 200);
          }}
        />
      </form>
    </div>
  );
};
/**
 *
 * @param {string} workspace
 * @param {Function} onPageSelect
 * @param {string} currentPath
 * @param {Function} onPageNameChange
 * @returns
 * @description A sidebar component that displays a list of pages
 * in the workspace and allows users to create, rename, and delete pages.
 */
const Sidebar = ({ workspace, onPageSelect, currentPath, onPageNameChange }: SidebarProps) => {
  const [expandedPaths, setExpandedPaths] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(EXPANDED_PATHS_KEY) || "{}");
    } catch {
      return {};
    }
  });
  const [width, setWidth] = useState(localStorage.getItem(SIDEBAR_WIDTH_KEY) || 250);
  const [isOpen, setIsOpen] = useState(localStorage.getItem(SIDEBAR_OPEN_KEY) === "true");
  const [isResizing, setIsResizing] = useState(false);
  const [dropTarget, setDropTarget] = useState(null);
  const [renamingPage, setRenamingPage] = useState(null);
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [newPageParentPath, setNewPageParentPath] = useState("");
  const [pages, setPages] = useState([]);

  useEffect(() => {
    if (workspace) {
      loadPages();
    }
  }, [workspace]);

  useEffect(() => {
    if (workspace) {
      loadPages();
    }
  }, [workspace]);

  useEffect(() => {
    localStorage.setItem(EXPANDED_PATHS_KEY, JSON.stringify(expandedPaths));
    localStorage.setItem(SIDEBAR_WIDTH_KEY, width);
    localStorage.setItem(SIDEBAR_OPEN_KEY, isOpen);
  }, [expandedPaths, width, isOpen]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleCreatePage = async (name, parentPath = "") => {
    try {
      const fullPath = parentPath ? `${parentPath}/${name}` : name;
      await FileService.createPage(workspace, fullPath);
      await loadPages();
      onPageSelect(fullPath);

      if (parentPath) {
        setExpandedPaths((prev) => ({
          ...prev,
          [parentPath]: true,
        }));
      }
      setIsCreatingPage(false);
      setNewPageParentPath("");
    } catch (error) {
      console.error("Error creating page:", error);
    }
  };

  const handleMouseMove = (e) => {
    if (isResizing) {
      const newWidth = Math.max(96, e.clientX);
      setWidth(newWidth);
      localStorage.setItem("sidebar_width", newWidth); // Store the updated width in localStorage
    }
  };

  const handleMouseUp = () => {
    if (isResizing) {
      setIsResizing(false);
      localStorage.setItem(SIDEBAR_WIDTH_KEY, width);
    }
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const loadPages = async () => {
    try {
      const pagesStructure = await FileService.listPages(workspace);
      setPages(pagesStructure);
    } catch (error) {
      console.error("Error loading pages:", error);
    }
  };
  const handlePageNameChange = (oldName, newName) => {
    setPages((prevPages) => prevPages.map((page) => (page.name === oldName ? { ...page, name: newName } : page)));
  };

  useEffect(() => {
    if (onPageNameChange) onPageNameChange(handlePageNameChange);
  }, [onPageNameChange]);

  const handleRename = async (oldPath, newName) => {
    try {
      await FileService.renamePage(workspace, oldPath, newName);
      await loadPages();

      if (currentPath === oldPath) {
        const pathParts = oldPath.split("/");
        pathParts[pathParts.length - 1] = newName;
        const newPath = pathParts.join("/");
        onPageSelect(newPath);
      }
      setRenamingPage(null);
    } catch (error) {
      console.error("Error renaming page:", error);
    }
  };

  const handleDelete = async (path) => {
    if (window.confirm(`Are you sure you want to delete "${path}"?`)) {
      try {
        await FileService.deletePage(workspace, path);
        if (currentPath === path) {
          onPageSelect(null);
        }
        await loadPages();
      } catch (error) {
        console.error("Error deleting page:", error);
      }
    }
  };

  const PageItem = ({ page, level = 0, parentPath = "" }) => {
    const fullPath = parentPath ? `${parentPath}/${page.name}` : page.name;
    const isExpanded = expandedPaths[fullPath];
    const isDropTarget = dropTarget === fullPath;

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, page, fullPath)}
        onDragEnd={() => setDropTarget(null)}
        onDragOver={(e) => {
          e.preventDefault();
          setDropTarget(fullPath);
        }}
        onDrop={(e) => handleDrop(e, fullPath)}
        className={`relative group ${isDropTarget ? "bg-blue-50 border-blue-200 rounded" : ""}`}>
        <div
          className={`flex items-center px-2 py-1 hover:bg-gray-100 ${currentPath === fullPath ? "bg-blue-50" : ""}`}
          style={{ paddingLeft: `${level * 1.5}rem` }}>
          <button
            onClick={() => {
              setExpandedPaths((prev) => ({
                ...prev,
                [fullPath]: !prev[fullPath],
              }));
            }}
            className="ml-2 p-1 hover:bg-gray-200 rounded">
            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
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
              }}>
              <input
                name="name"
                defaultValue={page.name}
                className="w-full px-2 py-1 text-sm border rounded"
                autoFocus
                onBlur={() => setRenamingPage(null)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setRenamingPage(null);
                  }
                }}
              />
            </form>
          ) : (
            <span
              onClick={() => onPageSelect(fullPath)}
              className="flex-1 px-2 py-1 cursor-pointer truncate">
              {page.name}
            </span>
          )}

          <div className="opacity-0 group-hover:opacity-100 flex items-center">{/* ... existing buttons ... */}</div>
        </div>

        {isExpanded && (
          <>
            {page.children?.map((child) => (
              <PageItem
                key={child.name}
                page={child}
                level={level + 1}
                parentPath={fullPath}
              />
            ))}
            {isCreatingPage && newPageParentPath === fullPath && (
              <PageCreationDialog
                workspace={workspace}
                parentPath={fullPath}
                onSubmit={(name) => handleCreatePage(name, fullPath)}
                onClose={() => {
                  setIsCreatingPage(false);
                  setNewPageParentPath("");
                }}
              />
            )}
          </>
        )}
      </div>
    );
  };

  const createNewPage = async (name, parentPath = "") => {
    try {
      const fullPath = parentPath ? `${parentPath}/${name}` : name;
      await FileService.createPage(workspace, fullPath);
      await loadPages();
      onPageSelect(fullPath);

      if (parentPath) {
        setExpandedPaths((prev) => ({
          ...prev,
          [parentPath]: true,
        }));
      }
    } catch (error) {
      console.error("Error creating page:", error);
    }
    setIsCreatingPage(false);
    setNewPageParentPath("");
  };

  return (
    <div
      style={{
        maxWidth: isOpen ? "640px" : "48px",
        minWidth: isOpen ? "200px" : "48px",
        width: isOpen ? `${width}px` : "48px",
        transition: "width 0.3s",
        position: "relative",
      }}
      className="bg-white shadow border-r-2 border-gray-200 h-screen overflow-hidden flex flex-col">
      <div className="flex items-center justify-between w-full px-3 py-2">
        {isOpen ? <h1 className="font-bold">Workspace</h1> : ""}
        <button
          onClick={toggleSidebar}
          className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none">
          {isOpen ? <PanelRightOpen /> : <PanelRightClose />}
        </button>
      </div>

      {isOpen && (
        <>
          <div className="border-b border-gray-200">
            {isCreatingPage && !newPageParentPath ? (
              <div className="px-3 py-2">
                <PageCreationDialog
                  workspace={workspace}
                  onSubmit={(name) => {
                    handleCreatePage(name);
                  }}
                  onClose={() => {
                    setIsCreatingPage(false);
                    setNewPageParentPath("");
                  }}
                />
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsCreatingPage(true);
                  setNewPageParentPath("");
                }}
                className="flex items-center space-x-2 w-full px-3 py-2 text-gray-600 hover:bg-gray-100">
                <Plus className="w-4 h-4" />
                <span>New Page</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            {pages.map((page) => (
              <PageItem
                key={page.name}
                page={page}
              />
            ))}
            {pages.length === 0 && <div className="text-center text-gray-500 mt-4">No pages yet. Create your first page using the button above!</div>}
          </div>

          <div
            onMouseDown={handleMouseDown}
            style={{
              width: "5px",
              cursor: "col-resize",
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.1)",
            }}
          />
        </>
      )}
    </div>
  );
};

export default Sidebar;
