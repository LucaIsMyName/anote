import React, { useState, useRef, useEffect, memo } from 'react';
import { Plus, Type, Heading1, Table, Image, ListTodo, FileText, ChevronDown } from 'lucide-react'; // Changed File to FileText
import PageMentionMenu from './PageMentionMenu';

export const BlockType = {
  PARAGRAPH: 'paragraph',
  HEADING: 'heading',
  TABLE: 'table',
  IMAGE: 'image',
  FILE: 'file',
  TODO: 'todo'
};

/**
 * 
 * @param {Function} onSelect
 * @param {React.Component} trigger 
 * @returns 
 */
export const BlockMenu = ({ onSelect, trigger = undefined }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);



  const blockTypes = [
    { type: BlockType.PARAGRAPH, icon: Type, label: 'Text' },
    { type: BlockType.HEADING, icon: Heading1, label: 'Heading' },
    { type: BlockType.TABLE, icon: Table, label: 'Table' },
    { type: BlockType.IMAGE, icon: Image, label: 'Image' },
    { type: BlockType.FILE, icon: FileText, label: 'File' }, // Using FileText instead of File
    { type: BlockType.TODO, icon: ListTodo, label: 'To-do List' }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger || (
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
          {blockTypes.map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              className="w-full px-4 py-2 flex items-center space-x-2 hover:bg-gray-100 text-left"
              onClick={() => {
                onSelect(type);
                setIsOpen(false);
              }}
            >
              <Icon className="w-4 h-4 text-gray-600" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * @param {string} content
 * @param {Function} onChange
 * @param {string} workspace
 * @param {Function} onPageClick
 * @returns
 * @description Paragraph block component that allows users to input text
 * and mention other pages using double square brackets.
 * Example: [[Page Name]]
 * When a page is mentioned, it will be highlighted and clickable.
 */
export const ParagraphBlock = memo(({ content, onChange, workspace, onPageClick }) => {
  const [mentionState, setMentionState] = useState({
    isOpen: false,
    searchTerm: '',
    startPosition: 0,
    pages: [],
    menuPosition: { top: 0, left: 0 }
  });
  const inputRef = useRef(null);
  const [pages, setPages] = useState([]);

  useEffect(() => {
    // Fetch pages when component mounts
    const fetchPages = async () => {
      try {
        const pageList = await FileService.listPages(workspace);
        setPages(pageList.map(page => page.name));
      } catch (error) {
        console.error('Error fetching pages:', error);
      }
    };

    if (workspace) {
      fetchPages();
    }
  }, [workspace]);

  const handleKeyDown = (e) => {
    if (e.key === '@') {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setMentionState({
        isOpen: true,
        searchTerm: '',
        startPosition: e.target.selectionStart + 1,
        pages,
        menuPosition: {
          top: rect.top - inputRef.current.getBoundingClientRect().top,
          left: rect.left - inputRef.current.getBoundingClientRect().left
        }
      });
    }
  };

  const handleInput = (e) => {
    const newContent = e.target.value;
    onChange(newContent);

    if (mentionState.isOpen) {
      const currentPosition = e.target.selectionStart;
      const searchText = newContent.slice(
        mentionState.startPosition,
        currentPosition
      );

      if (searchText.includes(' ') || currentPosition < mentionState.startPosition) {
        setMentionState(prev => ({ ...prev, isOpen: false }));
      } else {
        setMentionState(prev => ({ ...prev, searchTerm: searchText }));
      }
    }
  };

  const handlePageSelect = (pagePath) => {
    const before = content.slice(0, mentionState.startPosition - 1);
    const after = content.slice(inputRef.current.selectionStart);
    const pageLink = `[[${pagePath}]]`;

    onChange(before + pageLink + after);
    setMentionState(prev => ({ ...prev, isOpen: false }));
  };

  const handleClick = (e) => {
    const text = e.target.value;
    const clickPosition = e.target.selectionStart;

    // Find any page links around the click position
    const linkRegex = /\[\[(.*?)\]\]/g;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      const startIndex = match.index;
      const endIndex = startIndex + match[0].length;

      if (clickPosition >= startIndex && clickPosition <= endIndex) {
        const pagePath = match[1];
        onPageClick(pagePath);
        break;
      }
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="Type something..."
        value={content}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
      />

      <PageMentionMenu
        isOpen={mentionState.isOpen}
        searchTerm={mentionState.searchTerm}
        onSelect={handlePageSelect}
        onClose={() => setMentionState(prev => ({ ...prev, isOpen: false }))}
        position={mentionState.menuPosition}
        pages={mentionState.pages}
      />
    </div>
  );
});

/**
 * 
 * @param {string} content
 * @param {Function} onChange 
 * @returns 
 * @description Heading block component that allows users to select
 * a heading level and input heading text.
 */
export const HeadingBlock = ({ content, onChange }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [headingLevel, setHeadingLevel] = useState(2); // Default to H2
  const dropdownRef = useRef(null);

  const handleSelectLevel = (level) => {
    setHeadingLevel(level);
    setIsDropdownOpen(false);
    // Update content to include the heading level
    const newContent = `${content.replace('#', '')}`;
    onChange(newContent);
  };

  const handleContentChange = (e) => {
    const newText = e.target.value;
    onChange(`${headingLevel} ${newText}`);
  };

  return (
    <div className="flex items-center flex-row-reverse space-x-2 relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex opacity-25 hover:opacity-100 items-center space-x-1 bg-gray-100 px-3 py-1 rounded text-gray-700 hover:bg-gray-200"
      >
        <span>{`H${headingLevel}`}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isDropdownOpen && (
        <div ref={dropdownRef} className="absolute top-full right-0 mt-1 w-20 bg-white border rounded shadow-lg z-10">
          {[2, 3, 4, 5, 6].map(level => (
            <button
              key={level}
              onClick={() => handleSelectLevel(level)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              {`H${level}`}
            </button>
          ))}
        </div>
      )}

      <input
        type="text"
        value={content.replace(/^#\d\s/, '')} // Remove the level indicator from display
        onChange={handleContentChange}
        className="w-full bg-transparent text-lg font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="Heading text..."
      />
    </div>
  );
};

/**
 * 
 * @param {Array<any>} items
 * @param {Function} onChange 
 * @returns 
 * @description To-do list block
 */
export const TodoBlock = ({ items, onChange }) => {
  const addItem = () => {
    onChange([...items, { id: Date.now(), text: '', completed: false }]);
  };

  const updateItem = (id, updates) => {
    onChange(items.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  return (
    <div className="mb-4">
      {items.map(item => (
        <div key={item.id} className="flex items-center space-x-2 mb-2">
          <input
            type="checkbox"
            checked={item.completed}
            onChange={(e) => updateItem(item.id, { completed: e.target.checked })}
            className="rounded"
          />
          <input
            type="text"
            value={item.text}
            onChange={(e) => updateItem(item.id, { text: e.target.value })}
            className="flex-1 p-0 bg-transparent"
            placeholder="To-do item..."
          />
        </div>
      ))}
      <button
        onClick={addItem}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        + Add item
      </button>
    </div>
  );
};