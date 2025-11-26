import React from 'react';

const DateTag = ({ label }) => {
  return (
    <div className="px-3 py-1 text-xs rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 shadow-sm select-none">
      {label}
    </div>
  );
};

export default DateTag;
