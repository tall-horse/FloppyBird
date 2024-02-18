import WindEvent from './WindEvent.js';
import Player from './Player.js';

export class Scene2 extends Phaser.Scene {
    constructor() {
        super("playGame");
        this.score = 0;
        this.scoreContainer;
        this.baseHeight = 112;
        this.baseWidth = 336;
        this.config;
        this.upAngle = -20;
        this.downAngle = 90;
        this.previousVelocityY = 0;
        this.floatingTime = 0;
        this.isPlaying = false;
        this.jumpForce = -175;//
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
        this.windSpeed = 20;
        this.windChangeFrequency = 5;

        this.windEvent = WindEvent;
    }
    preload() {
        Player.preload(this);
    }

    create() {
        this.setBackground();

        this.config = this.game.config;

        this.platformsGroup = this.physics.add.group();
        this.pipesGroup = this.physics.add.group();
        this.ceilingGroup = this.physics.add.group();
        this.gapsGroup = this.physics.add.group();

        this.cursors = this.input.keyboard.createCursorKeys();

        this.player = new Player(this.config.width / 2, this.config.height / 2, this.platformsGroup, this.pipesGroup, this.gapsGroup,
            this.hit, this.scoreAPoint, this.startGame.bind(this), this, this.cursors, this.isPlaying, this.gameOver);
        this.player.create();

        this.gap = this.player.sprite.height * 8; //24 * 8 = 192

        this.setPlatforms();

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
        //this.welcomeMessage = this.add.sprite(this.config.width / 2, this.config.height / 2, "message");
        this.windEvent.addListener(this.handleWindTime);
    }
    setPlatforms() {
        for (let i = 0; i < 3; i++) {
            this.platformsGroup.create((i * this.config.width) + (this.config.width / 2), this.config.height, "base");
        }
        this.platformsGroup.setDepth(1);
        this.platformsGroup.children.iterate(function (child) {
            child.body.allowGravity = false;
        });
    }

    setCeiling() {
        let ceiling = this.ceilingGroup.create(this.config.width / 2, 0 - this.baseWidth, 'ceiling');
        ceiling.setOrigin(0, 0);
        ceiling.setScale(this.game.config.width, 1);
        ceiling.setAlpha(0);
        ceiling.body.setImmovable(true);
    }

    setBackground() {
        this.background = this.add.image(0, 0, "background-day");
        this.background.setDepth(0);
        this.background.setOrigin(0, 0);
    }

    managePipes(nrOfPipePairs) {
        for (let i = 0; i < nrOfPipePairs; i++) {
            this.createPipePair(this.config.width * (2 + i));
        }
        this.currentSpeed = this.normalSpeed;
        this.pipesGroup.setDepth(0);
    }
    createPipePair(xPos) {
        this.minTopPipeHeight = this.config.height / 3 * 2 - (this.pipeHeight + this.baseHeight);
        this.maxTopPipeHeight = this.config.height / 4;
        console.log("height is between " + this.minTopPipeHeight + " and " + this.maxTopPipeHeight);
        this.maxBottomPipeHeight = this.config.height - this.baseHeight + this.gap;
        this.minBottomPipeHeight = this.maxTopPipeHeight + this.baseHeight + this.gap * 2;

        this.heightTop = 0 - this.gap;
        this.heightBottom = this.heightTop + this.gap;
        this.safeZone = this.config.height / 2 - this.baseHeight;

        this.safeHeightTop = Phaser.Math.Between(this.minTopPipeHeight, this.maxTopPipeHeight);
        this.safeHeightBottom = this.safeHeightTop + this.gap + this.pipeHeight - this.baseHeight;

        let topPipe = this.pipesGroup.create(xPos, this.safeHeightTop, "pipe");
        let bottomPipe = this.pipesGroup.create(xPos, this.safeHeightBottom, "pipe");

        topPipe.body.setAllowGravity(false);
        bottomPipe.body.setAllowGravity(false);

        topPipe.setFlipY(true);

        let scoreTrigger = this.add.rectangle(
            xPos,
            this.config.height / 2,
            this.pipeWidth / 4,
            this.config.height,
            0xD04848, 1
        );

        this.gapsGroup.add(scoreTrigger);
        this.physics.add.existing(scoreTrigger);
        scoreTrigger.body.setAllowGravity(false);
        scoreTrigger.setVisible(false);
    }
    replacePipePair() {
        let pipePair = this.gapsGroup.children.entries[this.closestPipePair / 2];
        let outOfScreenPos = 0 - this.pipeWidth;
        if (pipePair && pipePair.x < outOfScreenPos - this.gapsGroup.children.entries.length) {
            this.outOfRangePipePair = pipePair;
            pipePair.setActive(false);
            this.pipesGroup.children.entries[this.closestPipePair].setActive(false);
            this.pipesGroup.children.entries[this.closestPipePair + 1].setActive(false);

            this.updateNextPipePair(pipePair);
        }
    }

    updateNextPipePair(closestGap) {
        let spawnNewPipesPositionTrigger = (this.config.width / 2) - this.pipeWidth;

        if (closestGap && closestGap.x < spawnNewPipesPositionTrigger) { // time to enable next pipe pair
            // enable next pair
            this.safeHeightTop = Phaser.Math.Between(this.minTopPipeHeight, this.maxTopPipeHeight);
            this.safeHeightBottom = this.safeHeightTop + this.gap + this.pipeHeight - this.baseHeight;

            const xSpawnPos = (this.config.width * 1.15) + this.pipeWidth;
            this.pipesGroup.children.entries[this.closestPipePair].x = xSpawnPos;
            this.pipesGroup.children.entries[this.closestPipePair].y = this.safeHeightTop;

            this.pipesGroup.children.entries[this.closestPipePair + 1].x = xSpawnPos;
            this.pipesGroup.children.entries[this.closestPipePair + 1].y = this.safeHeightBottom;

            closestGap.x = xSpawnPos;
            closestGap.y = this.config.height / 2;

            closestGap.body.checkCollision.none = false;

            this.outOfRangePipePair.setActive(true);
            this.pipesGroup.children.entries[this.closestPipePair].setActive(true);
            this.pipesGroup.children.entries[this.closestPipePair + 1].setActive(true);
        }
    }

    startGame() {
        if (this.isPlaying || this.gameOver) return;
        this.isPlaying = true;
        this.physics.resume();
        this.player.sprite.body.setAllowGravity(true);
        this.managePipes(3);
        this.createCollisonRules();
        //this.welcomeMessage.setActive(false);
    }
    hit() {
        this.score = 0;
        this.closestPipePair = 0;
        this.isPlaying = false;
        this.physics.pause();
        this.player.sprite.stop();
        this.restartButton.setVisible(false);
        this.restartButton.disableInteractive();
        this.windIcon.setVisible(false);
        this.gameOver = true;
        this.time.delayedCall(1000, () => {
            this.restartButton.setVisible(true);
            this.restartButton.setInteractive();
        }, [], this);
    }
    createCollisonRules() {
        this.physics.add.collider(this.player.sprite, this.platformsGroup, this.hit, null, this);
        this.physics.add.collider(this.player, this.ceilingGroup, null, null, this);
        this.physics.add.collider(this.player.sprite, this.pipesGroup, this.hit, null, this);
        this.physics.add.overlap(this.player.sprite, this.gapsGroup, this.scoreAPoint, null, this);
    }

    update() {
        const self = this;
        this.groundParallax(self);
        this.player.update();
        this.processPlayerRotation();
        if (!this.isPlaying) return;
        this.pipesGroup.setVelocityX(this.currentSpeed);
        this.gapsGroup.setVelocityX(this.currentSpeed);
        this.platformsGroup.setVelocityX(this.currentSpeed);
        this.replacePipePair();
    }



    groundParallax(self) {
        this.platformsGroup.children.iterate(function (child) {
            if (child.body.x <= -child.width) {
                child.x = self.config.width + child.width / 2;
            }
        });
    }

    //I wanted to have this function in Player class but apparently I can use Tweens only inside a scene and passing scene as a parameter did not work
    processPlayerRotation() {
        const currentVelocityY = this.player.sprite.body.velocity.y;

        this.floatingTime += this.game.loop.delta;
        // Check if the bird is moving upwards or downwards
        if (currentVelocityY < this.previousVelocityY) {
            // Bird is moving upwards
            this.tweens.add({
                targets: this.player.sprite,
                duration: 100,
                angle: this.upAngle,
                ease: 'Linear'
            });
            this.floatingTime = 0;
        } if (this.floatingTime >= 1000 && currentVelocityY > this.previousVelocityY) {
            // Bird is moving downwards
            this.tweens.add({
                targets: this.player.sprite,
                duration: 200,
                angle: this.downAngle,
                ease: 'Linear'
            });
            this.floatingTime = 0;
        }

        this.previousVelocityY = currentVelocityY;
    }

    scoreAPoint() {
        let pipePair = this.gapsGroup.children.entries[this.closestPipePair / 2];
        this.score++;
        if (this.score % this.windChangeFrequency === 0) {
            this.windEvent.fire();
        }
        pipePair.body.checkCollision.none = true;
        this.updateScoreUI();
        if (this.pipesGroup.children.entries.length > this.closestPipePair + 2) {
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

    restartScene() {
        this.gameOver = false;
        this.scene.restart();
        this.windIsOn = false;
        this.windIcon.setVisible(false);
    }

}