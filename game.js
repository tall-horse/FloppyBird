window.onload = function () {
    var config = {
        width: 288,
        height: 512,
        backgroundColor: 0x000000,
        scene: [Scene1, Scene2],
        physics: {
            default: "arcade",
            arcade: {
                gravity: { y: 750 },
                debug: false
            }
        }
    }
    var game = new Phaser.Game(config);
}