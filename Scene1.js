class Scene1 extends Phaser.Scene {
    constructor() {
        super("bootGame");
    }

    preload() {
        this.load.image("background-day", "assets/sprites/background-day.png");
        this.load.image("yellowbird-midflap", "assets/sprites/yellowbird-midflap.png");
        this.load.image("base", "assets/sprites/base.png");
        this.load.image("pipe", "assets/sprites/pipe-green.png");
    }

    create() {
        this.add.text(20, 20, "Loading game...");
        this.scene.start("playGame");
    }
}