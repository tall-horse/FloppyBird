class Scene1 extends Phaser.Scene {
    constructor() {
        super("bootGame");
    }

    preload() {
        this.load.image("background-day", "assets/sprites/background-day.png");
        this.load.image("yellowbird-downflap", "assets/sprites/yellowbird-downflap.png");
        this.load.image("yellowbird-midflap", "assets/sprites/yellowbird-midflap.png");
        this.load.image("yellowbird-upflap", "assets/sprites/yellowbird-upflap.png");
        this.load.image("base", "assets/sprites/base.png");
        this.load.image("pipe", "assets/sprites/pipe-green.png");
        this.load.image("0", "assets/sprites/0.png");
        this.load.image("1", "assets/sprites/1.png");
        this.load.image("2", "assets/sprites/2.png");
        this.load.image("3", "assets/sprites/3.png");
        this.load.image("4", "assets/sprites/4.png");
        this.load.image("5", "assets/sprites/5.png");
        this.load.image("6", "assets/sprites/6.png");
        this.load.image("7", "assets/sprites/7.png");
        this.load.image("8", "assets/sprites/8.png");
        this.load.image("9", "assets/sprites/9.png");
        this.load.image("message", "assets/sprites/message.png");
    }

    create() {
        this.add.text(20, 20, "Loading game...");
        this.scene.start("playGame");
    }
}