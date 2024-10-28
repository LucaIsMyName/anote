import React, { useCallback, useRef, memo } from "react";

/**
 * @description A sticky table of contents component
 * that displays a list of headings and scrolls to the
 * selected heading when clicked.
 */

interface TableOfContentsProps {
  headings: string[];
}
const TableOfContents = ({ headings }: TableOfContentsProps) => {
  const headingRefs = useRef(headings.map(() => React.createRef()));

  const handleScrollTo = useCallback((index: number) => {
    headingRefs.current[index].current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="sticky top-0 h-full overflow-y-auto p-4">
      <h2 className="text-lg font-semibold mb-2">Table of Contents</h2>
      <ul>
        {headings.map((heading, index) => (
          <li
            key={index}
            className="ml-0">
            <button
              className="text-sm hover:underline"
              onClick={() => handleScrollTo(index)}>
              {heading}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TableOfContents;
