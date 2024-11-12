interface LogoProps {
  color?: string;
  className?: any;
  strokeWidth?: number;
  size?: number;
  strokeLinecap?: "round" | "butt" | "square";
  strokeLinejoin?: "round" | "bevel" | "miter";
  hasFrame?: boolean;
  frameColor?: string | boolean;
}
const Logo = ({ color = "black", strokeWidth = 10, strokeLinecap = "round", strokeLinejoin = "round", className, hasFrame = false, frameColor = undefined }: LogoProps) => {
  return (
    <section
      style={frameColor ? { backgroundColor: frameColor.toString() } : { backgroundColor: "transparent" }}
      className={`${hasFrame ? `p-1 border-2 border-black/30  text-white ${!frameColor ? `bg-sky-400` : ''} rounded` : ""}`}>
      <svg
        width="156"
        height="156"
        viewBox="0 0 156 156"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M79 17C87.3333 12.3333 108.4 8.2 126 29C148 55 136 72 131 78C130.058 79.1304 127.064 82.2059 122.775 86.5M122.775 86.5C108.853 100.439 81.2898 127.22 66 142L27.5 104C15.5 92 13 74.55 27.5 61.5C47.5 43.5 67.5 53 79 66.5C89.1833 77.1667 112.195 96.1 122.775 86.5Z"
          stroke={!color ? "currentColor" : color}
          strokeWidth={strokeWidth}
          strokeLinecap={strokeLinecap}
          strokeLinejoin={strokeLinejoin}
        />
      </svg>
    </section>
  );
};

export default Logo;
