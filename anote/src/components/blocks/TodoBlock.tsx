import React, { useState } from "react";

/**
 *
 * @param {Array<any>} items
 * @param {Function} onChange
 * @returns
 * @description To-do list block
 */
interface TodoBlockProps {
  items: any[];
  onChange: (items: any[]) => void;
}
export const TodoBlock = ({ items, onChange }: TodoBlockProps) => {
  const addItem = () => {
    onChange([...items, { id: Date.now(), text: "", completed: false }]);
  };

  const updateItem = (id: any, updates: any): void => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  return (
    <div className="mb-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center space-x-2 mb-2">
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
        className="text-sm text-gray-500 hover:text-gray-700">
        + Add item
      </button>
    </div>
  );
};

export default TodoBlock;
