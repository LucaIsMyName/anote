import React, { useState, useEffect, useRef } from "react";
import Textarea from "./Textarea.tsx";
import { FileService } from "../../../services/FileService.ts";

interface SwitchableEditorProps {
  content: string;
  onChange: (content: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;  // Add this
  className?: string;
  placeholder?: string;
}

const SwitchableEditor: React.FC<SwitchableEditorProps> = ({ 
  content, 
  onChange, 
  onKeyDown,
  className = "", 
  placeholder = "Start typing..." 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [markdownContent, setMarkdownContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorPositionRef = useRef<{start: number; end: number} | null>(null);
  const isInitialMount = useRef(true);

  // Only transform content from HTML to Markdown on initial load or when content prop changes externally
  useEffect(() => {
    if (isInitialMount.current || !isEditing) {
      if (content.includes("<") && content.includes(">")) {
        const markdown = FileService.transformInlineHtmlToMarkdown(content);
        setMarkdownContent(markdown);
      } else {
        setMarkdownContent(content);
      }
    }
    isInitialMount.current = false;
  }, [content, isEditing]);

  const handleViewClick = () => {
    setIsEditing(true);
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        if (cursorPositionRef.current) {
          const { start, end } = cursorPositionRef.current;
          textareaRef.current.setSelectionRange(start, end);
        } else {
          const length = textareaRef.current.value.length;
          textareaRef.current.setSelectionRange(length, length);
        }
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent the default newline
      onKeyDown?.(e); // Call the parent's onKeyDown handler
    } else {
      onKeyDown?.(e); // For other keys, just pass through
    }
  };

  const handleBlur = () => {
    if (textareaRef.current) {
      cursorPositionRef.current = {
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd
      };
    }
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMarkdown = e.target.value;
    const element = e.target;
    
    // Store cursor position before any updates
    cursorPositionRef.current = {
      start: element.selectionStart,
      end: element.selectionEnd
    };

    // Update markdown content directly
    setMarkdownContent(newMarkdown);

    // Convert to HTML and trigger parent onChange
    const htmlContent = FileService.transformInlineMarkdownToHtml(newMarkdown);
    onChange(htmlContent);

    // Schedule cursor position restoration
    requestAnimationFrame(() => {
      if (textareaRef.current && cursorPositionRef.current) {
        const { start, end } = cursorPositionRef.current;
        textareaRef.current.setSelectionRange(start, end);
      }
    });
  };

  if (isEditing) {
    return (
      <Textarea
      ref={textareaRef}
      value={markdownContent}
      onChange={handleChange}
      onKeyDown={handleKeyDown}  // Use our new handler
      onBlur={handleBlur}
      className={`${className} whitespace-pre-wrap`}
      placeholder={placeholder}
      
    />
    );
  }

  const displayHtml = FileService.transformInlineMarkdownToHtml(markdownContent);

  return (
    <div 
      onClick={handleViewClick}
      className={`${className} cursor-text`}
    >
      {markdownContent ? (
        <div 
          dangerouslySetInnerHTML={{ __html: displayHtml }}
          className={className}
          style={{ 
            whiteSpace: 'pre-wrap',
            fontSize: 'inherit',
            fontWeight: 'inherit',
            fontFamily: 'inherit',
            lineHeight: 'inherit',
            padding: "0"
          }}
        />
      ) : (
        <span className="text-gray-400">{placeholder}</span>
      )}
    </div>
  );
};

export default SwitchableEditor;