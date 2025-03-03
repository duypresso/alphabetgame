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
  private debugText: Phaser.GameObjects.Text;
  private particleManager: Phaser.GameObjects.Particles.ParticleEmitterManager;
  private warningText: Phaser.GameObjects.Text | null = null;
  private warningContainer: Phaser.GameObjects.Container | null = null;
  private progressBar: Phaser.GameObjects.Container;
  private confettiEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private fireworksEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private starsEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private timelineContainer: Phaser.GameObjects.Container;
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
    this.particleManager = this.add.particles('particle');
  }

  private onLoadError(file: Phaser.Loader.File) {
    console.error('Failed to load:', file.key, file.src);
  }

  create() {
    // Get current screen dimensions
    const baseWidth = 1024;
    const baseHeight = 768;
    const scale = Math.min(
      this.cameras.main.width / baseWidth,
      this.cameras.main.height / baseHeight
    );

    // Calculate grid dimensions based on screen size
    const gridConfig = {
      cols: 7,
      rows: 4,
      spacing: 130 * scale,
      startX: (this.cameras.main.width - (6 * 130 * scale)) / 2,
      startY: this.cameras.main.height * 0.2,
      eggScale: 0.85 * scale
    };

    // Create background
    const bg = this.add.graphics()
      .setName('background');
    bg.fillGradientStyle(0xf0f7ff, 0xf0f7ff, 0xe6f0ff, 0xe6f0ff, 1);
    bg.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

    // Create eggs grid with scaled positions
    for (let i = 0; i < this.letters.length; i++) {
      const row = Math.floor(i / gridConfig.cols);
      const col = i % gridConfig.cols;
      
      const x = gridConfig.startX + col * gridConfig.spacing;
      const y = gridConfig.startY + row * gridConfig.spacing;

      // Add scaled shadow
      this.add.ellipse(
        x + 4 * scale,
        y + 4 * scale,
        85 * scale,
        100 * scale,
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

      // Add number indicator instead of letter
      const numberText = this.add.text(x, y + 5, `${i + 1}`, {
        fontSize: '24px',
        fontFamily: 'Comic Sans MS',
        color: '#666666',
        stroke: '#ffffff',
        strokeThickness: 1
      }).setOrigin(0.5).setAlpha(0.5);

      egg.setData('numberText', numberText);
    }

    // Add scaled title
    const title = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height * 0.1,
      '🥚 Break the Eggs! 🥚',
      {
        fontSize: `${48 * scale}px`,
        fontFamily: 'Comic Sans MS',
        color: '#4A4A4A',
        stroke: '#ffffff',
        strokeThickness: 6 * scale,
        shadow: {
          color: '#000000',
          fill: true,
          offsetX: 2 * scale,
          offsetY: 2 * scale,
          blur: 8
        }
      }
    ).setOrigin(0.5)
      .setName('title');

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
    const width = gameSize.width;
    const height = gameSize.height;
    const scale = Math.min(width / 1024, height / 768);

    this.cameras.resize(width, height);
    this.updateLayout(scale);
  }

  private updateLayout(scale: number) {
    // Update background
    const bg = this.children.getByName('background');
    if (bg) {
      bg.setSize(this.screenWidth, this.screenHeight);
    }

    // Update title
    const title = this.children.getByName('title');
    if (title) {
      title.setPosition(this.cameras.main.width / 2, this.cameras.main.height * 0.1);
      title.setScale(scale);
    }

    // Update progress bar position
    if (this.timelineContainer) {
      this.timelineContainer.setPosition(
        this.screenWidth / 2,
        this.screenHeight * 0.9
      );
    }

    // Update eggs positions
    const spacing = 130 * scale;
    const startX = (this.cameras.main.width - (6 * spacing)) / 2;
    const startY = this.cameras.main.height * 0.2;

    this.eggs.forEach((egg, i) => {
      const row = Math.floor(i / 7);
      const col = i % 7;
      const x = startX + col * spacing;
      const y = startY + row * spacing;

      egg.setPosition(x, y).setScale(0.85 * scale);

      // Update associated elements (letter display, etc.)
      const letterContainer = egg.getData('letterContainer');
      if (letterContainer) {
        letterContainer.setPosition(x, y).setScale(scale);
      }
    });
  }

  private setupEgg(egg: Phaser.GameObjects.Sprite, index: number) {
    egg.setData('letter', this.letters[index]);
    egg.setData('index', index);
    egg.setData('broken', false);

    // Add hover effects
    egg.on('pointerover', () => {
      if (index === this.currentIndex) {
        this.tweens.add({
          targets: egg,
          scale: egg.scale * 1.1,
          duration: 200,
          ease: 'Back.out'
        });
        egg.setTint(0xffff00);
      }
    });

    egg.on('pointerout', () => {
      this.tweens.add({
        targets: egg,
        scale: egg.scale / 1.1,
        duration: 200,
        ease: 'Back.out'
      });
      egg.clearTint();
    });

    egg.on('pointerdown', () => {
      if (index === this.currentIndex) {
        this.breakEgg(egg);
      } else if (index > this.currentIndex) {
        this.showError(egg);
      } else {
        // Already broken egg - do nothing
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

    // Create warning container
    this.warningContainer = this.add.container(400, 300);

    // Add dark overlay
    const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.3)
      .setOrigin(0.5)
      .setInteractive();
    this.warningContainer.add(overlay);

    // Create warning box
    const warningBox = this.add.rectangle(0, 0, 400, 200, 0xff0000)
      .setOrigin(0.5);
    const warningBg = this.add.rectangle(0, 0, 396, 196, 0xffffff)
      .setOrigin(0.5);
    this.warningContainer.add([warningBox, warningBg]);

    // Add warning icon and text
    const warningIcon = this.add.text(-150, -50, '⚠️', { fontSize: '40px' })
      .setOrigin(0.5);
    const warningText = this.add.text(0, -50, 'Oops!', {
      fontSize: '32px',
      fontFamily: 'Comic Sans MS',
      color: '#ff0000',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const messageText = this.add.text(0, 10, 
      `You need to break egg ${this.currentIndex + 1} first!`, {
      fontSize: '24px',
      fontFamily: 'Comic Sans MS',
      color: '#000000',
      align: 'center',
      wordWrap: { width: 300 }
    }).setOrigin(0.5);

    // Add OK button
    const button = this.add.rectangle(0, 60, 120, 40, 0x4CAF50)
      .setInteractive({ useHandCursor: true });
    const buttonText = this.add.text(0, 60, 'OK!', {
      fontSize: '24px',
      fontFamily: 'Comic Sans MS',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.warningContainer.add([warningIcon, warningText, messageText, button, buttonText]);

    // Add effects
    this.cameras.main.shake(200, 0.005);
    egg.setTint(0xff0000);

    // Highlight correct egg
    const currentEgg = this.eggs[this.currentIndex];
    if (currentEgg) {
      const spotlight = this.add.circle(currentEgg.x, currentEgg.y, 40, 0xffff00, 0.3);
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
    });

    button.on('pointerout', () => {
      button.setFillStyle(0x4CAF50);
      this.game.canvas.style.cursor = 'default';
    });

    // Auto-dismiss after 3 seconds
    this.time.delayedCall(3000, () => {
      if (this.warningContainer && this.warningContainer.active) {
        button.emit('pointerdown');
      }
    });

    // Add pulsing effect to correct egg
    if (currentEgg) {
      const pulseGlow = this.add.circle(currentEgg.x, currentEgg.y, 40, 0xffff00, 0.4);
      this.tweens.add({
        targets: pulseGlow,
        scale: 1.5,
        alpha: 0,
        duration: 1000,
        repeat: 2,
        onComplete: () => pulseGlow.destroy()
      });
    }

    // Highlight next egg number
    if (currentEgg) {
      const numberText = currentEgg.getData('numberText');
      if (numberText) {
        numberText.setColor('#ff0000');
        this.tweens.add({
          targets: numberText,
          scale: 1.2,
          duration: 200,
          yoyo: true,
          repeat: 2
        });
      }
    }
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

      // Create particle effect
      if (this.particleManager) {
        const emitter = this.particleManager.createEmitter({
          speed: { min: 50, max: 100 },
          scale: { start: 0.1, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 800,
          blendMode: 'ADD'
        });

        emitter.explode(20, egg.x, egg.y);
      }

      // Break egg animation
      this.tweens.add({
        targets: egg,
        scaleX: 1.1,
        scaleY: 0.9,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          egg.setTexture('broken_egg');
          // Only create letter display, don't load word data yet
          this.createLetterDisplay(egg, letter);
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

    // Create new container for word display
    const scale = Math.min(
      this.cameras.main.width / 1024,
      this.cameras.main.height / 768
    );

    const wordContainer = this.add.container(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2
    );

    // Scale the word display container
    wordContainer.setScale(scale);

    const overlayWidth = this.screenWidth;
    const overlayHeight = this.screenHeight;
    const displayWidth = Math.min(400, this.screenWidth * 0.8);
    const displayHeight = Math.min(300, this.screenHeight * 0.8);

    const overlay = this.add.rectangle(0, 0, overlayWidth, overlayHeight, 0x000000, 0.5)
        .setOrigin(0.5)
        .setInteractive();

    const bg = this.add.rectangle(0, 0, displayWidth, displayHeight, 0xffffff)
        .setStrokeStyle(2, 0x000000);

    // Add image using the stored key
    const image = this.add.image(0, -20, this.currentWord.imageKey);
    
    // Scale image to fit
    const maxWidth = 350;
    const maxHeight = 200;
    const scaleImage = Math.min(
        maxWidth / image.width,
        maxHeight / image.height
    );
    image.setScale(scaleImage);
    
    // Add word text
    const wordText = this.add.text(0, 100, this.currentWord.word.toUpperCase(), {
        fontSize: '48px',
        fontFamily: 'Comic Sans MS',
        color: '#000000',
        stroke: '#ffffff',
        strokeThickness: 4
    }).setOrigin(0.5);

    // Add close button with enlarged hit area
    const closeButton = this.add.circle(180, -130, 20, 0xff0000)
        .setInteractive({ useHandCursor: true });
    const closeX = this.add.text(180, -130, '×', {
        fontSize: '32px',
        fontFamily: 'Arial',
        color: '#ffffff'
    }).setOrigin(0.5);

    this.wordContainer.add([image, wordText, closeButton, closeX]);

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

    // Optional: Auto-close after 5 seconds
    this.time.delayedCall(5000, () => {
        if (this.wordContainer && this.wordContainer.active) {
            closeWordDisplay();
        }
    });
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

    // Add hover effect
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

    cardContainer.add([card, image, wordContainer]);
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
    const width = 800;
    const height = 30;
    const y = 680; // Position near bottom
    
    this.timelineContainer = this.add.container(512, y);
    
    // Add background bar
    const bg = this.add.rectangle(0, 0, width, height, 0xeeeeee)
      .setOrigin(0.5)
      .setAlpha(0.5)
      .setStrokeStyle(2, 0xcccccc);
    
    // Add progress fill
    const fill = this.add.rectangle(-width/2, 0, 0, height, 0x4CAF50)
      .setOrigin(0, 0.5);
    
    // Add milestone markers
    const milestones = [0.25, 0.5, 0.75, 1];
    milestones.forEach(milestone => {
      const x = -width/2 + width * milestone;
      const marker = this.add.circle(x, 0, 8, 0xFFD700)
        .setStrokeStyle(2, 0xffffff);
      
      const label = this.add.text(x, -20, `${milestone * 100}%`, {
        fontSize: '16px',
        fontFamily: 'Comic Sans MS',
        color: '#666666'
      }).setOrigin(0.5);

      this.timelineContainer.add([marker, label]);
    });

    // Add current letter indicator
    const letterIndicator = this.add.container(0, 15);
    const bubble = this.add.circle(0, 0, 15, 0x4CAF50);
    const letterText = this.add.text(0, 0, 'A', {
      fontSize: '18px',
      fontFamily: 'Comic Sans MS',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    letterIndicator.add([bubble, letterText]);
    letterIndicator.setData('text', letterText);
    
    this.timelineContainer.add([bg, fill, letterIndicator]);
    this.timelineContainer.setData('fill', fill);
    this.timelineContainer.setData('indicator', letterIndicator);

    // Add animated glow effect
    const glow = this.add.circle(0, 0, 20, 0x4CAF50, 0.3);
    this.timelineContainer.add(glow);
    this.tweens.add({
      targets: glow,
      scale: 1.5,
      alpha: 0,
      duration: 1000,
      repeat: -1
    });
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
    // Create dark overlay
    const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.7)
      .setOrigin(0);

    // Create celebration container
    const container = this.add.container(400, 300);

    // Add congratulations text with rainbow effect
    const congratsText = this.add.text(0, -100, 'Congratulations! 🎉', {
      fontSize: '64px',
      fontFamily: 'Comic Sans MS',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8,
      shadow: { blur: 10, color: '#000000', fill: true }
    }).setOrigin(0.5);

    // Add completion message
    const message = this.add.text(0, 0, 
      "You've learned all the letters!\nGreat job! 🌟", {
      fontSize: '32px',
      fontFamily: 'Comic Sans MS',
      align: 'center',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Add replay button
    const button = this.add.rectangle(0, 100, 200, 60, 0x4CAF50)
      .setInteractive({ useHandCursor: true });
    const buttonText = this.add.text(0, 100, 'Play Again!', {
      fontSize: '28px',
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
      callback: this.launchFirework,
      callbackScope: this
    });

    // Button interactions
    button.on('pointerover', () => {
      button.setFillStyle(0x45a049);
      this.starsEmitter.emitParticleAt(button.x, button.y, 5);
    });

    button.on('pointerout', () => {
      button.setFillStyle(0x4CAF50);
    });

    button.on('pointerdown', () => {
      // Reset game
      this.scene.restart();
    });
  }

  private launchFirework() {
    const startX = Phaser.Math.Between(200, 600);
    const startY = 600;
    const endX = startX + Phaser.Math.Between(-100, 100);
    const endY = Phaser.Math.Between(100, 400);

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
        // Sound effect
        // this.sound.play('explosion');
      }
    });
  }
}

// Add this interface at the top of the file with other interfaces
interface Word {
    _id: string;
    letter: string;
    word: string;
    imageUrl: string;
    imageKey?: string; // Add this new property
}
