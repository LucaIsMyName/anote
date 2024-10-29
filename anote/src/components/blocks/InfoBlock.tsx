import React from 'react';

export interface InfoBlockProps {
  title: string;
  description: string;
  type: string;
}

const InfoBlock = ({ title, description, type }: InfoBlockProps) => (
  <div className="p-4 border rounded">
    <p className="text-lg font-semibold">{title}</p>
    <p className="text-gray-500">{description}</p>
    <span className="text-xs text-gray-400">{type}</span>
  </div>
);

export default InfoBlock;