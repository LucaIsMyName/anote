import React from "react";

interface SkeletonProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | number | undefined;
  width?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | number | undefined;
  lines?: number;
  className?: string;
}

const Skeleton = ({ size = "sm", width = "sm", lines = 1, className = "" }: SkeletonProps): React.JSX.Element => {
  const translateWidth = (width: string) => {
    switch (width) {
      case "xs":
        return 240 * 1.2;
      case "sm":
        return 320 * 1.2;
      case "md":
        return 460 * 1.2;
      case "lg":
        return 560 * 1.2;
      case "xl":
        return 768 * 1.2;
      case "2xl":
        return 1024 * 1.2;
      case "3xl":
        return 1280 * 1.2;
      case typeof "Number":
        return width;
      default:
        return 320 * 1.2;
    }
  };

  const createLine = (key: number, size: number | string, width: number | string) => (
    <div
      key={key}
      style={{ width: "100%", maxWidth: width !== typeof "Number" ? Math.min(width === "xs" ? 120 : width === "sm" ? 240 : width === "md" ? 360 : width === "lg" ? 460 : width === "xl" ? 560 : 120, Math.floor(parseInt(translateWidth(width))) + 50) : width }}
      className={`rounded transition-all w-full bg-gray-100 ${size === "xs" ? "h-3" : size === "sm" ? "h-4" : size === "md" ? "h-6" : size === "lg" ? "h-8" : size === "xl" ? "h-10" : size === "2xl" ? "h-12" : size === "3xl" ? "h-16" : ""} ${className}`}></div>
  );

  return <div className={` ${size === "xs" ? "space-y-1" : size === "sm" ? "space-y-1" : size === "md" ? "space-y-1" : size === "lg" ? "space-y-2" : size === "xl" ? "space-y-2" : ""}`}>{Array.from(Array(lines).keys()).map((key) => createLine(key, size, width))}</div>;
};

export default Skeleton;
