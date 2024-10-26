import React, { useState } from "react";
import PropTypes from "prop-types";

/**
 * FileBlock component for uploading and displaying files.
 * @component
 * @param {Object} props
 * @param {Object} [props.file] - Optional initial file data to display.
 */
const FileBlock = ({ file }) => {
  const [uploadedFile, setUploadedFile] = useState(file || null);

  const handleFileUpload = (e) => {
    const newFile = e.target.files[0];
    if (newFile) {
      setUploadedFile({
        name: newFile.name,
        type: newFile.type || "Unknown",
        size: newFile.size,
      });
    }
  };

  return (
    <div className="p-4 border-2 border-dashed rounded-lg">
      {!uploadedFile ? (
        <div className="text-center">
          <input
            type="file"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-blue-50 file:text-blue-700
                       hover:file:bg-blue-100"
          />
          <p className="mt-2 text-sm text-gray-500">
            Choose a file to upload
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-4 p-4 border border-gray-300 rounded-lg">
          <span className="text-2xl text-blue-500">📄</span>
          <div>
            <p className="font-semibold text-gray-800">{uploadedFile.name}</p>
            <p className="text-sm text-gray-600">{uploadedFile.type}</p>
          </div>
        </div>
      )}
    </div>
  );
};

FileBlock.propTypes = {
  file: PropTypes.shape({
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  }),
};

export default FileBlock;
