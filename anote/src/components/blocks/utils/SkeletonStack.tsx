import Skeleton from "./Skeleton.tsx";

interface SkeletonStackProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  width?: "xs" | "sm" | "md" | "lg" | "xl";
  lines?: number;
  isCardLayout?: boolean;
  isGrid?: boolean;
  hasHeading?: boolean;
}

const SkeletonStack = ({ size, width, lines = 1, isCardLayout = true, isGrid = false, hasHeading = false }: SkeletonStackProps): React.JSX.Element => {
  return (
    <div className="space-y-2">
      {!isCardLayout && hasHeading && (
        <Skeleton
          lines={Math.max(1, Math.floor(lines / 3)) || 1}
          width={width === "xs" ? "xs" : width === "sm" ? "sm" : width === "md" ? "md" : width === "lg" ? "lg" : width === "xl" ? "xl" : "sm"}
          size={size === "xs" ? "md" : size === "sm" ? "lg" : size === "md" ? "xl" : size === "lg" ? "2xl" : size === "xl" ? "3xl" : "md"}
        />
      )}
      {!isGrid && (
        <Skeleton
          lines={lines || 1}
          width={width === "xs" ? "xs" : width === "sm" ? "sm" : width === "md" ? "md" : width === "lg" ? "lg" : width === "xl" ? "xl" : width === typeof "Number" ? width : "sm"}
          size={size === "xs" ? "xs" : size === "sm" ? "sm" : size === "md" ? "md" : size === "lg" ? "lg" : size === "xl" ? "xl" : "sm"}
          className={`${isCardLayout ? "aspect-square" : ""}`}
        />
      )}

      {isGrid && (
        <div className="flex gap-4">
          <Skeleton
            lines={lines || 1}
            size={size === "xs" ? "xs" : size === "sm" ? "sm" : size === "md" ? "md" : size === "lg" ? "lg" : size === "xl" ? "xl" : "sm"}
            width={width === "xs" ? "xs" : width === "sm" ? "sm" : width === "md" ? "md" : width === "lg" ? "lg" : width === "xl" ? "xl" : width === typeof "Number" ? width : "sm"}
            className={`flex-1 w-full ${isCardLayout ? "aspect-square" : ""}`}
          />
          <Skeleton
            lines={lines || 1}
            size={size === "xs" ? "xs" : size === "sm" ? "sm" : size === "md" ? "md" : size === "lg" ? "lg" : size === "xl" ? "xl" : "sm"}
            width={width === "xs" ? "xs" : width === "sm" ? "sm" : width === "md" ? "md" : width === "lg" ? "lg" : width === "xl" ? "xl" : width === typeof "Number" ? width : "sm"}
            className={`flex-1 w-full ${isCardLayout ? "aspect-square" : ""}`}
          />
        </div>
      )}
    </div>
  );
};

export default SkeletonStack;
