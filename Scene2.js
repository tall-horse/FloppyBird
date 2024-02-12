class Scene2 extends Phaser.Scene {
    constructor() {
        super("playGame");
    }

    create() {
        this.background = this.add.image(0, 0, "background-day");
        this.background.setOrigin(0, 0);

        this.config = this.game.config;
        this.player = this.physics.add.sprite(this.config.width / 2, this.config.height / 2, "yellowbird-midflap");

        var platforms = this.physics.add.staticGroup();
        this.pipes = this.physics.add.group();
        this.pipes.create(this.config.width, this.config.height, "pipe");
        this.pipes.children.iterate(function (child) {
            child.body.allowGravity = false;
        });
        platforms.create(this.config.width / 2, this.config.height, "base");


        this.cursors = this.input.keyboard.createCursorKeys();

        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);

        this.physics.add.collider(this.player, platforms);
        this.physics.add.collider(this.player, this.pipes, this.hit, null, this);
        this.add.text(20, 20, "Playing game", { font: "25px Arial", fill: "yellow" });
    }
    hit() {
        this.physics.pause();
    }

    update() {
        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-250);
        }
        this.pipes.setVelocityX(-100);
    }
    setupPlayer() {
        console.log("I am working");
    }

}