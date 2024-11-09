import React, { useState, useEffect, useRef } from "react";
import { List, X, ListOrdered, CheckSquare, ChevronDown } from "lucide-react";
import Tooltip from "../utils/Tooltip.tsx";

interface ListItem {
  id: number;
  text: string;
  completed?: boolean;
}

interface ListBlockProps {
  items: ListItem[];
  type?: "unordered" | "ordered" | "todo";
  onChange: (items: ListItem[], type: string) => void;
}

export const ListBlock: React.FC<ListBlockProps> = ({ items = [], type: initialType = "unordered", onChange }) => {
  const [listType, setListType] = useState(initialType);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const inputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Create first item automatically when the block is empty
  useEffect(() => {
    if (items.length === 0) {
      const newItem = { id: Date.now(), text: "1st Item" };
      onChange([newItem], listType);
      // Focus and select the text in the first input after render
      requestAnimationFrame(() => {
        if (firstInputRef.current) {
          firstInputRef.current.focus();
          firstInputRef.current.select();
        }
      });
    }
  }, []);

  const addItem = (afterId?: number) => {
    const newItem = { id: Date.now(), text: "", completed: false };
    if (afterId !== undefined) {
      // Insert after the specified item
      const index = items.findIndex((item) => item.id === afterId);
      const newItems = [...items];
      newItems.splice(index + 1, 0, newItem);
      onChange(newItems, listType);
      // Focus the new item in the next render
      requestAnimationFrame(() => {
        inputRefs.current[newItem.id]?.focus();
      });
    } else {
      onChange([...items, newItem], listType);
    }
  };

  const updateItem = (id: number, updates: Partial<ListItem>) => {
    onChange(
      items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
      listType
    );
  };

  const deleteItem = (id: number) => {
    // Don't delete if it's the last item
    if (items.length === 1) {
      updateItem(id, { text: "" });
      return;
    }
    const index = items.findIndex((item) => item.id === id);
    const newItems = items.filter((item) => item.id !== id);
    onChange(newItems, listType);
    // Focus the previous or next item after deletion
    requestAnimationFrame(() => {
      const nextIndex = Math.min(index, newItems.length - 1);
      const nextItem = newItems[nextIndex];
      if (nextItem) {
        inputRefs.current[nextItem.id]?.focus();
      }
    });
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, item: ListItem) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem(item.id);
    } else if (e.key === "Backspace" && item.text === "") {
      e.preventDefault();
      deleteItem(item.id);
    }
  };

  const handleTypeChange = (newType: "unordered" | "ordered" | "todo") => {
    setListType(newType);
    setIsDropdownOpen(false);
    onChange(items, newType);
  };

  const ListTypeMenu = (
    <div className="w-48 bg-white rounded-lg shadow-lg py-1">
      <button
        onClick={() => handleTypeChange("unordered")}
        className={`w-full text-left px-4 py-2 flex items-center space-x-2 hover:bg-gray-100 
          ${listType === "unordered" ? "text-sky-600" : ""}`}>
        <List className="w-4 h-4" />
        <span>Bullet List</span>
      </button>
      <button
        onClick={() => handleTypeChange("ordered")}
        className={`w-full text-left px-4 py-2 flex items-center space-x-2 hover:bg-gray-100 
          ${listType === "ordered" ? "text-sky-600" : ""}`}>
        <ListOrdered className="w-4 h-4" />
        <span>Numbered List</span>
      </button>
      <button
        onClick={() => handleTypeChange("todo")}
        className={`w-full text-left px-4 py-2 flex items-center space-x-2 hover:bg-gray-100 
          ${listType === "todo" ? "text-sky-600" : ""}`}>
        <CheckSquare className="w-4 h-4" />
        <span>To-do List</span>
      </button>
    </div>
  );

  return (
    <div className="relative max-w-3xl">
      <div className="flex flex-row-reverse">
        <div className="flex items-start">
          <Tooltip
            content={ListTypeMenu}
            visible={isDropdownOpen}
            onClickOutside={() => setIsDropdownOpen(false)}
            interactive={true}
            trigger="click"
            theme="light"
            placement="bottom-start"
            className="z-[150]">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 px-2 py-1 opacity-25 hover:opacity-100 rounded hover:bg-gray-100 text-gray-600">
              {listType === "unordered" && <List className="w-4 h-4" />}
              {listType === "ordered" && <ListOrdered className="w-4 h-4" />}
              {listType === "todo" && <CheckSquare className="w-4 h-4" />}
              <ChevronDown className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>

        <div className="space-y-2 flex-1 text-lg lg:text-xl">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center space-x-2 group">
              {listType === "todo" && (
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={(e) => updateItem(item.id, { completed: e.target.checked })}
                  className="rounded accent-sky-400"
                />
              )}
              {listType === "ordered" && <span className="w-auto truncate text-right text-gray-400">{index + 1}.</span>}
              {listType === "unordered" && <span className="w-4 text-right text-gray-500">•</span>}
              <input
                ref={(el) => {
                  inputRefs.current[item.id] = el;
                  if (index === 0) firstInputRef.current = el;
                }}
                type="text"
                value={item.text}
                onChange={(e) => updateItem(item.id, { text: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, item)}
                className="flex-1 p-0 bg-transparent truncate"
                placeholder={index === 0 ? "1st Item" : "List item..."}
              />
              <button
                onClick={() => deleteItem(item.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-opacity">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={() => addItem()}
        className={`${listType === "todo" ? "ml-[20px]" : "ml-[24px]"} text-xl mt-2 flex gap-4 sr-only text-gray-300 hover:text-gray-700`}>
        Add item
      </button>
    </div>
  );
};

export default ListBlock;
