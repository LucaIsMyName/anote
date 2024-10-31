import React, { useState, useEffect, useRef } from "react";
import Textarea from "./Textarea.tsx";
import { FileService } from "../../../services/FileService.ts";

interface SwitchableEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
  placeholder?: string;
}

const SwitchableEditor: React.FC<SwitchableEditorProps> = ({ 
  content, 
  onChange, 
  className = "", 
  placeholder = "Start typing..." 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [markdownContent, setMarkdownContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (content.includes("<") && content.includes(">")) {
      const markdown = FileService.transformInlineHtmlToMarkdown(content);
      setMarkdownContent(markdown);
    } else {
      setMarkdownContent(content);
    }
  }, [content]);

  const handleViewClick = () => {
    setIsEditing(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const position = textareaRef.current.value.length;
        textareaRef.current.selectionStart = position;
        textareaRef.current.selectionEnd = position;
      }
    }, 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMarkdown = e.target.value;
    setMarkdownContent(newMarkdown);
    onChange(newMarkdown);
  };

  if (isEditing) {
    return (
      <Textarea
        ref={textareaRef}
        value={markdownContent}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`${className} whitespace-pre-wrap`}
        placeholder={placeholder}
        style={{ whiteSpace: 'pre-wrap' }}
      />
    );
  }

  const displayHtml = FileService.transformInlineMarkdownToHtml(markdownContent);

  return (
    <div 
      onClick={handleViewClick}
      className={`${className} cursor-text min-h-[1.5em]`}
    >
      {markdownContent ? (
        <div 
          dangerouslySetInnerHTML={{ __html: displayHtml }}
          className={className} // Inherit parent className for styling
          style={{ 
            whiteSpace: 'pre-wrap',
            // Inherit all font properties
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