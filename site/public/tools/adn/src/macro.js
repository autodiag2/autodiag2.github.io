function signalModelChange() {
    eventBus.emit("gameStateChangedBackPropagation");
}

class DNAMacroScene extends Phaser.Scene {

    constructor() {
        super("DNAMacroScene");
        this.groundHeight = 50;
        this.playerSteps = 0;
        this.previousSteps = 0;
        this.config = {
            player: {
                stepPx: 10,  // player step in 1 second (base walk level, normal game speed)
                decorationEachNStep: 100,
                uri: "/tools/adn/assets/img/prod/player.png",
                frameWidth: 84,
                frameHeight: 158,
                target_height: 150
            },
            background: [{
                height: 400,
                uri: "/tools/adn/assets/img/prod/mountains.png",
                scrollFactorX: 0.05
            }, {
                height: 400,
                uri: "/tools/adn/assets/img/prod/hills.png",
                scrollFactorX: 0.1
            }],
            rocks: [{
                width: 1200,
                height: 765,
                target_width: 100,           // which width to scale to
                uri: "/tools/adn/assets/img/prod/rock.png"
            }],
            apple: {
                width: 1200,
                height: 1200,
                target_width: 50,
                uri: "/tools/adn/assets/img/prod/apple.png"
            }
        }
    }

    preload() {
        this.load.spritesheet("player", this.config.player.uri, {
            frameWidth: this.config.player.frameWidth,
            frameHeight: this.config.player.frameHeight
        });
        this.load.image("sky", "https://labs.phaser.io/assets/skies/sky4.png");
        let i = 1;
        for(let bgConfig of this.config.background) {
            this.load.image(`background-${i}`, bgConfig.uri);
            i += 1;
        }
        this.load.image("ground", "https://labs.phaser.io/assets/sprites/platform.png");
        i = 1;
        for(let rockConfig of this.config.rocks) {
            this.load.image(`rock-${i}`, rockConfig.uri);
        }
        this.load.image("apple", this.config.apple.uri)
    }

    // All positions are calculated from origin(0,0) at top-left corner
    getGroundStartY(h=this.scale.height) {
        return h - this.groundHeight;
    }

    getPlayerStartY(h=this.scale.height) {
        return this.getGroundStartY(h) - this.config.player.target_height;
    }

    rockXdimFromTargetWidth(rockIndex) {
        const rockConfig = this.config.rocks[rockIndex];
        const scaleFactor = rockConfig.target_width / rockConfig.width;
        return rockConfig.width * scaleFactor;
    }
    
    rockYdimFromTargetWidth(rockIndex) {
        const rockConfig = this.config.rocks[rockIndex];
        const scaleFactor = rockConfig.target_width / rockConfig.width;
        return rockConfig.height * scaleFactor;
    }

    getRockStartY(rock_n, h=this.scale.height) {
        return this.getGroundStartY(h) - this.rockYdimFromTargetWidth(rock_n-1) + 20;
    }

    appleXdimFromTargetWidth() {
        const scaleFactor = this.config.apple.target_width / this.config.apple.width;
        return this.config.apple.width * scaleFactor;
    }
    
    appleYdimFromTargetWidth() {
        const scaleFactor = this.config.apple.target_width / this.config.apple.width;
        return this.config.apple.height * scaleFactor;
    }

    getAppleStartY(h=this.scale.height) {
        return this.getGroundStartY(h) - this.appleYdimFromTargetWidth() - 10;
    }

    getBackgroundStartY(h=this.scale.height, backgroundIndex=0) {
        return this.getGroundStartY(h) - this.config.background[backgroundIndex].height;
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Create a separate canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Create gradient on this canvas
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1e90ff');
        gradient.addColorStop(1, '#87ceeb');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Add canvas as texture
        this.textures.addCanvas('skyGradient', canvas);

        this.sky = this.add.image(0, 0, 'skyGradient').setOrigin(0);

        this.backgrounds = [];
        for(let i = 0; i < this.config.background.length; i++) {
            const bgConfig = this.config.background[i];
            const bg = this.add.tileSprite(0, this.getBackgroundStartY(height, i), width, bgConfig.height, `background-${i+1}`)
                .setOrigin(0, 0)
                .setDepth(1 + i);
            this.backgrounds.push(bg);
        }

        this.ground = this.add.tileSprite(0, this.getGroundStartY(), this.scale.width, this.groundHeight, "ground")
            .setOrigin(0, 0)
            .setDepth(10);

        this.rocks = this.add.group();
        this.apples = this.add.group();

        this.anims.create({
            key: "walk",
            frames: this.anims.generateFrameNumbers("player", { start: 0, end: 4 }),
            frameRate: 1,
            repeat: -1
        });

        const scale = this.config.player.target_height / this.config.player.frameHeight;
        this.player = this.add.sprite(150, this.getPlayerStartY(), "player")
            .setOrigin(0, 0)
            .setDisplaySize(this.config.player.frameWidth * scale, this.config.player.frameHeight * scale)
            .setSize(this.config.player.frameWidth * scale,
                     this.config.player.frameHeight * scale)
            .setDepth(100);

        this.player.play("walk");
        this.player.anims.pause();

        this.scale.on("resize", this.resize, this);

    }

    update(time, delta) {
        const delta_s = delta / 1000;
        const energy_consumption = gameState.player.walkLevel * gameState.player.ENERGY_FOR_1_SEC_WALK * delta_s;
        if ( 0 <= (gameState.player.energy - energy_consumption) ) {
            const mp_earned = gameState.MP_PER_WALK_SECOND * gameState.player.walkLevel * delta_s;
            const px = this.config.player.stepPx * gameState.player.walkLevel * gameState.speed * delta_s;
            this.playerSteps += (px / this.config.player.stepPx);

            const shouldAddDecoration = ((Math.random() + 1) * (this.config.player.decorationEachNStep/2)) <= (parseInt(this.playerSteps) - parseInt(this.previousSteps));
            const shouldAddApple = shouldAddDecoration;
            if ( shouldAddDecoration ) {
                this.previousSteps = parseInt(this.playerSteps);
                const rock_n = 1;
                const rock = this.add.image(this.scale.width + 50, this.getRockStartY(rock_n), `rock-${rock_n}`)
                    .setDisplaySize(this.rockXdimFromTargetWidth(rock_n-1), this.rockYdimFromTargetWidth(rock_n-1))
                    .setOrigin(0, 0)
                    .setDepth(5);
                rock.rock_n = rock_n;
                this.rocks.add(rock);
            }
            if ( shouldAddApple ) {
                this.previousSteps = parseInt(this.playerSteps);
                const apple = this.add.image(this.scale.width + 50, this.getAppleStartY(), "apple")
                    .setDisplaySize(this.appleXdimFromTargetWidth(), this.appleYdimFromTargetWidth())
                    .setOrigin(0, 0)
                    .setDepth(6);
                this.apples.add(apple);
            }

            this.sky.tilePositionX += px * 0.2;
            for(let i = 0; i < this.backgrounds.length; i++) {
                const bgConfig = this.config.background[i];
                this.backgrounds[i].tilePositionX += px * bgConfig.scrollFactorX;
            }
            this.ground.tilePositionX += px;
    
            this.rocks.getChildren().forEach(r => {
                r.x -= px;
                if (r.x < -100) r.destroy();
            });

            this.apples.getChildren().forEach(a => {
                a.x -= px;
                collision_detect(a, this.player, () => {
                    this.apples.remove(a, true, true);
                    gameState.molecules.apple.amount += 1;
                });
                if (a.x < -100) a.destroy();
            });

            gameState.player.energy -= energy_consumption;
            gameState.points += mp_earned;
            signalModelChange();
            this.player.anims.msPerFrame = 1000 / gameState.player.walkLevel;
            this.player.anims.resume();
        } else {
            this.player.anims.pause();
        }
    }

    resize(gameSize) {
        const w = gameSize.width;
        const h = gameSize.height;

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#1e90ff');
        gradient.addColorStop(1, '#87ceeb');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        this.textures.remove('skyGradient');
        this.textures.addCanvas('skyGradient', canvas);

        this.sky.setTexture('skyGradient');
        this.sky.setDisplaySize(w, h);
        
        for(let i = 0; i < this.backgrounds.length; i++) {
            const bgConfig = this.config.background[i];
            this.backgrounds[i].setSize(w, bgConfig.height);
            this.backgrounds[i].y = this.getBackgroundStartY(h, i);
        }

        const rocks = this.rocks.getChildren();
        for(let i = 0; i < rocks.length; i++) {
            const rock = rocks[i];
            const rock_n = rock.rock_n;
            rock.setDisplaySize(this.rockXdimFromTargetWidth(rock_n-1), this.rockYdimFromTargetWidth(rock_n-1));
            rock.y = this.getRockStartY(rock_n, h);
        }

        const apples = this.apples.getChildren();
        for(let i = 0; i < apples.length; i++) {
            const apple = apples[i];
            apple.setDisplaySize(this.appleXdimFromTargetWidth(), this.appleYdimFromTargetWidth());
            apple.y = this.getAppleStartY(h);
        }

        this.ground.setSize(w, this.groundHeight);
        this.ground.y = this.getGroundStartY(h);
        this.player.y = this.getPlayerStartY(h);
    }

}

const macroConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth / 2,
    height: window.innerHeight,
    backgroundColor: "#ffffff",
    parent: "gc-macro",
    scene: DNAMacroScene,
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }
};

const macroGame = new Phaser.Game(macroConfig);
