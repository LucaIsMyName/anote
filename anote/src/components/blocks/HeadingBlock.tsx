import React, { useState, useRef } from "react";
import { ChevronDown } from "lucide-react";
import Input from "./utils/Input.tsx";
/**
 * @description Heading block component that allows users to select
 * a heading level and input heading text.
 */

interface HeadingBlockProps {
  content: string;
  onChange: (content: string) => void;
}

const HeadingBlock = ({ content, onChange }: HeadingBlockProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [headingLevel, setHeadingLevel] = useState(2); // Default to H2
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const handleSelectLevel = (level: number) => {
    setHeadingLevel(level);
    setIsDropdownOpen(false);
    // Update content to include the heading level
    const newContent = `${content.replace("#", "")}`;
    onChange(newContent);
  };

  const handleContentChange = (e: any) => {
    const newText = e.target.value;
    onChange(`${headingLevel} ${newText}`);
  };

  return (
    <div className="flex items-center flex-row-reverse space-x-2 relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex opacity-25 hover:opacity-100 items-center space-x-1 bg-gray-100 px-3 py-1 rounded text-gray-700 hover:bg-gray-200">
        <span>{`H${headingLevel}`}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full right-0 mt-1 w-20 bg-white border rounded shadow-lg z-10">
          {[2, 3, 4, 5, 6].map((level) => (
            <button
              key={level}
              onClick={() => handleSelectLevel(level)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100">
              {`H${level}`}
            </button>
          ))}
        </div>
      )}

      <Input
        type="text"
        value={content.replace(/^#\d\s/, "")} // Remove the level indicator from display
        onChange={handleContentChange}
        className="w-full bg-transparent text-lg font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="Heading text..."
      />
    </div>
  );
};

export default HeadingBlock;