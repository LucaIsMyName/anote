import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { BlockMenu, BlockType, ParagraphBlock, HeadingBlock, TodoBlock } from "./BlockMenu";
import TableBlock from "./TableBlock";
import ImageBlock from "./ImageBlock";
import FileBlock from "./FileBlock";
import { FileService } from "../../services/fileService";

const CURRENT_PAGE_KEY = 'anote_current_page';

const ContentEditor = ({ workspace, currentPath, onPathChange = () => {} }) => { // Added default value
  const [blocks, setBlocks] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [pageTitle, setPageTitle] = useState('');

  useEffect(() => {
    if (workspace && !currentPath) {
      loadInitialPage();
    }
  }, [workspace]);

  useEffect(() => {
    if (currentPath) {
      localStorage.setItem(CURRENT_PAGE_KEY, currentPath);
      loadContent();
      const pathParts = currentPath.split('/');
      setPageTitle(pathParts[pathParts.length - 1]);
    }
  }, [currentPath]);

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

  const loadContent = async () => {
    if (!workspace || !currentPath) return;

    try {
      const loadedBlocks = await FileService.readPage(workspace, currentPath);
      setBlocks(loadedBlocks);
    } catch (error) {
      console.error('Error loading content:', error);
      setBlocks([]);
    }
  };


  const saveContent = async () => {
    if (!workspace || !currentPath) return;

    try {
      setIsSaving(true);
      await FileService.writePage(workspace, currentPath, blocks);
    } catch (error) {
      console.error('Error saving content:', error);
    } finally {
      setIsSaving(false);
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
      default:
        return null;
    }
  };
  const BlockControls = ({ index }) => (
    <div className="absolute left-0 top-0 bottom-0 -ml-12 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100">
      {/* Delete button */}
      <button
        onClick={() => deleteBlock(index)}
        className="p-2 text-red-500 hover:bg-red-50 rounded-full mb-2"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Add block button */}
      <BlockMenu
        onSelect={(type) => addBlock(type, index)}
        trigger={
          <button className="p-2 text-blue-500 hover:bg-blue-50 rounded-full">
            <Plus className="w-4 h-4" />
          </button>
        }
      />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">{pageTitle}</h1>

      {/* Blocks */}
      {blocks.map((block, index) => (
        <div key={block.id} className="relative group mb-4">
          <BlockControls index={index} />
          {renderBlock(block)}
        </div>
      ))}

      {/* Add first block */}
      {blocks.length === 0 && (
        <div className="text-center py-8">
          <BlockMenu
            onSelect={(type) => addBlock(type, -1)}
            trigger={
              <button className="p-3 text-blue-500 hover:bg-blue-50 rounded-full">
                <Plus className="w-6 h-6" />
              </button>
            }
          />
          <p className="text-gray-500 mt-2">Click + to add content</p>
        </div>
      )}

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