import React, { useEffect, useRef, useState, memo } from "react";
import PageMentionMenu from "./PageMentionMenu.tsx";
import Input from "./utils/Input.tsx";
import Textarea from "./utils/Textarea.tsx";


export interface ParagraphBlockProps {
  content: string;
  onChange: (content: string) => void;
  workspace: string;
  onPageClick: (pagePath: string) => void;
}

/**
 * @description Paragraph block component that allows users to input text
 * and mention other pages using double square brackets.
 * Example: [[Page Name]]
 * When a page is mentioned, it will be highlighted and clickable.
 */

export const ParagraphBlock = ({ content, onChange, workspace, onPageClick }: ParagraphBlockProps) => {
  const [mentionState, setMentionState] = useState({
    isOpen: false,
    searchTerm: "",
    startPosition: 0,
    pages: [],
    menuPosition: { top: 0, left: 0 },
  });
  const inputRef = useRef(null);
  const [pages, setPages] = useState([]);

  useEffect(() => {
    // Fetch pages when component mounts
    const fetchPages = async () => {
      try {
        const pageList = await FileService.listPages(workspace);
        setPages(pageList.map((page: any) => page.name));
      } catch (error) {
        console.error("Error fetching pages:", error);
      }
    };

    if (workspace) {
      fetchPages();
    }
  }, [workspace]);

  const handleKeyDown = (e: any) => {
    if (e.key === "@") {
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();

      setMentionState({
        isOpen: true,
        searchTerm: "",
        startPosition: e.target.selectionStart + 1,
        pages,
        menuPosition: {
          top: rect.top - inputRef.current.getBoundingClientRect().top,
          left: rect.left - inputRef.current.getBoundingClientRect().left,
        },
      });
    }
  };

  const handleInput = (e: any) => {
    const newContent = e.target.value;
    onChange(newContent);

    if (mentionState.isOpen) {
      const currentPosition = e.target.selectionStart;
      const searchText = newContent.slice(mentionState.startPosition, currentPosition);

      if (searchText.includes(" ") || currentPosition < mentionState.startPosition) {
        setMentionState((prev) => ({ ...prev, isOpen: false }));
      } else {
        setMentionState((prev) => ({ ...prev, searchTerm: searchText }));
      }
    }
  };

  const handlePageSelect = (pagePath: string) => {
    const before = content.slice(0, mentionState.startPosition - 1);
    const after = content.slice(inputRef.current.selectionStart);
    const pageLink = `[[${pagePath}]]`;

    onChange(before + pageLink + after);
    setMentionState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleClick = (e: any) => {
    const text = e.target?.value.toString();
    const clickPosition = e.target?.selectionStart;

    // Find any page links around the click position
    const linkRegex = /\[\[(.*?)\]\]/g;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      const startIndex = match.index;
      const endIndex = startIndex + match[0].length;

      if (clickPosition >= startIndex && clickPosition <= endIndex) {
        const pagePath = match[1];
        onPageClick(pagePath);
        break;
      }
    }
  };

  return (
    <div className="relative">
      <Textarea
        className="w-full bg-transparent focus:ring-offset-2 focus:outline-4 outline-offset-2	rounded"
        placeholder="Type something..."
        value={content}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
      />

      <PageMentionMenu
        isOpen={mentionState.isOpen}
        searchTerm={mentionState.searchTerm}
        onSelect={handlePageSelect}
        onClose={() => setMentionState((prev) => ({ ...prev, isOpen: false }))}
        position={mentionState.menuPosition}
        pages={mentionState.pages}
      />
    </div>
  );
};

export default ParagraphBlock;
