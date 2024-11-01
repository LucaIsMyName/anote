import React, { useState, useEffect, useCallback, memo, forwardRef, useRef } from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const Textarea = memo(
  forwardRef<HTMLTextAreaElement, TextareaProps>(({ value, onChange, className = "", ...props }, forwardedRef) => {
    const localRef = useRef<HTMLTextAreaElement>(null);
    const ref = (forwardedRef || localRef) as React.RefObject<HTMLTextAreaElement>;
    const cursorPositionRef = useRef<{ start: number; end: number } | null>(null);
    const isComposing = useRef(false);

    const adjustHeight = useCallback(() => {
      const element = ref.current;
      if (!element) return;

      // Store current cursor position
      cursorPositionRef.current = {
        start: element.selectionStart,
        end: element.selectionEnd
      };

      // Reset height to minimum to get proper scrollHeight
      element.style.height = "auto";
      
      // Set height to scrollHeight
      const newHeight = Math.max(element.scrollHeight, 24);
      element.style.height = `${newHeight}px`;

      // Restore cursor position on next frame
      requestAnimationFrame(() => {
        if (element && cursorPositionRef.current) {
          const { start, end } = cursorPositionRef.current;
          element.setSelectionRange(start, end);
        }
      });
    }, [ref]);

    // Adjust height on content or class changes
    useEffect(() => {
      requestAnimationFrame(adjustHeight);
    }, [value, className, adjustHeight]);

    // Handle window resize
    useEffect(() => {
      const handleResize = () => requestAnimationFrame(adjustHeight);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (isComposing.current) return;

        // Store cursor position
        const element = e.target;
        cursorPositionRef.current = {
          start: element.selectionStart,
          end: element.selectionEnd
        };

        // Call parent onChange
        onChange(e);

        // Adjust height
        requestAnimationFrame(adjustHeight);
      },
      [onChange, adjustHeight]
    );

    const handleCompositionStart = () => {
      isComposing.current = true;
    };

    const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
      isComposing.current = false;
      handleChange(e as unknown as React.ChangeEvent<HTMLTextAreaElement>);
    };

    // Handle selection changes
    const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
      const element = e.target as HTMLTextAreaElement;
      cursorPositionRef.current = {
        start: element.selectionStart,
        end: element.selectionEnd
      };
    };

    return (
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onSelect={handleSelect}
        rows={1}
        className={`w-full p-0 bg-transparent rounded resize-none overflow-hidden ${className}`}
        {...props}
      />
    );
  })
);

Textarea.displayName = "Textarea";

export default Textarea;