import React, { useEffect, useState, useRef } from 'react';
import { Plus, Trash } from 'lucide-react';

const TableBlock = ({ data, onChange, id }) => {
  const [columnWidths, setColumnWidths] = useState({});
  const [headers, setHeaders] = useState([]);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeIndex, setResizeIndex] = useState(null);
  const [startX, setStartX] = useState(null);
  const [startWidths, setStartWidths] = useState(null);
  const tableRef = useRef(null);

  // Load saved column widths from localStorage
  useEffect(() => {
    const savedWidths = localStorage.getItem(`table-${id}-widths`);
    if (savedWidths) {
      setColumnWidths(JSON.parse(savedWidths));
    }
  }, [id]);

  // Load or initialize headers
  useEffect(() => {
    if (data.length > 0) {
      const savedHeaders = localStorage.getItem(`table-${id}-headers`);
      if (savedHeaders) {
        setHeaders(JSON.parse(savedHeaders));
      } else {
        setHeaders(Array(data[0].length).fill(''));
      }
    }
  }, [data, id]);

  const saveHeaders = (newHeaders) => {
    setHeaders(newHeaders);
    localStorage.setItem(`table-${id}-headers`, JSON.stringify(newHeaders));
  };

  const updateHeader = (index, value) => {
    const newHeaders = [...headers];
    newHeaders[index] = value;
    saveHeaders(newHeaders);
  };

  const startResize = (index, event) => {
    event.preventDefault();
    setIsResizing(true);
    setResizeIndex(index);
    setStartX(event.clientX);
    
    // Store the starting widths of both the current and next columns
    const currentWidth = columnWidths[index] || 150; // default width
    const nextWidth = columnWidths[index + 1] || 150;
    setStartWidths({ current: currentWidth, next: nextWidth });
  };

  const handleResize = (event) => {
    if (!isResizing || resizeIndex === null) return;

    const diff = event.clientX - startX;
    const newWidths = { ...columnWidths };
    
    // Ensure minimum width of 50px for both columns
    const newCurrentWidth = Math.max(50, startWidths.current + diff);
    const newNextWidth = Math.max(50, startWidths.next - diff);
    
    newWidths[resizeIndex] = newCurrentWidth;
    newWidths[resizeIndex + 1] = newNextWidth;
    
    setColumnWidths(newWidths);
    localStorage.setItem(`table-${id}-widths`, JSON.stringify(newWidths));
  };

  const stopResize = () => {
    setIsResizing(false);
    setResizeIndex(null);
    setStartX(null);
    setStartWidths(null);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', stopResize);
      return () => {
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
      };
    }
  }, [isResizing]);

  const addRow = () => {
    const newRow = Array(data[0]?.length || 3).fill('');
    onChange([...data, newRow]);
  };

  const addColumn = () => {
    const newData = data.map(row => [...row, '']);
    if (newData.length === 0) {
      newData.push(Array(3).fill('')); // Default 3 columns
    }
    onChange(newData);
    
    // Add new header
    const newHeaders = [...headers, ''];
    saveHeaders(newHeaders);
  };

  const updateCell = (rowIndex, colIndex, value) => {
    const newData = data.map((row, i) =>
      i === rowIndex
        ? row.map((cell, j) => (j === colIndex ? value : cell))
        : row
    );
    onChange(newData);
  };

  const deleteRow = (rowIndex) => {
    onChange(data.filter((_, i) => i !== rowIndex));
  };

  const deleteColumn = (colIndex) => {
    onChange(data.map(row => row.filter((_, j) => j !== colIndex)));
    
    // Update headers
    const newHeaders = headers.filter((_, i) => i !== colIndex);
    saveHeaders(newHeaders);
    
    // Update column widths
    const newWidths = { ...columnWidths };
    delete newWidths[colIndex];
    // Shift remaining widths
    Object.keys(newWidths).forEach(key => {
      if (Number(key) > colIndex) {
        newWidths[key - 1] = newWidths[key];
        delete newWidths[key];
      }
    });
    setColumnWidths(newWidths);
    localStorage.setItem(`table-${id}-widths`, JSON.stringify(newWidths));
  };

  if (data.length === 0) {
    // Initialize with a 3x3 table
    onChange([
      Array(3).fill(''),
      Array(3).fill(''),
      Array(3).fill('')
    ]);
    return null;
  }

  return (
    <div className="mb-4 overflow-x-auto">
      <div className="inline-block min-w-full border rounded-lg" ref={tableRef}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              {headers.map((header, colIndex) => (
                <th 
                  key={colIndex} 
                  className="relative border-b bg-gray-50"
                  style={{ width: columnWidths[colIndex] || 150 }}
                >
                  <input
                    type="text"
                    value={header}
                    onChange={(e) => updateHeader(colIndex, e.target.value)}
                    className=" w-full px-4 py-2 text-sm font-semibold bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Column name..."
                  />
                  <button
                    onClick={() => deleteColumn(colIndex)}
                    className="p-1 size-[24px] text-gray-400 hover:text-red-500 absolute right-2 top-[calc(50%-12px)]"
                  >
                    <Trash className="w-[12px] h-[12px]" />
                  </button>
                  {colIndex < headers.length - 1 && (
                    <div
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500"
                      onMouseDown={(e) => startResize(colIndex, e)}
                    />
                  )}
                </th>
              ))}
              <th className="w-8 border-b bg-gray-50"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td 
                    key={colIndex} 
                    className="relative"
                    style={{ width: columnWidths[colIndex] || 150 }}
                  >
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                      className="block w-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Type something..."
                    />
                  </td>
                ))}
                <td className="">
                  <button
                    onClick={() => deleteRow(rowIndex)}
                    className=" flex justify-center items-center size-[24px] text-gray-400 hover:text-red-500"
                  >
                    <Trash className="w-[12px] h-[12px]" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="flex border-t">
          <button
            onClick={addRow}
            className="flex-1 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center"
          >
            <Plus className="w-4 h-4 mr-1" /> Add row
          </button>
          <button
            onClick={addColumn}
            className="flex-1 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 border-l flex items-center justify-center"
          >
            <Plus className="w-4 h-4 mr-1" /> Add column
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableBlock;