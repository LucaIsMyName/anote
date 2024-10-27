import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Copy,  FolderPlus, Calendar, Save, GripVertical } from 'lucide-react';
import { BlockMenu, BlockType, ParagraphBlock, HeadingBlock, TodoBlock } from "./BlockMenu";
import TableBlock from "./TableBlock";
import ImageBlock from "./ImageBlock";
import FileBlock from "./FileBlock";
import { FileService } from "../../services/FileService";

const CURRENT_PAGE_KEY = 'anote_current_page';

const ContentEditor = ({ workspace, currentPath, onPathChange = () => { } }) => { // Added default value
  const [blocks, setBlocks] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [pageTitle, setPageTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [pageMetadata, setPageMetadata] = useState({
    createdAt: null,
    lastEdited: null
  });
  const [draggedBlockIndex, setDraggedBlockIndex] = useState(null);
  const [dragOverBlockIndex, setDragOverBlockIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleCopyBlock = (index) => {
    const blockToCopy = blocks[index];
    const copiedBlock = { ...blockToCopy, id: Date.now() }; // Create a new block with a unique ID
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, copiedBlock); // Insert the copied block after the original
    setBlocks(newBlocks);
  };
  const handleDragStart = (e, index) => {
    setIsDragging(true);
    setDraggedBlockIndex(index);
    e.dataTransfer.effectAllowed = "move";

    // Set a transparent drag image to improve visual feedback
    const dragImage = document.createElement('div');
    dragImage.style.opacity = '0';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragEnd = (e) => {
    setIsDragging(false);
    setDraggedBlockIndex(null);
    setDragOverBlockIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedBlockIndex === null || draggedBlockIndex === index) return;

    const draggedBlock = blocks[draggedBlockIndex];
    if (!draggedBlock) return;

    // Only update if we're actually changing position
    if (dragOverBlockIndex !== index) {
      setDragOverBlockIndex(index);

      const newBlocks = [...blocks];
      newBlocks.splice(draggedBlockIndex, 1);
      newBlocks.splice(index, 0, draggedBlock);

      setDraggedBlockIndex(index);
      setBlocks(newBlocks);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const BlockWrapper = ({ block, index, children }) => {
    const isDraggedBlock = draggedBlockIndex === index;
    const isOverBlock = dragOverBlockIndex === index;

    return (
      <div
        className={`
          relative group mb-8 transition-all duration-200 ease-in-out
          ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
          ${isDraggedBlock ? '' : 'opacity-100'}
          ${isOverBlock ? 'border-t-2 border-blue-500' : 'border-t-0 border-transparent'}
        `}
        draggable="true"
        onDragStart={(e) => handleDragStart(e, index)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragLeave={handleDragLeave}
      >
        {/* Larger drag handle area */}
        <div
          className="absolute left-0 top-0 bottom-0 w-12 -translate-x-full 
                     opacity-0 group-hover:opacity-100 flex items-center 
                     justify-center cursor-grab active:cursor-grabbing"
        >
          <div className="p-2 rounded hover:bg-gray-100">
            <GripVertical className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        <div className={`relative ${isDragging ? 'pointer-events-none' : ''}`}>
          {children}
        </div>

        <BlockControls index={index} />
      </div>
    );
  };

  useEffect(() => {
    if (workspace && !currentPath) {
      loadInitialPage();
    } else if (currentPath) {
      localStorage.setItem(CURRENT_PAGE_KEY, currentPath);
      loadContent();
      const pathParts = currentPath.split('/');
      setPageTitle(pathParts[pathParts.length - 1]);
    }
  }, [workspace, currentPath]);

  const loadContent = async () => {
    if (!workspace || !currentPath) {
      setBlocks([]);
      return;
    }

    try {
      const { blocks: loadedBlocks, metadata } = await FileService.readPage(workspace, currentPath);
      setBlocks(loadedBlocks || []);
      setPageMetadata(metadata || {
        createdAt: new Date().toISOString(),
        lastEdited: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error loading content:', error);
      setBlocks([]);
    }
  };

  useEffect(() => {
    if (workspace && !currentPath) {
      loadInitialPage();
    } else if (currentPath) {
      localStorage.setItem(CURRENT_PAGE_KEY, currentPath);
      loadContent();
      const pathParts = currentPath.split('/');
      setPageTitle(pathParts[pathParts.length - 1]);
    }
  }, [workspace, currentPath]);

  const loadInitialPage = async () => {
    try {
      // Try to load from localStorage first
      const savedPath = localStorage.getItem(CURRENT_PAGE_KEY);
      if (savedPath) {
        // Verify the path still exists
        try {
          await FileService.readPage(workspace, savedPath);
          onPathChange(savedPath); // Updated function name
          return;
        } catch {
          localStorage.removeItem(CURRENT_PAGE_KEY);
        }
      }

      // If no saved path or it's invalid, find the first page
      const pages = await FileService.listPages(workspace);
      if (pages.length > 0) {
        const firstPage = findFirstPage(pages);
        if (firstPage) {
          onPathChange(firstPage); // Updated function name
        }
      }
    } catch (error) {
      console.error('Error loading initial page:', error);
    }
  };

  const findFirstPage = (pages) => {
    // Sort pages alphabetically
    const sortedPages = [...pages].sort((a, b) => a.name.localeCompare(b.name));
    if (sortedPages.length === 0) return null;
    return sortedPages[0].name;
  };
  const saveContent = async () => {
    if (!workspace || !currentPath || !blocks) return;

    try {
      setIsSaving(true);
      const updatedMetadata = {
        ...pageMetadata,
        lastEdited: new Date().toISOString()
      };
      await FileService.writePage(workspace, currentPath, blocks, updatedMetadata);
      setPageMetadata(updatedMetadata);
    } catch (error) {
      console.error('Error saving content:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitleChange = async (newTitle) => {
    if (newTitle.trim() === pageTitle || !newTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }

    try {
      const pathParts = currentPath.split('/');
      pathParts[pathParts.length - 1] = newTitle;
      const newPath = pathParts.join('/');
      await FileService.renamePage(workspace, currentPath, newTitle);
      onPathChange(newPath);
      setPageTitle(newTitle);
      localStorage.setItem(CURRENT_PAGE_KEY, newPath);
      setIsEditingTitle(false);
    } catch (error) {
      console.error('Error renaming page:', error);
    }
  };



  // Add debounced auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (blocks.length > 0) {
        saveContent();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [blocks]);

  const addBlock = (type, index) => {
    const newBlock = {
      id: Date.now(),
      type,
      content: "",
      items: type === BlockType.TODO ? [] : undefined,
      data: type === BlockType.TABLE ? [] : undefined,
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${pageTitle}"?`)) {
      try {
        await FileService.deletePage(workspace, currentPath);
        onPathChange(null);
      } catch (error) {
        console.error('Error deleting page:', error);
      }
    }
  };

  const handleCreateSubpage = async () => {
    try {
      const name = prompt('Enter new page name:');
      if (!name) return;

      const newPath = `${currentPath}/${name}`;
      await FileService.createPage(workspace, newPath);
      onPathChange(newPath);
    } catch (error) {
      console.error('Error creating subpage:', error);
    }
  };


  const deleteBlock = (index) => {
    const newBlocks = blocks.filter((_, i) => i !== index);
    setBlocks(newBlocks);
  };

  const updateBlock = (id, updates) => {
    setBlocks(blocks.map((block) => (block.id === id ? { ...block, ...updates } : block)));
  };

  const renderBlock = (block) => {
    switch (block.type) {
      case BlockType.PARAGRAPH:
        return (
          <ParagraphBlock
            content={block.content}
            onChange={(content) => updateBlock(block.id, { content })}
          />
        );
      case BlockType.HEADING:
        return (
          <HeadingBlock
            content={block.content}
            onChange={(content) => updateBlock(block.id, { content })}
          />
        );
      case BlockType.TABLE:
        return (
          <TableBlock
            data={block.data || []}
            onChange={(data) => updateBlock(block.id, { data })}
          />
        );
      case BlockType.IMAGE:
        return (
          <ImageBlock
            src={block.src}
            caption={block.caption}
            onChange={(updates) => updateBlock(block.id, updates)}
          />
        );
      case BlockType.TODO:
        return (
          <TodoBlock
            items={block.items || []}
            onChange={(items) => updateBlock(block.id, { items })}
          />
        );
      case BlockType.FILE:
        return <FileBlock key={block.id} file={block} />;
      default:
        return null;
    }
  };

  const BlockControls = ({ index }) => (
    <div className="absolute w-full left-0 -bottom-8 flex flex-row items-center justify-start opacity-0 group-hover:opacity-100">
      {/* Add block button */}
      <div className="flex items-center">
        <BlockMenu
          onSelect={(type) => addBlock(type, index)}
          trigger={
            <button className="p-2 text-blue-500 hover:bg-blue-50 rounded-full">
              <Plus className="w-4 h-4" />
            </button>
          }
        />
        {/* Copy block button */}
        <button
          onClick={() => handleCopyBlock(index)}
          className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
          title="Copy Block"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>

      {/* Delete button */}
      <button
        onClick={() => deleteBlock(index)}
        className="p-2 text-red-500 hover:bg-red-50 rounded-full mr-1"
        title="Delete Block"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="mx-auto p-8">
      {/* Page Header */}
      <div className="mb-8 space-y-2 px-6">
        <div className="flex items-center justify-between group">
          {isEditingTitle ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleTitleChange(e.target.title.value);
              }}
              className="flex-1"
            >
              <input
                name="title"
                defaultValue={pageTitle}
                autoFocus
                className="text-5xl w-full focus:outline-none bg-transparent mb-4"
                onBlur={(e) => handleTitleChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
              />
            </form>
          ) : (
            <h1
              className="text-5xl flex-1 cursor-pointer hover:text-blue-600 mb-4"
              onClick={() => setIsEditingTitle(true)}
            >
              {pageTitle}
            </h1>
          )}

          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-2">
            <button
              onClick={() => setIsEditingTitle(true)}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Rename page"
            >
              <Edit2 className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Delete page"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
            <button
              onClick={handleCreateSubpage}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Create subpage"
            >
              <FolderPlus className="w-4 h-4 text-blue-500" />
            </button>
          </div>
        </div>

        {/* Page Metadata */}
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span className="truncate">Created: {new Date(pageMetadata.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Save className="w-4 h-4" />
            <span className="truncate">Last edited: {new Date(pageMetadata.lastEdited).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Blocks */}
      <div className="max-w-4xl mx-auto px-6 relative">
        {blocks.map((block, index) => (
          <BlockWrapper key={block.id} block={block} index={index}>
            {renderBlock(block)}
          </BlockWrapper>
        ))}
      </div>

      {/* Saving indicator */}
      {isSaving && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
          Saving...
        </div>
      )}
    </div>
  );

};

export default ContentEditor;