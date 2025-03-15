import 'phaser';
import { WordService } from '../services/wordService';
import { Word } from '../types/Word';

export class PracticeModeScene extends Phaser.Scene {
    private currentWord: Word | null = null;
    private wordImage: Phaser.GameObjects.Image | null = null;
    private letterButtons: Phaser.GameObjects.Container[] = [];
    private score: number = 0;
    private scoreText: Phaser.GameObjects.Text | null = null;
    private feedbackText: Phaser.GameObjects.Text | null = null;
    private currentLetter: string = '';
    private errorText: Phaser.GameObjects.Text | null = null;
    private wordText: Phaser.GameObjects.Text | null = null;
    private selectedLetter: string | null = null;
    private bgMusic!: Phaser.Sound.BaseSound;

    constructor() {
        super({ key: 'PracticeMode' });
    }

    async preload() {
        // Set base URL for loading assets
        this.load.setBaseURL(window.location.href.replace(/\/[^/]*$/, '/'));
        
        // Load core assets
        this.load.image('button', 'assets/button.png');
        this.load.image('particle', 'assets/particle.png');
        
        // Load background music
        this.load.audio('gameplayMusic', 'assets/audio/gameplay.mp3');
    }

    create() {
        // Start background music
        this.bgMusic = this.sound.add('gameplayMusic', {
            volume: 0.5,
            loop: true
        });
        this.bgMusic.play();

        // Get current screen dimensions and scale
        const baseWidth = 1024;
        const baseHeight = 768;
        const scale = Math.min(
            this.cameras.main.width / baseWidth,
            this.cameras.main.height / baseHeight
        );

        // Create background
        const bg = this.add.graphics();
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

        // Add title with responsive positioning
        const title = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height * 0.08,
            'Practice Mode',
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
        ).setOrigin(0.5).setName('title');

        // Add score display with responsive positioning and scaling
        this.scoreText = this.add.text(
            this.cameras.main.width - padding,
            padding,
            'Score: 0',
            {
                fontSize: `${Math.max(32 * scale, 24)}px`,
                fontFamily: 'Comic Sans MS',
                color: '#4A4A4A',
                stroke: '#ffffff',
                strokeThickness: Math.max(4 * scale, 2)
            }
        ).setOrigin(1, 0).setName('scoreText');

        // Start the game
        this.startNewRound();

        // Add resize handler
        this.scale.on('resize', this.handleResize, this);
    }

    private async startNewRound() {
        console.log('Starting new round...');
        
        // Clear previous round
        if (this.wordImage) {
            this.wordImage.destroy();
            this.wordImage = null;
        }
        if (this.wordText) {
            this.wordText.destroy();
            this.wordText = null;
        }
        this.letterButtons.forEach(button => button.destroy());
        this.letterButtons = [];
        if (this.feedbackText) {
            this.feedbackText.destroy();
            this.feedbackText = null;
        }
        if (this.errorText) {
            this.errorText.destroy();
            this.errorText = null;
        }
        this.selectedLetter = null;

        // Get random letter
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        this.currentLetter = letters[Math.floor(Math.random() * letters.length)];
        console.log('Selected letter:', this.currentLetter);

        // Fetch word data for the letter
        try {
            console.log('Fetching word data from API...');
            const response = await fetch(`http://localhost:8080/api/words/${this.currentLetter}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Received data:', data);

            if (!data || !data.imageUrl) {
                throw new Error('No word data found for this letter');
            }

            // Use the word data with proper type annotation
            this.currentWord = {
                _id: data._id || '',
                word: data.word,
                imageUrl: data.imageUrl,
                letter: this.currentLetter
            };
            console.log('Selected word:', this.currentWord);

            // Load and display the word image
            await this.displayWord();
        } catch (error: unknown) {
            console.error('Error in startNewRound:', error);
            this.showError(`Error loading word data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async displayWord() {
        if (!this.currentWord) {
            this.showError('No word selected');
            return;
        }

        console.log('Displaying word:', this.currentWord);

        try {
            // Create a unique key for the image
            const imageKey = `word_${this.currentLetter.toLowerCase()}_${Date.now()}`;
            
            // Load the image
            await new Promise<void>((resolve, reject) => {
                this.load.image(imageKey, this.currentWord!.imageUrl);
                this.load.once('filecomplete', (key: string) => {
                    if (key === imageKey) {
                        resolve();
                    }
                });
                this.load.once('loaderror', (file: Phaser.Loader.File) => {
                    if (file.key === imageKey) {
                        reject(new Error(`Failed to load image: ${file.src}`));
                    }
                });
                this.load.start();
            });

            // Display the image
            this.wordImage = this.add.image(
                this.cameras.main.width / 2,
                this.cameras.main.height / 2 - 100,
                imageKey
            ).setScale(1.5);

            // Add word text below the image
            if (this.wordText) {
                this.wordText.destroy();
            }
            this.wordText = this.add.text(
                this.cameras.main.width / 2,
                this.cameras.main.height / 2 + 50,
                this.currentWord.word,
                {
                    fontSize: '36px',
                    fontFamily: 'Comic Sans MS',
                    color: '#4A4A4A',
                    stroke: '#ffffff',
                    strokeThickness: 4
                }
            ).setOrigin(0.5);

            // Create letter buttons
            this.createLetterButtons();
        } catch (error: unknown) {
            console.error('Error displaying word:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while displaying the word';
            this.showError(errorMessage);
        }
    }

    private showError(message: string) {
        console.error('Showing error:', message);
        if (this.errorText) {
            this.errorText.destroy();
        }
        this.errorText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            message,
            {
                fontSize: '24px',
                fontFamily: 'Comic Sans MS',
                color: '#f44336',
                backgroundColor: '#ffffff',
                padding: { x: 20, y: 10 }
            }
        ).setOrigin(0.5);

        // Retry after 3 seconds
        this.time.delayedCall(3000, () => {
            this.startNewRound();
        });
    }

    private handleResize(gameSize: Phaser.Structs.Size) {
        const newWidth = gameSize.width;
        const newHeight = gameSize.height;
        const scale = Math.min(newWidth / 1024, newHeight / 768);
        const padding = Math.max(20 * scale, 15);

        // Update back button with responsive sizing
        const backButton = this.children.getByName('backButton') as Phaser.GameObjects.Container;
        if (backButton) {
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

        // Update score text with responsive positioning
        if (this.scoreText) {
            this.scoreText.setPosition(newWidth - padding, padding);
            this.scoreText.setFontSize(Math.max(32 * scale, 24));
            this.scoreText.setStroke('#ffffff', Math.max(4 * scale, 2));
        }

        // Update word image and text if they exist
        if (this.wordImage) {
            this.wordImage.setPosition(newWidth / 2, newHeight * 0.4);
            this.wordImage.setScale(Math.min(1.5 * scale, 1.8));
        }

        if (this.wordText) {
            this.wordText.setPosition(newWidth / 2, newHeight * 0.65);
            this.wordText.setFontSize(Math.max(36 * scale, 28));
            this.wordText.setStroke('#ffffff', Math.max(4 * scale, 2));
        }

        // Update letter buttons
        this.updateLetterButtons();
    }

    private updateLetterButtons() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const scale = Math.min(
            this.cameras.main.width / 1024,
            this.cameras.main.height / 768
        );
        
        // Calculate responsive button dimensions
        const buttonSize = Math.min(40 * scale, 50);
        const buttonSpacing = Math.min(buttonSize * 1.2, 60);
        const totalWidth = letters.length * buttonSpacing;
        const startX = (this.cameras.main.width - totalWidth) / 2;
        const buttonY = this.cameras.main.height * 0.85;

        this.letterButtons.forEach((button, index) => {
            const x = startX + index * buttonSpacing + buttonSpacing/2;
            button.setPosition(x, buttonY);

            // Update button graphics
            const buttonBg = button.list[0] as Phaser.GameObjects.Graphics;
            const buttonText = button.list[1] as Phaser.GameObjects.Text;

            if (buttonBg) {
                buttonBg.clear();
                buttonBg.fillStyle(0x4CAF50);
                buttonBg.fillRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, buttonSize/4);
            }

            if (buttonText) {
                buttonText.setFontSize(Math.max(24 * scale, 18));
            }
        });
    }

    private createLetterButtons() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const scale = Math.min(
            this.cameras.main.width / 1024,
            this.cameras.main.height / 768
        );

        // Calculate responsive button dimensions
        const buttonSize = Math.min(40 * scale, 50);
        const buttonSpacing = Math.min(buttonSize * 1.2, 60);
        const totalWidth = letters.length * buttonSpacing;
        const startX = (this.cameras.main.width - totalWidth) / 2;
        const buttonY = this.cameras.main.height * 0.85;

        letters.forEach((letter, index) => {
            const x = startX + index * buttonSpacing + buttonSpacing/2;
            const button = this.add.container(x, buttonY);
            
            const buttonBg = this.add.graphics();
            buttonBg.fillStyle(0x4CAF50);
            buttonBg.fillRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, buttonSize/4);
            
            const buttonText = this.add.text(0, 0, letter, {
                fontSize: `${Math.max(24 * scale, 18)}px`,
                fontFamily: 'Comic Sans MS',
                color: '#ffffff'
            }).setOrigin(0.5);
            
            button.add([buttonBg, buttonText]);

            // Add hover effect with scaled hitbox
            buttonBg.setInteractive(
                new Phaser.Geom.Rectangle(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize),
                Phaser.Geom.Rectangle.Contains
            )
            .on('pointerover', () => {
                buttonBg.clear();
                buttonBg.fillStyle(0x45a049);
                buttonBg.fillRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, buttonSize/4);
                this.game.canvas.style.cursor = 'pointer';
            })
            .on('pointerout', () => {
                buttonBg.clear();
                buttonBg.fillStyle(0x4CAF50);
                buttonBg.fillRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, buttonSize/4);
                this.game.canvas.style.cursor = 'default';
            })
            .on('pointerdown', () => {
                this.selectedLetter = letter;
                this.checkAnswer(letter);
            });

            this.letterButtons.push(button);
        });
    }

    private checkAnswer(selectedLetter: string) {
        if (!this.currentWord) {
            console.error('No current word selected');
            return;
        }

        const isCorrect = selectedLetter === this.currentLetter;
        console.log('Answer checked:', { selectedLetter, currentLetter: this.currentLetter, isCorrect });
        
        // Show feedback
        if (this.feedbackText) {
            this.feedbackText.destroy();
        }
        this.feedbackText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height - 100,
            isCorrect ? 'Correct! 🎉' : 'Try again!',
            {
                fontSize: '32px',
                fontFamily: 'Comic Sans MS',
                color: isCorrect ? '#4CAF50' : '#f44336',
                stroke: '#ffffff',
                strokeThickness: 4
            }
        ).setOrigin(0.5);

        if (isCorrect) {
            this.score += 10;
            if (this.scoreText) {
                this.scoreText.setText(`Score: ${this.score}`);
            }
            
            // Add particle effect
            this.addParticles();
            
            // Start new round after delay
            this.time.delayedCall(1500, () => {
                this.startNewRound();
            });
        }
    }

    private addParticles() {
        const particles = this.add.particles(0, 0, 'particle', {
            speed: { min: 100, max: 200 },
            scale: { start: 0.2, end: 0 },
            alpha: { start: 1, end: 0 },
            blendMode: 'ADD',
            lifespan: 1000,
            gravityY: 200,
            quantity: 20,
            tint: [0xffff00, 0x00ff00, 0x00ffff]
        });

        particles.emitParticleAt(this.cameras.main.width / 2, this.cameras.main.height / 2);
        this.time.delayedCall(1000, () => particles.destroy());
    }

    private stopMusic() {
        if (this.bgMusic) {
            this.bgMusic.stop();
        }
    }
} 