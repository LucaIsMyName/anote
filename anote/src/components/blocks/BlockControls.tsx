// src/components/blocks/BlockControls.tsx

import React, { memo } from "react";
import { Plus, Copy, Trash2 } from "lucide-react";
import { BlockMenu } from "./BlockMenu.tsx";

export interface BlockControlsProps {
  index: number;
  onAddBlock: (type: string, index: number) => void;
  onCopyBlock: (index: number) => void;
  onDeleteBlock: (index: number) => void;
}

const BlockControls = memo(({ index, onAddBlock, onCopyBlock, onDeleteBlock }: BlockControlsProps) => (
  <div className="absolute bg-white/80 rounded-lg -bottom-8 flex opacity-0 group-hover:opacity-100">
    {/* Add block button */}
    <div className="flex items-center gap-4">
      <BlockMenu
        onSelect={(type) => onAddBlock(type, index)}
        trigger={
          <button className="text-sky-400 pt-2">
            <Plus className="w-4 h-4" />
          </button>
        }
      />
      {/* Copy block button */}
      <button
        onClick={() => onCopyBlock(index)}
        className="text-sky-400"
        title="Copy Block">
        <Copy className="w-4 h-4" />
      </button>
      {/* Delete button */}
      <button
        onClick={() => onDeleteBlock(index)}
        className="text-red-500 mr-1"
        title="Delete Block">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
));

BlockControls.displayName = "BlockControls";

export default BlockControls;
