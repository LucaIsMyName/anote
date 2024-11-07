import React, { useState, useEffect } from "react";
import { FolderPlus, Download, PanelRightClose, Plus, ChevronRight, ChevronDown, Edit2, Trash2, PanelRightOpen } from "lucide-react";
import { FileService } from "../../services/FileService.ts";
import { ImportExportService } from "../../services/ImportExportService.ts";
import Input from "../blocks/utils/Input.tsx";

const EXPANDED_PATHS_KEY = "anote_expanded_paths";
const SIDEBAR_WIDTH_KEY = "sidebar_width";
const SIDEBAR_OPEN_KEY = "sidebar_open";

interface DragItem {
  type: string;
  path: string;
  name: string;
}

interface SidebarProps {
  workspace: string;
  onPageSelect: (path: string) => void;
  currentPath: string;
  onPageNameChange: (oldName: string, newName: string) => void;
}
const PageCreationDialog = ({ workspace, parentPath = "", onSubmit, onClose }) => {
  const [pageName, setPageName] = useState("");

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (pageName.trim()) {
      onSubmit(pageName.trim());
      setPageName("");
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Plus className="w-4 h-4" />
      <form onSubmit={handleSubmit}>
        <Input
          type="text"
          value={pageName}
          onChange={(e) => setPageName(e.target.value)}
          placeholder="Enter page name..."
          className="w-full flex-1 text-white placeholder:text-white bg-transparent"
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
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<"inside" | "above" | "below">("inside");
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
    const isDragging = draggedItem?.path === fullPath;
    const isDropTarget = dropTarget === fullPath;
    let dropIndicatorClass = "";
    if (isDropTarget && !isDragging) {
      switch (dropPosition) {
        case "above":
          dropIndicatorClass = "before:absolute before:left-0 before:right-0 before:top-0 before:h-0.5 before:bg-sky-400";
          break;
        case "below":
          dropIndicatorClass = "after:absolute after:left-0 after:right-0 after:bottom-0 after:h-0.5 after:bg-sky-400";
          break;
        case "inside":
          dropIndicatorClass = "bg-sky-50 border-2 border-sky-400";
          break;
      }
    }
    const handleCreateSubpage = () => {
      // First ensure the parent page is expanded
      setExpandedPaths((prev) => ({
        ...prev,
        [fullPath]: true,
      }));
      // Then set the creation state
      setIsCreatingPage(true);
      setNewPageParentPath(fullPath);
    };

    const handleDragStart = (e: React.DragEvent, page: any, path: string) => {
      setDraggedItem({
        type: "page",
        path,
        name: page.name,
      });
      e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, targetPath: string) => {
      e.preventDefault();
      if (!draggedItem || draggedItem.path === targetPath) return;

      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const y = e.clientY - rect.top;

      // Determine drop position based on mouse position
      if (y < rect.height * 0.25) {
        setDropPosition("above");
      } else if (y > rect.height * 0.75) {
        setDropPosition("below");
      } else {
        setDropPosition("inside");
      }

      setDropTarget(targetPath);
    };

    const handleDrop = async (e: React.DragEvent, targetPath: string) => {
      e.preventDefault();
      if (!draggedItem || draggedItem.path === targetPath) {
        resetDragState();
        return;
      }

      // Get target directory path based on drop position
      const targetDir = dropPosition === "inside" ? targetPath : targetPath.split("/").slice(0, -1).join("/");

      // Optimistically update UI
      const updatedPages = movePageInTree(pages, draggedItem.path, targetPath, dropPosition);
      setPages(updatedPages);

      try {
        // Perform the actual file system operation
        await FileService.movePage(workspace, draggedItem.path, `${targetDir}/${draggedItem.name}`);

        // Refresh pages to ensure consistency
        loadPages();
      } catch (error) {
        console.error("Error moving page:", error);
        // Revert UI on error
        loadPages();
      }

      resetDragState();
    };

    const resetDragState = () => {
      setDraggedItem(null);
      setDropTarget(null);
      setDropPosition("inside");
    };

    const movePageInTree = (pages: any[], sourcePath: string, targetPath: string, position: string) => {
      const newPages = [...pages];
      const sourcePathParts = sourcePath.split("/");
      const targetPathParts = targetPath.split("/");

      // Find and remove source page
      const sourcePage = removePageFromTree(newPages, sourcePathParts);
      if (!sourcePage) return newPages;

      // Add page to new location
      return insertPageInTree(newPages, targetPathParts, sourcePage, position);
    };

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, page, fullPath)}
        onDragEnd={resetDragState}
        onDragOver={(e) => handleDragOver(e, fullPath)}
        onDragEnter={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, fullPath)}
        className={`relative group space-y-2 ${isDragging ? "opacity-50" : ""} ${dropIndicatorClass}`}>
        <div
          className={`flex items-center rounded border-2 border-sky p-1 hover:bg-sky-50 ${currentPath === fullPath ? "bg-sky-50" : ""}`}
          style={{ marginLeft: `${level * 1}rem` }}>
          <button
            onClick={() => {
              setExpandedPaths((prev) => ({
                ...prev,
                [fullPath]: !prev[fullPath],
              }));
            }}
            className=" p-1 hover:bg-gray-200 rounded">
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
              onClick={() => {
                onPageSelect(fullPath);
              }}
              className="flex-1 px-2 py-1 cursor-pointer truncate">
              {page.name}
            </span>
          )}

          {/* Action Buttons */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
            <button
              onClick={() => setRenamingPage(fullPath)}
              className="p-1 hover:bg-gray-200 rounded"
              title="Rename page">
              <Edit2 className="w-3.5 h-3.5 text-gray-500" />
            </button>
            <button
              onClick={handleCreateSubpage}
              className="p-1 hover:bg-gray-200 rounded"
              title="Create subpage">
              <FolderPlus className="w-3.5 h-3.5 text-sky-400" />
            </button>
            <button
              onClick={() => handleDelete(fullPath)}
              className="p-1 hover:bg-gray-200 rounded"
              title="Delete page">
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
            </button>
          </div>
        </div>

        {/* Child pages and creation dialog */}
        <div className={isExpanded ? "" : "hidden"}>
          {page.children?.map((child) => (
            <PageItem
              key={child.name}
              page={child}
              level={level + 1}
              parentPath={fullPath}
            />
          ))}
          {isCreatingPage && newPageParentPath === fullPath && (
            <div className="ml-8">
              <PageCreationDialog
                workspace={workspace}
                parentPath={fullPath}
                onSubmit={(name) => handleCreatePage(name, fullPath)}
                onClose={() => {
                  setIsCreatingPage(false);
                  setNewPageParentPath("");
                }}
              />
            </div>
          )}
        </div>
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
        maxWidth: isOpen ? `${width}px` : "60px",
        width: isOpen ? `100%` : "60px",
        transition: "max-width 0.3s",
      }}
      className={`p-2 h-screen  flex flex-col ${isOpen ? "fixed inset-0 right-10 md:relative z-50 peer-[main]:ml-[60px]" : "relative"}`}>
      <div className="bg-white/90 backdrop-blur-sm border-2 rounded-lg border-gray-200 overflow-y-scroll h-full ">
        <div className="flex items-center justify-between w-full p-2">
          {isOpen ? (
            <h1 className="font-bold text-lg">
              <i>anote</i>
            </h1>
          ) : (
            ""
          )}
          <button
            onClick={toggleSidebar}
            className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none">
            {isOpen ? <PanelRightOpen /> : <PanelRightClose />}
          </button>
        </div>

        {isOpen && (
          <aside className="px-2 space-y-2">
            <div className="border-2 border-sky-600 rounded bg-sky-400 text-white">
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
                  className="flex items-center space-x-2 w-full px-2 py-2">
                  <Plus className="w-4 h-4" />
                  <span>New Page</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-auto space-y-2">
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
                backgroundColor: "rgba(0,0,0,0)",
              }}
            />
          </aside>
        )}
        {/* <div className="border-t border-gray-200 p-3 space-y-2">
        <div className="flex justify-between items-center">
          <button
            onClick={async () => {
              const workspaceJson = await ImportExportService.exportWorkspaceToJson(workspace);
              const blob = new Blob([JSON.stringify(workspaceJson, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "anote-workspace.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">
            <Download className="w-4 h-4" />
            <span>Export Workspace</span>
          </button>
        </div>
      </div> */}
      </div>
    </div>
  );
};

export default Sidebar;
