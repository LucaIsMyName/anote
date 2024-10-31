import React, { useRef, useEffect, useState } from "react";
import { FileService } from "../../services/FileService";

import Textarea from "./utils/Textarea";

interface ReferenceBlockProps {
  referenceId: string;
}

const ReferenceBlock: React.FC<ReferenceBlockProps> = ({ referenceId }) => {
  /*
  this block takes in any other id from a block in the app
  and displays a link to that block as well as the block iteself in
  read-only mode
   */
  const block = useBlock(referenceId);
  const [isEditing, setIsEditing] = useState(false);
  const [markdownContent, setMarkdownContent] = useState(block.content);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (block.content.includes("<") && block.content.includes(">")) {
      const markdown = FileService.transformInlineHtmlToMarkdown(block.content);
      setMarkdownContent(markdown);
    } else {
      setMarkdownContent(block.content);
    }
  }, [block.content]);

  const handleViewClick = () => {
    setIsEditing(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const position = textareaRef.current.value.length;
        textareaRef.current.selectionStart = position;
        textareaRef.current.selectionEnd = position;
      }
    }, 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const newMarkdown = e.target.value;
    setMarkdownContent(newMarkdown);
    block.updateBlock({ content: newMarkdown });
  };

  if (isEditing) {
    return (
      <Textarea
        ref={textareaRef}
        value={markdownContent}
        onChange={handleChange}
        onBlur={handleBlur}
        className="whitespace-pre-wrap"
        placeholder="Start typing..."
        style={{ whiteSpace: "pre-wrap" }}
      />
    );
  }

  return (
    <div>
      <button onClick={handleViewClick}>Edit</button>
      <div dangerouslySetInnerHTML={{ __html: block.content }} />
    </div>
  );
};

export default ReferenceBlock;