import React, { useState, useEffect, useCallback, memo, useMemo, forwardRef, useRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * @description A custom input component that wraps the native input element
 * and provides additional functionality such as focus tracking and cursor position restoration.
 */
const Input = memo(
  forwardRef<HTMLInputElement, InputProps>(({ 
    value = '', 
    onChange, 
    className = "", 
    type = "text",
    ...props 
  }, ref) => {
    const uniqueId = useMemo(() => `input-${Math.random().toString(36).slice(2)}-${Date.now()}`, []);
    const [localValue, setLocalValue] = useState<string>(value);
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
      if (wasFocused && element && type !== 'file') {
        element.focus();
        // Restore cursor position to end of input
        const length = element.value.length;
        element.setSelectionRange(length, length);
        setWasFocused(false);
      }
    }, [wasFocused, ref, type]);

    // Update local value when prop changes
    useEffect(() => {
      if (type !== 'file') {
        setLocalValue(value);
      }
    }, [value, type]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (type !== 'file') {
          setLocalValue(e.target.value);
        }
        onChange(e);
      },
      [onChange, type]
    );

    // For file inputs, don't set value prop
    const inputProps = type === 'file' 
      ? { ...props, type }
      : { ...props, type, value: localValue };

    return (
      <div
        key={uniqueId}
        className="w-full"
      >
        <input
          ref={ref || inputRef}
          onChange={handleChange}
          className={`w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-sky-500 ${className}`}
          {...inputProps}
        />
      </div>
    );
  })
);

Input.displayName = "Input";

export default Input;