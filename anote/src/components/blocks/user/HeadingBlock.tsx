import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import SwitchableEditor from "../utils/SwitchableEditor.tsx";
import Tooltip from "../utils/Tooltip.tsx";
import { FileService } from "../../../services/FileService.ts";

export interface HeadingBlockProps {
  content: string;
  level?: number;
  onChange: (content: string, level?: number) => void;
  onEnterKey?: () => void; // Add this prop
}

const HeadingBlock: React.FC<HeadingBlockProps> = ({ content, level: initialLevel = 2, onChange, onEnterKey }: HeadingBlockProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [headingLevel, setHeadingLevel] = useState(initialLevel);
  const [localContent, setLocalContent] = useState("");

  // Update heading level when prop changes
  useEffect(() => {
    setHeadingLevel(initialLevel);
  }, [initialLevel]);

  // Update local content when prop changes
  useEffect(() => {
    const markdownContent = FileService.transformInlineHtmlToMarkdown(content || "");
    setLocalContent(markdownContent);
  }, [content]);

  const handleSelectLevel = (level: number) => {
    setHeadingLevel(level);
    setIsDropdownOpen(false);
    // Convert current markdown content to HTML before sending to parent
    const htmlContent = FileService.transformInlineMarkdownToHtml(localContent);
    onChange(htmlContent, level);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onEnterKey?.();
    }
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
          className={`w-full text-left px-3 py-2 hover:bg-gray-100 ${headingLevel === level ? "bg-gray-50 text-sky-600" : ""}`}>
          <span className="inline-block w-8">H{level}</span>
        </button>
      ))}
    </div>
  );

  // Calculate dynamic font size based on heading level
  const getFontSize = () => {
    switch (headingLevel) {
      case 1:
        return "text-2xl md:text-4xl";
      case 2:
        return "text-xl md:text-3xl";
      case 3:
        return "text-lg md:text-2xl";
      case 4:
        return "text-base md:text-xl";
      case 5:
        return "text-sm md:text-lg";
      case 6:
        return "text-xs md:text-base";
      default:
        return "text-2xl md:text-3xl";
    }
  };

  return (
    <div className="flex items-start flex-row-reverse relative max-w-3xl">
      <Tooltip
        content={HeadingLevelMenu}
        visible={isDropdownOpen}
        onClickOutside={() => setIsDropdownOpen(false)}
        interactive={true}
        trigger="click"
        theme="light"
        placement="bottom-start"
        offset={[10, 0]}
        className="z-[1000]">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-1 px-2 pt-[0.1em] rounded text-gray-700 hover:bg-gray-100 opacity-25 hover:opacity-100 transition-opacity ml-2">
          <span>{`${headingLevel}`}</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </Tooltip>

      <SwitchableEditor
        content={localContent}
        onChange={handleContentChange}
        onKeyDown={handleKeyDown} // Add this prop
        className={`m-0 w-full break-words bg-transparent focus:ring-1 focus:ring-sky-400 focus:ring-offset-2 focus:outline-4 outline-offset-2 rounded ${getFontSize()}`}
        placeholder="Heading text..."
      />
    </div>
  );
};

export default HeadingBlock;
