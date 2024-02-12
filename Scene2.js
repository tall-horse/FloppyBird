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
        this.pipeWidth = 52 //softcode that
        this.pipeHeight = 320;//softcode that
        this.minGap = this.player.height * 4; //24 * 4 = 96;//440
        //this.maxGap = max
        this.gap = this.minGap;
        this.minTopPipeHeight = 0 - (this.pipeHeight - 40); //-280
        this.maxBottomPipeHeight = this.config.height; // 468
        this.minBottomPipeHeight = this.maxBottomPipeHeight - this.pipeHeight + 112 + this.gap;
        this.maxTopPipeHeight = 0;

        this.heightTop = 0 - this.gap;
        this.heightBottom = this.heightTop + this.gap;
        this.pipes.create(this.config.width, this.minTopPipeHeight, "pipe");
        this.pipes.create(this.config.width, this.minBottomPipeHeight, "pipe");//468
        this.pipes.children.iterate(function (child) {
            child.body.allowGravity = false;
            child.setOrigin(0.5, 0); //bottom of unflipped sprite is origin
            //child.setOrigin(0.5, 0); //bottom of unflipped sprite is origin
        });
        this.pipes.children.entries[0].setFlipY(true); // origin persists despite flipping
        //
        platforms.create(this.config.width / 2, this.config.height, "base");



        this.cursors = this.input.keyboard.createCursorKeys();

        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);

        this.physics.add.collider(this.player, platforms);
        this.physics.add.collider(this.player, this.pipes, this.hit, null, this);
        //this.add.text(20, 20, "Playing game", { font: "25px Arial", fill: "yellow" });
    }
    hit() {
        this.physics.pause();
    }

    update() {
        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-250);
        }
        this.pipes.setVelocityX(-100);
        if (this.pipes.children.entries[0].x < 0 - this.pipeWidth) {
            this.pipes.children.entries[0].x = this.config.width;
            this.pipes.children.entries[0].y = this.minTopPipeHeight;

            this.pipes.children.entries[1].x = this.config.width;
            this.pipes.children.entries[1].y = this.minBottomPipeHeight;
            // this.pipes.children.entries[0].setActive(false);
            // this.pipes.children.entries[1].setActive(false);
            // console.log("time to disable");
        }
    }
    setupPlayer() {
        console.log("I am working");
    }

}