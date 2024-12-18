// src/components/blocks/BlockControls.tsx

import React, { memo } from "react";
import { Plus, Copy, Trash2, Clock3, GripHorizontal } from "lucide-react";
import { BlockMenu } from "./BlockMenu.tsx";
import RelativeTime from "./utils/RelativeTime.tsx";

export interface BlockControlsProps {
  block: { id: string };
  index: number;
  onAddBlock: (type: string, index: number) => void;
  onCopyBlock: (index: number) => void;
  onDeleteBlock: (index: number) => void;
}

const BlockControls = memo(({ block, index, onAddBlock, onCopyBlock, onDeleteBlock }: BlockControlsProps) => (
  <div className="absolute -bottom-8 w-full flex opacity-0 group-hover:opacity-100 transition-all">
    {/* Add block button */}
    <div className="flex items-center justify-between gap-4 w-full max-w-3xl">
      <div className="flex gap-3 items-center">
        <BlockMenu
          onSelect={(type) => onAddBlock(type, index)}
          trigger={
            <button className="text-sky-400 pt-2">
              <Plus className="w-4 min-w-4 max-w-4 h-4 min-h-4 max-h-4" />
            </button>
          }
        />
        {/* Copy block button */}
        <button
          onClick={() => onCopyBlock(index)}
          className="text-sky-400"
          title="Copy Block">
          <Copy className="w-4 min-w-4 max-w-4 h-4 min-h-4 max-h-4" />
        </button>
        {/* Delete button */}
        <button
          onClick={() => onDeleteBlock(index)}
          className="text-red-500 mr-1"
          title="Delete Block">
          <Trash2 className="w-4 min-w-4 max-w-4 h-4 min-h-4 max-h-4" />
        </button>
      </div>
      <div className="flex-1 flex gap-4 justify-center items-center" >
        <hr className="w-full border-gray-100 border-t-2 border-dotted" />
        <GripHorizontal className="text-gray-300 w-4 min-w-4 max-w-4 h-4 min-h-4 max-h-4" />
        <hr className="w-full border-gray-100 border-t-2 border-dotted" />
      </div>
      <div className="hidden sm:flex gap-3 items-center">
        <section className=" text-[13px] text-gray-300 -bottom-0 right-0 truncate"><span className="truncate">#{block.id}</span></section>
        <section className=" text-[13px] text-gray-300 -bottom-0 right-0 truncate">
          <Clock3 className="inline-block size-3 mr-1 " />
          <RelativeTime date={block.createdAt} className="truncate" />
        </section>
      </div>
    </div>
  </div>
));

BlockControls.displayName = "BlockControls";

export default BlockControls;
