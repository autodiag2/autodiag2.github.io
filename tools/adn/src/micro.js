class DNAMoleculeScene extends Phaser.Scene {
    constructor() {
        super("DNAMoleculeScene");
        this.config = {
            molecules: {
                ATP: {
                    amount: 0,
                    width: 1100,
                    height: 1038,
                    target_width: 25,
                    uri: "/tools/adn/assets/img/prod/atp.png"
                },
                myosin: {
                    amount: 0,
                    width: 1200,
                    height: 448,
                    target_width: 100,
                    uri: "/tools/adn/assets/img/prod/myosin.png"
                },
                PFK1: {
                    amount: 0,
                    width: 759,
                    height: 661,
                    target_width: 50,
                    uri: "/tools/adn/assets/img/prod/PFK-1.png"
                },
                glucose: {
                    amount: 0,
                    width: 738,
                    height: 666,
                    target_width: 25,
                    uri: "/tools/adn/assets/img/prod/glucose.png"
                },
                amylase: {
                    amount: 0,
                    width: 615,
                    height: 607,
                    target_width: 50,
                    uri: "/tools/adn/assets/img/prod/amylase.png"
                },
                apple: {
                    amount: 0,
                    width: 1200,
                    height: 1200,
                    target_width: 50,
                    uri: "/tools/adn/assets/img/prod/apple.png"
                }
            }
        };
    }

    moleculeXdimFromTargetWidth(moleculeKey) {
        const molConfig = this.config.molecules[moleculeKey];
        const scaleFactor = molConfig.target_width / molConfig.width;
        return molConfig.width * scaleFactor;
    }
    
    moleculeYdimFromTargetWidth(moleculeKey) {
        const molConfig = this.config.molecules[moleculeKey];
        const scaleFactor = molConfig.target_width / molConfig.width;
        return molConfig.height * scaleFactor;
    }
        
    preload() {
        for (let key in this.config.molecules) {
            this.load.image(`molecule-${key}`, this.config.molecules[key].uri);
        }
    }

    updateView() {
        for(let key in this.config.molecules) {
            const molConfig = this.config.molecules[key];
            const gsmol = gameState.molecules[key];
            const delta = gsmol.amount - molConfig.amount;
            if ( delta < 0 ) {
                const toRemove = -delta;
                let removed = 0;
                this.molecules.getChildren().forEach((mol) => {
                    if ( mol.key === key && removed < toRemove ) {
                        this.molecules.remove(mol, true, true);
                        removed += 1;
                    }
                });
            } else {
                for(let i = 0; i < delta; i++) {
                    const height = this.moleculeYdimFromTargetWidth(key);
                    const width = this.moleculeXdimFromTargetWidth(key);
                    const x = Phaser.Math.Between(width, this.scale.width - width);
                    const y = Phaser.Math.Between(height, this.scale.height - height);
                    const mol = this.add.image(x, y, `molecule-${key}`).setDisplaySize(width, height);
                    mol.key = key;
                    mol.speed = 0.5 + Math.random();
                    mol.direction = Phaser.Math.FloatBetween(0, 2 * Math.PI);
                    mol.config = molConfig;
                    this.molecules.add(mol);
                }
            }
            molConfig.amount = gsmol.amount;
        }
    }

    create() {
        this.molecules = this.add.group();

        this.updateView();

        eventBus.on('gameStateChanged', (newGameState) => {
            this.updateView();
        });

        this.scale.on('resize', this.resize, this);

    }
    update() {

        const molecules = this.molecules.getChildren();

        molecules.forEach((mol) => {
            mol.x += Math.cos(mol.direction) * mol.speed * gameState.speed;
            mol.y += Math.sin(mol.direction) * mol.speed * gameState.speed;

            if (mol.x < 0) mol.x = this.scale.width;
            else if (mol.x > this.scale.width) mol.x = 0;

            if (mol.y < 0) mol.y = this.scale.height;
            else if (mol.y > this.scale.height) mol.y = 0;
        });

        for (let i = 0; i < molecules.length; i++) {
            for (let j = i + 1; j < molecules.length; j++) {
                const molA = molecules[i];
                const molB = molecules[j];

                collision_detect(molA, molB, () => {
                    this.process_collision(molA, molB);
                })
            }
        }
    }

    delete_molecule(mol) {
        this.molecules.remove(mol, true, true);
        const molConfig = this.config.molecules[mol.key];
        molConfig.amount -= 1;
        gameState.molecules[mol.key].amount -= 1;
    }

    process_collision(molA, molB) {
        if ( (molA.key === "ATP" && molB.key === "myosin") ||
            (molA.key === "myosin" && molB.key === "ATP")
        ) {
            gameState.player.energy += gameState.player.ENERGY_FOR_1_SEC_WALK;
            if ( molA.key === "ATP" ) {
                this.delete_molecule(molA);
            } else if ( molB.key === "ATP" ) {
                this.delete_molecule(molB);
            }
            signalModelChange();
        }
        if ( ( molA.key === "PFK1" && molB.key === "glucose" ) ||
             (molA.key === "glucose" && molB.key === "PFK1" )
        ) {
            gameState.molecules.ATP.amount += 30;
            if ( molA.key === "glucose" ) {
                this.delete_molecule(molA);
            } else if ( molB.key === "glucose" ) {
                this.delete_molecule(molB);
            }
            signalModelChange();
        }
        if ( ( molA.key === "apple" && molB.key === "amylase" ) ||
             (molA.key === "amylase" && molB.key === "apple" )
        ) {
            gameState.molecules.glucose.amount += 10;
            if ( molA.key === "apple" ) {
                this.delete_molecule(molA);
            } else if ( molB.key === "apple" ) {
                this.delete_molecule(molB);
            }
            signalModelChange();
        }
    }

    resize(gameSize) {
        const width = gameSize.width;
        const height = gameSize.height;
        this.cameras.resize(width, height);
    }

}

const microConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: "#1a1a1a",
    parent: "gc-micro",
    scene: DNAMoleculeScene,
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const microGame = new Phaser.Game(microConfig);