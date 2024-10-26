import React from 'react';
import { Plus, Trash } from 'lucide-react';

const TableBlock = ({ data, onChange }) => {
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
      <div className="inline-block min-w-full border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="relative">
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                      className="block w-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Type something..."
                    />
                    {/* Column delete button (only show for first row) */}
                    {rowIndex === 0 && (
                      <button
                        onClick={() => deleteColumn(colIndex)}
                        className="absolute -top-8 right-0 p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                ))}
                {/* Row delete button */}
                <td className="w-8">
                  <button
                    onClick={() => deleteRow(rowIndex)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Add row/column buttons */}
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