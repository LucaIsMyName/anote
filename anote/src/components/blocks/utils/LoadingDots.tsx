import { useEffect, useState } from "react";
const LoadingDots = () => {
  const [dots, setDots] = useState(1);
  const [direction, setDirection] = useState(1); // 1 for increasing, -1 for decreasing
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        // If we hit the bounds (1 or 3), change direction
        if (prev === 3) {
          setDirection(-1);
          return 2;
        }
        if (prev === 1 && direction === -1) {
          setDirection(1);
          return 2;
        }
        // Otherwise continue in current direction
        return prev + direction;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [direction]);

  return (
    <span className="">
      {Array.from({ length: dots }, () => ".").join("")}
    </span>
  );
};

export default LoadingDots;