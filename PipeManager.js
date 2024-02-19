export default class PipeManager {
    minTopPipeHeight;
    maxTopPipeHeight;
    maxBottomPipeHeight;
    minBottomPipeHeight;

    gap;

    constructor(scene) {
        this.scene = scene;
        this.heightTop = 0;
        this.heightBottom = this.heightTop + this.gap;
        this.safeZone = this.scene.config.height / 2 - this.baseHeight;
        this.pipeHeight = 320;
        this.pipeWidth = 52;
        this.baseHeight = 112;
        this.gap = 192;
        this.safeHeightTop = 0;
        this.safeHeightBottom = 0;
    }

    static preload(scenePar) {
        this.pipe = scenePar.load.image("pipe", "assets/sprites/pipe-green.png");
    }

    managePipes(numberOfPipePairs) {
        for (let i = 0; i < numberOfPipePairs; i++) {
            this.createPipePair(this.scene.config.width * (2 + i));
        }
        this.scene.currentSpeed = this.scene.normalSpeed;
        this.scene.pipesGroup.setDepth(0);
    }
    createPipePair(xPos) {
        this.minTopPipeHeight = this.scene.config.height * 0.7 - this.pipeHeight - this.baseHeight;
        this.maxTopPipeHeight = this.scene.config.height * 0.3;
        this.maxBottomPipeHeight = this.scene.config.height - this.baseHeight + this.gap;
        this.minBottomPipeHeight = this.maxTopPipeHeight + this.baseHeight + this.gap * 2;

        this.heightTop = 0 - this.gap;
        this.heightBottom = this.heightTop + this.gap;
        this.safeZone = this.scene.config.height / 2 - this.baseHeight;

        this.safeHeightTop = Phaser.Math.Between(this.minTopPipeHeight, this.maxTopPipeHeight);
        this.safeHeightBottom = this.safeHeightTop + this.gap + this.pipeHeight - this.baseHeight;

        let topPipe = this.scene.pipesGroup.create(xPos, this.safeHeightTop, "pipe");
        let bottomPipe = this.scene.pipesGroup.create(xPos, this.safeHeightBottom, "pipe");
        console.log(this.safeHeightTop);

        topPipe.body.setAllowGravity(false);
        bottomPipe.body.setAllowGravity(false);

        topPipe.setFlipY(true);

        let scoreTrigger = this.scene.add.rectangle(
            xPos,
            this.scene.config.height / 2,
            this.pipeWidth / 4,
            this.scene.config.height,
            0xD04848, 1
        );

        this.scene.gapsGroup.add(scoreTrigger);
        this.scene.physics.add.existing(scoreTrigger);
        scoreTrigger.body.setAllowGravity(false);
        scoreTrigger.setVisible(false);
    }
    replacePipePair() {
        let pipePair = this.scene.gapsGroup.children.entries[this.closestPipePair / 2];
        let outOfScreenPos = 0 - this.pipeWidth;
        if (pipePair && pipePair.x < outOfScreenPos - this.scene.gapsGroup.children.entries.length) {
            this.outOfRangePipePair = pipePair;
            pipePair.setActive(false);
            this.scene.pipesGroup.children.entries[this.closestPipePair].setActive(false);
            this.scene.pipesGroup.children.entries[this.closestPipePair + 1].setActive(false);

            this.updateNextPipePair(pipePair);
        }
    }

    updateNextPipePair(closestGap) {
        let spawnNewPipesPositionTrigger = (this.scene.config.width / 2) - this.pipeWidth;

        if (closestGap && closestGap.x < spawnNewPipesPositionTrigger) { // time to enable next pipe pair
            // enable next pair
            this.safeHeightTop = Phaser.Math.Between(this.minTopPipeHeight, this.maxTopPipeHeight);
            this.safeHeightBottom = this.safeHeightTop + this.gap + this.pipeHeight - this.baseHeight;

            const xSpawnPos = (this.scene.config.width * 1.15) + this.pipeWidth;
            this.scene.pipesGroup.children.entries[this.closestPipePair].x = xSpawnPos;
            this.scene.pipesGroup.children.entries[this.closestPipePair].y = this.safeHeightTop;

            this.scene.pipesGroup.children.entries[this.closestPipePair + 1].x = xSpawnPos;
            this.scene.pipesGroup.children.entries[this.closestPipePair + 1].y = this.safeHeightBottom;

            closestGap.x = xSpawnPos;
            closestGap.y = this.scene.config.height / 2;

            closestGap.body.checkCollision.none = false;

            this.outOfRangePipePair.setActive(true);
            this.scene.pipesGroup.children.entries[this.closestPipePair].setActive(true);
            this.scene.pipesGroup.children.entries[this.closestPipePair + 1].setActive(true);
        }
    }
}