import React, { useState, useEffect, useRef } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism.css";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-json";
import "prismjs/components/prism-yaml";
// import "prismjs/components/prism-php";
import { Copy, Check, ToggleLeft } from "lucide-react";
import Tooltip from "../utils/Tooltip.tsx";

export interface CodeBlockProps {
  content?: string;
  onChange: (updates: { content: string; language: string; isMultiline: boolean }) => void;
  language?: string;
  isMultiline?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ content = "", onChange, language: initialLanguage = "javascript", isMultiline: initialIsMultiline = true }) => {
  const [language, setLanguage] = useState(initialLanguage);
  const [isMultiline, setIsMultiline] = useState(initialIsMultiline);
  const [isEditing, setIsEditing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const selectionRef = useRef<{ start: number; end: number } | null>(null);
  const cursorPositionRef = useRef<number | null>(null);

  const supportedLanguages = [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "c", label: "C" },
    { value: "cpp", label: "C++" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
    { value: "bash", label: "Bash" },
    { value: "sql", label: "SQL" },
    { value: "json", label: "JSON" },
    { value: "yaml", label: "YAML" },
  ];

  useEffect(() => {
    if (codeRef.current && !isEditing) {
      Prism.highlightElement(codeRef.current);
    }
  }, [content, language, isEditing]);

  const saveCaretPosition = (element: HTMLElement) => {
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    if (range) {
      cursorPositionRef.current = range.startOffset;
    }
  };

  const restoreCaretPosition = (element: HTMLElement) => {
    if (cursorPositionRef.current !== null && isEditing) {
      const selection = window.getSelection();
      const range = document.createRange();

      // Get the text node (first child of the code element)
      const textNode = element.firstChild || element.appendChild(document.createTextNode(""));

      // Set cursor position
      const pos = Math.min(cursorPositionRef.current, textNode.textContent?.length || 0);
      range.setStart(textNode, pos);
      range.setEnd(textNode, pos);

      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  };

  const handleContentChange = (newContent: string) => {
    if (codeRef.current) {
      saveCaretPosition(codeRef.current);
    }

    onChange({
      content: newContent,
      language,
      isMultiline,
    });

    // Restore cursor position after React re-renders
    requestAnimationFrame(() => {
      if (codeRef.current) {
        restoreCaretPosition(codeRef.current);
      }
    });
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    onChange({
      content,
      language: newLanguage,
      isMultiline,
    });
    setIsLanguageMenuOpen(false);
  };

  const toggleMultiline = () => {
    const newIsMultiline = !isMultiline;
    setIsMultiline(newIsMultiline);
    onChange({
      content,
      language,
      isMultiline: newIsMultiline,
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isMultiline) {
      e.preventDefault();
      setIsEditing(false);
    } else if (e.key === "Escape") {
      setIsEditing(false);
    } else if (e.key === "Tab") {
      e.preventDefault();
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);

      if (range) {
        const spaces = document.createTextNode("  ");
        range.insertNode(spaces);
        range.setStartAfter(spaces);
        range.setEndAfter(spaces);
        selection?.removeAllRanges();
        selection?.addRange(range);

        // Trigger content update
        if (codeRef.current) {
          handleContentChange(codeRef.current.textContent || "");
        }
      }
    }
  };

  const restoreSelection = (element: HTMLElement) => {
    if (selectionRef.current) {
      element.selectionStart = selectionRef.current.start;
      element.selectionEnd = selectionRef.current.end;
    }
  };

  const sharedStyles = {
    fontSize: "0.875rem", // text-sm
    lineHeight: "1.5",
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    whiteSpace: "pre" as const,
    padding: "1rem",
    margin: "0",
    minHeight: isMultiline ? "5rem" : "2.5rem",
    wordWrap: "break-word" as const,
    overflowWrap: "break-word" as const,
    display: "block",
  };

  const styles = `
  .editing {
    -webkit-user-modify: read-write-plaintext-only;
    -moz-user-modify: read-write-plaintext-only;
    user-modify: read-write-plaintext-only;
  }
`;

  // Add the styles to the document
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  return (
    <div className="relative group rounded-lg  max-w-3xl max-w-3xl border-2 border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Tooltip
            content={
              <div className="w-48 bg-white rounded-lg py-2 max-h-64 overflow-y-auto">
                {supportedLanguages.map(({ value, label }) => (
                  <button
                    key={value}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${language === value ? "bg-gray-100" : ""}`}
                    onClick={() => handleLanguageChange(value)}>
                    {label}
                  </button>
                ))}
              </div>
            }
            visible={isLanguageMenuOpen}
            onClickOutside={() => setIsLanguageMenuOpen(false)}
            interactive={true}
            trigger="click"
            theme="light"
            placement="bottom-start"
            arrow={false}>
            <button
              onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
              className="px-3 py-1 min-w-32 text-left text-sm text-gray-600 hover:bg-gray-100 rounded">
              {supportedLanguages.find((lang) => lang.value === language)?.label || language}
            </button>
          </Tooltip>
          <div className="text-md h-[1.5em] w-[1.5px] bg-gray-200"></div>
          <button
            onClick={toggleMultiline}
            className="hidden lg:flex px-3 py-1 text-sm text-left gap-2 justify-between items-center min-w-32 text-gray-600 hover:bg-gray-100 rounded">
            {isMultiline ? "Multiline" : "Single line"}
            <ToggleLeft className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={copyToClipboard}
          className="p-1 px-3 hover:bg-gray-100 rounded text-gray-500 flex items-center justify-end gap-2 space-x-1">
          <span className="hidden lg:inline text-sm">{isCopied ? "Copied!" : "Copy"}</span>
          {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      <div className="relative">
        <pre
          ref={preRef}
          className="overflow-x-auto"
          onClick={() => !isEditing && setIsEditing(true)}
          style={sharedStyles}>
          <code
            ref={codeRef}
            className={`language-${language} ${isEditing ? "editing" : ""}`}
            contentEditable={isEditing}
            onBlur={(e) => {
              handleContentChange(e.currentTarget.textContent || "");
              setIsEditing(false);
            }}
            onKeyDown={handleKeyDown}
            onInput={(e) => {
              const newContent = e.currentTarget.textContent || "";
              handleContentChange(newContent);
            }}
            onPaste={(e) => {
              e.preventDefault();
              const text = e.clipboardData.getData("text/plain");
              document.execCommand("insertText", false, text);
            }}
            suppressContentEditableWarning={true}
            style={{
              ...sharedStyles,
              outline: "none",
              caretColor: isEditing ? "auto" : "transparent",
            }}>
            {content || " "}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;
