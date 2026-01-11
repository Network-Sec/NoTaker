import React from 'react';

interface MainStreamToggleProps {
  mainStreamViewMode: 'memo' | 'ai_conv';
  setMainStreamViewMode: (mode: 'memo' | 'ai_conv') => void;
}

const MainStreamToggle: React.FC<MainStreamToggleProps> = ({ mainStreamViewMode, setMainStreamViewMode }) => {
  const commonButtonClasses = "px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out relative z-10";
  const activeClasses = "bg-white text-gray-900 border-white"; // For the active tab
  const inactiveClasses = "bg-transparent text-gray-400 hover:text-white"; // For inactive tab, hover effect

  // Define the border color from GlobalSearchBar
  const searchBarBorderColor = "#53ffff94";

  return (
    <div className="flex -space-x-px"> {/* Use -space-x-px to make buttons flush */}
      <button
        className={`
          ${commonButtonClasses}
          ${mainStreamViewMode === 'memo' ? activeClasses : inactiveClasses}
          border border-r-0 ${mainStreamViewMode === 'memo' ? 'border-r-white' : 'border-r-transparent'}
          ${mainStreamViewMode === 'memo' ? '' : 'hover:border-r-transparent'}
          `}
        style={{
          borderTopColor: searchBarBorderColor,
          borderLeftColor: searchBarBorderColor,
          borderBottomColor: searchBarBorderColor,
          transform: 'skewX(-15deg)', // Apply trapezoidal shape
          marginLeft: '-15px', // Adjust to make it flush
          paddingLeft: '30px', // Counter-skew padding
          paddingRight: '15px',
          marginRight: '-15px', // Overlap with search bar
        }}
        onClick={() => setMainStreamViewMode('memo')}
      >
        <span style={{ transform: 'skewX(15deg)', display: 'inline-block' }}>Memo</span> {/* Counter-skew content */}
      </button>

      <button
        className={`
          ${commonButtonClasses}
          ${mainStreamViewMode === 'ai_conv' ? activeClasses : inactiveClasses}
          border border-l-0 ${mainStreamViewMode === 'ai_conv' ? 'border-l-white' : 'border-l-transparent'}
          ${mainStreamViewMode === 'ai_conv' ? '' : 'hover:border-l-transparent'}
        `}
        style={{
          borderTopColor: searchBarBorderColor,
          borderRightColor: searchBarBorderColor,
          borderBottomColor: searchBarBorderColor,
          transform: 'skewX(15deg)', // Apply trapezoidal shape
          marginRight: '-15px', // Adjust to make it flush
          paddingRight: '30px', // Counter-skew padding
          paddingLeft: '15px',
          marginLeft: '-15px', // Overlap with search bar
        }}
        onClick={() => setMainStreamViewMode('ai_conv')}
      >
        <span style={{ transform: 'skewX(-15deg)', display: 'inline-block' }}>AI Convo</span> {/* Counter-skew content */}
      </button>
    </div>
  );
};

export default MainStreamToggle;