import React, { useState, useEffect, useCallback, memo, useMemo, forwardRef, useRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * @description A custom input component that wraps the native input element
 * and provides additional functionality such as focus tracking and cursor position restoration.
 */
const Input = memo(
  forwardRef<HTMLInputElement, InputProps>(({ value, onChange, className = "", ...props }, ref) => {
    const uniqueId = useMemo(() => `input-${Math.random().toString(36).slice(2)}-${Date.now()}`, []);
    const [localValue, setLocalValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);
    const [wasFocused, setWasFocused] = useState(false);

    // Track focus state
    useEffect(() => {
      const element = (ref as React.RefObject<HTMLInputElement>)?.current || inputRef.current;
      if (element === document.activeElement) {
        setWasFocused(true);
      }
    });

    // Restore focus if component re-renders while focused
    useEffect(() => {
      const element = (ref as React.RefObject<HTMLInputElement>)?.current || inputRef.current;
      if (wasFocused && element) {
        element.focus();
        // Restore cursor position to end of input
        const length = element.value.length;
        element.setSelectionRange(length, length);
        setWasFocused(false);
      }
    }, [wasFocused, ref]);

    // Update local value when prop changes
    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalValue(e.target.value);
        onChange(e);
      },
      [onChange]
    );

    return (
      <div
        key={uniqueId}
        className="w-full">
        <input
          ref={ref || inputRef}
          value={localValue}
          onChange={handleChange}
          className={`w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-sky-500 ${className}`}
          {...props}
        />
      </div>
    );
  })
);

Input.displayName = "Input";

export default Input;
