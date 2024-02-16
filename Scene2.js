import WindEvent from './WindEvent.js';

export class Scene2 extends Phaser.Scene {
    constructor() {
        super("playGame");
        this.score = 0;
        this.scoreContainer;
        this.baseHeight = 112;
        this.sbaseWidth = 336;
        this.config;
        this.upAngle = -20;
        this.downAngle = 90;
        this.previousVelocityY = 0;
        this.floatingTime = 0;
        this.isPlaying = false;
        this.jumpForce = -175;
        this.timeBeforePipesCome = 5;
        this.closestPipePair = 0;
        this.pipeWidth = 52;
        this.pipeHeight = 320;
        this.baseHeight = 112;
        this.gameOver = false;
        this.outOfRangePipePair = null;
        this.windIsOn = false;
        this.normalSpeed = -100;
        this.modifiedSpeed;
        this.currentSpeed;
        this.windSpeed = 40;
        this.windChangeFrequency = 5;

        this.windEvent = WindEvent;
    }

    create() {
        this.setBackground();

        this.config = this.game.config;

        this.setPlayer();

        this.platforms = this.physics.add.group();
        this.pipes = this.physics.add.group();
        this.gapsGroup = this.physics.add.group();

        this.minGap = this.player.height * 4; //24 * 4 = 96;//440
        this.normalGap = this.player.height * 6; //24 * 6 = 144

        this.setPlatforms();

        this.cursors = this.input.keyboard.createCursorKeys();

        this.scoreContainer = this.add.container(20, 20);
        this.windIcon = this.add.image(this.config.width / 2, this.config.width / 4, "wind");
        this.windIcon.setScale(100 / this.windIcon.width, 100 / this.windIcon.height);
        this.windIcon.setDepth(3);
        this.windIcon.setVisible(false);
        this.updateScoreUI();
        this.updateWindUI();
        this.restartButton = this.add.text(this.config.width / 2, this.config.height / 3, 'Restart', { fontFamily: 'Arial', fontSize: 24, color: '#000000', backgroundColor: '#F3B95F' })
            .setInteractive()
            .on('pointerdown', () => {
                this.restartScene();
            });
        //this.restartButton.setInteractive(false);
        this.restartButton.setVisible(false);
        this.restartButton.disableInteractive();
        this.restartButton.setDepth(4);
        this.launchIdleAnimation();
        //this.welcomeMessage = this.add.sprite(this.config.width / 2, this.config.height / 2, "message");
        this.windEvent.addListener(this.handleWindTime);
    }
    setPlatforms() {
        for (let i = 0; i < 3; i++) {
            this.platforms.create((i * this.config.width) + (this.config.width / 2), this.config.height, "base");
        }
        this.platforms.setDepth(1);
        this.platforms.children.iterate(function (child) {
            child.body.allowGravity = false;
        });
    }

    setPlayer() {
        this.player = this.physics.add.sprite(this.config.width / 2, this.config.height / 2, "yellowbird-midflap");
        this.player.setDepth(1);
        this.player.body.setAllowGravity(false);
    }

    setBackground() {
        this.background = this.add.image(0, 0, "background-day");
        this.background.setDepth(0);
        this.background.setOrigin(0, 0);
    }

    createCollisonRules(platforms) {
        this.physics.add.collider(this.player, platforms, this.hit, null, this);
        this.physics.add.collider(this.player, this.pipes, this.hit, null, this);
        this.physics.add.overlap(this.player, this.gapsGroup, this.scoreAPoint, null, this);
    }

    managePipes(nrOfPipePairs) {
        for (var i = 0; i < nrOfPipePairs; i++) {
            this.createPipePair(this.config.width * (2 + i));
        }
        this.currentSpeed = this.normalSpeed;
        this.pipes.setDepth(0);
    }
    createPipePair(xPos) {
        this.gap = this.normalGap;
        this.minTopPipeHeight = -135;
        this.maxBottomPipeHeight = this.config.height - this.baseHeight; // 468
        this.minBottomPipeHeight = this.maxBottomPipeHeight - this.pipeHeight + this.baseHeight + this.gap + 20;
        this.maxTopPipeHeight = 0;

        this.heightTop = 0 - this.gap;
        this.heightBottom = this.heightTop + this.gap;
        this.safeZone = this.config.height / 2 - this.baseHeight;

        this.safeHeightTop = Phaser.Math.Between(this.minTopPipeHeight, this.maxTopPipeHeight);
        this.safeHeightBottom = Phaser.Math.Between(this.minBottomPipeHeight, this.maxBottomPipeHeight);

        var topPipe = this.pipes.create(xPos, this.safeHeightTop, "pipe");
        var bottomPipe = this.pipes.create(xPos, this.safeHeightBottom, "pipe"); //468

        topPipe.body.setAllowGravity(false);
        bottomPipe.body.setAllowGravity(false);

        topPipe.setFlipY(true);

        var scoreTrigger = this.add.rectangle(
            xPos,
            this.config.height / 2,
            this.pipeWidth / 4,
            this.config.height,
            0xD04848, 1 // Set the color to be invisible //red: 0xD04848
        );

        this.gapsGroup.add(scoreTrigger);
        this.physics.add.existing(scoreTrigger);
        scoreTrigger.body.setAllowGravity(false);
        scoreTrigger.setVisible(false);
    }
    replacePipePair() {
        var pipePair = this.gapsGroup.children.entries[this.closestPipePair / 2];
        var outOfScreenPos = 0 - this.pipeWidth;
        if (pipePair && pipePair.x < outOfScreenPos - this.gapsGroup.children.entries.length) { // out of screen space
            this.outOfRangePipePair = pipePair;
            pipePair.setActive(false);
            this.pipes.children.entries[this.closestPipePair].setActive(false);
            this.pipes.children.entries[this.closestPipePair + 1].setActive(false);

            this.updateNextPipePair(pipePair);
        }
    }

    updateNextPipePair(closestGap) {
        var spawnNewPipesPositionTrigger = (this.config.width / 2) - this.pipeWidth;

        if (closestGap && closestGap.x < spawnNewPipesPositionTrigger) { // time to enable next pipe pair
            // enable next pair
            this.safeHeightTop = Phaser.Math.Between(this.minTopPipeHeight, this.maxTopPipeHeight);
            this.safeHeightBottom = Phaser.Math.Between(this.minBottomPipeHeight, this.maxBottomPipeHeight);

            const xSpawnPos = (this.config.width * 1.15) + this.pipeWidth;
            this.pipes.children.entries[this.closestPipePair].x = xSpawnPos;
            this.pipes.children.entries[this.closestPipePair].y = this.safeHeightTop;

            this.pipes.children.entries[this.closestPipePair + 1].x = xSpawnPos;
            this.pipes.children.entries[this.closestPipePair + 1].y = this.safeHeightBottom;

            closestGap.x = xSpawnPos;
            closestGap.y = this.config.height / 2;

            closestGap.body.checkCollision.none = false;

            this.outOfRangePipePair.setActive(true);//error here
            this.pipes.children.entries[this.closestPipePair].setActive(true);
            this.pipes.children.entries[this.closestPipePair + 1].setActive(true);
        }
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
        this.managePipes(3);
        this.createCollisonRules(this.platforms);
        //this.welcomeMessage.setActive(false);
    }
    hit() {
        this.score = 0; // Reset the score
        this.closestPipePair = 0;
        this.isPlaying = false;
        this.physics.pause();
        this.player.stop();
        this.restartButton.setVisible(false);
        this.restartButton.disableInteractive();
        this.windIcon.setVisible(false);
        this.gameOver = true;
        this.time.delayedCall(1000, () => {
            this.restartButton.setVisible(true);
            this.restartButton.setInteractive();
        }, [], this);
    }

    update() {
        const self = this;
        this.groundParallax(self);
        if (this.cursors.up.isDown || this.cursors.space.isDown) {
            if (!this.isPlaying && !this.gameOver) {
                this.startGame();
            }
            this.player.setVelocityY(this.jumpForce);
        }
        if (!this.isPlaying) return;
        this.pipes.setVelocityX(this.currentSpeed);
        this.gapsGroup.setVelocityX(this.currentSpeed);
        this.platforms.setVelocityX(this.currentSpeed);
        this.replacePipePair();

        this.processPlayerRotation();
    }

    processPlayerRotation() {
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
        } if (this.floatingTime >= 1000 && currentVelocityY > this.previousVelocityY) {
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
        var pipePair = this.gapsGroup.children.entries[this.closestPipePair / 2];
        this.score++;
        if (this.score % this.windChangeFrequency === 0) {
            this.windEvent.fire();
        }
        pipePair.body.checkCollision.none = true;
        this.updateScoreUI();
        if (this.pipes.children.entries.length > this.closestPipePair + 2) {
            this.closestPipePair += 2;
        }
        else {
            this.closestPipePair = 0;
        }
    }
    handleWindTime = () => {
        this.windIsOn = true;
        let windDir = this.generateWindDirection();
        this.currentSpeed = this.normalSpeed + (this.windSpeed * windDir);
        this.updateWindUI(windDir);
    }
    generateWindDirection() {
        let windDirection = Math.floor(Math.random() * 2) + 1;
        return windDirection === 1 ? -1 : 1;
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

    updateWindUI(speedPar) {
        if (!this.windIsOn) {
            this.windIcon.setVisible(false);
        }
        else {
            this.windIcon.setVisible(true);
            if (speedPar === 1) {
                this.windIcon.setFlipX(true);
            }
            else {
                this.windIcon.setFlipX(false);
            }
        }
    }

    findRightMostGap() {
        var result;
        var minX = 0;
        for (let i = 0; i < this.gapsGroup.children.entries.length; i++) {
            if (this.gapsGroup.children.entries[i].body.x < minX) {
                result = this.gapsGroup.children.entries[i];
            }
        }
        return result;
    }
    restartScene() {
        this.gameOver = false;
        this.scene.restart();
        this.windIsOn = false;
        this.windIcon.setVisible(false);
    }

}