import React, { memo } from "react";
import { ChevronRight } from "lucide-react";

interface TableOfContentsProps {
  blocks: Array<any>;
  onHeadingClick: (blockId: number) => void;
}

const TableOfContents = memo(({ blocks, onHeadingClick }: TableOfContentsProps) => {
  // Filter and transform heading blocks

  const stripHtml = (html: string): string => {
    if (!html) return '';
    
    // First decode HTML entities
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    const decodedHtml = txt.value;
    
    // Then remove HTML tags
    return decodedHtml.replace(/<[^>]+>/g, '');
  };

  const headings = blocks
    .filter((block) => block.type === "heading")
    .map((block) => ({
      id: block.id,
      content: stripHtml(block.content), // Clean the content here
      level: block.level || 2,
    }));

  if (headings.length === 0) {
    return null;
  }

  const getIndentClass = (level: number) => {
    switch (level) {
      case 1:
        return "ml-0";
      case 2:
        return "ml-3";
      case 3:
        return "ml-6";
      case 4:
        return "ml-9";
      case 5:
        return "ml-12";
      case 6:
        return "ml-16";
      default:
        return "ml-3";
    }
  };

  return (
    <details
      open
      className="lg:sticky top-8 bg-white/50 backdrop-blur-sm border-gray-200 mb-8 lg:max-h-[calc(100vh-2rem)] overflow-y-auto pt-0 pb-8 border-b-2 lg:border-b-0">
      <summary className="text-md font-semibold text-gray-500">Table of Contents</summary>
      <ul className="space-y-2 mt-3">
        {headings.map((heading) => (
          <li
            key={heading.id}
            className={`${getIndentClass(heading.level)} group transition-colors`}>
            <a
              href={`#${heading.id}`}
              className="flex items-center text-gray-600 hover:text-sky-600 text-sm py-1 w-full">
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="truncate">{heading.content || "Untitled"}</span>
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
});

TableOfContents.displayName = "TableOfContents";

export default TableOfContents;
