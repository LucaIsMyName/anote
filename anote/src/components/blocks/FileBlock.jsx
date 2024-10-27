import React, { useState } from 'react';
import { Upload, File as FileIcon, Download } from 'lucide-react';

const FileBlock = ({ src, name, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const processFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      onChange({
        name: file.name,
        type: file.type,
        size: file.size,
        base64: event.target.result
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mb-4">
      {src ? (
        <div className="space-y-2 p-4 border border-gray-300 rounded-lg flex items-center gap-4">
          <FileIcon className="w-8 h-8 text-gray-500" />
          <div>
            <p className="font-semibold">{name}</p>
            <a
              href={src}
              download={name}
              className="mt-2 inline-flex items-center px-3 py-1 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600"
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </a>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          `}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <FileIcon className="w-8 h-8 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-gray-600">Drag and drop any file, or</p>
              <label className="inline-flex items-center mt-2 px-4 py-2 bg-white border rounded-md cursor-pointer hover:bg-gray-50">
                <Upload className="w-4 h-4 mr-2" />
                <span>Choose file</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileBlock;