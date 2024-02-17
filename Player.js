export default class Player {
    constructor(xPos, yPos, platforms, pipesGroup, gapsGroup, hit, scoreAPoint, startGame, scene, cursors, isPlaying, gameOver) {
        this.xPos = xPos;
        this.yPos = yPos;
        this.platforms = platforms;
        this.pipesGroup = pipesGroup;
        this.gapsGroup = gapsGroup;
        this.hit = hit;
        this.scoreAPoint = scoreAPoint;
        this.startGame = startGame;
        this.scene = scene;
        this.cursors = cursors;
        this.isPlaying = isPlaying;
        this.gameOver = gameOver;

        this.jumpForce = -175;
        this.tweens = scene.tweens;
    }
    static preload(scenePar) {
        console.log("preload called in player");
        this.downFlapSprite = scenePar.load.image("yellowbird-downflap", "assets/sprites/yellowbird-downflap.png");
        this.midFlapSprite = scenePar.load.image("yellowbird-midflap", "assets/sprites/yellowbird-midflap.png");
        this.upFlapSprite = scenePar.load.image("yellowbird-upflap", "assets/sprites/yellowbird-upflap.png");
    }

    launchIdleAnimation() {
        const birdSprite = this.sprite;

        this.scene.anims.create({
            key: 'birdAnimation',
            frames: [
                { key: 'yellowbird-downflap' },
                { key: 'yellowbird-midflap' },
                { key: 'yellowbird-upflap' }
            ],
            frameRate: 10,
            repeat: -1
        });

        this.scene.anims.play("birdAnimation", birdSprite);
    }

    create() {
        this.sprite = this.scene.physics.add.sprite(this.xPos, this.yPos, "yellowbird-midflap");
        this.sprite.setDepth(1);
        this.sprite.body.setAllowGravity(false);

        this.launchIdleAnimation();
    }
    update() {
        if (this.cursors.up.isDown || this.cursors.space.isDown) {
            if (!this.isPlaying && !this.gameOver) {
                this.startGame();
            }
            this.sprite.setVelocityY(this.jumpForce);
        }
    }
}