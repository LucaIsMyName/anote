import React, { useState, useEffect, memo, useCallback } from "react";
import { Plus, Trash2, Edit2, Copy, FolderPlus, Calendar, Save, GripVertical } from "lucide-react";
import { BlockMenu, BlockType } from "./BlockMenu.tsx";
import TableBlock from "./TableBlock.tsx";
import HeadingBlock from "./HeadingBlock.tsx";
import ParagraphBlock from "./ParagraphBlock.tsx";
import ImageBlock from "./ImageBlock.tsx";
import FileBlock from "./FileBlock.tsx";

import BlockControls from "./BlockControls.tsx";
import BlockWrapper from "./BlockWrapper.tsx";
import TableOfContents from "./TableOfContents.tsx";
import TodoBlock from "./TodoBlock.tsx";
import Input from "./utils/Input.tsx";
import { FileService } from "../../services/FileService.ts";

const CURRENT_PAGE_KEY = "anote_current_page";

export interface ContentEditorProps {
  workspace: string;
  currentPath: string;
  onPathChange?: (path: string) => void;
}

/**
 *
 * @param {string} workspace
 * @param {string} currentPath
 * @param {Function} onPathChange
 * @returns
 * @description A content editor component that allows users to
 * create, edit, and delete blocks of content in a page.
 */

const ContentEditor = ({ workspace, currentPath, onPathChange = () => {} }: ContentEditorProps) => {
  // Added default value
  const [blocks, setBlocks] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [pageTitle, setPageTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [pageMetadata, setPageMetadata] = useState({
    createdAt: null,
    lastEdited: null,
  });
  const [draggedBlockIndex, setDraggedBlockIndex] = useState(null);
  const [dragOverBlockIndex, setDragOverBlockIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  /**
   *
   * @param {number} index
   * @returns
   * @description Handles copying a block by
   * creating a new block with a unique ID
   * and inserting it after the original block.
   * This function is called when the user clicks the
   * copy button in the block controls.
   */
  const handleCopyBlock = useCallback((index: number) => {
    const blockToCopy = blocks[index];
    const copiedBlock = { ...blockToCopy, id: Date.now() };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, copiedBlock);
    setBlocks(newBlocks);
  }, [blocks]);

  /**
   * @description Handles the start of a drag operation by setting the dragged block index
   * and setting a transparent drag image to improve visual feedback.
   * This function is called when the user starts dragging a block.
   * The dragged block index is set to the index of the block being dragged.
   * A transparent drag image is created and set to the drag event to improve visual feedback.
   */
  const handleDragStart = (e: any, index: any) => {
    setIsDragging(true);
    setDraggedBlockIndex(index);
    e.dataTransfer.effectAllowed = "move";

    // Set a transparent drag image to improve visual feedback
    const dragImage = document.createElement("div");
    dragImage.style.opacity = "0";
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  /**
   * @description Handles the end of a drag operation by resetting the dragged block index
   * and the drag over block index.
   * This function is called when the user stops dragging a block.
   * The dragged block index and drag over block index are reset to null.
   */
  const handleDragEnd = (e: any) => {
    setIsDragging(false);
    setDraggedBlockIndex(null);
    setDragOverBlockIndex(null);
  };

  /**
   * @description Handles the drag over event by preventing the default behavior
   * and updating the drag over block index.
   * This function is called when the user drags a block over another block.
   * The drag over block index is updated to the index of the block being dragged over.
   */
  const handleDragOver = (e: any, index: any) => {
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

  /**
   * @description Handles the drag leave event by preventing the default behavior
   * and stopping the event propagation.
   * This function is called when the user drags a block out of another block.
   * The drag over block index is reset to null.
   */
  const handleDragLeave = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
  };

  /**
   *
   * @param {React.Component} block
   * @param {number} index
   * @param {ReactNode} children
   * @returns {React.JSX.Element}
   * @description A wrapper component that adds drag and drop functionality
   * to a block by handling drag events and rendering drag handles.
   * This component is used to wrap each block in the content editor.
   * It adds drag and drop functionality to the block by handling drag events
   * and rendering drag handles for reordering blocks.
   * The block is wrapped in a div that listens for drag events and renders a larger
   * drag handle area on the left side of the block.
   */

  // const BlockWrapper = ({ block, index, children }: BlockWrapperProps) => {
  //   const isDraggedBlock = draggedBlockIndex === index;
  //   const isOverBlock = dragOverBlockIndex === index;

  //   return (
  //     <div
  //       className={`
  //         relative group mb-8 transition-all duration-200 ease-in-out
  //         ${isDragging ? "cursor-grabbing" : "cursor-grab"}
  //         ${isDraggedBlock ? "" : "opacity-100"}
  //         ${isOverBlock ? "border-t-2 border-blue-500" : "border-t-0 border-transparent"}
  //       `}
  //       draggable="true"
  //       onDragStart={(e) => handleDragStart(e, index)}
  //       onDragEnd={(e) => handleDragEnd(e)}
  //       onDragOver={(e) => handleDragOver(e, index)}
  //       onDragLeave={(e) => handleDragLeave(e)}>
  //       {/* Larger drag handle area */}
  //       <div
  //         className="absolute left-0 top-0 bottom-0 w-12 -translate-x-full
  //                    opacity-0 group-hover:opacity-100 flex items-center
  //                    justify-center cursor-grab active:cursor-grabbing">
  //         <div className="p-2 rounded hover:bg-gray-100">
  //           <GripVertical className="w-5 h-5 text-gray-400" />
  //         </div>
  //       </div>

  //       <div className={`relative ${isDragging ? "pointer-events-none" : ""}`}>{children}</div>

  //       <BlockControls index={index} />
  //     </div>
  //   );
  // };

  useEffect(() => {
    if (workspace && !currentPath) {
      loadInitialPage();
    } else if (currentPath) {
      localStorage.setItem(CURRENT_PAGE_KEY, currentPath);
      loadContent();
      const pathParts = currentPath.split("/");
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
      setPageMetadata(
        metadata || {
          createdAt: new Date().toISOString(),
          lastEdited: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error("Error loading content:", error);
      setBlocks([]);
    }
  };

  useEffect(() => {
    if (workspace && !currentPath) {
      loadInitialPage();
    } else if (currentPath) {
      localStorage.setItem(CURRENT_PAGE_KEY, currentPath);
      loadContent();
      const pathParts = currentPath.split("/");
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
      console.error("Error loading initial page:", error);
    }
  };

  const findFirstPage = (pages: any) => {
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
        lastEdited: new Date().toISOString(),
      };
      await FileService.writePage(workspace, currentPath, blocks, updatedMetadata);
      setPageMetadata(updatedMetadata);
    } catch (error) {
      console.error("Error saving content:", error);
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
      const pathParts = currentPath.split("/");
      pathParts[pathParts.length - 1] = newTitle;
      const newPath = pathParts.join("/");
      await FileService.renamePage(workspace, currentPath, newTitle);
      onPathChange(newPath);
      setPageTitle(newTitle);
      localStorage.setItem(CURRENT_PAGE_KEY, newPath);
      setIsEditingTitle(false);
    } catch (error) {
      console.error("Error renaming page:", error);
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

  const addBlock = useCallback((type, index) => {
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
  }, [blocks]);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${pageTitle}"?`)) {
      try {
        await FileService.deletePage(workspace, currentPath);
        onPathChange(null);
      } catch (error) {
        console.error("Error deleting page:", error);
      }
    }
  };

  const handleCreateSubpage = async () => {
    try {
      const name = prompt("Enter new page name:");
      if (!name) return;

      const newPath = `${currentPath}/${name}`;
      await FileService.createPage(workspace, newPath);
      onPathChange(newPath);
    } catch (error) {
      console.error("Error creating subpage:", error);
    }
  };

  const deleteBlock = (index) => {
    const newBlocks = blocks.filter((_, i) => i !== index);
    setBlocks(newBlocks);
  };

  const updateBlock = (id: number, updates: any) => {
    setBlocks(blocks.map((block) => (block.id === id ? { ...block, ...updates } : block)));
  };

  const renderBlock = (block: React.JSX.Element) => {
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
            id={block.id}
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
        return (
          <FileBlock
            key={block.id}
            file={block}
          />
        );
      default:
        return null;
    }
  };

  /**
   *
   * @param {number} index
   * @returns
   * @description Block controls component that renders buttons for adding, copying, and deleting blocks.
   * This component is displayed at the bottom of each block and is only visible when the user hovers over the block.
   * It renders buttons for adding a new block, copying the current block, and deleting the current block.
   * The add block button opens a block menu when clicked, allowing the user to select a block type to add.
   */
  
  const renderBlockControls = useCallback((index: number) => (
    <BlockControls 
      index={index}
      onAddBlock={addBlock}
      onCopyBlock={handleCopyBlock}
      onDeleteBlock={deleteBlock}
    />
  ), [addBlock, handleCopyBlock, deleteBlock]);
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
              className="flex-1">
              <Input
                name="title"
                defaultValue={pageTitle}
                className="text-5xl w-full focus:outline-none bg-transparent mb-4"
                onBlur={(e) => handleTitleChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setIsEditingTitle(false);
                }}
              />
            </form>
          ) : (
            <h1
              className="text-5xl flex-1 cursor-pointer hover:text-blue-600 mb-4"
              onClick={() => setIsEditingTitle(true)}>
              {pageTitle}
            </h1>
          )}

          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-2">
            <button
              onClick={() => setIsEditingTitle(true)}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Rename page">
              <Edit2 className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Delete page">
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
            <button
              onClick={handleCreateSubpage}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Create subpage">
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
          <BlockWrapper
            key={block.id}
            block={block}
            index={index}
            isDragging={isDragging}
            draggedBlockIndex={draggedBlockIndex}
            dragOverBlockIndex={dragOverBlockIndex}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            renderBlockControls={renderBlockControls}>
            {renderBlock(block)}
          </BlockWrapper>
        ))}
      </div>

      {/* Saving indicator */}
      {isSaving && <div className="fixed top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm">Saving...</div>}
    </div>
  );
};

export default ContentEditor;
