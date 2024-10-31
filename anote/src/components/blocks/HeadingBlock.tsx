import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import SwitchableEditor from "./utils/SwitchableEditor.tsx";
import Tooltip from "./utils/Tooltip.tsx";
import { FileService } from "../../services/FileService.ts";

export interface HeadingBlockProps {
  content: string;
  level?: number;
  onChange: (content: string, level?: number) => void;
}

/**
 * @description Heading block component that allows users to select
 * a heading level and input heading text. Supports h1-h6.
 */
const HeadingBlock = ({ content, level: initialLevel = 2, onChange }: HeadingBlockProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [headingLevel, setHeadingLevel] = useState(initialLevel);
  const [localContent, setLocalContent] = useState('');

  // Update heading level when prop changes
  useEffect(() => {
    setHeadingLevel(initialLevel);
  }, [initialLevel]);

  useEffect(() => {
    const markdownContent = FileService.transformInlineHtmlToMarkdown(content || '');
    setLocalContent(markdownContent);
  }, [content]);

  const handleSelectLevel = (level: number) => {
    setHeadingLevel(level);
    setIsDropdownOpen(false);
    onChange(content || "", level);
  };

  const handleContentChange = (newMarkdownContent: string) => {
    setLocalContent(newMarkdownContent);
    const htmlContent = FileService.transformInlineMarkdownToHtml(newMarkdownContent);
    onChange(htmlContent, headingLevel);
  };

  const HeadingLevelMenu = (
    <div className="w-24 bg-white rounded-lg shadow-lg py-1">
      {[1, 2, 3, 4, 5, 6].map((level) => (
        <button
          key={level}
          onClick={() => handleSelectLevel(level)}
          className={`w-full text-left px-3 py-2 hover:bg-gray-100 ${
            headingLevel === level ? 'bg-gray-50 text-sky-600' : ''
          }`}
        >
          <span className="inline-block w-8">H{level}</span>
        </button>
      ))}
    </div>
  );

  // Calculate dynamic font size based on heading level
  const getFontSize = () => {
    switch (headingLevel) {
      case 1: return 'text-4xl';
      case 2: return 'text-3xl';
      case 3: return 'text-2xl';
      case 4: return 'text-xl';
      case 5: return 'text-lg';
      case 6: return 'text-base';
      default: return 'text-3xl';
    }
  };
  
  return (
    <div className="flex items-center flex-row-reverse relative">
      <Tooltip
        content={HeadingLevelMenu}
        visible={isDropdownOpen}
        onClickOutside={() => setIsDropdownOpen(false)}
        interactive={true}
        trigger="click"
        theme="light"
        placement="bottom-end"
      >
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-1 bg-gray-100 px-3 py-1 rounded text-gray-700 hover:bg-gray-200 opacity-25 hover:opacity-100 transition-opacity ml-2"
        >
          <span>{`H${headingLevel}`}</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </Tooltip>
      
      <SwitchableEditor
        content={localContent}
        onChange={handleContentChange}
        className={`m-0 w-full bg-transparent focus:ring-1 focus:ring-sky-500 focus:ring-offset-2 focus:outline-4 outline-offset-2 rounded p-1 ${getFontSize()}`}
        placeholder="Heading text..."
      />
    </div>
  );
};

export default HeadingBlock;