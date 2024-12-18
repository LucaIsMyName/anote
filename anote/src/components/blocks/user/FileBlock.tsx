import React, { useState, useRef } from "react";
import { FileIcon, Upload } from "lucide-react";
import Input from "../utils/Input.tsx";

interface FileData {
  name: string;
  type: string;
  size: number;
  base64: string;
  lastModified: number;
}

interface FileBlockProps {
  src: string | null;
  caption: string | null;
  onChange: (data: { src: string; caption: string }) => void;
}

const FileBlock: React.FC<FileBlockProps> = ({ src, caption = "", onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result;
      if (result && typeof result === "string") {
        const fileData: FileData = {
          name: file.name,
          type: file.type,
          size: file.size,
          base64: result,
          lastModified: file.lastModified,
        };

        onChange({
          src: JSON.stringify(fileData),
          caption: file.name,
        });
      }
    };

    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileInfo = (): FileData | null => {
    if (!src || src === "undefined") return null;
    try {
      return JSON.parse(src) as FileData;
    } catch {
      return null;
    }
  };

  const fileInfo = getFileInfo();

  if (fileInfo) {
    return (
      <div className="max-w-3xl">
        <div className="border-2 rounded-lg p-2 bg-gray-50">
          <div className="space-y-2 md:py-2">
            <div className="md:flex  space-y-2 items-center truncate">
              <FileIcon className="w-14 h-14 text-gray-300" strokeWidth={1} />
              <div className="">
                <p className="font-medium text-sm text-gray-900 ">{fileInfo.name}</p>
                <p className="text-sm text-gray-500">
                  {fileInfo.type.split("/")[1].toLowerCase()} • {(fileInfo.size / 1024).toFixed(1)} KB
                </p>
              </div>
              
            </div>
            <Input
              type="text"
              value={caption || ""}
              onChange={(e) => onChange({ src, caption: e.target.value })}
              placeholder="Add a caption..."
              className="my-2 md:px-2 w-full bg-transparent text-sm text-gray-600 focus:ring-offset-2 focus:outline-4 outline-offset-2 rounded"
            />
            <button
              onClick={() => {
                const link = document.createElement("a");
                link.href = fileInfo.base64;
                link.download = fileInfo.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="md:mx-2 font-bold py-2 px-4 md:min-w-[180px] w-auto text-sm border-2 border-sky-600 bg-sky-400 text-white hover:bg-sky-500 rounded-md transition-colors">
              Download
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-lg p-8 mb-4 max-w-3xl
        ${isDragging ? "border-sky-400 bg-sky-50" : "border-gray-300"}
      `}>
      <div className="flex flex-col items-center space-y-4">
        <div className="p-4 bg-gray-100 rounded-full">
          <FileIcon className="w-8 h-8 text-gray-400" />
        </div>
        <div className="text-center">
          <p className="text-gray-600">Drag and drop a file, or</p>
          <label className="flex items-center mt-2 px-4 py-2 bg-white border rounded-md cursor-pointer hover:bg-gray-50">
            <Upload className="w-5 h-5 mr-2" />
            <span className="text-gray-700">Choose file</span>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default FileBlock;
