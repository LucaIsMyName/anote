// src/components/blocks/BlockControls.tsx

import React, { memo } from 'react';
import { Plus, Copy, Trash2 } from 'lucide-react';
import { BlockMenu } from './BlockMenu.tsx';

export interface BlockControlsProps {
  index: number;
  onAddBlock: (type: string, index: number) => void;
  onCopyBlock: (index: number) => void;
  onDeleteBlock: (index: number) => void;
}

const BlockControls = memo(({ 
  index, 
  onAddBlock, 
  onCopyBlock, 
  onDeleteBlock 
}: BlockControlsProps) => (
  <div className="absolute w-full -left-2 -bottom-8 flex flex-row items-center justify-start opacity-0 group-hover:opacity-100">
    {/* Add block button */}
    <div className="flex items-center">
      <BlockMenu
        onSelect={(type) => onAddBlock(type, index)}
        trigger={
          <button className="p-2 text-sky-500 hover:bg-sky-50 rounded-full">
            <Plus className="w-4 h-4" />
          </button>
        }
      />
      {/* Copy block button */}
      <button
        onClick={() => onCopyBlock(index)}
        className="p-2 text-sky-500 hover:bg-sky-50 rounded-full"
        title="Copy Block">
        <Copy className="w-4 h-4" />
      </button>
    </div>

    {/* Delete button */}
    <button
      onClick={() => onDeleteBlock(index)}
      className="p-2 text-red-500 hover:bg-red-50 rounded-full mr-1"
      title="Delete Block">
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
));

BlockControls.displayName = 'BlockControls';

export default BlockControls;