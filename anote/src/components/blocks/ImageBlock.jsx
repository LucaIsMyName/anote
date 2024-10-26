import React, { useState } from 'react';
import { Image as ImageIcon, Upload } from 'lucide-react';

const ImageBlock = ({ src, caption, onChange }) => {
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
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange({ src: event.target.result, caption });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange({ src: event.target.result, caption });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="mb-4">
      {src ? (
        <div className="space-y-2">
          <img
            src={src}
            alt={caption || 'Uploaded image'}
            className="max-w-full h-auto rounded-lg"
          />
          <input
            type="text"
            value={caption || ''}
            onChange={(e) => onChange({ src, caption: e.target.value })}
            placeholder="Add a caption..."
            className="w-full bg-transparent text-sm text-gray-600"
          />
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
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-gray-600">Drag and drop an image, or</p>
              <label className="inline-flex items-center mt-2 px-4 py-2 bg-white border rounded-md cursor-pointer hover:bg-gray-50">
                <Upload className="w-4 h-4 mr-2" />
                <span>Choose file</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
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

export default ImageBlock;