import React, { memo, forwardRef } from "react";
import { GripVertical, ChevronUp, ChevronDown } from "lucide-react";

export interface BlockWrapperProps {
  block: any;
  index: number;
  children: React.ReactNode;
  isDragging: boolean;
  draggedBlockIndex: number | null;
  dragOverBlockIndex: number | null;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: (e: React.DragEvent) => void;
  renderBlockControls: (index: number) => React.ReactNode;
  onMoveBlock: (fromIndex: number, toIndex: number) => void;
}

const BlockWrapper = forwardRef<HTMLDivElement, BlockWrapperProps>(({ block, index, children, isDragging, draggedBlockIndex, dragOverBlockIndex, onDragStart, onDragEnd, onDragOver, onDragLeave, renderBlockControls, onMoveBlock }, ref) => {
  const isDraggedBlock = draggedBlockIndex === index;
  const isOverBlock = dragOverBlockIndex === index;
  const handleMoveUp = (e: React.MouseEvent) => {
    e.preventDefault();
    if (index > 0) {
      onMoveBlock(index, index - 1);
    }
  };
  const handleMoveDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onMoveBlock(index, index + 1);
  };
  return (
    <div
      ref={ref}
      className={`
        relative group mb-10 transition-all duration-200 ease-in-out
        ${isDragging ? "cursor-grabbing" : "cursor-grab"}
        ${isDraggedBlock ? "" : "opacity-100 border-2 border-transparent p-0 rounded-lg shadow-sky-400"}
        ${isOverBlock ? "border-2 outline-sky-400 outline-offset-4 rounded-lg" : "border-transparent"}
      `}
      id={block.id}
      draggable="true"
      onDragStart={(e) => onDragStart(e, index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, index)}
      onDragLeave={onDragLeave}>
      {/* Larger drag handle area */}
      {/* Block controls with arrows */}
      <div
        className="absolute left-0 top-0 w-8 -translate-x-full 
                     opacity-0 group-hover:opacity-100 flex flex-col
                     items-center gap-1">
        <button
          onClick={handleMoveUp}
          className={`${index === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={index === 0}>
          <ChevronUp className="w-4 h-4 text-gray-400" />
        </button>

        <div className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>

        <button
          onClick={handleMoveDown}
          className="">
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className={`relative ${isDragging ? "pointer-events-none" : ""}`}>{children}</div>

      <div>{renderBlockControls(index)}</div>
    </div>
  );
});

BlockWrapper.displayName = "BlockWrapper";

export default memo(BlockWrapper);
