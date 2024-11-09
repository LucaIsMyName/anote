import React, { useRef, useEffect, useState } from "react";
import { Link, Hash, Cuboid, NotepadText, RefreshCcw, ExternalLink, AlertTriangle, FileIcon } from "lucide-react";
import { FileService } from "../../../services/FileService.ts";
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

export interface BlockReference {
  id: string;
  type: string;
  content?: string;
  pageId: string;
  pagePath: string;
  pageTitle: string;
  createdAt: string;
  lastEdited: string;
}

interface ReferenceBlockProps {
  referenceId?: string;
  workspace: string;
  onNavigate: (pagePath: string) => void;
  onChange: (referenceId: string) => void;
}

const ReferenceBlock: React.FC<ReferenceBlockProps> = ({ referenceId, workspace, onNavigate, onChange }) => {
  const [isSearching, setIsSearching] = useState(!referenceId);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<BlockReference[]>([]);
  const [selectedReference, setSelectedReference] = useState<BlockReference | null>(null);
  const [isReferenceValid, setIsReferenceValid] = useState(true);
  const searchDebounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (referenceId) {
      loadReference();
    }
  }, [referenceId]);

  // In ReferenceBlock.tsx
  const loadReference = async () => {
    try {
      if (!referenceId) {
        setSelectedReference(null);
        setIsReferenceValid(false);
        return;
      }

      const reference = await FileService.getBlockReference(workspace, referenceId);
      if (!reference) {
        setSelectedReference(null);
        setIsReferenceValid(false);
        return;
      }

      setSelectedReference(reference);
      setIsReferenceValid(true);
    } catch (error) {
      console.error("Error loading reference:", error);
      setSelectedReference(null);
      setIsReferenceValid(false);
    }
  };

  useEffect(() => {
    if (!workspace) return;

    // Clear state when referenceId is removed/changed
    if (!referenceId) {
      setSelectedReference(null);
      setIsReferenceValid(false);
      setIsSearching(true); // Auto-open search when reference is invalid
      return;
    }

    loadReference();
  }, [referenceId, workspace]);

  const handleNavigate = () => {
    // First navigate to the page
    onNavigate(selectedReference?.pagePath || "");

    // Then scroll to the block after a small delay to ensure the page has loaded
    setTimeout(() => {
      const blockElement = document.getElementById(`${selectedReference?.id}`);
      if (blockElement) {
        blockElement.scrollIntoView({ behavior: "smooth" });
        // Optional: Add highlight effect
        blockElement.classList.add("highlight-referenced-block");
        setTimeout(() => {
          blockElement.classList.remove("highlight-referenced-block");
        }, 2000);
      }
    }, 100);
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);

    // Clear existing timeout
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    // Debounce search
    searchDebounceRef.current = setTimeout(async () => {
      if (term.trim().length > 2) {
        try {
          const results = await FileService.searchBlocks(workspace, term);
          setSearchResults(results);
        } catch (error) {
          console.error("Error searching blocks:", error);
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);
  };

  const handleSelectReference = (reference: BlockReference) => {
    setSelectedReference(reference);
    setIsSearching(false);
    onChange(reference.id);
  };

  const styles = `
  .highlight-referenced-block {
    animation: highlight-pulse 2s ease-in-out;
  }

  @keyframes highlight-pulse {
    0% { background-color: transparent; }
    25% { background-color: rgba(2, 132, 199, 0.12); }
    75% { background-color: rgba(2, 132, 199, 0.12); }
    100% { background-color: transparent; }
  }
`;

  // Add the styles to the document
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  const renderSearchResults = () => (
    <div className="mt-2 space-y-2 max-w-3xl">
      {searchResults.length === 0 && searchTerm.length > 2 && <div className="p-4 text-sm text-gray-500 bg-gray-50 rounded">No blocks found matching your search.</div>}
      {searchResults.map((result) => (
        <div
          key={result.id}
          onClick={() => handleSelectReference(result)}
          className="p-3 hover:bg-gray-50 rounded cursor-pointer border border-gray-200">
          <section className="flex gap-4">
            <div className="flex flex-1 gap-3 items-center justify-between">
              <div className="flex gap-3 flex-1 items-center">
                <NotepadText className="size-4 text-gray-500" />
                <div className="text-sm truncate font-medium text-gray-900">{cleanContent(result.pagePath)}</div>
                <div className="text-[10px] flex-1 text-gray-500">{new Date(result.lastEdited).toLocaleDateString()}</div>
              </div>
            </div>
            <div className="text-sm text-gray-600 flex items-center gap-3">
              <Cuboid className="size-4 text-gray-500" /> {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
            </div>
          </section>
          {result.type !== "file" ? <div className="text-sm text-gray-600 mt-3">{cleanContent(result.content)}</div> : ""}
        </div>
      ))}
    </div>
  );

  // In ReferenceBlock.tsx
  const renderReference = () => {
    if (!isReferenceValid || !selectedReference) {
      return (
        <div className="p-4 border-2 border-yellow-300 bg-yellow-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <p className="text-sm text-yellow-700">{!isReferenceValid ? "This reference is no longer valid." : "No reference selected."}</p>
            </div>
            <button
              onClick={() => setIsSearching(true)}
              className="px-3 py-1 text-sm bg-white border-2 border-yellow-400 rounded hover:bg-yellow-50">
              {!isReferenceValid ? "Select New Reference" : "Select Reference"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={`border-2 border-gray-100 rounded-lg p-4 max-w-3xl`}>
        <div className="prose prose-sm max-w-none mb-4">{renderReferencedBlock(selectedReference)}</div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t-2 border-gray-100 text-xs">
          <div className="flex items-center gap-2 truncate">
            <Link className="w-4 h-4 text-gray-400" />
            <span className="text-sm leading-3 truncate text-gray-400">{selectedReference.pageTitle}</span>
            <Hash className="w-4 h-4 text-gray-400" />
            <span className="text-sm leading-3	truncate text-gray-400">{selectedReference.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearching(true)}
              className="p-1 text-sm text-gray-600 hover:bg-gray-100 rounded">
              <RefreshCcw className="size-4 text-gray-400" />
            </button>
            <button
              onClick={handleNavigate}
              className="p-1 hover:bg-gray-100 rounded">
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const cleanContent = (content: string) => {
    if (!content) return "";
    return content
      .replace(/<[^>]+>/g, "") // Remove HTML tags
      .replace(/&nbsp;/g, " ") // Replace &nbsp; with space
      .replace(/&amp;/g, "&") // Replace &amp; with &
      .replace(/&lt;/g, "<") // Replace &lt; with
      .replace(/&gt;/g, ">"); // Replace &gt; with >
  };

  const renderReferencedBlock = (reference: BlockReference) => {
    switch (reference.type) {
      case "heading":
        return <div className={`font-bold ${reference.level === 1 ? "text-2xl" : reference.level === 2 ? "text-xl" : reference.level === 3 ? "text-lg" : "text-base"}`}>{cleanContent(reference.content)}</div>;

      case "paragraph":
        return <div className="text-gray-700">{cleanContent(reference.content)}</div>;
        case "quote":
          return <div className="text-gray-700 pl-2 border-l-2 text-md"><i>{cleanContent(reference.content.replace('>', ''))}</i></div>;
        case "code":
        return (
          <pre className="border-2 border-gray-100 bg-gray-50 text-black p-3 rounded">
            <code>{reference.content}</code>
          </pre>
        );

      case "list":
        const items = reference.items || [];
        const listType = reference.listType || "unordered";

        if (listType === "todo") {
          return (
            <ul className="space-y-1">
              {items.map((item, i) => (
                <li
                  key={i}
                  className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    readOnly
                    disabled
                    className="rounded accent-sky-400"
                  />
                  <span className="text-gray-700">{item.text}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <ul
            className={listType === "ordered" ? "list-decimal" : "list-disc"}
            style={{ paddingLeft: "1.5rem" }}>
            {items.map((item, i) => (
              <li
                key={i}
                className="text-gray-700">
                {item.text}
              </li>
            ))}
          </ul>
        );

      case "table":
        const tableData = reference.content || [];
        if (tableData.length === 0) return null;

        return (
          <div className="overflow-x-auto border-2 rounded">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody>{tableData}</tbody>
            </table>
          </div>
        );

      case "image":
        return (
          <div className="p-3 bg-gray-50 truncate rounded border-2 border-gray-200 text-sm text-gray-500">
            {reference.pagePath}/#{reference.id}
          </div>
        );
      case "file":
        return (
          <div className="p-3 bg-gray-50 truncate rounded border-2 border-gray-200 text-sm text-gray-500">
            {reference.pagePath}/#{reference.id}
          </div>
        );
      default:
        return (
          <div className="p-3 bg-gray-50 truncate rounded border-2 border-gray-200 text-sm text-gray-500">
            {reference.pagePath}/#{reference.id}
          </div>
        );
    }
  };

  if (isSearching) {
    return (
      <div className="space-y-2">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search for a block to reference..."
          className="w-full p-2 pb-1 max-w-3xl pt-2 border border-gray-300 rounded focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
        {renderSearchResults()}
      </div>
    );
  }

  return renderReference();
};

export default ReferenceBlock;
