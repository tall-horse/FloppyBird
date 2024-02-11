class Scene2 extends Phaser.Scene {
    constructor() {
        super("playGame");
    }

    create() {
        this.background = this.add.image(0, 0, "background-day");
        this.background.setOrigin(0, 0);

        var config = this.game.config;
        var platforms = this.physics.add.staticGroup();
        this.player = this.physics.add.sprite(config.width / 2, config.height / 2, "yellowbird-midflap");

        this.cursors = this.input.keyboard.createCursorKeys();

        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);

        platforms.create(config.width / 2, config.height, "base");
        this.physics.add.collider(this.player, platforms);
        this.add.text(20, 20, "Playing game", { font: "25px Arial", fill: "yellow" });
    }

    update() {
        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-250);
        }
    }
    setupPlayer() {
        console.log("I am working");
    }
}