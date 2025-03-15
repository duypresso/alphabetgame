import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { MainMenuScene } from './MainMenu';
import { AlphabetScene } from './Game';
import { PracticeModeScene } from './PracticeMode';
import './App.css';

const App: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const [showQuitMenu, setShowQuitMenu] = useState(false);

  useEffect(() => {
    // Request fullscreen immediately
    const requestFullscreen = () => {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        (element as any).msRequestFullscreen();
      }
    };

    // Try to enter fullscreen mode immediately
    requestFullscreen();

    // Ensure fullscreen on visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden && !document.fullscreenElement) {
        requestFullscreen();
      }
    };

    // Ensure fullscreen on focus
    const handleFocus = () => {
      if (!document.fullscreenElement) {
        requestFullscreen();
      }
    };

    // Add event listeners for maintaining fullscreen
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    // Check fullscreen status periodically
    const fullscreenCheck = setInterval(() => {
      if (!document.fullscreenElement) {
        requestFullscreen();
      }
    }, 1000);

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: 'phaser-game',
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#f0f7ff',
      scene: [MainMenuScene, AlphabetScene, PracticeModeScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'phaser-game',
        width: '100%',
        height: '100%',
        min: {
          width: 800,
          height: 600
        },
        max: {
          width: 2048,
          height: 1536
        },
        fullscreenTarget: 'phaser-game',
        autoRound: true,
        expandParent: true,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        zoom: 1
      },
      physics: {
        default: 'arcade',
        arcade: {
          debug: false
        }
      }
    };

    try {
      gameRef.current = new Phaser.Game(config);

      // Start in fullscreen mode
      const startFullscreen = () => {
        if (gameRef.current) {
          gameRef.current.scale.startFullscreen();
        }
      };

      // Handle window resize with debounce
      let resizeTimeout: NodeJS.Timeout;
      const handleResize = () => {
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }

        resizeTimeout = setTimeout(() => {
          if (gameRef.current) {
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            // Update game size
            gameRef.current.scale.resize(width, height);
            
            // Force a refresh of the scale manager
            gameRef.current.scale.refresh();
            
            // Update camera bounds and size through the current scene
            const currentScene = gameRef.current.scene.getScenes(true)[0];
            if (currentScene) {
              currentScene.cameras.main.setBounds(0, 0, width, height);
              currentScene.cameras.main.setSize(width, height);
              
              // Force the scene to handle resize
              if (currentScene.handleResize) {
                currentScene.handleResize(width, height);
              }
            }

            // Ensure we stay in fullscreen
            if (!document.fullscreenElement) {
              startFullscreen();
            }
          }
        }, 100); // Debounce resize events
      };

      // Add fullscreen change listener
      const handleFullscreenChange = () => {
        if (!document.fullscreenElement) {
          startFullscreen();
        } else {
          // When entering fullscreen, ensure proper scaling
          handleResize();
        }
      };

      // Add escape key handler for quit menu
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setShowQuitMenu(prev => !prev);
        }
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.addEventListener('mozfullscreenchange', handleFullscreenChange);
      document.addEventListener('MSFullscreenChange', handleFullscreenChange);

      // Start in fullscreen mode after a short delay
      setTimeout(startFullscreen, 100);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
        document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
        clearInterval(fullscreenCheck);
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }
        gameRef.current?.destroy(true);
      };
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  }, []);

  const handleQuit = () => {
    window.close();
  };

  return (
    <div className="app-container">
      <div className="game-wrapper">
        <div id="phaser-game" />
      </div>
      {showQuitMenu && (
        <div className="quit-menu">
          <div className="quit-menu-content">
            <h2>Quit Game?</h2>
            <div className="quit-menu-buttons">
              <button onClick={() => setShowQuitMenu(false)}>Cancel</button>
              <button onClick={handleQuit}>Quit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
