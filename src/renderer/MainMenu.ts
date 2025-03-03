import 'phaser';

const { ipcRenderer } = window.require('electron');

export class MainMenuScene extends Phaser.Scene {
    private startButton: Phaser.GameObjects.Container;

    constructor() {
        super({ key: 'MainMenu' });
        // Clear cache when menu loads
        this.clearCache();
    }

    create() {
        // Create background gradient
        const bg = this.add.graphics();
        bg.fillGradientStyle(0xf0f7ff, 0xf0f7ff, 0xe6f0ff, 0xe6f0ff, 1);
        bg.fillRect(0, 0, 1024, 768);

        // Add title with shadow
        const title = this.add.text(512, 200, '🎯 Alphabet Game 🎯', {
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
            targets: title,
            y: '+=10',
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });

        // Create start button container
        this.startButton = this.add.container(512, 400);

        // Button background with gradient
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x4CAF50);
        buttonBg.fillRoundedRect(-100, -30, 200, 60, 15);

        // Add glow effect
        const glow = this.add.circle(0, 0, 120, 0x4CAF50, 0.2);
        
        // Button text
        const buttonText = this.add.text(0, 0, 'Start Game!', {
            fontSize: '32px',
            fontFamily: 'Comic Sans MS',
            color: '#ffffff',
            stroke: '#45a049',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Add everything to button container
        this.startButton.add([glow, buttonBg, buttonText]);

        // Make button interactive
        buttonBg.setInteractive(new Phaser.Geom.Rectangle(-100, -30, 200, 60), 
            Phaser.Geom.Rectangle.Contains)
            .on('pointerover', () => {
                buttonBg.clear();
                buttonBg.fillStyle(0x45a049);
                buttonBg.fillRoundedRect(-100, -30, 200, 60, 15);
                this.startButton.setScale(1.05);
                this.game.canvas.style.cursor = 'pointer';
            })
            .on('pointerout', () => {
                buttonBg.clear();
                buttonBg.fillStyle(0x4CAF50);
                buttonBg.fillRoundedRect(-100, -30, 200, 60, 15);
                this.startButton.setScale(1);
                this.game.canvas.style.cursor = 'default';
            })
            .on('pointerdown', () => {
                // Add click effect
                this.startButton.setScale(0.95);
                
                // Add particle effect
                this.addClickParticles();
                
                // Transition to game scene
                this.time.delayedCall(500, () => {
                    this.scene.start('AlphabetScene');
                });
            });

        // Add pulse animation to glow
        this.tweens.add({
            targets: glow,
            scale: 1.2,
            alpha: 0.1,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });

        // Add some decorative stars
        this.addDecorations();
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

        particles.emitParticleAt(512, 400);
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
}
