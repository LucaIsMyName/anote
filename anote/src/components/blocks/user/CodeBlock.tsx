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
import { Copy, Check } from "lucide-react";
import Tooltip from "../utils/Tooltip.tsx";
import Textarea from "../utils/Textarea.tsx";
export interface CodeBlockProps {
  content?: string;
  onChange: (updates: { content: string; language: string; isMultiline: boolean }) => void;
  language?: string;
  isMultiline?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ content = "", onChange, language: initialLanguage = "javascript", isMultiline: initialIsMultiline = true }) => {
  const [language, setLanguage] = useState(initialLanguage);
  const [isMultiline, setIsMultiline] = useState(initialIsMultiline);
  const [localContent, setLocalContent] = useState(content);
  const [isCopied, setIsCopied] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

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
    // Highlight code whenever content or language changes
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [content, language]);

  useEffect(() => {
    // Update local content when prop changes
    setLocalContent(content);
  }, [content]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    // Send all state in the update
    onChange({
      content: newContent,
      language,
      isMultiline
    });
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    // Send all state in the update
    onChange({
      content,
      language: newLanguage,
      isMultiline
    });
    setIsLanguageMenuOpen(false);
  };

  const toggleMultiline = () => {
    const newIsMultiline = !isMultiline;
    setIsMultiline(newIsMultiline);
    // Send all state in the update
    onChange({
      content,
      language,
      isMultiline: newIsMultiline
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

  const LanguageSelector = (
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
  );

  return (
    <div className="relative group rounded-lg border border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Tooltip
            content={LanguageSelector}
            visible={isLanguageMenuOpen}
            onClickOutside={() => setIsLanguageMenuOpen(false)}
            interactive={true}
            trigger="click"
            theme="light"
            placement="bottom-start"
            arrow={false}>
            <button
              onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">
              {supportedLanguages.find((lang) => lang.value === language)?.label || language}
            </button>
          </Tooltip>
          <button
            onClick={toggleMultiline}
            className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">
            {isMultiline ? "Multiline" : "Single line"}
          </button>
        </div>
        <button
          onClick={copyToClipboard}
          className="p-2 hover:bg-gray-100 rounded text-gray-500 flex items-center space-x-1">
          {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span className="text-sm">{isCopied ? "Copied!" : "Copy"}</span>
        </button>
      </div>

      <div className="relative h-auto">
        <Textarea
          value={content}  // Use content directly from props
          onChange={handleContentChange}
          className="w-full p-4 font-mono text-sm bg-transparent absolute inset-0 resize-none outline-none"
          style={{ height: isMultiline ? "auto" : "2.5rem" }}
          rows={isMultiline ? 5 : 1}
        />
        <pre className="p-4 m-0 overflow-x-auto">
          <code ref={codeRef} className={`language-${language}`}>
            {content || " "}  {/* Use content directly from props */}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;
