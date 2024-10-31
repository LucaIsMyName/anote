// import React, { useState, useRef, useEffect, memo } from "react";
// import { Plus, Type, Heading1, Table, Image, ListTodo, FileText, ChevronDown } from "lucide-react";

// export const BlockType = {
//   PARAGRAPH: "paragraph",
//   HEADING: "heading",
//   TABLE: "table",
//   IMAGE: "image",
//   FILE: "file",
//   TODO: "todo",
// };

// export interface BlockMenuProps {
//   onSelect: (type: string) => void;
//   trigger?: React.ReactNode;
// }

// /**
//  * @description A block menu component that displays a list of block types
//  * for users to select when adding a new block to a page.
//  */
// export const BlockMenu = ({ onSelect, trigger = undefined }: BlockMenuProps) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const menuRef = useRef(null);

//   const blockTypes = [
//     { type: BlockType.PARAGRAPH, icon: Type, label: "Text" },
//     { type: BlockType.HEADING, icon: Heading1, label: "Heading" },
//     { type: BlockType.TABLE, icon: Table, label: "Table" },
//     { type: BlockType.IMAGE, icon: Image, label: "Image" },
//     { type: BlockType.FILE, icon: FileText, label: "File" }, // Using FileText instead of File
//     { type: BlockType.TODO, icon: ListTodo, label: "To-do List" },
//   ];

//   useEffect(() => {
//     const handleClickOutside = (event: any) => {
//       if (menuRef.current && !menuRef.current.contains(event.target)) {
//         setIsOpen(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   return (
//     <div
//       className="relative"
//       ref={menuRef}>
//       <div onClick={() => setIsOpen(!isOpen)}>
//         {trigger || (
//           <button className="p-2 hover:bg-gray-100 rounded-full">
//             <Plus className="w-4 h-4 text-gray-600" />
//           </button>
//         )}
//       </div>

//       {isOpen && (
//         <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
//           {blockTypes.map(({ type, icon: Icon, label }) => (
//             <button
//               key={type}
//               className="w-full px-4 py-2 flex items-center space-x-2 hover:bg-gray-100 text-left"
//               onClick={() => {
//                 onSelect(type);
//                 setIsOpen(false);
//               }}>
//               <Icon className="w-4 h-4 text-gray-600" />
//               <span>{label}</span>
//             </button>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };


import React, { useState } from "react";
import { Plus, Type, Heading1, Table, Image, FileText, ListTodo } from "lucide-react";
import Tooltip from "./utils/Tooltip.tsx";

export const BlockType = {
  PARAGRAPH: "paragraph",
  HEADING: "heading",
  TABLE: "table",
  IMAGE: "image",
  FILE: "file",
  TODO: "todo",
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
    { type: BlockType.TODO, icon: ListTodo, label: "To-do List" },
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
      className="block-menu-tooltip">
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger || (
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>
    </Tooltip>
  );
};