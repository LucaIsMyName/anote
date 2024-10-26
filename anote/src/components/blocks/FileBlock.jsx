import React, { useState } from 'react';
import { Upload, FileText, Download } from 'lucide-react';

const FileBlock = ({ file, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  const handleFile = async (file) => {
    try {
      // Read file and create copy in assets
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target.result;
        onChange({
          name: file.name,
          type: file.type,
          size: file.size,
          data: result
        });
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error handling file:', error);
    }
  };

  return (
    <div className="mb-4">
      {file ? (
        <div className="flex items-center space-x-4 p-4 border rounded-lg">
          <FileText className="w-8 h-8 text-gray-400" />
          <div className="flex-1">
            <div className="font-medium">{file.name}</div>
            <div className="text-sm text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
          <a 
            href={file.path} 
            download
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Download className="w-5 h-5 text-gray-600" />
          </a>
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
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-gray-600">
                Drag and drop a file, or click to select
              </p>
              <label className="inline-flex items-center mt-2 px-4 py-2 bg-white border rounded-md cursor-pointer hover:bg-gray-50">
                <Upload className="w-4 h-4 mr-2" />
                <span>Choose file</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.rtf,.xlsx,.xls,.ppt,.pptx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
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