import React, { useEffect } from 'react';
import Phaser from 'phaser';
import { MainMenuScene } from './MainMenu';
import { AlphabetScene } from './Game';

const App: React.FC = () => {
  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: 'phaser-game',
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#f0f7ff',
      scene: [MainMenuScene, AlphabetScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1024,
        height: 768,
        min: {
          width: 800,
          height: 600
        },
        max: {
          width: 2048,
          height: 1536
        }
      },
      physics: {
        default: 'arcade',
        arcade: {
          debug: false
        }
      }
    };

    try {
      const game = new Phaser.Game(config);
      return () => {
        game.destroy(true);
      };
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  }, []);

  return (
    <div className="game-wrapper">
      <div id="phaser-game" />
    </div>
  );
};

export default App;
