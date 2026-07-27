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
    this.createTeammate();
    this.createOpponent();
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

createTeammate() {
    this.teammate = this.add.rectangle(
        GAME_WIDTH / 2 + 120,
        GAME_HEIGHT / 2 - 55,
        22,
        30,
        0x2185d0
    );

    this.teammate.setStrokeStyle(
        3,
        0xffffff
    );

    this.teammateData = {
        team: "home",
        state: "SUPPORT",
        speed: 135,
        targetX: this.teammate.x,
        targetY: this.teammate.y,
        hasBall: false
    };
}

createOpponent() {
    this.opponent = this.add.rectangle(
        GAME_WIDTH / 2 + 55,
        GAME_HEIGHT / 2 + 70,
        22,
        30,
        0x2fa84f
    );

    this.opponent.setStrokeStyle(
        3,
        0xffffff
    );

    this.opponentData = {
        team: "away",
        state: "CHASE",
        speed: 125,
        targetX: this.opponent.x,
        targetY: this.opponent.y,
        hasBall: false
    };
}

createFootball() {
    this.football = this.add.ellipse(
        GAME_WIDTH / 2 + 75,
        GAME_HEIGHT / 2 + 25,
        15,
        9,
        0x9a5a2b
    );

    this.football.setStrokeStyle(2, 0xffffff);

    // Possession
    this.playerHasBall = false;
    this.ballPickupDistance = 24;

    // Ball movement
    this.footballInFlight = false;
    this.footballVelocityX = 0;
    this.footballVelocityY = 0;

    // Drag aiming
    this.isAimingPass = false;
    this.aimPointerId = null;

    this.aimStartX = 0;
    this.aimStartY = 0;
    this.aimCurrentX = 0;
    this.aimCurrentY = 0;

    this.minimumPassDrag = 18;
    this.maximumPassDrag = 140;

    // Short drag = handball, long drag = kick.
    this.handballKickThreshold = 65;

    // Automatic bounce tracking.
    this.distanceRunWithBall = 0;

    /*
     * The ground is approximately 160 metres long.
     * This converts 15 metres into the current field's pixel scale.
     */
    this.maximumRunDistance =
        this.field.horizontalRadius * 2 * (15 / 160);

    this.isBallBouncing = false;
    this.ballBounceTimer = 0;
    this.ballBounceDuration = 300;

    // Pass label
    this.passTypeText = this.add.text(
        GAME_WIDTH - 24,
        64,
        "",
        {
            fontFamily: "Courier New",
            fontSize: "15px",
            color: "#ffffff",
            backgroundColor: "#222222",
            padding: {
                x: 8,
                y: 5
            }
        }
    ).setOrigin(1, 0);

    // Aiming line
    this.aimGraphics = this.add.graphics();
}

createKeyboardControls() {
    this.cursors = this.input.keyboard.createCursorKeys();

    this.wasdKeys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
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

this.input.on("pointerdown", (pointer) => {
    this.beginPassAim(pointer);
});

this.input.on("pointermove", (pointer) => {
    this.updatePassAim(pointer);
});

this.input.on("pointerup", (pointer) => {
    this.releasePassAim(pointer);
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

beginPassAim(pointer) {
    /*
     * The player must have possession.
     */
    if (!this.playerHasBall) {
        return;
    }

    /*
     * Do not begin another pass while one is already being aimed.
     */
    if (this.isAimingPass) {
        return;
    }

    /*
     * Convert the pointer into game-world coordinates.
     */
    const pointerX = pointer.worldX;
    const pointerY = pointer.worldY;

    const distanceFromPlayer =
        Phaser.Math.Distance.Between(
            pointerX,
            pointerY,
            this.player.x,
            this.player.y
        );

    /*
     * The touch must start close to the player.
     */
    const aimStartDistance = 42;

    if (distanceFromPlayer > aimStartDistance) {
        return;
    }

    this.isAimingPass = true;
    this.aimPointerId = pointer.id;

    this.aimStartX = pointerX;
    this.aimStartY = pointerY;

    this.aimCurrentX = pointerX;
    this.aimCurrentY = pointerY;

    /*
     * Stop movement while aiming.
     */
    this.resetTouchMovement();

    this.drawPassAim();
}

updatePassAim(pointer) {
    if (!this.isAimingPass) {
        return;
    }

    if (pointer.id !== this.aimPointerId) {
        return;
    }

    this.aimCurrentX = pointer.worldX;
    this.aimCurrentY = pointer.worldY;

    this.drawPassAim();
}

drawPassAim() {
    this.aimGraphics.clear();

    if (!this.isAimingPass) {
        this.passTypeText.setText("");
        return;
    }

    const dragX =
        this.aimCurrentX - this.aimStartX;

    const dragY =
        this.aimCurrentY - this.aimStartY;

    /*
     * Horizontal drag controls power.
     *
     * Absolute value lets us test dragging either left or
     * right during this early prototype.
     */
    const horizontalDrag =
        Phaser.Math.Clamp(
            Math.abs(dragX),
            0,
            this.maximumPassDrag
        );

    /*
     * Vertical direction is inverted:
     *
     * Drag down = ball aims up
     * Drag up   = ball aims down
     */
    const aimedVerticalOffset = -dragY;

    const previewLength =
        Phaser.Math.Linear(
            35,
            170,
            horizontalDrag / this.maximumPassDrag
        );

    const previewEndX =
        this.player.x + previewLength;

    const previewEndY =
        this.player.y +
        Phaser.Math.Clamp(
            aimedVerticalOffset,
            -100,
            100
        );

    const isKick =
        horizontalDrag >= this.handballKickThreshold;

    const lineColour =
        isKick ? 0xffd43b : 0x66d9ff;

    this.aimGraphics.lineStyle(
        3,
        lineColour,
        1
    );

    this.aimGraphics.beginPath();

    this.aimGraphics.moveTo(
        this.player.x,
        this.player.y
    );

    this.aimGraphics.lineTo(
        previewEndX,
        previewEndY
    );

    this.aimGraphics.strokePath();

    /*
     * Draw a small target marker.
     */
    this.aimGraphics.strokeCircle(
        previewEndX,
        previewEndY,
        7
    );

    if (horizontalDrag < this.minimumPassDrag) {
        this.passTypeText.setText("DRAG TO PASS");
    } else if (isKick) {
        this.passTypeText.setText("KICK");
    } else {
        this.passTypeText.setText("HANDBALL");
    }
}

releasePassAim(pointer) {
    if (!this.isAimingPass) {
        return;
    }

    if (pointer.id !== this.aimPointerId) {
        return;
    }

    this.aimCurrentX = pointer.worldX;
    this.aimCurrentY = pointer.worldY;

    const dragX =
        this.aimCurrentX - this.aimStartX;

    const dragY =
        this.aimCurrentY - this.aimStartY;

    const horizontalDrag =
        Phaser.Math.Clamp(
            Math.abs(dragX),
            0,
            this.maximumPassDrag
        );

    /*
     * Cancel very small accidental drags.
     */
    if (horizontalDrag < this.minimumPassDrag) {
        this.cancelPassAim();
        return;
    }

    const isKick =
        horizontalDrag >= this.handballKickThreshold;

    this.launchFootball(
        horizontalDrag,
        dragY,
        isKick
    );

    this.cancelPassAim();
}

cancelPassAim() {
    this.isAimingPass = false;
    this.aimPointerId = null;

    this.aimGraphics.clear();
    this.passTypeText.setText("");
}

launchFootball(horizontalDrag, verticalDrag, isKick) {
    if (!this.playerHasBall) {
        return;
    }

    this.playerHasBall = false;
    this.footballInFlight = true;

    /*
     * Horizontal drag determines the percentage of maximum power.
     */
    const powerPercentage =
        horizontalDrag / this.maximumPassDrag;

    /*
     * Kicks travel faster and farther than handballs.
     */
    const minimumSpeed = isKick ? 250 : 170;
    const maximumSpeed = isKick ? 480 : 280;

    const launchSpeed =
        Phaser.Math.Linear(
            minimumSpeed,
            maximumSpeed,
            powerPercentage
        );

    /*
     * This prototype always attacks toward the right.
     *
     * Vertical drag is inverted.
     */
    const direction = new Phaser.Math.Vector2(
        1,
        Phaser.Math.Clamp(
            -verticalDrag / 100,
            -1,
            1
        )
    );

    direction.normalize();

    this.football.x = this.player.x + 18;
    this.football.y = this.player.y;

    this.footballVelocityX =
        direction.x * launchSpeed;

    this.footballVelocityY =
        direction.y * launchSpeed;

    /*
     * The football has a different outline while travelling.
     */
    this.football.setStrokeStyle(
        2,
        isKick ? 0xffd43b : 0x66d9ff
    );

    console.log(
        isKick
            ? "Player kicked the football."
            : "Player handballed the football."
    );
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

const previousPlayerX = this.player.x;
const previousPlayerY = this.player.y;

this.player.x +=
    direction.x * moveDistance;

this.player.y +=
    direction.y * moveDistance;

const actualDistanceMoved =
    Phaser.Math.Distance.Between(
        previousPlayerX,
        previousPlayerY,
        this.player.x,
        this.player.y
    );

this.updateAutomaticBounce(
    actualDistanceMoved,
    delta
);

this.keepPlayerInsideField();
this.updateTeammateSupport(delta);
this.updateOpponentChase(delta);
this.updateFootballFlight(delta);
this.updateFootballPossession();
this.keepFootballInsideField();
}

updateTeammateSupport(delta) {
    if (!this.teammate || !this.player) {
        return;
    }

    /*
     * The teammate tries to remain ahead of the player,
     * giving the player a forward passing option.
     */
    const forwardDistance = 115;

    /*
     * The teammate moves to the opposite side of the
     * ground from the player's current position.
     */
    const supportWidth = 65;
    const groundCentreY = GAME_HEIGHT / 2;

    let verticalOffset;

    if (this.player.y >= groundCentreY) {
        verticalOffset = -supportWidth;
    } else {
        verticalOffset = supportWidth;
    }

    let targetX =
        this.player.x + forwardDistance;

    let targetY =
        this.player.y + verticalOffset;

    /*
     * Temporarily keep the target inside the visible
     * game area. We will add proper oval boundary
     * movement in Step 12E.
     */
    targetX = Phaser.Math.Clamp(
        targetX,
        40,
        GAME_WIDTH - 40
    );

    targetY = Phaser.Math.Clamp(
        targetY,
        95,
        GAME_HEIGHT - 40
    );

    this.teammateData.targetX = targetX;
    this.teammateData.targetY = targetY;

    const directionToTarget =
        new Phaser.Math.Vector2(
            targetX - this.teammate.x,
            targetY - this.teammate.y
        );

    const distanceToTarget =
        directionToTarget.length();

    /*
     * Stop moving when the teammate is close enough
     * to the target. This prevents shaking or jittering.
     */
    const stoppingDistance = 4;

    if (distanceToTarget <= stoppingDistance) {
        return;
    }

    directionToTarget.normalize();

    const deltaSeconds = delta / 1000;

    const maximumMovement =
        this.teammateData.speed * deltaSeconds;

    const movementDistance =
        Math.min(
            maximumMovement,
            distanceToTarget
        );

    this.teammate.x +=
        directionToTarget.x * movementDistance;

    this.teammate.y +=
        directionToTarget.y * movementDistance;
}

updateOpponentChase(delta) {
    if (!this.opponent || !this.player) {
        return;
    }

    /*
     * For now, the opponent only chases when the
     * controlled player has possession.
     */
    if (!this.playerHasBall) {
        this.opponentData.state = "WAIT";
        return;
    }

    this.opponentData.state = "CHASE";

    /*
     * The opponent targets the controlled player's
     * current position.
     */
    const targetX = this.player.x;
    const targetY = this.player.y;

    this.opponentData.targetX = targetX;
    this.opponentData.targetY = targetY;

    const directionToPlayer =
        new Phaser.Math.Vector2(
            targetX - this.opponent.x,
            targetY - this.opponent.y
        );

    const distanceToPlayer =
        directionToPlayer.length();

    /*
     * Stop before completely overlapping the player.
     * Tackling will be added in a later step.
     */
    const pressureDistance = 28;

    if (distanceToPlayer <= pressureDistance) {
        return;
    }

    directionToPlayer.normalize();

    const deltaSeconds = delta / 1000;

    const maximumMovement =
        this.opponentData.speed * deltaSeconds;

    const movementDistance =
        Math.min(
            maximumMovement,
            distanceToPlayer - pressureDistance
        );

    this.opponent.x +=
        directionToPlayer.x * movementDistance;

    this.opponent.y +=
        directionToPlayer.y * movementDistance;
}

updateAutomaticBounce(distanceMoved, delta) {
    if (!this.playerHasBall) {
        this.distanceRunWithBall = 0;
        return;
    }

    if (this.isAimingPass) {
        return;
    }

    if (this.isBallBouncing) {
        this.updateBallBounceAnimation(delta);
        return;
    }

    this.distanceRunWithBall += distanceMoved;

    if (
        this.distanceRunWithBall >=
        this.maximumRunDistance
    ) {
        this.startAutomaticBounce();
    }
}

startAutomaticBounce() {
    if (!this.playerHasBall) {
        return;
    }

    this.isBallBouncing = true;
    this.ballBounceTimer = 0;
    this.distanceRunWithBall = 0;

    console.log("Player automatically bounced the football.");
}

updateBallBounceAnimation(delta) {
    this.ballBounceTimer += delta;

    const progress =
        Phaser.Math.Clamp(
            this.ballBounceTimer /
            this.ballBounceDuration,
            0,
            1
        );

    /*
     * The football moves down toward the ground and
     * then returns to the player's hand.
     */
    const bounceCurve =
        Math.sin(progress * Math.PI);

    this.football.x = this.player.x + 10;
    this.football.y =
        this.player.y +
        2 +
        bounceCurve * 20;

    if (progress >= 1) {
        this.isBallBouncing = false;
        this.ballBounceTimer = 0;

        this.football.x = this.player.x + 10;
        this.football.y = this.player.y + 2;
    }
}

updateFootballPossession() {
    if (!this.football) {
        return;
    }

    if (this.footballInFlight) {
        return;
    }

    if (this.playerHasBall) {
        if (!this.isBallBouncing) {
            this.football.x = this.player.x + 10;
            this.football.y = this.player.y + 2;
        }

        return;
    }

    const distanceToBall =
        Phaser.Math.Distance.Between(
            this.player.x,
            this.player.y,
            this.football.x,
            this.football.y
        );

    if (distanceToBall <= this.ballPickupDistance) {
        this.takeFootballPossession();
    }
}

updateFootballFlight(delta) {
    if (!this.footballInFlight) {
        return;
    }

    const deltaSeconds = delta / 1000;

    this.football.x +=
        this.footballVelocityX * deltaSeconds;

    this.football.y +=
        this.footballVelocityY * deltaSeconds;

    /*
     * Apply gradual air resistance.
     */
    const dragPerSecond = 1.8;

    const dragMultiplier =
        Math.max(
            0,
            1 - dragPerSecond * deltaSeconds
        );

    this.footballVelocityX *= dragMultiplier;
    this.footballVelocityY *= dragMultiplier;

    const currentSpeed =
        Math.sqrt(
            this.footballVelocityX *
            this.footballVelocityX +
            this.footballVelocityY *
            this.footballVelocityY
        );

    /*
     * Stop the football once it becomes slow enough.
     */
    if (currentSpeed < 35) {
        this.stopFootballFlight();
    }
}

stopFootballFlight() {
    this.footballInFlight = false;

    this.footballVelocityX = 0;
    this.footballVelocityY = 0;

    this.football.setStrokeStyle(
        2,
        0xffffff
    );
}

takeFootballPossession() {
    this.playerHasBall = true;
    this.distanceRunWithBall = 0;
    this.isBallBouncing = false;

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

        if (this.footballInFlight) {
    this.stopFootballFlight();
}
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