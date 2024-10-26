import React, { useState, useRef, useEffect } from 'react';
import { Plus, Type, Heading1, Table, Image, ListTodo, FileText } from 'lucide-react'; // Changed File to FileText

export const BlockType = {
  PARAGRAPH: 'paragraph',
  HEADING: 'heading',
  TABLE: 'table',
  IMAGE: 'image',
  FILE: 'file',
  TODO: 'todo'
};

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

// Individual Block Components
export const ParagraphBlock = ({ content, onChange }) => (
  <div className="mb-4">
    <input
      className="w-full bg-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      placeholder="Type something..."
      value={content}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

export const HeadingBlock = ({ content, onChange }) => (
  <div className="mb-4">
    <input
      type="text"
      className="w-full p-2 text-2xl font-bold border-b border-gray-200 focus:border-blue-500 focus:ring-0"
      placeholder="Heading"
      value={content}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

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
            className="flex-1 p-2 border border-gray-200 rounded"
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