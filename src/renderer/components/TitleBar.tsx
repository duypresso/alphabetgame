import React from 'react';
import { ipcRenderer } from 'electron';
import '../styles/titlebar.css';

const TitleBar: React.FC = () => {
  const handleMinimize = () => {
    ipcRenderer.send('window-minimize');
  };

  const handleMaximize = () => {
    ipcRenderer.send('window-maximize');
  };

  const handleClose = () => {
    ipcRenderer.send('window-close');
  };

  return (
    <div className="titlebar">
      <div className="titlebar-drag">
        <span className="titlebar-title">🎯 Alphabet Learning Game</span>
      </div>
      <div className="titlebar-controls">
        <button className="titlebar-button minimize" onClick={handleMinimize}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="2" y="5" width="8" height="2" fill="currentColor" />
          </svg>
        </button>
        <button className="titlebar-button maximize" onClick={handleMaximize}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
        <button className="titlebar-button close" onClick={handleClose}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M3,3 L9,9 M9,3 L3,9" stroke="currentColor" strokeWidth="1.1" fill="none" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TitleBar; 