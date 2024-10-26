import React, { useState, useEffect } from 'react';
import {  Folder, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  File, 
  PlusSquare, 
  Edit2, 
  Trash2  } from 'lucide-react';
import { FileService } from '../../services/fileService';

const Sidebar = ({ workspace, onPageSelect, currentPath }) => {
  const [pages, setPages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [newPageParentPath, setNewPageParentPath] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [renamingPage, setRenamingPage] = useState(null);
  const [isCreatingSubpage, setIsCreatingSubpage] = useState(false);

  useEffect(() => {
    if (workspace) {
      loadPages();
    }
  }, [workspace]);

  const loadPages = async () => {
    try {
      const pagesStructure = await FileService.listPages(workspace);
      setPages(pagesStructure);
    } catch (error) {
      console.error('Error loading pages:', error);
    }
  };

  const createNewPage = async (name, parentPath = '') => {
    try {
      const fullPath = parentPath ? `${parentPath}/${name}` : name;
      await FileService.createPage(workspace, fullPath);
      await loadPages(); // Reload the page structure
      onPageSelect(fullPath); // Navigate to the new page
    } catch (error) {
      console.error('Error creating page:', error);
    }
    setIsCreatingPage(false);
    setIsCreatingSubpage(false);
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
        />
      </form>
    );
  };

  const handleDelete = async (path) => {
    if (window.confirm(`Are you sure you want to delete "${path}"?`)) {
      try {
        await FileService.deletePage(workspace, path);
        await loadPages();
        if (currentPath === path) {
          onPageSelect(null);
        }
      } catch (error) {
        console.error('Error deleting page:', error);
      }
    }
  };

  const handleRename = async (path, newName) => {
    try {
      const newPath = await FileService.renamePage(workspace, path, newName);
      await loadPages();
      if (currentPath === path) {
        onPageSelect(newPath);
      }
      setRenamingPage(null);
    } catch (error) {
      console.error('Error renaming page:', error);
    }
  };

  const handleDragStart = (e, page, path) => {
    setDraggedItem({ page, path });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, targetPath) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(targetPath);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (e, targetPath) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.path === targetPath) return;

    try {
      const newPath = `${targetPath}/${draggedItem.page.name}`;
      await FileService.movePage(workspace, draggedItem.path, newPath);
      await loadPages();
      if (currentPath === draggedItem.path) {
        onPageSelect(newPath);
      }
    } catch (error) {
      console.error('Error moving page:', error);
    }

    setDraggedItem(null);
    setDropTarget(null);
  };

  const PageItem = ({ page, level, parentPath = '' }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const fullPath = parentPath ? `${parentPath}/${page.name}` : page.name;
    const isDropTarget = dropTarget === fullPath;
    const [isCreatingSubpage, setIsCreatingSubpage] = useState(false);

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, page, fullPath)}
        onDragOver={(e) => handleDragOver(e, fullPath)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, fullPath)}
        className={`
          relative group
          ${isDropTarget ? 'bg-blue-50 border-2 border-blue-200 rounded' : ''}
        `}
      >
        <div
          className={`
            flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer
            ${currentPath === fullPath ? 'bg-blue-50' : ''}
          `}
          style={{ paddingLeft: `${level * 1.5}rem` }}
        >
          {page.type === 'directory' && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-400" />
              )}
            </button>
          )}

          <div className="flex items-center space-x-2 flex-1">
            {page.type === 'directory' ? (
              <Folder className="w-4 h-4 text-gray-400" />
            ) : (
              <File className="w-4 h-4 text-gray-400" />
            )}

            {renamingPage === fullPath ? (
              <form
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
                  className="px-1 py-0.5 text-sm border rounded"
                  autoFocus
                  onBlur={() => setRenamingPage(null)}
                />
              </form>
            ) : (
              <span
                onClick={() => onPageSelect(fullPath)}
                className="text-sm truncate flex-1"
              >
                {page.name}
              </span>
            )}
          </div>

          <div className="flex space-x-1 opacity-0 group-hover:opacity-100">
            <button
              onClick={() => setRenamingPage(fullPath)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <Edit2 className="w-3 h-3 text-gray-400" />
            </button>
            <button
              onClick={() => handleDelete(fullPath)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <Trash2 className="w-3 h-3 text-gray-400" />
            </button>
            {page.type === 'directory' && (
              <button
                onClick={() => {
                  setIsCreatingSubpage(true);
                  setIsExpanded(true);
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <PlusSquare className="w-3 h-3 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {isExpanded && (
          <div>
            {isCreatingSubpage && (
              <div style={{ paddingLeft: `${(level + 1) * 1.5}rem` }}>
                <PageCreationDialog parentPath={fullPath} />
              </div>
            )}
            {page.children?.map((childPage) => (
              <PageItem
                key={childPage.name}
                page={childPage}
                level={level + 1}
                parentPath={fullPath}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen p-4 flex flex-col">
      {/* Workspace Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Folder className="w-5 h-5 text-blue-600" />
          <span className="font-semibold">My Workspace</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search pages..."
          className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-auto space-y-1">
        {pages.map((page) => (
          <PageItem key={page.name} page={page} level={0} />
        ))}
      </div>

      {/* New Page Button */}
      <button
        onClick={() => setIsCreatingPage(true)}
        className="flex items-center space-x-2 mt-4 text-gray-600 hover:text-gray-900 text-sm"
      >
        <Plus className="w-4 h-4" />
        <span>New Page</span>
      </button>

      {/* New Page Dialog */}
      {isCreatingPage && (
        <div className="mt-2">
          <PageCreationDialog />
        </div>
      )}
    </div>
  );
};

export default Sidebar;