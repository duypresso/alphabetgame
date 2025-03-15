import 'phaser';
import { WordService } from '../services/wordService';
import { Word } from '../types/Word';

// Add this helper function near the top of your file
function getFillStyle(color: string | null): string | CanvasGradient | CanvasPattern {
    return color || 'black'; // Default to black if color is null
}

export class AlphabetScene extends Phaser.Scene {
  private eggs: Phaser.GameObjects.Sprite[] = [];
  private letters: string[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  private currentIndex: number = 0;
  private debugText!: Phaser.GameObjects.Text;
  private particleManager!: Phaser.GameObjects.Particles.ParticleEmitter;
  private warningText: Phaser.GameObjects.Text | null = null;
  private warningContainer: Phaser.GameObjects.Container | null = null;
  private progressBar!: Phaser.GameObjects.Container;
  private confettiEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private fireworksEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private starsEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private timelineContainer!: Phaser.GameObjects.Container;
  private currentWordImage: Phaser.GameObjects.Image | null = null;
  private wordContainer: Phaser.GameObjects.Container | null = null;
  private wordsForLetters: { [key: string]: string[] } = {
    'A': ['Apple', 'Cat', 'Train', 'Brain'],
    'B': ['Ball', 'Blue', 'Rabbit', 'Robot'],
    'C': ['Car', 'Cat', 'Candy', 'Circle'],
    // ...add more words for each letter
  };
  private wordImages: { [key: string]: string[] } = {
    'A': ['apple', 'airplane', 'ant'],
    'B': ['ball', 'banana', 'butterfly'],
    'C': ['cat', 'car', 'cake'],
    // Add entries for all letters...
  };
  private currentWord?: Word;
  private wordImage?: Phaser.GameObjects.Image;
  private screenWidth: number = 0;
  private screenHeight: number = 0;
  private bgMusic: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'AlphabetScene' });
  }

  async preload() {
    try {
      this.load.setBaseURL(window.location.href.replace(/\/[^/]*$/, '/'));
      
      // Load core assets
      this.load.image('egg', 'assets/egg.png');
      this.load.image('broken_egg', 'assets/broken_egg.png');
      this.load.image('particle', 'assets/particle.png');
      
      // Load background music
      this.load.audio('gameplayMusic', 'assets/audio/gameplay.mp3');

      // Load word images for each letter from backend
      for (const letter of this.letters) {
        try {
          const response = await fetch(`http://localhost:8080/api/words/${letter}`);
          const data = await response.json();
          
          // Load each image URL
          data.urls.forEach((url: string, index: number) => {
            this.load.image(
              `word_${letter.toLowerCase()}_${index}`,
              url
            );
          });
        } catch (error) {
          console.error(`Error loading images for letter ${letter}:`, error);
        }
      }

      // Debug loading status
      this.load.on('filecomplete', (key: string) => {
        console.log('Loaded asset:', key);
      });

      this.load.on('complete', () => {
        console.log('All assets loaded successfully');
      });
    } catch (error) {
      console.error('Error in preload:', error);
    }
  }

  private onLoadComplete() {
    console.log('All assets loaded successfully');
    // Initialize particle system
    this.particleManager = this.add.particles(0, 0, 'particle');
  }

  private onLoadError(file: Phaser.Loader.File) {
    console.error('Failed to load:', file.key, file.src);
  }

  create() {
    // Start background music
    this.bgMusic = this.sound.add('gameplayMusic', {
        volume: 0.5,
        loop: true
    });
    this.bgMusic.play();

    // Get current screen dimensions
    const baseWidth = 1024;
    const baseHeight = 768;
    const scale = Math.min(
      this.cameras.main.width / baseWidth,
      this.cameras.main.height / baseHeight
    );

    // Create background
    const bg = this.add.graphics()
      .setName('background');
    bg.fillGradientStyle(0xf0f7ff, 0xf0f7ff, 0xe6f0ff, 0xe6f0ff, 1);
    bg.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

    // Add back to menu button in top-left corner with padding based on screen size
    const padding = Math.max(20 * scale, 15);
    const backButton = this.add.container(padding, padding).setName('backButton');
    const backButtonBg = this.add.graphics();
    backButtonBg.fillStyle(0x4CAF50);
    const buttonWidth = Math.min(120 * scale, 140);
    const buttonHeight = Math.min(50 * scale, 60);
    backButtonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 15);
    const backButtonText = this.add.text(0, 0, '← Menu', {
        fontSize: `${Math.max(24 * scale, 18)}px`,
        fontFamily: 'Comic Sans MS',
        color: '#ffffff'
    }).setOrigin(0.5);
    backButton.add([backButtonBg, backButtonText]);

    // Make back button interactive with scaled hitbox
    backButtonBg.setInteractive(new Phaser.Geom.Rectangle(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight), 
        Phaser.Geom.Rectangle.Contains)
        .on('pointerover', () => {
            backButtonBg.clear();
            backButtonBg.fillStyle(0x45a049);
            backButtonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 15);
            this.game.canvas.style.cursor = 'pointer';
        })
        .on('pointerout', () => {
            backButtonBg.clear();
            backButtonBg.fillStyle(0x4CAF50);
            backButtonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 15);
            this.game.canvas.style.cursor = 'default';
        })
        .on('pointerdown', () => {
            this.tweens.add({
                targets: backButton,
                scale: 0.95,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    this.stopMusic();
                    this.scene.start('MainMenu');
                }
            });
        });

    // Add scaled title with responsive positioning
    const title = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height * 0.08, // Adjusted position for better spacing
      '🥚 Break the Eggs! 🥚',
      {
        fontSize: `${Math.max(48 * scale, 32)}px`,
        fontFamily: 'Comic Sans MS',
        color: '#4A4A4A',
        stroke: '#ffffff',
        strokeThickness: Math.max(6 * scale, 3),
        shadow: {
          color: '#000000',
          fill: true,
          offsetX: Math.max(2 * scale, 1),
          offsetY: Math.max(2 * scale, 1),
          blur: 8
        }
      }
    ).setOrigin(0.5)
      .setName('title');

    // Calculate grid dimensions with responsive spacing
    const gridConfig = {
      cols: 7,
      rows: 4,
      eggBaseSize: Math.min(100 * scale, 120), // Cap maximum egg size
      spacing: Math.min(130 * scale, 150), // Increased maximum spacing
      eggScale: Math.min(0.7 * scale, 0.8) // Slightly increased maximum scale
    };

    // Calculate total grid width and height
    const totalGridWidth = gridConfig.spacing * (gridConfig.cols - 1);
    const totalGridHeight = gridConfig.spacing * (gridConfig.rows - 1);

    // Calculate starting position to center the grid with better vertical spacing
    const startX = (this.cameras.main.width - totalGridWidth) / 2;
    const startY = this.cameras.main.height * 0.15; // Adjusted for better vertical distribution

    // Create eggs grid with consistent sizes
    for (let i = 0; i < this.letters.length; i++) {
      const row = Math.floor(i / gridConfig.cols);
      const col = i % gridConfig.cols;
      
      const x = startX + col * gridConfig.spacing;
      const y = startY + row * gridConfig.spacing;

      // Add scaled shadow with consistent size
      this.add.ellipse(
        x + 4 * scale,
        y + 4 * scale,
        gridConfig.eggBaseSize * gridConfig.eggScale,
        gridConfig.eggBaseSize * 1.2 * gridConfig.eggScale,
        0x000000,
        0.15
      );

      const egg = this.add.sprite(x, y, 'egg')
        .setScale(gridConfig.eggScale)
        .setInteractive({ useHandCursor: true });

      // Setup egg data and events
      this.setupEgg(egg, i);

      // Store letter data but don't show preview
      egg.setData('letter', this.letters[i]);
      egg.setData('index', i);
      egg.setData('broken', false);

      this.eggs.push(egg);

      // Add number indicator with scaled font size
      const numberText = this.add.text(x, y + 5, `${i + 1}`, {
        fontSize: `${Math.max(24 * scale, 16)}px`, // Minimum font size of 16px
        fontFamily: 'Comic Sans MS',
        color: '#666666',
        stroke: '#ffffff',
        strokeThickness: Math.max(1 * scale, 0.5)
      }).setOrigin(0.5).setAlpha(0.5);

      egg.setData('numberText', numberText);
    }

    // Add progress bar at bottom
    this.createProgressBar(scale);

    // Setup confetti emitter
    this.setupConfetti();

    // Setup fireworks
    this.setupFireworks();

    // Add resize handler
    this.scale.on('resize', this.handleResize, this);
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    const newWidth = gameSize.width;
    const newHeight = gameSize.height;
    const scale = Math.min(newWidth / 1024, newHeight / 768);

    // Update back button with responsive sizing
    const backButton = this.children.getByName('backButton') as Phaser.GameObjects.Container;
    if (backButton) {
        const padding = Math.max(20 * scale, 15);
        backButton.setPosition(padding, padding);
        const backButtonBg = backButton.list[0] as Phaser.GameObjects.Graphics;
        const backButtonText = backButton.list[1] as Phaser.GameObjects.Text;
        if (backButtonBg) {
            backButtonBg.clear();
            const buttonWidth = Math.min(120 * scale, 140);
            const buttonHeight = Math.min(50 * scale, 60);
            backButtonBg.fillStyle(0x4CAF50);
            backButtonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 15);
        }
        if (backButtonText) {
            backButtonText.setFontSize(Math.max(24 * scale, 18));
        }
    }

    // Update title with responsive positioning
    const title = this.children.getByName('title') as Phaser.GameObjects.Text;
    if (title) {
        title.setPosition(newWidth / 2, newHeight * 0.08);
        title.setFontSize(Math.max(48 * scale, 32));
        title.setStroke('#ffffff', Math.max(6 * scale, 3));
        title.setShadow(
            Math.max(2 * scale, 1),
            Math.max(2 * scale, 1),
            '#000000',
            8,
            true
        );
    }

    // Update background
    const bg = this.children.getByName('background') as Phaser.GameObjects.Graphics;
    if (bg) {
        bg.clear();
        bg.fillGradientStyle(0xf0f7ff, 0xf0f7ff, 0xe6f0ff, 0xe6f0ff, 1);
        bg.fillRect(0, 0, newWidth, newHeight);
    }

    // Calculate new grid dimensions
    const gridConfig = {
        cols: 7,
        rows: 4,
        eggBaseSize: Math.min(100 * scale, 120),
        spacing: Math.min(130 * scale, 150),
        eggScale: Math.min(0.7 * scale, 0.8)
    };

    // Calculate total grid width and height
    const totalGridWidth = gridConfig.spacing * (gridConfig.cols - 1);
    const totalGridHeight = gridConfig.spacing * (gridConfig.rows - 1);

    // Calculate new starting position to center the grid
    const startX = (newWidth - totalGridWidth) / 2;
    const startY = newHeight * 0.15;

    // Update eggs grid
    this.eggs.forEach((egg, i) => {
        const row = Math.floor(i / gridConfig.cols);
        const col = i % gridConfig.cols;
        
        const x = startX + col * gridConfig.spacing;
        const y = startY + row * gridConfig.spacing;

        // Update egg position and scale
        egg.setPosition(x, y).setScale(gridConfig.eggScale);

        // Update number text
        const numberText = egg.getData('numberText') as Phaser.GameObjects.Text;
        if (numberText) {
            numberText.setPosition(x, y + 5);
            numberText.setFontSize(Math.max(24 * scale, 16));
            numberText.setStrokeThickness(Math.max(1 * scale, 0.5));
        }

        // Update letter container if exists
        const letterContainer = egg.getData('letterContainer') as Phaser.GameObjects.Container;
        if (letterContainer) {
            letterContainer.setPosition(x, y);
            const letterText = letterContainer.list[1] as Phaser.GameObjects.Text;
            if (letterText) {
                letterText.setFontSize(Math.max(52 * scale, 32));
                letterText.setStrokeThickness(Math.max(6 * scale, 3));
            }
        }
    });

    // Update progress bar
    if (this.timelineContainer) {
        const barWidth = Math.min(800 * scale, 800);
        const barHeight = 30 * scale;
        const y = newHeight - 50 * scale;

        this.timelineContainer.setPosition(newWidth / 2, y);

        // Update background bar
        const bg = this.timelineContainer.list[0] as Phaser.GameObjects.Rectangle;
        if (bg) {
            bg.setSize(barWidth, barHeight);
            bg.setStrokeStyle(2 * scale, 0xcccccc);
        }

        // Update progress fill
        const fill = this.timelineContainer.getData('fill') as Phaser.GameObjects.Rectangle;
        if (fill) {
            fill.setSize(fill.width, barHeight);
        }

        // Update milestone markers
        const milestones = [0.25, 0.5, 0.75, 1];
        milestones.forEach((milestone, index) => {
            const x = -barWidth/2 + barWidth * milestone;
            const marker = this.timelineContainer.list[index * 2 + 2] as Phaser.GameObjects.Ellipse;
            const label = this.timelineContainer.list[index * 2 + 3] as Phaser.GameObjects.Text;
            
            if (marker) {
                marker.setPosition(x, 0);
                marker.setRadius(8 * scale);
                marker.setStrokeStyle(2 * scale, 0xffffff);
            }
            
            if (label) {
                label.setPosition(x, -20 * scale);
                label.setFontSize(16 * scale);
            }
        });

        // Update letter indicator
        const letterIndicator = this.timelineContainer.getData('indicator') as Phaser.GameObjects.Container;
        if (letterIndicator) {
            letterIndicator.setY(15 * scale);
            const bubble = letterIndicator.list[0] as Phaser.GameObjects.Ellipse;
            const letterText = letterIndicator.list[1] as Phaser.GameObjects.Text;
            
            if (bubble) bubble.setRadius(15 * scale);
            if (letterText) letterText.setFontSize(18 * scale);
        }
    }

    // Update word container if exists
    if (this.wordContainer) {
        this.wordContainer.setPosition(newWidth / 2, newHeight / 2);
        
        // Update overlay
        const overlay = this.wordContainer.list[0] as Phaser.GameObjects.Rectangle;
        if (overlay) {
            overlay.setSize(newWidth, newHeight);
        }

        // Update display box
        const displayWidth = 600 * scale;
        const displayHeight = 400 * scale;
        const bg = this.wordContainer.list[1] as Phaser.GameObjects.Rectangle;
        if (bg) {
            bg.setSize(displayWidth, displayHeight);
            bg.setStrokeStyle(4 * scale, 0x4CAF50);
        }

        // Update word text
        const wordText = this.wordContainer.list[3] as Phaser.GameObjects.Text;
        if (wordText) {
            wordText.setFontSize(48 * scale);
            wordText.setStrokeThickness(4 * scale);
        }

        // Update speaker icon
        const speakerBg = this.wordContainer.list[4] as Phaser.GameObjects.Ellipse;
        const speakerIcon = this.wordContainer.list[5] as Phaser.GameObjects.Text;
        if (speakerBg) {
            speakerBg.setRadius(25 * scale);
            speakerBg.setPosition(wordText.x + wordText.width/2 + 40 * scale, 80 * scale);
        }
        if (speakerIcon) {
            speakerIcon.setFontSize(32 * scale);
            speakerIcon.setPosition(speakerBg.x, speakerBg.y);
        }

        // Update close button
        const closeButton = this.wordContainer.list[6] as Phaser.GameObjects.Ellipse;
        const closeX = this.wordContainer.list[7] as Phaser.GameObjects.Text;
        if (closeButton) {
            closeButton.setRadius(20 * scale);
            closeButton.setPosition(displayWidth/2 - 30 * scale, -displayHeight/2 + 30 * scale);
        }
        if (closeX) {
            closeX.setFontSize(32 * scale);
            closeX.setPosition(closeButton.x, closeButton.y);
        }
    }
  }

  private setupEgg(egg: Phaser.GameObjects.Sprite, index: number) {
    egg.setData('letter', this.letters[index]);
    egg.setData('index', index);
    egg.setData('broken', false);

    // Add hover effects with consistent scaling
    egg.on('pointerover', () => {
      if (index === this.currentIndex) {
        this.tweens.add({
          targets: egg,
          scale: egg.scale * 1.05,  // Reduced hover scale for consistency
          duration: 200,
          ease: 'Back.out'
        });
        egg.setTint(0xffff00);
      }
    });

    egg.on('pointerout', () => {
      this.tweens.add({
        targets: egg,
        scale: 0.7,  // Return to base scale
        duration: 200,
        ease: 'Back.out'
      });
      egg.clearTint();
    });

    egg.on('pointerdown', () => {
      // Check if the egg is actually broken by looking at its data
      const isBroken = egg.getData('broken');
      
      if (index === this.currentIndex) {
        this.breakEgg(egg);
      } else if (index > this.currentIndex) {
        this.showError(egg);
      } else if (isBroken) {
        // Only show "Already broken" message if the egg is actually broken
        const alreadyBrokenEffect = this.add.text(
          egg.x,
          egg.y - 40,
          'Already broken!',
          {
            fontSize: '16px',
            fontFamily: 'Comic Sans MS',
            color: '#666666'
          }
        ).setOrigin(0.5);

        this.tweens.add({
          targets: alreadyBrokenEffect,
          y: egg.y - 60,
          alpha: 0,
          duration: 800,
          onComplete: () => alreadyBrokenEffect.destroy()
        });
      }
    });

    this.eggs.push(egg);
  }

  private showError(egg: Phaser.GameObjects.Sprite) {
    // Clear previous warning
    if (this.warningContainer) {
      this.warningContainer.destroy();
    }

    // Get screen dimensions and scale
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    const scale = Math.min(screenWidth / 1024, screenHeight / 768);

    // Get screen center coordinates
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;

    // Create warning container at screen center
    this.warningContainer = this.add.container(centerX, centerY);

    // Add dark overlay covering the entire screen
    const overlay = this.add.rectangle(
        0,
        0,
        screenWidth,
        screenHeight,
        0x000000,
        0.3
    ).setOrigin(0.5)
      .setInteractive();
    
    // Create warning box with proper dimensions
    const boxWidth = Math.min(500 * scale, 500);
    const boxHeight = Math.min(300 * scale, 300);
    
    const warningBox = this.add.rectangle(0, 0, boxWidth, boxHeight, 0xff0000)
        .setOrigin(0.5);
    const warningBg = this.add.rectangle(0, 0, boxWidth - 4 * scale, boxHeight - 4 * scale, 0xffffff)
        .setOrigin(0.5);

    // Add warning icon and text with proper positioning
    const warningIcon = this.add.text(-boxWidth/4, -boxHeight/4, '⚠️', { 
        fontSize: `${40 * scale}px` 
    }).setOrigin(0.5);
    
    const warningText = this.add.text(0, -boxHeight/4, 'Oops!', {
        fontSize: `${32 * scale}px`,
        fontFamily: 'Comic Sans MS',
        color: '#ff0000',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    const messageText = this.add.text(0, 0, 
        `You need to break egg ${this.currentIndex + 1} first!`, {
        fontSize: `${24 * scale}px`,
        fontFamily: 'Comic Sans MS',
        color: '#000000',
        align: 'center',
        wordWrap: { width: boxWidth * 0.8 }
    }).setOrigin(0.5);

    // Add OK button with proper positioning
    const button = this.add.rectangle(0, boxHeight/4, 120 * scale, 40 * scale, 0x4CAF50)
        .setInteractive({ useHandCursor: true });
    const buttonText = this.add.text(0, boxHeight/4, 'OK!', {
        fontSize: `${24 * scale}px`,
        fontFamily: 'Comic Sans MS',
        color: '#ffffff'
    }).setOrigin(0.5);

    // Add everything to the container
    this.warningContainer.add([
        overlay,
        warningBox,
        warningBg,
        warningIcon,
        warningText,
        messageText,
        button,
        buttonText
    ]);

    // Add resize handler for the warning container
    const resizeHandler = () => {
      const newWidth = this.cameras.main.width;
      const newHeight = this.cameras.main.height;
      const newScale = Math.min(newWidth / 1024, newHeight / 768);

      // Update overlay
      overlay.setPosition(0, 0)
            .setSize(newWidth, newHeight);

      // Update container position
      this.warningContainer?.setPosition(newWidth / 2, newHeight / 2);

      // Update box size
      const newBoxWidth = Math.min(500 * newScale, 500);
      const newBoxHeight = Math.min(300 * newScale, 300);
      warningBox.setSize(newBoxWidth, newBoxHeight);
      warningBg.setSize(newBoxWidth - 4 * newScale, newBoxHeight - 4 * newScale);

      // Update text sizes
      warningIcon.setFontSize(40 * newScale);
      warningText.setFontSize(32 * newScale);
      messageText.setFontSize(24 * newScale);
      buttonText.setFontSize(24 * newScale);

      // Update button size and position
      button.setSize(120 * newScale, 40 * newScale);
      button.setY(newBoxHeight/4);
      buttonText.setY(newBoxHeight/4);
    };

    // Add resize listener
    this.scale.on('resize', resizeHandler);

    // Add effects
    this.cameras.main.shake(200, 0.005);
    egg.setTint(0xff0000);

    // Highlight correct egg
    const currentEgg = this.eggs[this.currentIndex];
    if (currentEgg) {
        const spotlight = this.add.circle(
            currentEgg.x - centerX,
            currentEgg.y - centerY,
            40 * scale,
            0xffff00,
            0.3
        );
        this.tweens.add({
            targets: spotlight,
            scale: 1.2,
            alpha: 0,
            duration: 1000,
            repeat: -1
        });
        this.warningContainer.add(spotlight);
    }

    // Animate warning container entrance
    this.warningContainer.setScale(0);
    this.tweens.add({
        targets: this.warningContainer,
        scale: 1,
        duration: 300,
        ease: 'Back.out'
    });

    // Handle button click
    button.on('pointerdown', () => {
        this.tweens.add({
            targets: this.warningContainer,
            scale: 0,
            duration: 200,
            ease: 'Back.in',
            onComplete: () => {
                if (this.warningContainer) {
                    this.warningContainer.destroy();
                    this.warningContainer = null;
                }
                egg.clearTint();
            }
        });
    });

    // Hover effects for button
    button.on('pointerover', () => {
        button.setFillStyle(0x45a049);
        this.game.canvas.style.cursor = 'pointer';
        this.tweens.add({
            targets: [button, buttonText],
            scale: 1.1,
            duration: 100
        });
    });

    button.on('pointerout', () => {
        button.setFillStyle(0x4CAF50);
        this.game.canvas.style.cursor = 'default';
        this.tweens.add({
            targets: [button, buttonText],
            scale: 1.0,
            duration: 100
        });
    });

    // Auto-dismiss after 3 seconds
    this.time.delayedCall(3000, () => {
        if (this.warningContainer && this.warningContainer.active) {
            button.emit('pointerdown');
        }
    });
  }

  private async breakEgg(egg: Phaser.GameObjects.Sprite) {
    if (egg.getData('broken')) return;
    
    // Don't break egg if word display is still showing
    if (this.wordContainer) {
        return;
    }
    
    try {
      const letter = egg.getData('letter');
      egg.setData('broken', true);

      // Remove number indicator
      const numberText = egg.getData('numberText');
      if (numberText) {
        numberText.destroy();
      }

      // Play cracking sound if available
      // this.sound.play('crack'); // Uncomment if you have a sound asset

      // Step 1: Add initial shake effect
      const shakeIntensity = 3;
      const originalX = egg.x;
      const originalY = egg.y;
      const shakeTween = this.tweens.add({
        targets: egg,
        x: { value: () => originalX + Phaser.Math.Between(-shakeIntensity, shakeIntensity) },
        y: { value: () => originalY + Phaser.Math.Between(-shakeIntensity, shakeIntensity) },
        duration: 50,
        repeat: 5,
        yoyo: true,
        onComplete: () => {
          // Step 2: Create subtle squash effect
          this.tweens.add({
            targets: egg,
            scaleX: 1.15,
            scaleY: 0.85,
            duration: 120,
            ease: 'Sine.easeInOut',
            onComplete: () => {
              // Create first batch of small particles (pre-break)
              if (this.particleManager) {
                const emitter = this.particleManager.createEmitter({
                  speed: { min: 20, max: 40 },
                  scale: { start: 0.05, end: 0 },
                  alpha: { start: 1, end: 0 },
                  lifespan: 400,
                  blendMode: 'ADD',
                  tint: 0xFFFFCC
                });
                
                emitter.explode(8, egg.x, egg.y);
              }
              
              // Step 3: Switch to broken egg with "pop" effect
              this.tweens.add({
                targets: egg,
                scaleX: 1.2,
                scaleY: 0.8,
                duration: 80,
                ease: 'Elastic.easeOut',
                onComplete: () => {
                  // Switch to broken texture
                  egg.setTexture('broken_egg');
                  
                  // Step 4: Create shell fragment effect (main particles)
                  if (this.particleManager) {
                    const shellEmitter = this.particleManager.createEmitter({
                      speed: { min: 50, max: 150 },
                      scale: { start: 0.15, end: 0 },
                      angle: { min: 0, max: 360 },
                      rotate: { min: 0, max: 360 },
                      alpha: { start: 1, end: 0 },
                      lifespan: { min: 600, max: 800 },
                      tint: [0xFFFFCC, 0xFFEEAA, 0xFFFFFF]
                    });
                    
                    shellEmitter.explode(20, egg.x, egg.y);
                  }
                  
                  // Step 5: Return to normal scale with slight bounce
                  this.tweens.add({
                    targets: egg,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 200,
                    ease: 'Back.easeOut',
                    onComplete: () => {
                      // Step 6: Short delay before showing letter
                      this.time.delayedCall(250, () => {
                        // Create letter display
                        this.createLetterDisplay(egg, letter);
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
      
      this.currentIndex++;
      this.updateProgress();
      
      // Check if all eggs are broken
      if (this.currentIndex >= this.letters.length) {
        this.time.delayedCall(1000, () => {
          this.showCongratulations();
        });
      }

    } catch (error) {
      console.error('Error breaking egg:', error);
    }
  }

  private createLetterDisplay(egg: Phaser.GameObjects.Sprite, letter: string) {
    // Create letter container
    const letterContainer = this.add.container(egg.x, egg.y);
    
    // Add glowing background with interactive capability
    const glow = this.add.circle(0, 0, 40, 0xffff00, 0.3)
        .setInteractive({ useHandCursor: true });
    
    // Add letter with enhanced styling
    const letterText = this.add.text(0, 0, letter, {
      fontSize: '52px',
      fontFamily: 'Comic Sans MS',
      color: '#4A4A4A',
      stroke: '#ffffff',
      strokeThickness: 6,
      shadow: {
        color: '#000000',
        fill: true,
        offsetX: 2,
        offsetY: 2,
        blur: 8
      }
    }).setOrigin(0.5);

    letterContainer.add([glow, letterText]);
    letterContainer.setScale(0);

    // Add reveal animation
    this.tweens.add({
      targets: letterContainer,
      scale: 1,
      duration: 400,
      ease: 'Back.out'
    });

    // Add click handler to show word
    glow.on('pointerdown', async () => {
        // Fetch new random word each time
        await this.loadWordData(letter);
    });

    // Add hover effects
    glow.on('pointerover', () => {
      this.tweens.add({
        targets: letterContainer,
        scale: 1.1,
        duration: 200,
        ease: 'Back.out'
      });
      this.game.canvas.style.cursor = 'pointer';
    });

    glow.on('pointerout', () => {
      this.tweens.add({
        targets: letterContainer,
        scale: 1,
        duration: 200,
        ease: 'Back.out'
      });
      this.game.canvas.style.cursor = 'default';
    });

    // Add pulsing hint effect
    this.tweens.add({
      targets: glow,
      alpha: 0.5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
  }

  private async loadWordData(letter: string) {
    try {
        const loadingText = this.add.text(512, 384, 'Loading...', {
            fontSize: '32px',
            fontFamily: 'Comic Sans MS',
            color: '#000000'
        }).setOrigin(0.5);

        const response = await fetch(`http://localhost:8080/api/words/${letter}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received word data:', data); // Debug log

        this.currentWord = {
            _id: data._id || '',
            letter: data.letter,
            word: data.word,
            imageUrl: data.imageUrl
        };

        // Add loading indicator
        const imageKey = `word-image-${letter}-${Date.now()}`; // Unique key for each load
        
        // Load the image
        this.load.image(imageKey, data.imageUrl);
        
        // Wait for image to load
        await new Promise((resolve, reject) => {
            this.load.once('complete', resolve);
            this.load.once('loaderror', reject);
            this.load.start();
        });

        loadingText.destroy();
        
        // Store the image key for use in displayWord
        this.currentWord.imageKey = imageKey;
        this.displayWord();

    } catch (error) {
        console.error('Error loading word:', error);
        if (loadingText) loadingText.setText('Failed to load word');
    }
}

private displayWord() {
    if (!this.currentWord) return;

    // Clear existing word container
    if (this.wordContainer) {
        this.wordContainer.destroy();
    }

    // Get the camera dimensions for proper centering
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Create new container for word display
    this.wordContainer = this.add.container(centerX, centerY);

    // Create semi-transparent overlay covering the entire screen
    const overlay = this.add.rectangle(
        0,
        0,
        this.cameras.main.width,
        this.cameras.main.height,
        0x000000,
        0.7
    ).setOrigin(0.5);

    // Create white background for the word display
    const displayWidth = 600;
    const displayHeight = 400;
    const bg = this.add.rectangle(0, 0, displayWidth, displayHeight, 0xffffff)
        .setStrokeStyle(4, 0x4CAF50)
        .setOrigin(0.5);

    // Add image using the stored key
    const image = this.add.image(0, -50, this.currentWord.imageKey);
    
    // Scale image to fit while maintaining aspect ratio
    const maxImageWidth = displayWidth * 0.8;
    const maxImageHeight = displayHeight * 0.5;
    const scaleX = maxImageWidth / image.width;
    const scaleY = maxImageHeight / image.height;
    const scale = Math.min(scaleX, scaleY);
    image.setScale(scale);

    // Add word text below the image
    const wordText = this.add.text(0, 80, this.currentWord.word.toUpperCase(), {
        fontSize: '48px',
        fontFamily: 'Comic Sans MS',
        color: '#000000',
        stroke: '#ffffff',
        strokeThickness: 4
    }).setOrigin(0.5);

    // Add speaker icon next to the word
    const speakerBg = this.add.circle(wordText.x + wordText.width/2 + 40, 80, 25, 0x4CAF50)
        .setInteractive({ useHandCursor: true });
    const speakerIcon = this.add.text(wordText.x + wordText.width/2 + 40, 80, '🔊', {
        fontSize: '32px'
    }).setOrigin(0.5);

    // Add hover and click effects for speaker
    speakerBg.on('pointerover', () => {
        this.tweens.add({
            targets: [speakerBg, speakerIcon],
            scale: 1.1,
            duration: 100
        });
        this.game.canvas.style.cursor = 'pointer';
    });

    speakerBg.on('pointerout', () => {
        this.tweens.add({
            targets: [speakerBg, speakerIcon],
            scale: 1.0,
            duration: 100
        });
        this.game.canvas.style.cursor = 'default';
    });

    speakerBg.on('pointerdown', () => {
        // Visual feedback
        this.tweens.add({
            targets: [speakerBg, speakerIcon],
            scale: 0.9,
            yoyo: true,
            duration: 100
        });
        
        // Speak the word
        this.speakWord(this.currentWord.word);
    });

    // Add close button in the top-right corner
    const closeButton = this.add.circle(displayWidth/2 - 30, -displayHeight/2 + 30, 20, 0xff0000)
        .setInteractive({ useHandCursor: true });
    const closeX = this.add.text(displayWidth/2 - 30, -displayHeight/2 + 30, '×', {
        fontSize: '32px',
        fontFamily: 'Arial',
        color: '#ffffff'
    }).setOrigin(0.5);

    // Add everything to the container
    this.wordContainer.add([overlay, bg, image, wordText, speakerBg, speakerIcon, closeButton, closeX]);

    // Add entrance animation
    this.wordContainer.setScale(0);
    this.tweens.add({
        targets: this.wordContainer,
        scale: 1,
        duration: 300,
        ease: 'Back.out'
    });

    // Close functionality
    const closeWordDisplay = () => {
        this.tweens.add({
            targets: this.wordContainer,
            scale: 0,
            duration: 200,
            ease: 'Back.in',
            onComplete: () => {
                if (this.wordContainer) {
                    this.wordContainer.destroy();
                    this.wordContainer = null;
                    // Clear texture from cache
                    if (this.currentWord && this.currentWord.imageKey) {
                        this.textures.remove(this.currentWord.imageKey);
                    }
                }
            }
        });
    };

    // Make both the X button and overlay clickable
    closeButton.setInteractive({ useHandCursor: true })
        .on('pointerdown', closeWordDisplay);
    closeX.setInteractive({ useHandCursor: true })
        .on('pointerdown', closeWordDisplay);
    overlay.on('pointerdown', closeWordDisplay);

    // Add hover effects for close button
    closeButton.on('pointerover', () => {
        this.tweens.add({
            targets: [closeButton, closeX],
            scale: 1.2,
            duration: 100
        });
        this.game.canvas.style.cursor = 'pointer';
    });

    closeButton.on('pointerout', () => {
        this.tweens.add({
            targets: [closeButton, closeX],
            scale: 1.0,
            duration: 100
        });
        this.game.canvas.style.cursor = 'default';
    });
  }

  // Add the speech function
  private speakWord(word: string) {
    // Create speech synthesis utterance
    const utterance = new SpeechSynthesisUtterance(word);
    
    // Configure the voice
    utterance.rate = 0.8; // Slightly slower for clarity
    utterance.pitch = 1;
    
    // Get available voices and try to set a child-friendly English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoices = voices.filter(voice => voice.lang.startsWith('en-'));
    
    if (englishVoices.length > 0) {
        // Prefer voices with "child" in the name, otherwise use the first English voice
        const childVoice = englishVoices.find(voice => 
            voice.name.toLowerCase().includes('child') ||
            voice.name.toLowerCase().includes('junior')
        );
        utterance.voice = childVoice || englishVoices[0];
    }
    
    // Speak the word
    window.speechSynthesis.speak(utterance);
  }

  private showLetter(egg: Phaser.GameObjects.Sprite, letter: string) {
    // Remove preview text
    const preview = egg.getData('preview');
    if (preview) preview.destroy();

    // Create letter container
    const letterContainer = this.add.container(egg.x, egg.y);
    
    // Add glowing background
    const glow = this.add.circle(0, 0, 40, 0xffff00, 0.3);
    
    // Add letter with enhanced styling
    const letterText = this.add.text(0, 0, letter, {
      fontSize: '52px',
      fontFamily: 'Comic Sans MS',
      color: '#4A4A4A',
      stroke: '#ffffff',
      strokeThickness: 6,
      shadow: {
        color: '#000000',
        fill: true,
        offsetX: 2,
        offsetY: 2,
        blur: 8
      }
    }).setOrigin(0.5);

    letterContainer.add([glow, letterText]);
    letterContainer.setScale(0);

    // Add reveal animation sequence
    this.tweens.add({
      targets: letterContainer,
      scale: 1,
      duration: 400,
      ease: 'Back.out',
      onComplete: () => {
        // Add floating animation
        this.tweens.add({
          targets: letterContainer,
          y: letterContainer.y - 3, // Reduced float distance
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });
        
        // Add rotating glow effect
        this.tweens.add({
          targets: glow,
          angle: 360,
          duration: 3000,
          repeat: -1,
          ease: 'Linear'
        });
      }
    });

    // Make letter clickable
    letterText.setInteractive({ useHandCursor: true });
    letterText.on('pointerdown', () => {
      this.showWordExample(letter);
    });

    // Add hint that letter is clickable
    this.tweens.add({
      targets: letterText,
      scale: '*=1.1',
      duration: 200,
      yoyo: true,
      repeat: 2
    });

    // Celebrate progress milestones
    const progress = this.currentIndex / this.letters.length;
    if (progress === 0.25 || progress === 0.5 || progress === 0.75) {
      this.celebrateProgress();
    }

    this.updateProgress();
  }

  private showWordExample(letter: string) {
    if (this.wordContainer) {
      this.wordContainer.destroy();
    }

    // Create popup container in center
    this.wordContainer = this.add.container(512, 384);

    // Semi-transparent dark overlay
    const overlay = this.add.rectangle(0, 0, 1024, 768, 0x000000, 0.7)
      .setOrigin(0.5)
      .setInteractive();

    // Create main content box
    const boxWidth = 800;
    const boxHeight = 500;
    const box = this.add.rectangle(0, 0, boxWidth, boxHeight, 0xffffff)
      .setStrokeStyle(4, 0x4CAF50);

    // Add title
    const title = this.add.text(0, -boxHeight/2 + 40, 
      `Words with letter '${letter}'`, {
      fontSize: '32px',
      fontFamily: 'Comic Sans MS',
      color: '#4A4A4A',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Create word grid container
    const gridContainer = this.add.container(0, 0);
    
    // Get words for this letter
    const words = this.wordImages[letter] || [];
    
    // Create word cards
    words.forEach((word, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = (col - 0.5) * 350; // 2 columns
      const y = (row - 0.5) * 200; // Row spacing

      // Create word card
      const card = this.createWordCard(word, letter, x, y);
      gridContainer.add(card);
    });

    // Add close button
    const closeBtn = this.add.circle(boxWidth/2 - 30, -boxHeight/2 + 30, 20, 0xff0000)
      .setInteractive({ useHandCursor: true });
    const closeX = this.add.text(closeBtn.x, closeBtn.y, '×', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Add everything to main container
    this.wordContainer.add([overlay, box, title, gridContainer, closeBtn, closeX]);

    // Animate container entrance
    this.wordContainer.setScale(0);
    this.tweens.add({
      targets: this.wordContainer,
      scale: 1,
      duration: 300,
      ease: 'Back.out'
    });

    // Close functionality
    const closePopup = () => {
      this.tweens.add({
        targets: this.wordContainer,
        scale: 0,
        duration: 200,
        ease: 'Back.in',
        onComplete: () => {
          if (this.wordContainer) {
            this.wordContainer.destroy();
            this.wordContainer = null;
          }
        }
      });
    };

    closeBtn.on('pointerdown', closePopup);
    overlay.on('pointerdown', closePopup);
  }

  private createWordCard(word: string, highlightLetter: string, x: number, y: number): Phaser.GameObjects.Container {
    const cardContainer = this.add.container(x, y);
    
    // Card background
    const card = this.add.rectangle(0, 0, 300, 160, 0xf8f8f8)
      .setStrokeStyle(2, 0xcccccc);
    
    // Word image
    const image = this.add.image(0, -20, `word_${word}`)
      .setScale(0.8);
    
    // Create highlighted word text
    const wordContainer = this.add.container(0, 60);
    let xOffset = 0;
    
    // Split word into characters and create individual text objects
    word.split('').forEach(char => {
      const isHighlight = char.toLowerCase() === highlightLetter.toLowerCase();
      const charText = this.add.text(xOffset, 0, char, {
        fontSize: '28px',
        fontFamily: 'Comic Sans MS',
        color: isHighlight ? '#ff0000' : '#4A4A4A',
        stroke: isHighlight ? '#ffff00' : null,
        strokeThickness: isHighlight ? 4 : 0
      }).setOrigin(0, 0.5);

      if (isHighlight) {
        this.tweens.add({
          targets: charText,
          scale: 1.2,
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });
      }

      wordContainer.add(charText);
      xOffset += charText.width;
    });
    
    // Center the word
    wordContainer.setX(-xOffset / 2);

    // Add speaker icon
    const speakerBg = this.add.circle(wordContainer.x + xOffset/2 + 30, 60, 20, 0x4CAF50)
        .setInteractive({ useHandCursor: true });
    const speakerIcon = this.add.text(wordContainer.x + xOffset/2 + 30, 60, '🔊', {
        fontSize: '24px'
    }).setOrigin(0.5);

    // Add hover and click effects for speaker
    speakerBg.on('pointerover', () => {
        this.tweens.add({
            targets: [speakerBg, speakerIcon],
            scale: 1.1,
            duration: 100
        });
    });

    speakerBg.on('pointerout', () => {
        this.tweens.add({
            targets: [speakerBg, speakerIcon],
            scale: 1.0,
            duration: 100
        });
    });

    speakerBg.on('pointerdown', () => {
        // Visual feedback
        this.tweens.add({
            targets: [speakerBg, speakerIcon],
            scale: 0.9,
            yoyo: true,
            duration: 100
        });
        
        // Speak the word
        this.speakWord(word);
    });

    // Add hover effect for the whole card
    card.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        this.tweens.add({
          targets: card,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 200,
          ease: 'Back.out'
        });
      })
      .on('pointerout', () => {
        this.tweens.add({
          targets: card,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          ease: 'Back.out'
        });
      });

    cardContainer.add([card, image, wordContainer, speakerBg, speakerIcon]);
    return cardContainer;
  }

  private findWordsContainingLetter(letter: string): string[] {
    // Combine all words
    const allWords = Object.values(this.wordsForLetters).flat();
    // Filter words containing the letter (case insensitive)
    return [...new Set(allWords.filter(word => 
      word.toLowerCase().includes(letter.toLowerCase())
    ))].slice(0, 6); // Limit to 6 words
  }

  private createHighlightedWord(word: string, letter: string, x: number, y: number, container: Phaser.GameObjects.Container) {
    const chars = word.split('');
    let xOffset = 0;
    
    chars.forEach((char, i) => {
      const isHighlighted = char.toLowerCase() === letter.toLowerCase();
      const charText = this.add.text(x + xOffset, y, char, {
        fontSize: '28px',
        fontFamily: 'Comic Sans MS',
        color: isHighlighted ? '#ff0000' : '#4A4A4A',
        stroke: isHighlighted ? '#ffff00' : null,
        strokeThickness: isHighlighted ? 4 : 0
      });

      if (isHighlighted) {
        this.tweens.add({
          targets: charText,
          scale: 1.2,
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });
      }

      container.add(charText);
      xOffset += charText.width;
    });
  }

  private createSparkles(x: number, y: number) {
    for (let i = 0; i < 5; i++) {
      const spark = this.add.star(x, y, 5, 2, 4, 0xFFD700);
      this.tweens.add({
        targets: spark,
        x: x + Phaser.Math.Between(-50, 50),
        y: y + Phaser.Math.Between(-50, 50),
        alpha: 0,
        scale: 0,
        duration: 1000,
        ease: 'Cubic.out',
        onComplete: () => spark.destroy()
      });
    }
  }

  private createProgressBar(scale: number) {
    const width = Math.min(800 * scale, 800); // Cap maximum width
    const height = 30 * scale;
    const y = this.cameras.main.height - 50 * scale; // Position relative to bottom
    
    this.timelineContainer = this.add.container(this.cameras.main.width / 2, y);
    
    // Add background bar
    const bg = this.add.rectangle(0, 0, width, height, 0xeeeeee)
      .setOrigin(0.5)
      .setAlpha(0.5)
      .setStrokeStyle(2 * scale, 0xcccccc);
    
    // Add progress fill
    const fill = this.add.rectangle(-width/2, 0, 0, height, 0x4CAF50)
      .setOrigin(0, 0.5);
    
    // Add milestone markers
    const milestones = [0.25, 0.5, 0.75, 1];
    milestones.forEach(milestone => {
      const x = -width/2 + width * milestone;
      const marker = this.add.circle(x, 0, 8 * scale, 0xFFD700)
        .setStrokeStyle(2 * scale, 0xffffff);
      
      const label = this.add.text(x, -20 * scale, `${milestone * 100}%`, {
        fontSize: `${16 * scale}px`,
        fontFamily: 'Comic Sans MS',
        color: '#666666'
      }).setOrigin(0.5);

      this.timelineContainer.add([marker, label]);
    });

    // Add current letter indicator
    const letterIndicator = this.add.container(0, 15 * scale);
    const bubble = this.add.circle(0, 0, 15 * scale, 0x4CAF50);
    const letterText = this.add.text(0, 0, 'A', {
      fontSize: `${18 * scale}px`,
      fontFamily: 'Comic Sans MS',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    letterIndicator.add([bubble, letterText]);
    letterIndicator.setData('text', letterText);
    
    this.timelineContainer.add([bg, fill, letterIndicator]);
    this.timelineContainer.setData('fill', fill);
    this.timelineContainer.setData('indicator', letterIndicator);

    // Add animated glow effect
    const glow = this.add.circle(0, 0, 20 * scale, 0x4CAF50, 0.3);
    this.timelineContainer.add(glow);
    this.tweens.add({
      targets: glow,
      scale: 1.5,
      alpha: 0,
      duration: 1000,
      repeat: -1
    });

    // Add resize handler for the progress bar
    const resizeHandler = () => {
      const newWidth = this.cameras.main.width;
      const newHeight = this.cameras.main.height;
      const newScale = Math.min(newWidth / 1024, newHeight / 768);
      const newBarWidth = Math.min(800 * newScale, 800);
      const newBarHeight = 30 * newScale;
      const newY = newHeight - 50 * newScale;

      // Update container position
      this.timelineContainer?.setPosition(newWidth / 2, newY);

      // Update background bar
      bg.setSize(newBarWidth, newBarHeight);
      bg.setStrokeStyle(2 * newScale, 0xcccccc);

      // Update progress fill
      fill.setSize(fill.width, newBarHeight);

      // Update milestone markers
      milestones.forEach((milestone, index) => {
        const x = -newBarWidth/2 + newBarWidth * milestone;
        const marker = this.timelineContainer?.list[index * 2] as Phaser.GameObjects.Circle;
        const label = this.timelineContainer?.list[index * 2 + 1] as Phaser.GameObjects.Text;
        
        if (marker) {
          marker.setPosition(x, 0);
          marker.setRadius(8 * newScale);
          marker.setStrokeStyle(2 * newScale, 0xffffff);
        }
        
        if (label) {
          label.setPosition(x, -20 * newScale);
          label.setFontSize(16 * newScale);
        }
      });

      // Update letter indicator
      letterIndicator.setY(15 * newScale);
      bubble.setRadius(15 * newScale);
      letterText.setFontSize(18 * newScale);

      // Update glow effect
      glow.setRadius(20 * newScale);
    };

    // Add resize listener
    this.scale.on('resize', resizeHandler);
  }

  private setupConfetti() {
    this.confettiEmitter = this.add.particles(0, 0, 'particle', {
      frame: 0,
      quantity: 1,
      frequency: -1,
      scale: { start: 0.2, end: 0 },
      alpha: { start: 1, end: 0 },
      speed: { min: 100, max: 200 },
      angle: { min: -120, max: -60 },
      gravityY: 300,
      lifespan: 2000,
      tint: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00]
    });
  }

  private setupFireworks() {
    this.fireworksEmitter = this.add.particles(0, 0, 'particle', {
      frame: 0,
      lifespan: 2000,
      speed: { min: 200, max: 400 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      blendMode: 'ADD',
      tint: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff]
    });

    this.starsEmitter = this.add.particles(0, 0, 'particle', {
      frame: 0,
      lifespan: 3000,
      speed: { min: 50, max: 100 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 1, end: 0 },
      blendMode: 'ADD',
      tint: 0xFFD700
    });
  }

  private updateProgress() {
    const width = 800;
    const progress = this.currentIndex / this.letters.length;
    const fill = this.timelineContainer.getData('fill');
    const indicator = this.timelineContainer.getData('indicator');
    const letterText = indicator.getData('text');
    
    // Update progress bar
    this.tweens.add({
      targets: fill,
      width: width * progress,
      duration: 300,
      ease: 'Cubic.out'
    });

    // Update indicator position
    this.tweens.add({
      targets: indicator,
      x: -width/2 + width * progress,
      duration: 300,
      ease: 'Back.out'
    });

    // Update current letter
    if (this.currentIndex < this.letters.length) {
      letterText.setText(this.letters[this.currentIndex]);
    }

    // Add celebration effect at milestones
    const milestones = [0.25, 0.5, 0.75];
    if (milestones.includes(progress)) {
      this.celebrateMilestone(-width/2 + width * progress);
    }
  }

  private celebrateMilestone(x: number) {
    // Add sparkle effect at milestone
    for (let i = 0; i < 10; i++) {
      const spark = this.add.star(
        x + Phaser.Math.Between(-10, 10),
        680 + Phaser.Math.Between(-10, 10),
        5,
        2,
        4,
        0xFFD700
      );
      
      this.tweens.add({
        targets: spark,
        scale: { from: 0.5, to: 0 },
        alpha: { from: 1, to: 0 },
        angle: 360,
        duration: 1000,
        ease: 'Cubic.out',
        onComplete: () => spark.destroy()
      });
    }
  }

  private celebrateProgress() {
    // Show celebration text
    const celebrationText = this.add.text(400, 300, 'Great Progress! 🎉', {
      fontSize: '48px',
      fontFamily: 'Comic Sans MS',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: { blur: 10, color: '#000000', fill: true }
    }).setOrigin(0.5).setScale(0);

    // Animate celebration text
    this.tweens.add({
      targets: celebrationText,
      scale: 1,
      duration: 500,
      ease: 'Back.out',
      yoyo: true,
      hold: 1000,
      onComplete: () => celebrationText.destroy()
    });

    // Burst of confetti
    this.confettiEmitter.explode(50, 400, 300);
  }

  private showCongratulations() {
    // Get current screen dimensions and scale
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    const scale = Math.min(
      screenWidth / 1024,
      screenHeight / 768
    );

    // Create dark overlay that covers the entire screen
    const overlay = this.add.rectangle(
      screenWidth / 2,
      screenHeight / 2,
      screenWidth,
      screenHeight,
      0x000000,
      0.7
    ).setOrigin(0.5);

    // Create celebration container centered on screen
    const container = this.add.container(screenWidth / 2, screenHeight / 2);

    // Add congratulations text with rainbow effect
    const congratsText = this.add.text(0, -screenHeight * 0.15, 'Congratulations! 🎉', {
      fontSize: `${64 * scale}px`,
      fontFamily: 'Comic Sans MS',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8 * scale,
      shadow: { blur: 10, color: '#000000', fill: true }
    }).setOrigin(0.5);

    // Add completion message
    const message = this.add.text(0, 0, 
      "You've learned all the letters!\nGreat job! 🌟", {
      fontSize: `${32 * scale}px`,
      fontFamily: 'Comic Sans MS',
      align: 'center',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Add replay button with scaled dimensions
    const buttonWidth = 200 * scale;
    const buttonHeight = 60 * scale;
    const button = this.add.rectangle(0, screenHeight * 0.15, buttonWidth, buttonHeight, 0x4CAF50)
      .setInteractive({ useHandCursor: true });
    const buttonText = this.add.text(0, screenHeight * 0.15, 'Play Again!', {
      fontSize: `${28 * scale}px`,
      fontFamily: 'Comic Sans MS',
      color: '#ffffff'
    }).setOrigin(0.5);

    container.add([congratsText, message, button, buttonText]);

    // Rainbow animation for congratulations text
    let hue = 0;
    this.time.addEvent({
      delay: 50,
      callback: () => {
        hue = (hue + 0.01) % 1;
        congratsText.setTint(Phaser.Display.Color.HSLToColor(hue, 1, 0.5).color);
      },
      loop: true
    });

    // Animate container entrance
    container.setScale(0);
    this.tweens.add({
      targets: container,
      scale: 1,
      duration: 500,
      ease: 'Back.out'
    });

    // Launch fireworks
    this.time.addEvent({
      delay: 500,
      repeat: 10,
      callback: () => this.launchFirework(screenWidth, screenHeight),
      callbackScope: this
    });

    // Button interactions with scaled effects
    button.on('pointerover', () => {
      button.setFillStyle(0x45a049);
      this.starsEmitter.emitParticleAt(button.x + container.x, button.y + container.y, 5);
    });

    button.on('pointerout', () => {
      button.setFillStyle(0x4CAF50);
    });

    button.on('pointerdown', () => {
      // Reset game state
      this.currentIndex = 0;
      this.eggs = [];
      this.letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      
      // Remove all existing game objects
      this.children.removeAll();
      
      // Restart the scene
      this.scene.restart();
    });

    // Add resize handler for the congratulations screen
    const resizeHandler = () => {
      const newWidth = this.cameras.main.width;
      const newHeight = this.cameras.main.height;
      const newScale = Math.min(newWidth / 1024, newHeight / 768);

      // Update overlay
      overlay.setPosition(newWidth / 2, newHeight / 2)
            .setSize(newWidth, newHeight);

      // Update container position
      container.setPosition(newWidth / 2, newHeight / 2);

      // Update text sizes
      congratsText.setFontSize(64 * newScale);
      message.setFontSize(32 * newScale);
      buttonText.setFontSize(28 * newScale);

      // Update button size
      button.setSize(200 * newScale, 60 * newScale);
    };

    // Add resize listener
    this.scale.on('resize', resizeHandler);
  }

  private launchFirework(screenWidth: number, screenHeight: number) {
    const startX = Phaser.Math.Between(screenWidth * 0.2, screenWidth * 0.8);
    const startY = screenHeight;
    const endX = startX + Phaser.Math.Between(-screenWidth * 0.1, screenWidth * 0.1);
    const endY = Phaser.Math.Between(screenHeight * 0.2, screenHeight * 0.6);

    // Launch trail
    const trail = this.add.particles(0, 0, 'particle', {
      frame: 0,
      lifespan: 100,
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.5, end: 0 },
      tint: 0xffff00,
      blendMode: 'ADD'
    });

    // Rocket
    const rocket = this.add.circle(startX, startY, 3, 0xffff00);
    this.tweens.add({
      targets: rocket,
      x: endX,
      y: endY,
      duration: 1000,
      ease: 'Quad.out',
      onUpdate: () => {
        trail.emitParticleAt(rocket.x, rocket.y);
      },
      onComplete: () => {
        rocket.destroy();
        trail.destroy();
        // Explosion
        this.fireworksEmitter.setPosition(endX, endY);
        this.fireworksEmitter.explode(50);
      }
    });
  }

  private stopMusic() {
    if (this.bgMusic) {
        this.bgMusic.stop();
    }
  }
}
