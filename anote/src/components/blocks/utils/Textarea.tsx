import React, { useState, useEffect, useCallback, memo, forwardRef, useRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const Textarea = memo(forwardRef<HTMLTextAreaElement, TextareaProps>(({
  value,
  onChange,
  className = "",
  ...props
}, forwardedRef) => {
  const localRef = useRef<HTMLTextAreaElement>(null);
  const ref = (forwardedRef || localRef) as React.RefObject<HTMLTextAreaElement>;
  const [localValue, setLocalValue] = useState(value);

  const adjustHeight = useCallback(() => {
    const element = ref.current;
    if (!element) return;

    // Reset height to auto to get proper scrollHeight
    element.style.height = 'auto';
    // Set height to scrollHeight to fit content
    element.style.height = `${element.scrollHeight}px`;
  }, [ref]);

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
    // Adjust height after value update
    adjustHeight();
  }, [value, adjustHeight]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(e.target.value);
    onChange(e);
    // Adjust height after content change
    adjustHeight();
  }, [onChange, adjustHeight]);

  // Initial height adjustment
  useEffect(() => {
    adjustHeight();
  }, [adjustHeight]);

  return (
    <textarea
      ref={ref}
      value={localValue}
      onChange={handleChange}
      rows={1}
      className={`w-full bg-transparent focus:ring-offset-2 focus:outline-4 outline-offset-2 rounded focus:ring-blue-500 resize-none overflow-hidden ${className}`}
      {...props}
    />
  );
}));

Textarea.displayName = 'Textarea';

export default Textarea;