import React from 'react';

const ResponsiveTable = ({ 
  headers, 
  data, 
  renderRow, 
  emptyMessage = "No data available",
  className = "" 
}) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      {/* Desktop Table */}
      <div className="hidden md:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => renderRow(item, index))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {data.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          data.map((item, index) => (
            <div key={index} className="card hover-lift">
              <div className="card-body">
                {renderRow(item, index, true)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ResponsiveTable;
