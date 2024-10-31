import React, { useState, useEffect, useCallback, memo, forwardRef, useRef } from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const Textarea = memo(
  forwardRef<HTMLTextAreaElement, TextareaProps>(({ value, onChange, className = "", ...props }, forwardedRef) => {
    const localRef = useRef<HTMLTextAreaElement>(null);
    const ref = (forwardedRef || localRef) as React.RefObject<HTMLTextAreaElement>;
    const [localValue, setLocalValue] = useState(value);
    const previousClassName = useRef(className);

    const adjustHeight = useCallback(() => {
      const element = ref.current;
      if (!element) return;

      // Reset height to minimum to get proper scrollHeight
      element.style.height = "auto";

      // Force a repaint to ensure proper height calculation
      // This is needed especially when font size changes
      void element.offsetHeight;

      // Set height to scrollHeight to fit content
      const newHeight = Math.max(element.scrollHeight, 24); // Minimum height of 24px
      element.style.height = `${newHeight}px`;
    }, [ref]);

    // Update local value when prop changes
    useEffect(() => {
      setLocalValue(value);
      // Adjust height after value update
      requestAnimationFrame(adjustHeight);
    }, [value, adjustHeight]);

    // Monitor className changes
    useEffect(() => {
      if (previousClassName.current !== className) {
        previousClassName.current = className;
        // Use requestAnimationFrame to ensure the class change has been applied
        requestAnimationFrame(() => {
          requestAnimationFrame(adjustHeight);
        });
      }
    }, [className, adjustHeight]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalValue(e.target.value);
        onChange(e);
        // Adjust height after content change
        requestAnimationFrame(adjustHeight);
      },
      [onChange, adjustHeight]
    );

    // Initial height adjustment
    useEffect(() => {
      requestAnimationFrame(adjustHeight);
    }, [adjustHeight]);

    // Adjust height on window resize to handle font-size changes from responsive design
    useEffect(() => {
      const handleResize = () => {
        requestAnimationFrame(adjustHeight);
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return (
      <textarea
        ref={ref}
        value={localValue}
        onChange={handleChange}
        rows={1}
        className={`w-full p-0 bg-transparent rounded resize-none overflow-hidden ${className}`}
        {...props}
      />
    );
  })
);

Textarea.displayName = "Textarea";

export default Textarea;
