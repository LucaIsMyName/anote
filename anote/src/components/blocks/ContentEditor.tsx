import React, { useState, useEffect, memo, useRef, useCallback } from "react";
import { Plus, Trash2, Edit2, Copy, FolderPlus, Calendar, Save, GripVertical, LoaderCircle } from "lucide-react";
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
import Tooltip from "./utils/Tooltip.tsx";
import { FileService } from "../../services/FileService.ts";

const CURRENT_PAGE_KEY = "anote_current_page";

export interface ContentEditorProps {
  workspace: string;
  currentPath: string;
  onPathChange?: (path: string) => void;
}

const EmptyPageBlock = ({ onAddBlock: any }) => {
  const [showMenu, setShowMenu] = useState(false);
  const buttonRef = useRef(null);

  const handleAddBlock = (type) => {
    onAddBlock(type, -1); // -1 as index since it's the first block
    setShowMenu(false);
  };

  return (
    <div className="text-left py-4">
      <div className="relative inline-block">
        <button
          ref={buttonRef}
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded border border-gray-300 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Add Block</span>
        </button>

        {showMenu && (
          <BlockMenu
            anchorEl={buttonRef.current}
            onClose={() => setShowMenu(false)}
            onSelect={handleAddBlock}
          />
        )}
      </div>
    </div>
  );
};

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
  const [isShowingSavingIndicator, setIsShowingSavingIndicator] = useState(false);
  const savingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [pageTitle, setPageTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [pageMetadata, setPageMetadata] = useState({
    createdAt: null,
    lastEdited: null,
  });
  const [draggedBlockIndex, setDraggedBlockIndex] = useState(null);
  const [dragOverBlockIndex, setDragOverBlockIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const blockRefs = useRef(new Map());

  const scrollToHeading = useCallback((blockId: number) => {
    const element = blockRefs.current.get(blockId);
    if (element) {
      // Scroll the heading into view with some offset from the top
      const offset = 80; // Adjust this value based on your layout
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }, []);
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
  const handleCopyBlock = useCallback(
    (index: number) => {
      const blockToCopy = blocks[index];
      const copiedBlock = { ...blockToCopy, id: Date.now() };
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, copiedBlock);
      setBlocks(newBlocks);
    },
    [blocks]
  );

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
      setIsShowingSavingIndicator(true);

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

      // Clear any existing timer
      if (savingTimerRef.current) {
        clearTimeout(savingTimerRef.current);
      }

      // Set a new timer to hide the indicator after 1 second
      savingTimerRef.current = setTimeout(() => {
        setIsShowingSavingIndicator(false);
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (savingTimerRef.current) {
        clearTimeout(savingTimerRef.current);
      }
    };
  }, []);

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

  const addBlock = useCallback(
    (type, index) => {
      const newBlock = {
        id: Date.now(),
        type,
        content: "",
        level: type === BlockType.HEADING ? 2 : undefined, // Add default level for headings
        createdAt: new Date().toISOString(),
        lastEdited: new Date().toISOString(),
        items: type === BlockType.TODO ? [] : undefined,
        data: type === BlockType.TABLE ? [] : undefined,
      };

      // Handle adding first block
      if (index === -1) {
        setBlocks([newBlock]);
        return;
      }

      // Handle adding block at specific index
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      setBlocks(newBlocks);
    },
    [blocks]
  );

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${pageTitle}"?`)) {
      try {
        const newPagePath = await FileService.deletePage(workspace, currentPath);
        // If newPagePath is returned, it means a new initial page was created
        // Update the current path to the new page
        onPathChange(newPagePath || null);
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
            level={block.level || 2}
            onChange={(content, level) => updateBlock(block.id, { content, level })}
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
            src={block.src || null}
            caption={block.caption || ''}
            onChange={(updates) => updateBlock(block.id, updates)}
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

  const renderBlockControls = useCallback(
    (index: number) => (
      <BlockControls
        index={index}
        onAddBlock={addBlock}
        onCopyBlock={handleCopyBlock}
        onDeleteBlock={deleteBlock}
      />
    ),
    [addBlock, handleCopyBlock, deleteBlock]
  );
  return (
    <main className="mx-auto p-8">
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
              className="text-5xl flex-1 cursor-pointer hover:text-sky-600 mb-4"
              onClick={() => setIsEditingTitle(true)}>
              {pageTitle}
            </h1>
          )}

          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-2">
            <Tooltip
              theme={"light"}
              content="Rename page"
              placement="top">
              <button
                onClick={() => setIsEditingTitle(true)}
                className="p-2 hover:bg-gray-100 rounded-full">
                <Edit2 className="w-4 h-4 text-gray-500" />
              </button>
            </Tooltip>

            <Tooltip
              content="Delete page"
              placement="top">
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-gray-100 rounded-full">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </Tooltip>

            <Tooltip
              content="Create subpage"
              placement="top">
              <button
                onClick={handleCreateSubpage}
                className="p-2 hover:bg-gray-100 rounded-full">
                <FolderPlus className="w-4 h-4 text-sky-500" />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Page Metadata */}
        <div className="flex items-center space-x-4 text-sm text-gray-500 pb-6 border-b-2">
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
      <div className=" mx-auto px-6 relative">
        <div className="lg:flex gap-8">
          <div className="block w-full lg:w-64 flex-shrink-0 lg:mr-6">
            <TableOfContents
              blocks={blocks}
              onHeadingClick={scrollToHeading}
            />
          </div>
          <div className="flex-1">
            {blocks.length === 0 ? (
              <EmptyPageBlock onAddBlock={addBlock} />
            ) : (
              blocks.map((block, index) => (
                <BlockWrapper
                  key={block.id}
                  ref={(node) => {
                    if (node) {
                      blockRefs.current.set(block.id, node);
                    } else {
                      blockRefs.current.delete(block.id);
                    }
                  }}
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
              ))
            )}
          </div>
        </div>
      </div>

      {/* Saving indicator */}
      {isShowingSavingIndicator && (
        <div className="fixed top-4 right-4 bg-white/80 backdrop-blur-sm border border-gray-200 rounded px-2 py-1 text-sm text-gray-500 flex items-center gap-2 shadow-sm">
          <LoaderCircle className="w-4 h-4 animate-spin" />
          <span>Saving...</span>
        </div>
      )}
    </main>
  );
};

export default ContentEditor;
