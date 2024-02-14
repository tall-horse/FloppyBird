class Scene2 extends Phaser.Scene {
    constructor() {
        super("playGame");
        var score = 0;
        var scoreContainer;
        var baseHeight = 112;
        var baseWidth = 336;
        var config;
    }

    create() {
        this.background = this.add.image(0, 0, "background-day");
        this.background.setOrigin(0, 0);

        this.config = this.game.config;
        this.player = this.physics.add.sprite(this.config.width / 2, this.config.height / 2, "yellowbird-midflap");

        this.platforms = this.physics.add.group();
        this.gapsGroup = this.physics.add.group();
        this.managePipes();

        for (let i = 0; i < 3; i++) {
            this.platforms.create((i * this.config.width) + (this.config.width / 2), this.config.height, "base");
        }
        this.platforms.children.iterate(function (child) {
            child.body.allowGravity = false;
        });
        this.platforms.setVelocityX(-100);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.createCollisonRules(this.platforms);
        this.scoreContainer = this.add.container(20, 20);
        this.updateScoreUI();
    }
    createCollisonRules(platforms) {
        this.physics.add.collider(this.player, platforms, this.hit, null, this);
        this.physics.add.collider(this.player, this.pipes, this.hit, null, this);
        this.physics.add.overlap(this.player, this.gapsGroup, this.scoreAPoint, null, this);
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

        this.scoreTrigger = this.add.rectangle(
            this.config.width,
            this.config.height / 2,
            this.pipeWidth / 4,
            this.config.height,
            0x000000, 1 // Set the color to be invisible //red: 0xD04848
        );
        this.gapsGroup.add(this.scoreTrigger);
        this.physics.add.existing(this.scoreTrigger);
        this.scoreTrigger.body.setAllowGravity(false);
        this.scoreTrigger.setVisible(false);
        this.launchIdleAnimation();
    }

    launchIdleAnimation() {
        this.anims.create({
            key: 'birdAnimation',
            frames: [
                { key: 'yellowbird-downflap' },
                { key: 'yellowbird-midflap' },
                { key: 'yellowbird-upflap' }
            ],
            frameRate: 10,
            repeat: -1
        });
        this.player.play("birdAnimation");
    }

    hit() {
        this.score = 0; // Reset the score
        this.physics.pause();
        this.player.stop();
        this.time.delayedCall(1000, this.restartScene, [], this);
    }

    update() {
        const self = this;
        if (this.cursors.up.isDown || this.cursors.space.isDown) {
            this.player.setVelocityY(-250);
        }
        this.pipes.setVelocityX(-100);
        this.groundParallax(self);
        this.scoreTrigger.body.setVelocityX(-100);
        this.ReplacePipePair();
    }

    groundParallax(self) {
        this.platforms.children.iterate(function (child) {
            if (child.body.x <= -child.width) {
                child.x = self.config.width + child.width / 2;
            }
        });
    }

    scoreAPoint() {
        this.score++;
        this.scoreTrigger.body.checkCollision.none = true;
        this.updateScoreUI();
    }
    updateScoreUI() {
        this.scoreContainer.removeAll(true);
        const scoreString = String(this.score);
        for (let i = 0; i < scoreString.length; i++) {
            const numberImageKey = scoreString[i];
            const numberImage = this.add.image(20 * (i + 1), 20, numberImageKey);
            this.scoreContainer.add(numberImage);
        }
    }

    ReplacePipePair() {
        if (this.pipes.children.entries[0].x < 0 - this.pipeWidth) {
            this.safeHeightTop = Phaser.Math.Between(this.minTopPipeHeight, this.maxTopPipeHeight);
            this.safeHeightBottom = Phaser.Math.Between(this.minBottomPipeHeight, this.maxBottomPipeHeight);
            this.pipes.children.entries[0].x = this.config.width;
            this.pipes.children.entries[0].y = this.safeHeightTop;

            this.pipes.children.entries[1].x = this.config.width;
            this.pipes.children.entries[1].y = this.safeHeightBottom;

            this.scoreTrigger.x = this.config.width;
            this.scoreTrigger.y = this.config.height / 2;

            this.scoreTrigger.body.checkCollision.none = false;
        }
    }

    restartScene() {
        this.scene.restart();
    }

}