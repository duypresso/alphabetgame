import 'phaser';

const { ipcRenderer } = window.require('electron');

export class MainMenuScene extends Phaser.Scene {
    private startButton: Phaser.GameObjects.Container;
    private practiceButton: Phaser.GameObjects.Container;
    private title: Phaser.GameObjects.Text;
    private bg: Phaser.GameObjects.Graphics;
    private bgMusic: Phaser.Sound.BaseSound;

    constructor() {
        super({ key: 'MainMenu' });
        // Clear cache when menu loads
        this.clearCache();
    }

    preload() {
        // Load audio file
        this.load.setBaseURL(window.location.href.replace(/\/[^/]*$/, '/'));
        this.load.audio('menuMusic', 'assets/audio/mainmenu.mp3');
    }

    create() {
        // Start background music
        this.bgMusic = this.sound.add('menuMusic', {
            volume: 0.5,
            loop: true
        });
        this.bgMusic.play();

        // Create background gradient
        this.bg = this.add.graphics();
        this.updateBackground();

        // Add title with shadow
        this.title = this.add.text(this.cameras.main.width / 2, this.cameras.main.height * 0.25, '🎯 Alphabet Game 🎯', {
            fontSize: '64px',
            fontFamily: 'Comic Sans MS',
            color: '#4A4A4A',
            stroke: '#ffffff',
            strokeThickness: 8,
            shadow: {
                color: '#000000',
                fill: true,
                offsetX: 2,
                offsetY: 2,
                blur: 8
            }
        }).setOrigin(0.5);

        // Create floating animation for title
        this.tweens.add({
            targets: this.title,
            y: '+=10',
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });

        // Calculate vertical center and spacing
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        const buttonSpacing = 80; // Space between buttons

        // Create start button container at center minus half spacing
        this.startButton = this.add.container(centerX, centerY - buttonSpacing/2);

        // Button background with gradient
        const startButtonBg = this.add.graphics();
        startButtonBg.fillStyle(0x4CAF50);
        startButtonBg.fillRoundedRect(-100, -30, 200, 60, 15);

        // Add glow effect
        const startGlow = this.add.circle(0, 0, 120, 0x4CAF50, 0.2);
        
        // Button text
        const startButtonText = this.add.text(0, 0, 'Start Game!', {
            fontSize: '32px',
            fontFamily: 'Comic Sans MS',
            color: '#ffffff',
            stroke: '#45a049',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Add everything to button container
        this.startButton.add([startGlow, startButtonBg, startButtonText]);

        // Create practice button container at center plus half spacing
        this.practiceButton = this.add.container(centerX, centerY + buttonSpacing/2);

        // Practice button background with gradient
        const practiceButtonBg = this.add.graphics();
        practiceButtonBg.fillStyle(0x2196F3);
        practiceButtonBg.fillRoundedRect(-100, -30, 200, 60, 15);

        // Add glow effect
        const practiceGlow = this.add.circle(0, 0, 120, 0x2196F3, 0.2);
        
        // Practice button text
        const practiceButtonText = this.add.text(0, 0, 'Practice Mode', {
            fontSize: '32px',
            fontFamily: 'Comic Sans MS',
            color: '#ffffff',
            stroke: '#1976D2',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Add everything to practice button container
        this.practiceButton.add([practiceGlow, practiceButtonBg, practiceButtonText]);

        // Make start button interactive
        startButtonBg.setInteractive(new Phaser.Geom.Rectangle(-100, -30, 200, 60), 
            Phaser.Geom.Rectangle.Contains)
            .on('pointerover', () => {
                startButtonBg.clear();
                startButtonBg.fillStyle(0x45a049);
                startButtonBg.fillRoundedRect(-100, -30, 200, 60, 15);
                this.startButton.setScale(1.05);
                this.game.canvas.style.cursor = 'pointer';
            })
            .on('pointerout', () => {
                startButtonBg.clear();
                startButtonBg.fillStyle(0x4CAF50);
                startButtonBg.fillRoundedRect(-100, -30, 200, 60, 15);
                this.startButton.setScale(1);
                this.game.canvas.style.cursor = 'default';
            })
            .on('pointerdown', () => {
                // Add click effect
                this.startButton.setScale(0.95);
                
                // Add particle effect
                this.addClickParticles();
                
                // Stop music and transition to game scene
                this.stopMusic();
                this.time.delayedCall(500, () => {
                    this.scene.start('AlphabetScene');
                });
            });

        // Make practice button interactive
        practiceButtonBg.setInteractive(new Phaser.Geom.Rectangle(-100, -30, 200, 60), 
            Phaser.Geom.Rectangle.Contains)
            .on('pointerover', () => {
                practiceButtonBg.clear();
                practiceButtonBg.fillStyle(0x1976D2);
                practiceButtonBg.fillRoundedRect(-100, -30, 200, 60, 15);
                this.practiceButton.setScale(1.05);
                this.game.canvas.style.cursor = 'pointer';
            })
            .on('pointerout', () => {
                practiceButtonBg.clear();
                practiceButtonBg.fillStyle(0x2196F3);
                practiceButtonBg.fillRoundedRect(-100, -30, 200, 60, 15);
                this.practiceButton.setScale(1);
                this.game.canvas.style.cursor = 'default';
            })
            .on('pointerdown', () => {
                // Add click effect
                this.practiceButton.setScale(0.95);
                
                // Add particle effect
                this.addClickParticles();
                
                // Stop music and transition to practice mode scene
                this.stopMusic();
                this.time.delayedCall(500, () => {
                    this.scene.start('PracticeMode');
                });
            });

        // Add pulse animation to glows
        this.tweens.add({
            targets: [startGlow, practiceGlow],
            scale: 1.2,
            alpha: 0.1,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });

        // Add some decorative stars
        this.addDecorations();

        // Ensure we're in fullscreen mode
        if (!document.fullscreenElement) {
            this.scale.startFullscreen();
        }
    }

    handleResize(width: number, height: number) {
        // Update background
        this.updateBackground();

        // Update title position
        if (this.title) {
            this.title.setPosition(width / 2, height * 0.25);
        }

        // Calculate new vertical center and update button positions
        const centerY = height / 2;
        const buttonSpacing = 80;

        // Update start button position
        if (this.startButton) {
            this.startButton.setPosition(width / 2, centerY - buttonSpacing/2);
        }

        // Update practice button position
        if (this.practiceButton) {
            this.practiceButton.setPosition(width / 2, centerY + buttonSpacing/2);
        }
    }

    private updateBackground() {
        if (this.bg) {
            this.bg.clear();
            this.bg.fillGradientStyle(0xf0f7ff, 0xf0f7ff, 0xe6f0ff, 0xe6f0ff, 1);
            this.bg.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        }
    }

    private async clearCache() {
        try {
            await ipcRenderer.invoke('clear-cache');
            console.log('Cache cleared');
        } catch (err) {
            console.error('Failed to clear cache:', err);
        }
    }

    private addClickParticles() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
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

        particles.emitParticleAt(centerX, centerY);
        this.time.delayedCall(1000, () => particles.destroy());
    }

    private addDecorations() {
        // Add floating stars
        for (let i = 0; i < 10; i++) {
            const x = Phaser.Math.Between(100, 924);
            const y = Phaser.Math.Between(100, 668);
            const star = this.add.star(x, y, 5, 2, 8, 0xFFD700, 0.5);
            
            this.tweens.add({
                targets: star,
                y: y + Phaser.Math.Between(-20, 20),
                alpha: 0.2,
                duration: Phaser.Math.Between(2000, 4000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.inOut'
            });
        }
    }

    private stopMusic() {
        if (this.bgMusic) {
            this.bgMusic.stop();
        }
    }
}
