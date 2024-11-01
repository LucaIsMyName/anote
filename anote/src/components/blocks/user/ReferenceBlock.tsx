import React, { useRef, useEffect, useState } from "react";
import { Link, ExternalLink, AlertTriangle } from "lucide-react";
import { FileService } from "../../../services/FileService.ts";

interface BlockReference {
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

const ReferenceBlock: React.FC<ReferenceBlockProps> = ({
  referenceId,
  workspace,
  onNavigate,
  onChange,
}) => {
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

  const loadReference = async () => {
    try {
      const reference = await FileService.getBlockReference(workspace, referenceId);
      setSelectedReference(reference);
      setIsReferenceValid(true);
    } catch (error) {
      console.error("Error loading reference:", error);
      setIsReferenceValid(false);
    }
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

  const renderSearchResults = () => (
    <div className="mt-2 space-y-2">
      {searchResults.map((result) => (
        <div
          key={result.id}
          onClick={() => handleSelectReference(result)}
          className="p-2 hover:bg-gray-50 rounded cursor-pointer border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">{result.pageTitle}</div>
            <div className="text-xs text-gray-500">
              {new Date(result.lastEdited).toLocaleDateString()}
            </div>
          </div>
          <div className="text-sm text-gray-600 truncate">{result.content}</div>
        </div>
      ))}
    </div>
  );

  const renderReference = () => {
    if (!isReferenceValid) {
      return (
        <div className="p-4 border border-yellow-200 bg-yellow-50 rounded flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <div>
            <p className="text-sm text-yellow-700">This reference is no longer valid.</p>
            <button
              onClick={() => setIsSearching(true)}
              className="text-sm text-yellow-600 underline"
            >
              Select a new reference
            </button>
          </div>
        </div>
      );
    }

    if (!selectedReference) return null;

    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Link className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">
              Referenced from: {selectedReference.pageTitle}
            </span>
          </div>
          <button
            onClick={() => onNavigate(selectedReference.pagePath)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        
        <div className="prose prose-sm max-w-none">
          {/* Render the referenced block based on its type */}
          {renderReferencedBlock(selectedReference)}
        </div>
      </div>
    );
  };

  const renderReferencedBlock = (reference: BlockReference) => {
    // This would render a read-only version of the block based on its type
    // You'll need to implement this based on your block rendering logic
    return <div>{reference.content}</div>;
  };

  if (isSearching) {
    return (
      <div className="space-y-2">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search for a block to reference..."
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
        {renderSearchResults()}
      </div>
    );
  }

  return renderReference();
};

export default ReferenceBlock;