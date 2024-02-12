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
        this.managePipes();

        platforms.create(this.config.width / 2, this.config.height, "base");

        this.cursors = this.input.keyboard.createCursorKeys();

        this.physics.add.collider(this.player, platforms, this.hit, null, this);
        this.physics.add.collider(this.player, this.pipes, this.hit, null, this);
        //this.add.text(20, 20, "Playing game", { font: "25px Arial", fill: "yellow" });
    }
    managePipes() {
        this.pipes = this.physics.add.group();
        this.pipeWidth = 52; //softcode that
        this.pipeHeight = 320; //softcode that
        this.baseHeight = 112;
        this.minGap = this.player.height * 4; //24 * 4 = 96;//440
        this.normalGap = this.player.height * 6; //24 * 6 = 144
        //this.maxGap = max
        this.gap = this.minGap;
        this.minTopPipeHeight = 0 - (this.pipeHeight - 40); //-280
        this.maxBottomPipeHeight = this.config.height - this.baseHeight; // 468
        this.minBottomPipeHeight = this.maxBottomPipeHeight - this.pipeHeight + this.baseHeight + this.gap;
        this.maxTopPipeHeight = 0;

        this.heightTop = 0 - this.gap;
        this.heightBottom = this.heightTop + this.gap;
        this.safeZone = this.config.height / 2 - this.baseHeight;
        this.safeHeightTop = Phaser.Math.Between(this.minTopPipeHeight, this.maxTopPipeHeight);
        this.safeHeightBottom = Phaser.Math.Between(this.minBottomPipeHeight, this.maxBottomPipeHeight);
        this.pipes.create(this.config.width, this.safeHeightTop, "pipe");
        this.pipes.create(this.config.width, this.safeHeightBottom, "pipe"); //468
        this.pipes.children.iterate(function (child) {
            child.body.allowGravity = false;
            child.setOrigin(0.5, 0); //bottom of unflipped sprite is origin
        });
        this.pipes.children.entries[0].setFlipY(true);

        //this.safeZone - (this.gap / 2)
    }

    hit() {
        this.physics.pause();
        this.time.delayedCall(1000, this.restartScene, [], this);
    }

    update() {
        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-250);
        }
        this.pipes.setVelocityX(-100);
        this.ReplacePipePair();
    }
    ReplacePipePair() {
        if (this.pipes.children.entries[0].x < 0 - this.pipeWidth) {
            this.safeHeightTop = Phaser.Math.Between(this.minTopPipeHeight, this.maxTopPipeHeight);
            this.safeHeightBottom = Phaser.Math.Between(this.minBottomPipeHeight, this.maxBottomPipeHeight);
            this.pipes.children.entries[0].x = this.config.width;
            this.pipes.children.entries[0].y = this.safeHeightTop;

            this.pipes.children.entries[1].x = this.config.width;
            this.pipes.children.entries[1].y = this.safeHeightBottom;
        }
    }

    restartScene() {
        this.scene.restart();
    }

}