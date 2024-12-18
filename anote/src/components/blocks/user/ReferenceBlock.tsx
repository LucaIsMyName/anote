import React, { useRef, useEffect, useState, Suspense } from "react";
import { Link, Link2, Loader2, ImageIcon, Hash, Cuboid, NotepadText, RefreshCcw, ExternalLink, AlertTriangle, FileIcon } from "lucide-react";
import { FileService } from "../../../services/FileService.ts";
import Skeleton from "../utils/Skeleton.tsx";
import LoadingDots from "../utils/LoadingDots.tsx";
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

  // List properties
  items?: Array<{
    id: number;
    text: string;
    completed?: boolean;
  }>;
  listType?: "unordered" | "ordered" | "todo";

  // Heading property
  level?: number;

  // Table property
  data?: Array<Array<string>>;

  // Image and File properties
  src?: string;
  caption?: string;

  // Frame properties
  aspect?: string;
  isFullWidth?: boolean;
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
  const [searchResults, setSearchResults] = useState([]);
  const [selectedReference, setSelectedReference] = useState(null);
  const [isReferenceValid, setIsReferenceValid] = useState(true);
  const [isLoading, setIsLoading] = useState(!!referenceId);
  const searchDebounceRef = useRef();

  useEffect(() => {
    if (referenceId) {
      loadReference();
    } else {
      setIsLoading(false);
    }
  }, [referenceId]);

  // In ReferenceBlock.tsx
  const loadReference = async () => {
    try {
      setIsLoading(true);

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
    } finally {
      setIsLoading(false);
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
    <Suspense fallback={<Skeleton />}>
      <div className="mt-2 space-y-2 max-w-3xl">
        {searchResults.length === 0 && searchTerm.length > 2 && <div className="p-4 text-sm text-gray-500 bg-gray-50 rounded">No blocks found matching your search.</div>}
        {searchResults.map((result) => (
          <div
            key={result.id}
            onClick={() => handleSelectReference(result)}
            className="p-3 bg-gray-50 rounded cursor-pointer border-2 border-gray-200 hover:bg-sky-400 transition-colors hover:border-sky-700 hover:text-white">
            <section className="flex gap-4">
              <div className="flex flex-1 gap-3 items-center justify-between">
                <div className="flex gap-3 flex-1 items-center">
                  <NotepadText className="size-4 " />
                  <div className="text-sm truncate font-medium ">{cleanContent(result.pagePath)}</div>
                  <div className="text-[10px] flex-1 ">{new Date(result.lastEdited).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="text-sm flex items-center gap-3">
                <Cuboid className="size-4 " /> {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
              </div>
            </section>
            {result.type !== "file" ? <div className="text-sm mt-3">{cleanContent(result.content)}</div> : ""}
          </div>
        ))}
      </div>
    </Suspense>
  );

  // In ReferenceBlock.tsx
  const renderReference = () => {
    // Loading state
    if (isLoading) {
      return (
        <div className="border-2 border-dotted border-gray-200 bg-gray-50 rounded-lg p-4 max-w-3xl">
          <div className="flex space-x-2">
            <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
            <span className="text-sm text-gray-400">Loading reference <LoadingDots /></span>
          </div>
        </div>
      );
    }

    // Invalid reference state
    if (!isReferenceValid || !selectedReference) {
      return (
        <div className="p-4 border-2 border-dotted border-yellow-300 bg-yellow-50 rounded-lg max-w-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <p className="text-sm text-yellow-700">
                {!isReferenceValid ? "This reference is no longer valid." : "No reference selected."}
              </p>
            </div>
            <button
              onClick={() => setIsSearching(true)}
              className="px-3 py-1 text-sm bg-white border-2 border-yellow-400 rounded hover:bg-yellow-50"
            >
              {!isReferenceValid ? "Select New Reference" : "Select Reference"}
            </button>
          </div>
        </div>
      );
    }

    // Valid reference display
    return (
      <div className="border-2 border-dotted border-gray-100 rounded-lg p-4 max-w-3xl">
        <div className="prose prose-sm max-w-none mb-4">
          {renderReferencedBlock(selectedReference)}
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t-2 border-gray-100 text-xs">
          <div className="flex items-center gap-2 truncate">
            <Link className="w-4 h-4 text-gray-400" />
            <span className="text-sm leading-3 truncate text-gray-400">
              {selectedReference.pageTitle}
            </span>
            <Hash className="w-4 h-4 text-gray-400" />
            <span className="text-sm leading-3 truncate text-gray-400">
              {selectedReference.id}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearching(true)}
              className="p-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              <RefreshCcw className="size-4 text-gray-400" />
            </button>
            <button
              onClick={handleNavigate}
              className="p-1 hover:bg-gray-100 rounded"
            >
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

  // Inside ReferenceBlock.tsx, update the renderReferencedBlock function

  const renderReferencedBlock = (reference: BlockReference) => {
    switch (reference.type) {
      case "heading":
              
              return <div className={`font-bold ${reference.level === 1 ? "text-2xl" : reference.level === 2 ? "text-xl" : reference.level === 3 ? "text-lg" : "text-base"}`}>{cleanContent(reference.content)}</div>;

      case "paragraph":
        return <div className="text-gray-700 text-xs md:text-base">{cleanContent(FileService.transformInlineMarkdownToHtml(reference.content))}</div>;

      case "quote":
        return (
          <div className="text-gray-700 pl-2 border-l-2 text-sm md:text-lg">
            <i>{reference.content.replace(">", "")}</i>
          </div>
        );

      case "code":
        return (
          <pre className="border-2 border-gray-100 bg-gray-50 text-black p-3 rounded">
            <code>{reference.content}</code>
          </pre>
        );

      case "list": {
        // Check for both items and content as items may come in different formats
        const listItems = reference.items || [];

        if (listItems.length === 0) {
          return <div className="text-gray-500 text-sm">List reference not available</div>;
        }

        return (
          <div className="pl-4">
            {reference.listType === "todo" ? (
              <ul className="space-y-1">
                {listItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      readOnly
                      disabled
                      className="rounded accent-sky-400"
                    />
                    <span className={`text-gray-700 ${item.completed ? "line-through" : ""}`}>{item.text}</span>
                  </li>
                ))}
              </ul>
            ) : reference.listType === "ordered" ? (
              <ol className="list-decimal list-inside">
                {listItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="text-gray-700">
                    {item.text}
                  </li>
                ))}
              </ol>
            ) : (
              <ul className="list-disc list-inside">
                {listItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="text-gray-700">
                    {item.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      }

      /** NOT WORKING */
      case "table": {
        // Check for both data and content as table data may come in different formats
        const tableData = reference.data || [];
        console.log("tableData", reference);
        if (tableData.length === 0) {
          return <div className="text-gray-500 text-sm">Table reference not available</div>;
        }

        return (
          <div className="overflow-x-auto border rounded">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="divide-y divide-gray-200 text-sm">
                {tableData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={rowIndex === 0 ? "bg-gray-50" : ""}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className={`px-3 py-2 ${rowIndex === 0 ? "font-medium text-gray-700" : "text-gray-500"}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      /** NOT WORKING */
      case "reference": {
        return (
          <div className="border-l-4 border-sky-400 bg-sky-50 p-4 rounded-r-lg">
            <div className="flex items-center gap-2 text-sky-600 text-sm mb-2">
              <Hash className="w-4 h-4" />
              <span className="font-medium">Referenced Block</span>
            </div>
            <div className="pl-2">{reference.content ? <div className="text-gray-600">{reference.content}</div> : <div className="text-gray-500 text-sm italic">Reference content not available</div>}</div>
            <div className="mt-2 text-xs text-gray-400 flex items-center gap-2">
              <Link className="w-3 h-3" />
              <span>{reference.pageTitle || "Unknown page"}</span>
            </div>
          </div>
        );
      }
      /** NOT WORKING */
      case "image": {
        // For image blocks, check both src directly and potentially nested data
        const imageSource = reference.src || reference.content;
        console.log("imageSource", reference);
        return (
          <div className="space-y-2 border rounded-lg overflow-hidden bg-gray-50">
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
              {imageSource ? (
                <img
                  src={imageSource}
                  alt={reference.caption || "Referenced image"}
                  className="max-h-full rounded object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-sm">Image reference not available</span>
                </div>
              )}
            </div>
            {reference.caption && <div className="px-3 py-2 text-sm text-gray-500 border-t">{reference.caption}</div>}
          </div>
        );
      }
      /** NOT WORKING */
      case "file":
        return (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border-2">
            <FileIcon className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-700">{reference.caption || "Attached file"}</div>
              <div className="text-xs text-gray-500 truncate">{reference.src || "File reference"}</div>
            </div>
          </div>
        );
      /** NOT WORKING */
      case "frame":
        return (
          <div className="border-2 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Link2 className="w-4 h-4" />
              <span className="truncate">{reference.src}</span>
            </div>
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
          className="w-full p-2 pb-1 max-w-3xl pt-2 border-2 border-dotted border-gray-300 rounded"
        />
        {renderSearchResults()}
      </div>
    );
  }

  return renderReference();
};

export default ReferenceBlock;
