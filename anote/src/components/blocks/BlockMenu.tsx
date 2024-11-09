import React, { useState } from "react";
import { Plus, Link, Type, Code, List, Heading1, Table, Image, FileText, ListTodo } from "lucide-react";
import Tooltip from "./utils/Tooltip.tsx";

export const BlockType = {
  PARAGRAPH: "paragraph",
  HEADING: "heading",
  TABLE: "table",
  IMAGE: "image",
  FILE: "file",
  LIST: "list",
  CODE: "code",
  REFERENCE: "reference",
};

export interface BlockMenuProps {
  onSelect: (type: string) => void;
  trigger?: React.ReactNode;
}

export const BlockMenu = ({ onSelect, trigger = undefined }: BlockMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const blockTypes = [
    { type: BlockType.PARAGRAPH, icon: Type, label: "Text" },
    { type: BlockType.HEADING, icon: Heading1, label: "Heading" },
    { type: BlockType.TABLE, icon: Table, label: "Table" },
    { type: BlockType.IMAGE, icon: Image, label: "Image" },
    { type: BlockType.FILE, icon: FileText, label: "File" },
    { type: BlockType.LIST, icon: List, label: "List" },
    { type: BlockType.CODE, icon: Code, label: "Code Block" }, // Add this line
    { type: BlockType.REFERENCE, icon: Link, label: "Reference" },
  ];

  const MenuContent = (
    <div className="w-48 bg-white rounded-lg py-2">
      {blockTypes.map(({ type, icon: Icon, label }) => (
        <button
          key={type}
          className="w-full px-4 py-2 flex items-center space-x-2 hover:bg-gray-100 text-left"
          onClick={() => {
            onSelect(type);
            setIsOpen(false);
          }}>
          <Icon className="w-4 h-4 text-gray-600" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <Tooltip
      content={MenuContent}
      visible={isOpen}
      onClickOutside={() => setIsOpen(false)}
      interactive={true}
      trigger="click"
      theme="light"
      placement="bottom-start"
      arrow={false}
      className="block-menu-tooltip z-[100]">
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger || (
          <button className="">
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>
    </Tooltip>
  );
};
