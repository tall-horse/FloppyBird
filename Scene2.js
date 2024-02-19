import WindEvent from './WindEvent.js';
import Player from './Player.js';
import PipeManager from './PipeManager.js';

export class Scene2 extends Phaser.Scene {
    constructor() {
        super("playGame");
        this.score = 0;
        this.scoreContainer;
        this.config;
        this.upAngle = -20;
        this.downAngle = 60;
        this.previousVelocityY = 0;
        this.floatingTime = 0;
        this.isPlaying = false;
        this.jumpForce = -175;
        this.timeBeforePipesCome = 5;
        this.closestPipePair = 0;
        this.gameOver = false;
        this.outOfRangePipePair = null;
        this.windIsOn = false;
        this.normalSpeed = -100;
        this.modifiedSpeed;
        this.currentSpeed;
        this.windSpeed = 20;
        this.windChangeFrequency = 5;
        this.timeBeforeBirdShouldLookDown = 800;
        this.lookUpAnimationDuration = 100;
        this.lookDownAnimationDuration = 400;
        this.birdHeight = 24;
        this.windEvent = WindEvent;
        this.pipeManager;
    }
    preload() {
        Player.preload(this);
        PipeManager.preload(this);
    }

    create() {
        this.config = this.game.config;
        this.setBackground();
        this.platformsGroup = this.physics.add.group();
        this.pipesGroup = this.physics.add.group();
        this.ceilingGroup = this.physics.add.group();
        this.gapsGroup = this.physics.add.group();
        this.pipeManager = new PipeManager(this);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.player = new Player(this.config.width / 2, this.config.height / 2, this.platformsGroup, this.pipesGroup, this.gapsGroup,
            this.hit, this.scoreAPoint, this.startGame.bind(this), this, this.cursors, this.isPlaying, this.gameOver, this.sound);
        this.player.create();

        this.setCeiling();
        this.setPlatforms();

        this.scoreContainer = this.add.container(20, 20);
        this.windIcon = this.add.image(this.config.width / 2, this.config.width / 4, "wind");
        this.windIcon.setScale(100 / this.windIcon.width, 100 / this.windIcon.height);
        this.windIcon.setDepth(3);
        this.windIcon.setVisible(false);
        this.updateScoreUI();
        this.updateWindUI();
        let textStyle = {
            fontFamily: 'Arial',
            fontSize: 24,
            padding: 10,
            color: '#FFFFFF',
            backgroundColor: '#F3B95F',
            border: 3,
            borderColor: '#FFFFFF'
        }
        this.restartButton = this.add.text(this.config.width / 2, this.config.height / 3, 'RESTART', textStyle)
            .setInteractive()
            .setOrigin(0.5)
            .on('pointerdown', () => {
                this.restartScene();
            });

        this.restartButton.setVisible(false);
        this.restartButton.disableInteractive();
        this.restartButton.setDepth(4);
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
        let ceiling = this.ceilingGroup.create(0, -this.birdHeight * 3, 'ceiling');
        ceiling.setOrigin(0, 0);
        ceiling.setScale(this.game.config.width, 1);
        ceiling.setAlpha(0);
        ceiling.body.setAllowGravity(false);
        ceiling.body.setImmovable(true);
    }

    setBackground() {
        this.background = this.add.image(0, 0, "background-day");
        this.background.setDepth(0);
        this.background.setOrigin(0, 0);
    }

    startGame() {
        if (this.isPlaying || this.gameOver) return;
        this.isPlaying = true;
        this.physics.resume();
        this.player.sprite.body.setAllowGravity(true);
        console.log('manage pieps');
        this.pipeManager.managePipes(3);
        this.createCollisonRules();
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
        this.player.playDieSound();
        this.player.gameOver = true;
        this.time.delayedCall(1000, () => {
            this.restartButton.setVisible(true);
            this.restartButton.setInteractive();
        }, [], this);
    }
    createCollisonRules() {
        this.physics.add.collider(this.player.sprite, this.platformsGroup, this.hit, null, this);
        this.physics.add.collider(this.player.sprite, this.ceilingGroup, null, null, this);
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
        this.pipeManager.replacePipePair();
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
                duration: this.lookUpAnimationDuration,
                angle: this.upAngle,
                ease: 'Linear'
            });
            this.floatingTime = 0;
        } if (this.floatingTime >= this.timeBeforeBirdShouldLookDown && currentVelocityY > this.previousVelocityY) {
            // Bird is moving downwards
            this.tweens.add({
                targets: this.player.sprite,
                duration: this.lookDownAnimationDuration,
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
        this.player.playPointSound();
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