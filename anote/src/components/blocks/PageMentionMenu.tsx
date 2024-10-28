import React, { useState, useEffect, useRef } from "react";
import { FileText } from "lucide-react";

export interface PageMentionMenuProps {
  isOpen: boolean;
  searchTerm: string;
  onSelect: (page: string) => void;
  onClose: () => void;
  position: { top: number; left: number };
  pages: string[];
}

/**
 * @description A menu component that displays a list of pages
 * for users to select when mentioning a page in a block.
 */


const PageMentionMenu = ({ isOpen, searchTerm, onSelect, onClose, position, pages }: PageMentionMenuProps) => {
  const menuRef = useRef(null);
  const [filteredPages, setFilteredPages] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (searchTerm) {
      const filtered = pages.filter((page) => page.toLowerCase().includes(searchTerm.toLowerCase()));
      setFilteredPages(filtered);
      setSelectedIndex(0);
    } else {
      setFilteredPages(pages);
    }
  }, [searchTerm, pages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredPages.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredPages[selectedIndex]) {
          onSelect(filteredPages[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        onClose();
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-64 bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-y-auto"
      style={{
        top: position.top + 24,
        left: position.left,
      }}
      onKeyDown={handleKeyDown}>
      {filteredPages.length > 0 ? (
        <div className="py-1">
          {filteredPages.map((page, index) => (
            <button
              key={page}
              className={`w-full px-4 py-2 flex items-center space-x-2 text-left hover:bg-gray-100 ${index === selectedIndex ? "bg-gray-100" : ""}`}
              onClick={() => onSelect(page)}
              onMouseEnter={() => setSelectedIndex(index)}>
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="flex-1 truncate">{page}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="px-4 py-2 text-sm text-gray-500">No pages found</div>
      )}
    </div>
  );
};

export default PageMentionMenu;
