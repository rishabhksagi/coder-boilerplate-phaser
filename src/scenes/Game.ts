import Phaser from 'phaser';

export class Game extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super('Game');
  }

  create() {
    // Create a colored rectangle as the player
    const rect = this.add.rectangle(400, 300, 48, 48, 0x00aaff);
    this.physics.add.existing(rect);
    this.player = rect as Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };

    // Keep player within world bounds
    this.player.body.setCollideWorldBounds(true);

    // Set up arrow key input
    this.cursors = this.input.keyboard!.createCursorKeys();

    // Instructions text
    this.add.text(16, 16, 'Use arrow keys to move', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
    });
  }

  update() {
    const speed = 200;
    const body = this.player.body;

    body.setVelocity(0);

    if (this.cursors.left.isDown) {
      body.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      body.setVelocityX(speed);
    }

    if (this.cursors.up.isDown) {
      body.setVelocityY(-speed);
    } else if (this.cursors.down.isDown) {
      body.setVelocityY(speed);
    }
  }
}
