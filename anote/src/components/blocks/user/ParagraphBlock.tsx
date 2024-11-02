import React, { useEffect, useRef, useState, memo } from "react";
import { Navigate } from "react-router-dom";
import PageMentionMenu from "../PageMentionMenu.tsx";
import Input from "../utils/Input.tsx";
import SwitchableEditor from "../utils/SwitchableEditor.tsx";
import { FileService } from "../../../services/FileService.ts";

export interface ParagraphBlockProps {
  content: string;
  onChange: (content: string) => void;
  workspace: string;
  onPageClick: (pagePath: string) => void;
  onEnterKey?: () => void;
}

export const ParagraphBlock = ({ content, onChange, workspace, onPageClick, onEnterKey }: ParagraphBlockProps) => {
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

  // Update local content when prop changes, converting HTML to Markdown
  useEffect(() => {
    const markdownContent = FileService.transformInlineHtmlToMarkdown(content || "");
    setLocalContent(markdownContent);
  }, [content]);

  const handleChange = (newContent: string) => {
    // The content coming from SwitchableEditor will already be HTML
    // because SwitchableEditor handles the markdown-to-html conversion
    onChange(newContent);
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
    const pageLink = `[[${pageInfo.name}|${pageInfo.id}]]`; // Include ID in link
    
    const newContent = before + pageLink + after;
    setLocalContent(newContent);
    const htmlContent = FileService.transformInlineMarkdownToHtml(newContent);
    onChange(htmlContent);
    
    setMentionState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleClick = (e: any) => {
    const text = e.target?.value.toString();
    const clickPosition = e.target?.selectionStart;
    const linkRegex = /\[\[(.*?)\|(.*?)\]\]/g;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      const [_, name, id] = match;
      const startIndex = match.index;
      const endIndex = startIndex + match[0].length;

      if (clickPosition >= startIndex && clickPosition <= endIndex) {
        Navigate(`/page/${id}`);
        break;
      }
    }
  };

  return (
    <div className="relative">
      <SwitchableEditor
        content={localContent}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="w-full focus:ring-1 focus:ring-sky-400 focus:ring-offset-2 focus:outline-4 outline-offset-2 rounded p-1 text-gray-700"
        placeholder="Type something..."
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