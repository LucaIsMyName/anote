import React, { useState, useEffect } from 'react';
import { FileService } from '../../services/FileService';

/**
 * @description A file block component that allows users to
 * upload a file by dragging and dropping or selecting a file.
 */
const FileBlock = ({ fileData, onChange }) => {
  const [base64Data, setBase64Data] = useState(fileData?.base64 || '');

  useEffect(() => {
    if (fileData?.base64) {
      setBase64Data(fileData.base64); // Load base64 data from props on load
    }
  }, [fileData]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result;
        setBase64Data(base64);
        // Pass structured data with type and fileData fields
        onChange({ type: 'file', fileData: { name: file.name, base64 } });
      };
      reader.readAsDataURL(file);

    }
  };

  return (
    <div className="p-4 border rounded">
      {base64Data ? (
        <a href={base64Data} download={fileData?.name || 'download'}>
          Download {fileData?.name || 'file'}
        </a>
      ) : (
        <input type="file" onChange={handleFileUpload} />
      )}
    </div>
  );
};

export default FileBlock;
