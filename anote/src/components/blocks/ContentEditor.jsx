import React, { useState, useEffect } from "react";
import { BlockMenu, BlockType, ParagraphBlock, HeadingBlock, TodoBlock } from "./BlockMenu";
import TableBlock from "./TableBlock";
import ImageBlock from "./ImageBlock";
import { FileService } from "../../services/fileService";

const ContentEditor = ({ workspace, currentPath }) => {
  const [blocks, setBlocks] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadContent();
  }, [currentPath]);

  const loadContent = async () => {
    if (!workspace || !currentPath) return;
    
    try {
      const loadedBlocks = await FileService.readMarkdownFile(workspace, currentPath);
      setBlocks(loadedBlocks);
    } catch (error) {
      console.error('Error loading content:', error);
      // If file doesn't exist, start with empty blocks
      setBlocks([]);
    }
  };

  const saveContent = async () => {
    if (!workspace || !currentPath) return;
    
    try {
      setIsSaving(true);
      await FileService.writeMarkdownFile(workspace, currentPath, blocks);
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

  const addBlock = (type) => {
    const newBlock = {
      id: Date.now(),
      type,
      content: "",
      items: type === BlockType.TODO ? [] : undefined,
      data: type === BlockType.TABLE ? [] : undefined,
    };
    setBlocks([...blocks, newBlock]);
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

  return (
    <div className="max-w-4xl mx-auto p-8">
      {isSaving && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
          Saving...
        </div>
      )}

      {/* Blocks */}
      {blocks.map((block) => (
        <div
          key={block.id}
          className="relative group">
          <div className="absolute -left-8 top-2 opacity-0 group-hover:opacity-100">
            <BlockMenu onSelect={addBlock} />
          </div>
          {renderBlock(block)}
        </div>
      ))}

      {/* Add Block Button */}
      {blocks.length === 0 && (
        <div className="text-center py-8">
          <BlockMenu onSelect={addBlock} />
          <p className="text-gray-500 mt-2">Click + to add content</p>
        </div>
      )}
    </div>
  );
};

export default ContentEditor;