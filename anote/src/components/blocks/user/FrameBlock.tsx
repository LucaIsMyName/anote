import React, { useState, useEffect } from "react";
import { Link2, Minimize2, ExternalLink, RefreshCcw, Maximize2, ChevronDown } from "lucide-react";
import Input from "../utils/Input.tsx";
import Tooltip from "../utils/Tooltip.tsx";

interface AspectRatio {
  icon?: React.JSX.Element;
  label: string;
  value: string;
  padding: number;
}

interface FrameBlockProps {
  initialSrc?: string;
  initialAspect?: string;
  initialIsFullWidth?: boolean;
  onChange?: (updates: { src?: string; aspect?: string; isFullWidth?: boolean }) => void;
}

const ASPECT_RATIOS: AspectRatio[] = [
  { label: "Square", value: "1/1", padding: 100 },
  { label: "Wide", value: "3/2", padding: 66.67 },
  { label: "Landscape", value: "4/3", padding: 75 },
  { label: "Video", value: "16/9", padding: 56.25 },
  { label: "Cinema", value: "21/9", padding: 42.86 },
  { label: "R-Letter", value: "29/21", padding: 72.41 },
  { label: "Portrait", value: "2/3", padding: 150 },
  { label: "Height", value: "3/4", padding: 133.33 },
  { label: "Shorts", value: "9/16", padding: 177.78 },
  { label: "R-Cinema", value: "9/21", padding: 233.33 },
  { label: "Letter", value: "21/29", padding: 138.1 },
];

const FrameBlock: React.FC<FrameBlockProps> = ({ initialSrc = "", initialAspect = "16/9", initialIsFullWidth = false, onChange }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState(initialSrc);
  const [inputValue, setInputValue] = useState(initialSrc);
  const [aspect, setAspect] = useState(initialAspect);
  const [isFullWidth, setIsFullWidth] = useState(initialIsFullWidth);
  const [isAspectDropdownOpen, setIsAspectDropdownOpen] = useState(false);

  const currentAspectRatio = ASPECT_RATIOS.find((ratio) => ratio.value === aspect) || ASPECT_RATIOS[3];

  useEffect(() => {
    setCurrentSrc(initialSrc);
    setInputValue(initialSrc);
    setAspect(initialAspect);
    setIsFullWidth(initialIsFullWidth);
  }, [initialSrc, initialAspect, initialIsFullWidth]);

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
      onChange?.({ src: newSrc, aspect, isFullWidth });
    }
  };

  const handleAspectSelect = (newAspect: string) => {
    setAspect(newAspect);
    setIsAspectDropdownOpen(false);
    onChange?.({ src: currentSrc, aspect: newAspect, isFullWidth });
  };

  const toggleFullWidth = () => {
    const newIsFullWidth = !isFullWidth;
    setIsFullWidth(newIsFullWidth);
    onChange?.({ src: currentSrc, aspect, isFullWidth: newIsFullWidth });
  };

  const AspectRatioMenu = (
    <div className="w-24 bg-white rounded-lg shadow-lg py-1">
      {ASPECT_RATIOS.map((ratio) => (
        <button
          key={ratio.value}
          onClick={() => handleAspectSelect(ratio.value)}
          className={`w-full text-left px-3 py-2 hover:bg-gray-100 ${aspect === ratio.value ? "bg-gray-50 text-sky-600" : ""}`}>
          {ratio.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className={`w-full space-y-2 ${!isFullWidth ? "max-w-3xl" : "max-w-full"} transition-all`}>
      {currentSrc && (
        <div
          className="relative w-full mb-4"
          style={{ paddingBottom: `${currentAspectRatio.padding}%` }}>
          <iframe
            src={currentSrc}
            className="absolute inset-0 w-full h-full rounded-lg border-2 border-gray-200"
            frameBorder="0"
            allowFullScreen
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-popups"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      )}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 max-w-3xl">
        <div className="flex-grow flex items-center gap-2 sm:text-sm">
          <Link2 className="size-4 text-gray-500" />
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter URL and press Enter"
            className={`w-full ${currentSrc ? "text-gray-400 focus:text-gray-700" : ""}`}
          />
        </div>
        <div className="flex gap-4 shrink-0 items-center">
          <Tooltip
            offset={[0, 5]}
            content={<div className="px-2 py-1 border-2 rounded text-xs">Reload the frame</div>}
            theme="light">
            <button
              onClick={handleRefresh}
              className="p-1 hover:bg-gray-100 text-gray-400 hover:text-black rounded-md border-2 border-transparent  transition-colors"
              title="Refresh frame">
              <RefreshCcw className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip
            offset={[0, 5]}
            content={<div className="px-2 py-1 border-2 rounded text-xs">Open page in new tab</div>}
            theme="light">
            <button
              onClick={handleOpenExternal}
              className="p-1 hover:bg-gray-100 text-gray-400 hover:text-black rounded-md border-2 border-transparent  transition-colors"
              title="Open in new tab">
              <ExternalLink className="w-4 h-4" />
            </button>
          </Tooltip>

          <div className="w-0 border-r-2 text-lg h-[1.5em] bg-gray-500"></div>
          <Tooltip
            content={AspectRatioMenu}
            visible={isAspectDropdownOpen}
            onClickOutside={() => setIsAspectDropdownOpen(false)}
            interactive={true}
            trigger="click"
            theme="light"
            placement="bottom-end"
            className="aspect-tooltip">
            <button
              onClick={() => setIsAspectDropdownOpen(!isAspectDropdownOpen)}
              className="flex items-center gap-1 px-2 py-1 rounded border-2 text-sm bg-white hover:bg-gray-50">
              <span>{currentAspectRatio.label}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip
            offset={[0, 5]}
            content={<div className="px-2 py-1 border-2 rounded text-xs">{isFullWidth ? "Smaller" : "Bigger"}</div>}
            theme="light">
            <button
              onClick={toggleFullWidth}
              className={`p-1 rounded-md border-2  transition-colors ${isFullWidth ? "bg-sky-400 border-sky-600  text-white" : "hover:bg-gray-100 hover:scale-110 border-transparent"} transition-all`}
              title={isFullWidth ? "Set contained width" : "Set full width"}>
              {isFullWidth && <Minimize2 className={`w-4 h-4 transition-all ${isFullWidth ? "hover:scale-90" : ""}`} />}
              {!isFullWidth && <Maximize2 className={`w-4 h-4 transition-all ${isFullWidth ? "hover:scale-90" : ""}`} />}
            </button>
          </Tooltip>
        </div>
      </div>
      {!currentSrc && <div className="text-gray-400 text-xs p-4 px-5 border-2 border-dotted rounded-lg">Enter a URL to load a webpage</div>}
    </div>
  );
};

export default FrameBlock;
