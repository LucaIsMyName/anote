import React, { useState, useEffect, memo, useRef, useCallback } from "react";
import { Plus, Download, FileText, Trash2, Edit2, Copy, FolderPlus, Calendar, Save, GripVertical, LoaderCircle } from "lucide-react";
import { BlockMenu, BlockType } from "./BlockMenu.tsx";

import TableBlock from "./user/TableBlock.tsx";
import HeadingBlock from "./user/HeadingBlock.tsx";
import ParagraphBlock from "./user/ParagraphBlock.tsx";
import ImageBlock from "./user/ImageBlock.tsx";
import FileBlock from "./user/FileBlock.tsx";
import CodeBlock from "./user/CodeBlock.tsx";
import ListBlock from "./user/ListBlock.tsx";
import ReferenceBlock from "./user/ReferenceBlock.tsx";

import BlockControls from "./BlockControls.tsx";
import BlockWrapper from "./BlockWrapper.tsx";
import TableOfContents from "./TableOfContents.tsx";

import Input from "./utils/Input.tsx";
import Tooltip from "./utils/Tooltip.tsx";
import RelativeTime from "./utils/RelativeTime.tsx";

import { FileService } from "../../services/FileService.ts";
import { ImportExportService } from "../../services/ImportExportService.ts";

const CURRENT_PAGE_KEY = "anote_current_page";

export interface ContentEditorProps {
  workspace: string;
  currentPath: string;
  onPathChange?: (path: string) => void;
}

const EmptyPageBlock = ({ onAddBlock: any }) => {
  const [showMenu, setShowMenu] = useState(false);
  const buttonRef = useRef(null);

  const handleAddBlock = (type: any) => {
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
  const [blockMenuState, setBlockMenuState] = useState({
    isOpen: false,
    anchorEl: null,
    triggerBlockIndex: -1,
  });
  const handleMoveBlock = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (toIndex < 0 || toIndex >= blocks.length) return;

      const newBlocks = [...blocks];
      const [movedBlock] = newBlocks.splice(fromIndex, 1);
      newBlocks.splice(toIndex, 0, movedBlock);

      // Update lastEdited timestamp of the moved block
      movedBlock.lastEdited = new Date().toISOString();

      setBlocks(newBlocks);
    },
    [blocks]
  );

  const handleBlockEnterKey = (index: number) => {
    // Get the position of the current block
    const blockElement = blockRefs.current.get(blocks[index].id);
    if (!blockElement) return;

    // Calculate position for the menu
    const rect = blockElement.getBoundingClientRect();
    setBlockMenuState({
      isOpen: true,
      anchorEl: blockElement,
      triggerBlockIndex: index,
    });
  };

  const handleBlockMenuSelect = (type: string) => {
    addBlock(type, blockMenuState.triggerBlockIndex);
    setBlockMenuState({
      isOpen: false,
      anchorEl: null,
      triggerBlockIndex: -1,
    });
  };

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

  const handlePageClick = (pagePath: string) => {
    // Find the real path by looking up the page ID
    FileService.findPagePathById(workspace, pagePath).then((path) => {
      if (path) {
        onPathChange(path);
      }
    });
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

  const addBlock = useCallback(
    (type, index) => {
      const newBlock = {
        id: Date.now(),
        type,
        content: "",
        level: type === BlockType.HEADING ? 2 : undefined,
        createdAt: new Date().toISOString(),
        lastEdited: new Date().toISOString(),
        items: type === BlockType.LIST ? [] : undefined, // Changed from TODO to LIST
        listType: type === BlockType.LIST ? "unordered" : undefined, // Add this line
        data: type === BlockType.TABLE ? [] : undefined,
        referenceId: type === BlockType.REFERENCE ? undefined : undefined, // Add this line
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
            workspace={workspace}
            onPageClick={handlePageClick}
            onEnterKey={() => handleBlockEnterKey(index)}
          />
        );
      case BlockType.HEADING:
        return (
          <HeadingBlock
            content={block.content}
            level={block.level || 2}
            onChange={(content, level) => updateBlock(block.id, { content, level })}
            onEnterKey={() => handleBlockEnterKey(index)}
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
      case BlockType.LIST:
        return (
          <ListBlock
            items={block.items || []}
            type={block.listType || "unordered"}
            onChange={(items, type) => updateBlock(block.id, { items, listType: type })}
          />
        );
      case BlockType.FILE:
        return (
          <FileBlock
            key={block.id}
            src={block.src || null}
            caption={block.caption || ""}
            onChange={(updates) => updateBlock(block.id, updates)}
          />
        );
      case BlockType.CODE:
        return (
          <CodeBlock
            content={block.content || ""}
            language={block.language || "javascript"}
            isMultiline={block.isMultiline !== false}
            onChange={(updates) => {
              // Properly handle all updates from CodeBlock
              updateBlock(block.id, {
                content: updates.content,
                language: updates.language,
                isMultiline: updates.isMultiline,
              });
            }}
          />
        );
      case BlockType.REFERENCE:
        return (
          <ReferenceBlock
            referenceId={block.referenceId}
            workspace={workspace}
            onNavigate={(pagePath) => onPathChange(pagePath)}
            onChange={(referenceId) => updateBlock(block.id, { referenceId })}
          />
        );
      default:
        return null;
    }
  };

  /**
   *
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
      <div className="mb-8 space-y-2 md:px-6">
        <div className="flex items-center justify-between group my-4">
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
                className="text-5xl w-full focus:outline-none bg-transparent "
                onBlur={(e) => handleTitleChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setIsEditingTitle(false);
                }}
              />
            </form>
          ) : (
            <h1
              className="text-5xl lg:text-6xl font-bold flex-1 cursor-pointer hover:text-sky-600"
              onClick={() => setIsEditingTitle(true)}>
              {pageTitle}
            </h1>
          )}
        </div>

        <section className="flex items-center space-x-2 pb-4 -ml-2">
          <button
            onClick={async () => {
              const pageJson = await ImportExportService.exportPageToJson(workspace, currentPath);
              const blob = new Blob([JSON.stringify(pageJson, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${pageTitle}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="p-2 hover:bg-gray-100 rounded-full">
            <Download className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={async () => {
              const markdown = await ImportExportService.exportPageToMd(workspace, currentPath);
              const blob = new Blob([markdown], { type: "text/markdown" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${pageTitle}.md`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="p-2 hover:bg-gray-100 rounded-full">
            <FileText className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => setIsEditingTitle(true)}
            className="p-2 hover:bg-gray-100 rounded-full">
            <Edit2 className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 hover:bg-gray-100 rounded-full">
            <Trash2 className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={handleCreateSubpage}
            className="p-2 hover:bg-gray-100 rounded-full">
            <FolderPlus className="w-4 h-4 text-gray-500" />
          </button>
        </section>

        {/* Page Metadata */}
        <div className="md:flex items-center md:space-x-4 text-sm text-gray-500 pb-6 border-b-2">
          <div className="flex items-center space-x-1 mb-2 md:mb-0">
            <Calendar className="w-4 h-4" />
            <span className="truncate">
              <RelativeTime date={pageMetadata.createdAt} />
            </span>
          </div>
          <div className="flex items-center space-x-1 mb-2 md:mb-0">
          {isShowingSavingIndicator ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="truncate">{isShowingSavingIndicator ? "Saving ..." : <RelativeTime date={pageMetadata.lastEdited} />}</span>
          </div>
        </div>
      </div>
      {/* Blocks */}
      <div className=" mx-auto md:px-6 relative">
        <div className="flex flex-col-reverse justify-between lg:flex-row gap-8">
          <div className="flex-1 max-w-3xl">
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
                  onMoveBlock={handleMoveBlock} // Add this line
                  renderBlockControls={renderBlockControls}>
                  {renderBlock(block, index)}
                </BlockWrapper>
              ))
            )}
          </div>
          <div className="block w-full h-full overlow-y-scroll lg:max-w-48 flex-shrink-0 lg:mr-6">
            <TableOfContents
              blocks={blocks}
              onHeadingClick={scrollToHeading}
            />
          </div>
        </div>
      </div>

      {/* Saving indicator */}
      {isShowingSavingIndicator && (
        <div className="fixed top-8 right-12 bg-white/80 backdrop-blur-sm border border-gray-200 rounded px-2 py-1 text-sm text-gray-500 flex items-center gap-2 shadow-sm">
          <LoaderCircle className="w-4 h-4 animate-spin" />
          <span>Saving...</span>
        </div>
      )}
      {/* Add BlockMenu portal */}
      {blockMenuState.isOpen && blockMenuState.anchorEl && (
        <div
          className="fixed z-50"
          style={{
            top: blockMenuState.anchorEl.getBoundingClientRect().bottom + 8,
            left: blockMenuState.anchorEl.getBoundingClientRect().left,
          }}>
          <BlockMenu
            onSelect={handleBlockMenuSelect}
            onClose={() =>
              setBlockMenuState({
                isOpen: false,
                anchorEl: null,
                triggerBlockIndex: -1,
              })
            }
          />
        </div>
      )}
    </main>
  );
};

export default ContentEditor;
