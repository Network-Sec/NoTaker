import React from 'react';

interface MainStreamToggleProps {
  mainStreamViewMode: 'memo' | 'ai_conv';
  setMainStreamViewMode: (mode: 'memo' | 'ai_conv') => void;
}

const MainStreamToggle: React.FC<MainStreamToggleProps> = ({ mainStreamViewMode, setMainStreamViewMode }) => {
  return (
    <div className="main-stream-toggle">
      <button
        className={`main-stream-toggle-button ${mainStreamViewMode === 'memo' ? 'active' : ''}`}
        onClick={() => setMainStreamViewMode('memo')}
      >
        Memo
      </button>
      <button
        className={`main-stream-toggle-button ${mainStreamViewMode === 'ai_conv' ? 'active' : ''}`}
        onClick={() => setMainStreamViewMode('ai_conv')}
      >
        AI Convo
      </button>
    </div>
  );
};

export default MainStreamToggle;