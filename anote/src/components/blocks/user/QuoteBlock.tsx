import React, { useEffect, useRef, useState, memo } from "react";
import { Navigate } from "react-router-dom";
import PageMentionMenu from "../PageMentionMenu.tsx";
import SwitchableEditor from "../utils/SwitchableEditor.tsx";
import { FileService } from "../../../services/FileService.ts";

export interface QuoteBlockProps {
  content: string;
  onChange: (content: string) => void;
  workspace: string;
  onPageClick: (pagePath: string) => void;
  onEnterKey?: () => void;
}

export const QuoteBlock = ({ content, onChange, workspace, onPageClick, onEnterKey }: QuoteBlockProps) => {
  const [mentionState, setMentionState] = useState({
    isOpen: false,
    searchTerm: "",
    startPosition: 0,
    pages: [],
    menuPosition: { top: 0, left: 0 },
  });
  const inputRef = useRef(null);
  const [pages, setPages] = useState([]);
  const [localContent, setLocalContent] = useState("");

  useEffect(() => {
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

  // Update local content when prop changes, ensuring ">" is stripped for display
  useEffect(() => {
    const markdownContent = FileService.transformInlineHtmlToMarkdown(content || "");
    // Remove any leading ">" characters and whitespace when displaying
    const cleanContent = markdownContent.replace(/^>\s*/, '');
    setLocalContent(cleanContent);
  }, [content]);

  const handleChange = (newContent: string) => {
    // Don't add ">" here - it will be added by FileService when saving
    const htmlContent = FileService.transformInlineHtmlToMarkdown(newContent);
    onChange(htmlContent);
  };

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
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onEnterKey?.();
    }
  };

  const handlePageSelect = (pageInfo: PageInfo) => {
    const before = localContent.slice(0, mentionState.startPosition - 1);
    const after = localContent.slice(inputRef.current.selectionStart);
    const pageLink = `[[${pageInfo.name}|${pageInfo.id}]]`;
    
    const newContent = before + pageLink + after;
    setLocalContent(newContent);
    onChange(newContent);
    
    setMentionState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="relative max-w-3xl pl-4 border-l-4 border-gray-300">
      <SwitchableEditor
        content={localContent}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="w-auto text-sm md:text-xl italic focus:ring-1 focus:ring-sky-400 focus:ring-offset-2 focus:outline-4 outline-offset-2 p-1 text-gray-700"
        placeholder="Type a quote..."
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

export default QuoteBlock;