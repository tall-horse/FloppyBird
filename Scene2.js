class Scene2 extends Phaser.Scene {
    constructor() {
        super("playGame");
        var score = 0;
        var scoreContainer;
        var baseHeight = 112;
        var baseWidth = 336;
        var config;
        this.upAngle = -20;
        this.downAngle = 90;
        this.previousVelocityY = 0;
        this.floatingTime = 0;
        this.isPlaying = false;
        this.jumpForce = -175;
    }

    create() {
        this.background = this.add.image(0, 0, "background-day");
        this.background.setDepth(0);
        this.background.setOrigin(0, 0);

        this.config = this.game.config;
        this.player = this.physics.add.sprite(this.config.width / 2, this.config.height / 2, "yellowbird-midflap");
        this.player.setDepth(1);
        this.player.body.setAllowGravity(false);

        this.platforms = this.physics.add.group();
        this.gapsGroup = this.physics.add.group();

        for (let i = 0; i < 3; i++) {
            this.platforms.create((i * this.config.width) + (this.config.width / 2), this.config.height, "base");
        }
        this.platforms.setDepth(1);
        this.platforms.children.iterate(function (child) {
            child.body.allowGravity = false;
        });
        this.platforms.setVelocityX(-100);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.scoreContainer = this.add.container(20, 20);
        this.updateScoreUI();
        this.restartButton = this.add.text(this.config.width / 2, this.config.height / 3, 'Restart', { fontFamily: 'Arial', fontSize: 24, color: '#000000', backgroundColor: '#F3B95F' })
            .setInteractive()
            .on('pointerdown', () => {
                this.restartScene();
            });
        //this.restartButton.setInteractive(false);
        this.restartButton.setVisible(false);
        this.restartButton.disableInteractive();
        this.restartButton.setDepth(4);
        //this.welcomeMessage = this.add.sprite(this.config.width / 2, this.config.height / 2, "message");
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
        this.pipes.setDepth(0);
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
    startGame() {
        this.isPlaying = true;
        this.physics.resume();
        this.player.body.setAllowGravity(true);
        this.managePipes();
        this.createCollisonRules(this.platforms);
        //this.welcomeMessage.setActive(false);
    }
    hit() {
        this.score = 0; // Reset the score
        this.isPlaying = false;
        this.physics.pause();
        this.player.stop();
        this.restartButton.setVisible(false);
        this.restartButton.disableInteractive();
        this.time.delayedCall(1000, () => {
            this.restartButton.setVisible(true);
            this.restartButton.setInteractive();
        }, [], this);
    }

    update() {
        const self = this;
        this.groundParallax(self);
        if (this.cursors.up.isDown || this.cursors.space.isDown) {
            if (!this.isPlaying) {
                this.startGame();
            }
            this.player.setVelocityY(this.jumpForce);
        }
        if (!this.isPlaying) return;
        this.pipes.setVelocityX(-100);
        this.scoreTrigger.body.setVelocityX(-100);
        this.ReplacePipePair();

        const currentVelocityY = this.player.body.velocity.y;

        this.floatingTime += this.game.loop.delta;
        // Check if the bird is moving upwards or downwards
        if (currentVelocityY < this.previousVelocityY) {
            // Bird is moving upwards
            this.tweens.add({
                targets: this.player,
                duration: 100, // Set the desired time in milliseconds
                angle: this.upAngle,
                ease: 'Linear'
            });
            this.floatingTime = 0;
            //this.player.setRotation(this.upAngle);
        } if (this.floatingTime >= 1150 && currentVelocityY > this.previousVelocityY) {
            // Bird is moving downwards
            this.tweens.add({
                targets: this.player,
                duration: 200, // Set the desired time in milliseconds
                angle: this.downAngle,
                ease: 'Linear'
            });
            this.floatingTime = 0;
        }

        // Store the current velocity for the next frame
        this.previousVelocityY = currentVelocityY;
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
            this.scoreContainer.setDepth(3);
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