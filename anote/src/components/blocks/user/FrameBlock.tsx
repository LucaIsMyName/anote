import React, { useState } from "react";
import { ExternalLink, RefreshCcw } from "lucide-react";
import Input from "../utils/Input.tsx";

interface FrameBlockProps {
  initialSrc?: string;
}

const FrameBlock: React.FC<FrameBlockProps> = ({ initialSrc = "" }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState(initialSrc);
  const [inputValue, setInputValue] = useState(initialSrc);

  const handleRefresh = () => {
    const iframe = document.querySelector("iframe");
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  const handleOpenExternal = () => {
    if (currentSrc) {
      window.open(currentSrc, "_blank");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      let newSrc = inputValue.trim();
      if (newSrc && !newSrc.startsWith("http://") && !newSrc.startsWith("https://")) {
        newSrc = "https://" + newSrc;
      }
      setCurrentSrc(newSrc);
    }
  };

  return (
    <div className="w-full space-y-2 max-w-3xl">
      <div className="flex justify-between items-center gap-4">
        <div className="flex-grow">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter URL and press Enter"
            className="w-full"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleRefresh}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            title="Refresh frame">
            <RefreshCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenExternal}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            title="Open in new tab">
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {currentSrc !== "" && (
        <iframe
          src={currentSrc}
          className="w-full h-96 rounded-lg border-2 border-gray-200"
          frameBorder="0"
          allowFullScreen
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-popups"
          onLoad={() => setIsLoading(false)}
        />
      )}
      {currentSrc === "" && (
        <div className=" text-gray-400 text-xs p-4 px-5 border-2 border-dotted rounded-lg">Enter a URL to load a webpage</div>
      )}
    </div>
  );
};

export default FrameBlock;
