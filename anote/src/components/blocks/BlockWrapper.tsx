import React, { memo, forwardRef } from "react";
import { GripVertical } from "lucide-react";

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
}

const BlockWrapper = forwardRef<HTMLDivElement, BlockWrapperProps>(({
  block,
  index,
  children,
  isDragging,
  draggedBlockIndex,
  dragOverBlockIndex,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  renderBlockControls
}, ref) => {
  const isDraggedBlock = draggedBlockIndex === index;
  const isOverBlock = dragOverBlockIndex === index;

  return (
    <div
      ref={ref}
      className={`
        relative group mb-10 transition-all duration-200 ease-in-out
        ${isDragging ? "cursor-grabbing" : "cursor-grab"}
        ${isDraggedBlock ? "" : "opacity-100 border-2 border-transparent p-0 rounded-lg shadow-sky-400"}
        ${isOverBlock ? "border-2 border-sky-400 p-4 scale-90 rounded-lg" : "border-transparent"}
      `}
      id={block.id}
      draggable="true"
      onDragStart={(e) => onDragStart(e, index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, index)}
      onDragLeave={onDragLeave}>
      {/* Larger drag handle area */}
      <div
      id={block.id}
        className="absolute left-0 top-0 w-12 -translate-x-full 
                   opacity-0 group-hover:opacity-100 flex items-center h-full
                   justify-center cursor-grab active:cursor-grabbing">
        <div className="p-2 rounded hover:bg-gray-100">
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      <div className={`relative ${isDragging ? "pointer-events-none" : ""}`}>{children}</div>

      {renderBlockControls(index)}
    </div>
  );
});

BlockWrapper.displayName = "BlockWrapper";

export default memo(BlockWrapper);