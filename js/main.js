"use strict";

/*
 * RETRO FOOTY
 * Step 7B: Expanded AFL field presentation
 */

const GAME_WIDTH = 700;
const GAME_HEIGHT = 390;

class MatchScene extends Phaser.Scene {
    constructor() {
        super("MatchScene");
    }

create() {
    this.cameras.main.setBackgroundColor("#171717");

    this.createGround();
    this.createScoreboard();
    this.createPlayer();
    this.createFootball();
    this.createKeyboardControls();
    this.createTouchControls();

    console.log("Retro Footy football possession loaded.");
}

createPlayer() {
    this.player = this.add.rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + 25,
        22,
        30,
        0xff3b30
    );

    this.player.setStrokeStyle(
        3,
        0xffffff
    );

    this.playerSpeed = 170;

    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;
}

createFootball() {
    this.football = this.add.ellipse(
        GAME_WIDTH / 2 + 75,
        GAME_HEIGHT / 2 + 25,
        15,
        9,
        0x9a5a2b
    );

    this.football.setStrokeStyle(
        2,
        0xffffff
    );

    this.playerHasBall = false;

    this.ballPickupDistance = 24;
}

createKeyboardControls() {
    this.cursors = this.input.keyboard.createCursorKeys();

    this.wasdKeys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
    });

    this.dropBallKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    this.dropBallKey.on("down", () => {
        this.dropFootball();
    });
}

createTouchControls() {
    const buttonStyle = {
        fontFamily: "Courier New",
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#222222",
        padding: {
            x: 15,
            y: 9
        }
    };

    const controlCentreX = 95;
    const controlCentreY = 315;

    const upButton = this.add.text(
        controlCentreX,
        controlCentreY - 40,
        "▲",
        buttonStyle
    ).setOrigin(0.5).setInteractive();

    const downButton = this.add.text(
        controlCentreX,
        controlCentreY + 40,
        "▼",
        buttonStyle
    ).setOrigin(0.5).setInteractive();

    const leftButton = this.add.text(
        controlCentreX - 48,
        controlCentreY,
        "◀",
        buttonStyle
    ).setOrigin(0.5).setInteractive();

    const rightButton = this.add.text(
        controlCentreX + 48,
        controlCentreY,
        "▶",
        buttonStyle
    ).setOrigin(0.5).setInteractive();

    this.configureMovementButton(
        upButton,
        "moveUp"
    );

    this.configureMovementButton(
        downButton,
        "moveDown"
    );

    this.configureMovementButton(
        leftButton,
        "moveLeft"
    );

    this.configureMovementButton(
        rightButton,
        "moveRight"
    );

const dropBallButton = this.add.text(
    GAME_WIDTH - 80,
    GAME_HEIGHT - 45,
    "DROP",
    {
        fontFamily: "Courier New",
        fontSize: "18px",
        color: "#ffffff",
        backgroundColor: "#7a2d1f",
        padding: {
            x: 14,
            y: 10
        }
    }
).setOrigin(0.5).setInteractive();

dropBallButton.on("pointerdown", () => {
    this.dropFootball();
});

    this.input.on("pointerup", () => {
        this.resetTouchMovement();
    });
}

configureMovementButton(button, movementProperty) {
    button.on("pointerdown", () => {
        this[movementProperty] = true;
    });

    button.on("pointerup", () => {
        this[movementProperty] = false;
    });

    button.on("pointerout", () => {
        this[movementProperty] = false;
    });
}

resetTouchMovement() {
    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;
}

update(time, delta) {
    if (!this.player) {
        return;
    }

    let horizontalDirection = 0;
    let verticalDirection = 0;

    const keyboardLeft =
        this.cursors.left.isDown ||
        this.wasdKeys.left.isDown;

    const keyboardRight =
        this.cursors.right.isDown ||
        this.wasdKeys.right.isDown;

    const keyboardUp =
        this.cursors.up.isDown ||
        this.wasdKeys.up.isDown;

    const keyboardDown =
        this.cursors.down.isDown ||
        this.wasdKeys.down.isDown;

    if (keyboardLeft || this.moveLeft) {
        horizontalDirection -= 1;
    }

    if (keyboardRight || this.moveRight) {
        horizontalDirection += 1;
    }

    if (keyboardUp || this.moveUp) {
        verticalDirection -= 1;
    }

    if (keyboardDown || this.moveDown) {
        verticalDirection += 1;
    }

    const direction = new Phaser.Math.Vector2(
        horizontalDirection,
        verticalDirection
    );

    if (direction.length() > 0) {
        direction.normalize();
    }

    const moveDistance =
        this.playerSpeed * (delta / 1000);

    this.player.x +=
        direction.x * moveDistance;

    this.player.y +=
        direction.y * moveDistance;

    this.keepPlayerInsideField();
    this.updateFootballPossession();
    this.keepFootballInsideField();
}

updateFootballPossession() {
    if (!this.football) {
        return;
    }

    if (this.playerHasBall) {
        this.football.x = this.player.x + 10;
        this.football.y = this.player.y + 2;

        return;
    }

    const distanceToBall = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.football.x,
        this.football.y
    );

    if (distanceToBall <= this.ballPickupDistance) {
        this.takeFootballPossession();
    }
}

takeFootballPossession() {
    this.playerHasBall = true;

    this.football.setStrokeStyle(
        2,
        0xffff00
    );
}

dropFootball() {
    if (!this.playerHasBall) {
        return;
    }

    this.playerHasBall = false;

    this.football.x = this.player.x + 24;
    this.football.y = this.player.y;

    this.football.setStrokeStyle(
        2,
        0xffffff
    );
}

keepPlayerInsideField() {
    const {
        centreX,
        centreY,
        horizontalRadius,
        verticalRadius
    } = this.field;

    const playerRadius = 12;

    const relativeX =
        this.player.x - centreX;

    const relativeY =
        this.player.y - centreY;

    const allowedHorizontalRadius =
        horizontalRadius - playerRadius;

    const allowedVerticalRadius =
        verticalRadius - playerRadius;

    const ellipseValue =
        (relativeX * relativeX) /
        (allowedHorizontalRadius * allowedHorizontalRadius) +
        (relativeY * relativeY) /
        (allowedVerticalRadius * allowedVerticalRadius);

    if (ellipseValue <= 1) {
        return;
    }

    const correctionScale =
        1 / Math.sqrt(ellipseValue);

    this.player.x =
        centreX +
        relativeX * correctionScale;

    this.player.y =
        centreY +
        relativeY * correctionScale;
}

keepFootballInsideField() {
    if (!this.football || this.playerHasBall) {
        return;
    }

    const {
        centreX,
        centreY,
        horizontalRadius,
        verticalRadius
    } = this.field;

    const ballRadius = 7;

    const relativeX =
        this.football.x - centreX;

    const relativeY =
        this.football.y - centreY;

    const allowedHorizontalRadius =
        horizontalRadius - ballRadius;

    const allowedVerticalRadius =
        verticalRadius - ballRadius;

    const ellipseValue =
        (relativeX * relativeX) /
        (allowedHorizontalRadius * allowedHorizontalRadius) +
        (relativeY * relativeY) /
        (allowedVerticalRadius * allowedVerticalRadius);

    if (ellipseValue <= 1) {
        return;
    }

    const correctionScale =
        1 / Math.sqrt(ellipseValue);

    this.football.x =
        centreX +
        relativeX * correctionScale;

    this.football.y =
        centreY +
        relativeY * correctionScale;
}

createGround() {
    const graphics = this.add.graphics();

    /*
     * MCG playing-area proportions:
     * approximately 160 metres long × 141 metres wide.
     *
     * The field is fitted to the available game screen while
     * preserving that general proportion.
     */
    const fieldLengthMetres = 160;
    const fieldWidthMetres = 141;

    const ovalHeight = 292;
    const ovalWidth =
        ovalHeight * (fieldLengthMetres / fieldWidthMetres);

    const centreX = GAME_WIDTH / 2;
    const centreY = 218;

    const horizontalRadius = ovalWidth / 2;
    const verticalRadius = ovalHeight / 2;

    /*
     * Store the field geometry so later functions can use
     * exactly the same measurements.
     */
    this.field = {
        centreX,
        centreY,
        ovalWidth,
        ovalHeight,
        horizontalRadius,
        verticalRadius,
        fieldLengthMetres,
        fieldWidthMetres
    };

    // Grass
    graphics.fillStyle(0x3f9846, 1);

    graphics.fillEllipse(
        centreX,
        centreY,
        ovalWidth,
        ovalHeight
    );

    // Boundary line
    graphics.lineStyle(4, 0xffffff, 1);

    graphics.strokeEllipse(
        centreX,
        centreY,
        ovalWidth,
        ovalHeight
    );

    // Centre square
    const centreSquareSize = 82;

    graphics.lineStyle(3, 0xffffff, 1);

    graphics.strokeRect(
        centreX - centreSquareSize / 2,
        centreY - centreSquareSize / 2,
        centreSquareSize,
        centreSquareSize
    );

    // Centre circle
    graphics.strokeCircle(
        centreX,
        centreY,
        22
    );

    // Centre point
    graphics.fillStyle(0xffffff, 1);

    graphics.fillRect(
        centreX - 3,
        centreY - 3,
        6,
        6
    );

    this.createGoalposts(graphics);
    this.createGoalSquares(graphics);
    this.createFiftyMetreArcs(graphics);
    this.createInterchangeBenches();
}

createGoalSquares(graphics) {
    const {
        centreY,
        leftGoalLineX,
        rightGoalLineX,
        goalPostOffset
    } = this.field;

    /*
     * The short side runs directly between the two goalposts.
     *
     * The goalposts sit at:
     * centreY - goalPostOffset
     * centreY + goalPostOffset
     */
    const goalSquareWidth =
        goalPostOffset * 2;

    const goalSquareDepth = 34;

    graphics.lineStyle(3, 0xffffff, 1);

    /*
     * Left goal square extends inwards from the goal line.
     */
    graphics.strokeRect(
        leftGoalLineX,
        centreY - goalSquareWidth / 2,
        goalSquareDepth,
        goalSquareWidth
    );

    /*
     * Right goal square extends inwards from the goal line.
     */
    graphics.strokeRect(
        rightGoalLineX - goalSquareDepth,
        centreY - goalSquareWidth / 2,
        goalSquareDepth,
        goalSquareWidth
    );
}

createFiftyMetreArcs(graphics) {
    const {
        centreX,
        centreY,
        horizontalRadius,
        verticalRadius,
        fieldLengthMetres,
        fieldWidthMetres,
        leftGoalLineX,
        rightGoalLineX
    } = this.field;

    /*
     * Convert 50 metres into screen coordinates.
     *
     * Horizontal and vertical scaling differ because the
     * oval is fitted onto a rectangular screen.
     */
    const pixelsPerMetreX =
        (horizontalRadius * 2) / fieldLengthMetres;

    const pixelsPerMetreY =
        (verticalRadius * 2) / fieldWidthMetres;

    const arcRadiusX = 50 * pixelsPerMetreX;
    const arcRadiusY = 50 * pixelsPerMetreY;

    graphics.lineStyle(3, 0xffffff, 1);

    /*
     * Returns true when a point is inside the oval.
     */
    const pointIsInsideBoundary = (x, y) => {
        const normalisedX =
            (x - centreX) / horizontalRadius;

        const normalisedY =
            (y - centreY) / verticalRadius;

        return (
            normalisedX * normalisedX +
            normalisedY * normalisedY
        ) <= 1;
    };

    /*
     * Draw a sampled elliptical arc, but only draw the
     * portions that remain inside the field boundary.
     */
    const drawClippedArc = (
        arcCentreX,
        startAngle,
        endAngle
    ) => {
        const steps = 160;

        graphics.beginPath();

        let previousPointWasInside = false;

        for (let step = 0; step <= steps; step += 1) {
            const progress = step / steps;

            const angle =
                startAngle +
                (endAngle - startAngle) * progress;

            const x =
                arcCentreX +
                Math.cos(angle) * arcRadiusX;

            const y =
                centreY +
                Math.sin(angle) * arcRadiusY;

            const insideBoundary =
                pointIsInsideBoundary(x, y);

            if (insideBoundary) {
                if (!previousPointWasInside) {
                    graphics.moveTo(x, y);
                } else {
                    graphics.lineTo(x, y);
                }
            }

            previousPointWasInside = insideBoundary;
        }

        graphics.strokePath();
    };

    /*
     * Left arc curves inwards towards the centre.
     */
    drawClippedArc(
        leftGoalLineX,
        Phaser.Math.DegToRad(-90),
        Phaser.Math.DegToRad(90)
    );

    /*
     * Right arc curves inwards towards the centre.
     */
    drawClippedArc(
        rightGoalLineX,
        Phaser.Math.DegToRad(90),
        Phaser.Math.DegToRad(270)
    );
}

    createGoalposts(graphics) {
    const {
        centreX,
        centreY,
        horizontalRadius
    } = this.field;

    /*
     * Move the goal line slightly inside the boundary.
     */
    const goalLineInset = 8;

    const leftGoalLineX =
        centreX - horizontalRadius + goalLineInset;

    const rightGoalLineX =
        centreX + horizontalRadius - goalLineInset;

    /*
     * The two inner posts are the goalposts.
     * The two outer posts are the behind posts.
     */
    const behindPostOffset = 48;
    const goalPostOffset = 20;

    const postOffsets = [
        -behindPostOffset,
        -goalPostOffset,
        goalPostOffset,
        behindPostOffset
    ];

    postOffsets.forEach((offset, index) => {
        const isGoalPost = index === 1 || index === 2;

        const postDepth = isGoalPost ? 22 : 16;
        const postThickness = 5;

        /*
         * Left-side posts extend outwards from the field.
         */
        this.add.rectangle(
            leftGoalLineX - postDepth / 2,
            centreY + offset,
            postDepth,
            postThickness,
            0xffffff
        );

        /*
         * Right-side posts extend outwards from the field.
         */
        this.add.rectangle(
            rightGoalLineX + postDepth / 2,
            centreY + offset,
            postDepth,
            postThickness,
            0xffffff
        );
    });

    this.field.leftGoalLineX = leftGoalLineX;
    this.field.rightGoalLineX = rightGoalLineX;
    this.field.goalPostOffset = goalPostOffset;
}

   createInterchangeBenches() {
    const benchY = 74;

    const benchWidth = 105;
    const benchHeight = 18;

    const centreX = GAME_WIDTH / 2;
    const gapBetweenBenches = 18;

    const homeBenchX =
        centreX - benchWidth / 2 - gapBetweenBenches / 2;

    const awayBenchX =
        centreX + benchWidth / 2 + gapBetweenBenches / 2;

    // Home bench
    this.add.rectangle(
        homeBenchX,
        benchY,
        benchWidth,
        benchHeight,
        0x9d1f1f
    ).setStrokeStyle(2, 0xffffff);

    this.add.text(
        homeBenchX,
        benchY,
        "HOME BENCH",
        {
            fontFamily: "Courier New",
            fontSize: "11px",
            color: "#ffffff"
        }
    ).setOrigin(0.5);

    // Away bench
    this.add.rectangle(
        awayBenchX,
        benchY,
        benchWidth,
        benchHeight,
        0x184f9e
    ).setStrokeStyle(2, 0xffffff);

    this.add.text(
        awayBenchX,
        benchY,
        "AWAY BENCH",
        {
            fontFamily: "Courier New",
            fontSize: "11px",
            color: "#ffffff"
        }
    ).setOrigin(0.5);
}

    createScoreboard() {
        const scoreboardY = 25;

        // Main TV-style scoreboard panel
        this.add.rectangle(
            GAME_WIDTH / 2,
            scoreboardY,
            650,
            42,
            0x111111
        ).setStrokeStyle(2, 0xffffff);

        // Home team panel
        this.add.rectangle(
            117,
            scoreboardY,
            185,
            34,
            0x9d1f1f
        );

        // Quarter and timer panel
        this.add.rectangle(
            GAME_WIDTH / 2,
            scoreboardY,
            170,
            34,
            0x262626
        );

        // Away team panel
        this.add.rectangle(
            GAME_WIDTH - 117,
            scoreboardY,
            185,
            34,
            0x184f9e
        );

        this.add.text(
            36,
            13,
            "HOME",
            {
                fontFamily: "Courier New",
                fontSize: "15px",
                color: "#ffffff"
            }
        );

        this.add.text(
            198,
            13,
            "0.0.0",
            {
                fontFamily: "Courier New",
                fontSize: "15px",
                color: "#ffffff"
            }
        ).setOrigin(1, 0);

        this.add.text(
            GAME_WIDTH / 2,
            13,
            "Q1   1:30",
            {
                fontFamily: "Courier New",
                fontSize: "16px",
                color: "#ffffff"
            }
        ).setOrigin(0.5, 0);

        this.add.text(
            GAME_WIDTH - 198,
            13,
            "0.0.0",
            {
                fontFamily: "Courier New",
                fontSize: "15px",
                color: "#ffffff"
            }
        );

        this.add.text(
            GAME_WIDTH - 36,
            13,
            "AWAY",
            {
                fontFamily: "Courier New",
                fontSize: "15px",
                color: "#ffffff"
            }
        ).setOrigin(1, 0);
    }
}

const gameConfig = {
    type: Phaser.AUTO,

    width: GAME_WIDTH,
    height: GAME_HEIGHT,

    parent: "game-container",

    backgroundColor: "#171717",

    pixelArt: true,
    roundPixels: true,

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_WIDTH,
        height: GAME_HEIGHT
    },

    scene: MatchScene
};

window.game = new Phaser.Game(gameConfig);