import React, { useState } from "react";
import { Image as ImageIcon, Upload } from "lucide-react";
import Input from "./utils/Input.tsx";

export interface ImageBlockProps {
  src: string | ArrayBuffer | null;
  caption: string | ArrayBuffer | null;
  onChange: (data: { src: string; caption: string }) => void;
}

/**
 * @description An image block component that allows users to
 * upload an image by dragging and dropping or selecting a file.
 */
const ImageBlock = ({ src, caption, onChange }: ImageBlockProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: any) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange({ src: event.target.result, caption });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (e: any) => {
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
            alt={caption || "Uploaded image"}
            className="max-w-full h-auto rounded-lg"
          />
          <Input
            type="text"
            value={caption || ""}
            onChange={(e) => onChange({ src, caption: e.target.value })}
            placeholder="Add a caption..."
            className="w-full bg-transparent text-sm text-gray-600 focus:ring-offset-2 focus:outline-4 outline-offset-2	rounded"
          />
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8
            ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"}
          `}>
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
            <div className="">
              <p className="text-gray-600">Drag and drop an image, or</p>
              <label className="flex items-center mt-2 px-4 py-2 bg-white border rounded-md cursor-pointer hover:bg-gray-50">
                <Upload className="w-8 h-8 size-8 mr-2" />
                <span className="truncate block w-full">Choose file</span>
                <Input
                  value=""
                  type="file"
                  className="hidden screen-reader-text"
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
