"use strict";

/*
 * RETRO FOOTY
 * Step 7B: Expanded AFL field presentation
 */

/*
 * The game window is the portion of the world currently
 * visible to the player.
 */
const GAME_WIDTH = 700;
const GAME_HEIGHT = 390;

/*
 * The world is larger than the visible game window.
 *
 * The camera will eventually move around this larger area.
 */
const WORLD_WIDTH = 1400;
const WORLD_HEIGHT = 780;

class MatchScene extends Phaser.Scene {
    constructor() {
        super("MatchScene");
    }

create() {
    this.cameras.main.setBackgroundColor("#171717");

    /*
     * Allow the camera to move around the larger world.
     */
    this.cameras.main.setBounds(
        0,
        0,
        WORLD_WIDTH,
        WORLD_HEIGHT
    );

this.createGround();

this.createScoreboard();

this.createPlayer();
this.createTeammate();
this.createOpponent();

/*
 * The controlled and supporting roles can move between
 * the two home-team players.
 *
 * The rectangles themselves keep their colours and
 * identities.
 */
this.controlledPlayer = this.player;
this.supportPlayer = this.teammate;

this.createFootball();
this.createControlledPlayerIndicator();

/*
 * Create the invisible object that the camera follows.
 */
this.createCameraTarget();

this.createKeyboardControls();
this.createPassControls();
this.createTouchControls();

/*
 * Position the interface inside the fixed
 * 700 × 390 logical game view.
 */
this.layoutResponsiveInterface();

/*
 * Reapply those positions whenever the browser
 * or phone screen changes size.
 */
this.scale.on(
    Phaser.Scale.Events.RESIZE,
    this.handleGameResize,
    this
);

console.log(
    "Step 14F team possession system loaded."
);
}

handleGameResize() {
    /*
     * Phaser FIT automatically scales the canvas.
     *
     * We only restore the fixed logical positions
     * of the interface after a browser resize.
     */
    this.layoutResponsiveInterface();
}

layoutResponsiveInterface() {
    /*
     * Phaser FIT mode keeps the internal game view
     * fixed at GAME_WIDTH × GAME_HEIGHT.
     *
     * Therefore all interface positions should use
     * those fixed game coordinates.
     */

    /*
     * Keep the scoreboard centred at the top.
     */
    if (this.scoreboardContainer) {
        this.scoreboardContainer.setPosition(
            GAME_WIDTH / 2,
            25
        );
    }

    /*
     * Keep the pass label in the top-right corner.
     */
    if (this.passTypeText) {
        this.passTypeText.setPosition(
            GAME_WIDTH - 24,
            64
        );
    }

    /*
     * Keep the joystick in the bottom-right corner.
     */
    if (
        this.joystickBase &&
        this.joystickThumb
    ) {
        const screenPadding = 28;

        this.joystickCentreX =
            GAME_WIDTH -
            this.joystickRadius -
            screenPadding;

        this.joystickCentreY =
            GAME_HEIGHT -
            this.joystickRadius -
            screenPadding;

        this.joystickBase.setPosition(
            this.joystickCentreX,
            this.joystickCentreY
        );

        /*
         * Only recenter the joystick thumb when the
         * player is not touching the joystick.
         */
        if (this.joystickPointerId === null) {
            this.joystickThumb.setPosition(
                this.joystickCentreX,
                this.joystickCentreY
            );
        }
    }
}

createPlayer() {
    this.player = this.add.rectangle(
        this.field.centreX,
        this.field.centreY + 25,
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
    this.field.centreX + 155,
    this.field.centreY - 95,
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
        speed: 145,
        targetX: this.teammate.x,
        targetY: this.teammate.y,
        hasBall: false
    };
}

createControlledPlayerIndicator() {
    /*
     * The yellow triangle appears above whichever home
     * player is currently controlled.
     */
    this.controlledPlayerIndicator =
        this.add.triangle(
            this.controlledPlayer.x,
            this.controlledPlayer.y - 27,
            0,
            0,
            12,
            0,
            6,
            9,
            0xffff00
        );

    this.controlledPlayerIndicator
        .setStrokeStyle(
            2,
            0x111111
        )
        .setDepth(20);
}

updateControlledPlayerIndicator() {
    if (
        !this.controlledPlayerIndicator ||
        !this.controlledPlayer
    ) {
        return;
    }

    this.controlledPlayerIndicator.x =
        this.controlledPlayer.x;

    this.controlledPlayerIndicator.y =
        this.controlledPlayer.y - 27;
}

switchControlledPlayer(newControlledPlayer) {
    if (!newControlledPlayer) {
        return;
    }

    /*
     * Do nothing when this player is already controlled.
     */
    if (
        newControlledPlayer ===
        this.controlledPlayer
    ) {
        return;
    }

    const previousControlledPlayer =
        this.controlledPlayer;

    /*
     * The player receiving possession becomes controlled.
     *
     * The previously controlled player becomes the new
     * supporting AI player.
     */
    this.controlledPlayer =
        newControlledPlayer;

    this.supportPlayer =
        previousControlledPlayer;

    /*
     * Cancel any movement or disposal input that may
     * still belong to the previous player.
     */
    this.resetTouchMovement();
    this.cancelPassAim();

    this.distanceRunWithBall = 0;
    this.isBallBouncing = false;
    this.ballBounceTimer = 0;

    this.updateControlledPlayerIndicator();

    console.log(
        this.controlledPlayer === this.player
            ? "Control switched to the red player."
            : "Control switched to the blue player."
    );
}

isHomePlayer(playerObject) {
    return (
        playerObject === this.player ||
        playerObject === this.teammate
    );
}

hasHomePossession() {
    return (
        this.possessionOwner !== null &&
        this.isHomePlayer(
            this.possessionOwner
        )
    );
}

hasAwayPossession() {
    return (
        this.possessionOwner ===
        this.opponent
    );
}

clearPossession() {
    /*
     * Remove possession from every player.
     */
    this.possessionOwner = null;

    this.playerHasBall = false;

    if (this.teammateData) {
        this.teammateData.hasBall = false;
    }

    if (this.opponentData) {
        this.opponentData.hasBall = false;
    }

    /*
     * Stop the carried-ball bounce animation.
     */
    this.distanceRunWithBall = 0;
    this.isBallBouncing = false;
    this.ballBounceTimer = 0;

    if (this.football) {
        this.football.setStrokeStyle(
            2,
            0xffffff
        );
    }
}

setPossessionOwner(newOwner) {
    if (!newOwner) {
        this.clearPossession();
        return;
    }

    const ownerIsHomePlayer =
        this.isHomePlayer(newOwner);

    /*
     * Stop any flight, bounce or rolling movement before
     * placing the football into a player's possession.
     */
    this.stopFootballFlight();

    this.possessionOwner =
        newOwner;

    this.playerHasBall =
        ownerIsHomePlayer;

    if (this.teammateData) {
        this.teammateData.hasBall =
            newOwner === this.teammate;
    }

    if (this.opponentData) {
        this.opponentData.hasBall =
            newOwner === this.opponent;
    }

    /*
     * A home player with possession must always become
     * the controlled player.
     */
    if (ownerIsHomePlayer) {
        if (
            newOwner !==
            this.controlledPlayer
        ) {
            this.switchControlledPlayer(
                newOwner
            );
        }
    } else {
        /*
         * The away player remains controlled by AI.
         *
         * The user instead controls the nearest home
         * defender.
         */
        this.selectNearestHomeDefender();

        this.cancelPassAim();
        this.resetTouchMovement();
    }

    this.footballPickupLockTimer = 0;

    this.distanceRunWithBall = 0;
    this.isBallBouncing = false;
    this.ballBounceTimer = 0;

    /*
     * Attach the ball to the correct owner immediately.
     */
    this.attachFootballToPossessionOwner();

    this.football.setStrokeStyle(
        2,
        ownerIsHomePlayer
            ? 0xffff00
            : 0x7cff7c
    );
}

attachFootballToPossessionOwner() {
    if (
        !this.football ||
        !this.possessionOwner
    ) {
        return;
    }

    /*
     * Home players currently attack toward the right.
     *
     * The away player carries the football on their
     * left side while moving in the opposite direction.
     */
    const carryOffsetX =
        this.hasAwayPossession()
            ? -10
            : 10;

    this.football.x =
        this.possessionOwner.x +
        carryOffsetX;

    this.football.y =
        this.possessionOwner.y + 2;
}

selectNearestHomeDefender() {
    if (
        !this.player ||
        !this.teammate ||
        !this.opponent
    ) {
        return;
    }

    const redDistance =
        Phaser.Math.Distance.Between(
            this.player.x,
            this.player.y,
            this.opponent.x,
            this.opponent.y
        );

    const blueDistance =
        Phaser.Math.Distance.Between(
            this.teammate.x,
            this.teammate.y,
            this.opponent.x,
            this.opponent.y
        );

    const nearestDefender =
        redDistance <= blueDistance
            ? this.player
            : this.teammate;

    this.switchControlledPlayer(
        nearestDefender
    );

    console.log(
        nearestDefender === this.player
            ? "Red selected as nearest defender."
            : "Blue selected as nearest defender."
    );
}

createOpponent() {
this.opponent = this.add.rectangle(
    this.field.centreX + 170,
    this.field.centreY + 120,
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
        speed: 135,
        targetX: this.opponent.x,
        targetY: this.opponent.y,
        hasBall: false
    };
}

createFootball() {
this.football = this.add.ellipse(
    this.field.centreX + 75,
    this.field.centreY + 25,
        15,
        9,
        0x9a5a2b
    );

    this.football.setStrokeStyle(2, 0xffffff);

    // Possession
/*
 * The player object that currently owns the football.
 *
 * Possible values:
 *
 * this.player
 * this.teammate
 * this.opponent
 * null
 */
this.possessionOwner = null;

/*
 * Keep this temporary compatibility flag while older
 * home-possession systems are migrated.
 *
 * It is now updated only by the possession-owner system.
 */
this.playerHasBall = false;
/*
 * Loose-ball pickup settings.
 */
this.ballPickupDistance = 24;

/*
 * Running players receive a small pickup-distance bonus.
 */
this.runningPickupBonus = 6;

/*
 * Prevent the player from immediately recollecting
 * their own disposal.
 */
this.footballPickupLockTimer = 0;
this.footballPickupLockDuration = 220;

/*
 * During a ground bounce, the football can only be
 * collected when it is close to the ground.
 */
this.maximumPickupBounceCurve = 0.32;

// Ball movement
this.footballInFlight = false;

this.footballVelocityX = 0;
this.footballVelocityY = 0;

/*
 * Stores whether the current disposal is a kick
 * or handball.
 */
this.footballFlightType = null;

/*
 * Rotation speed is measured in degrees per second.
 */
this.footballRotationSpeed = 0;

/*
 * Tracks how long the football has been travelling.
 *
 * This will also support bounce and marking systems
 * in later steps.
 */
this.footballFlightTime = 0;

/*
 * Ground-ball movement states:
 *
 * NONE     = stationary or being carried
 * BOUNCING = completing one or more ground bounces
 * ROLLING  = travelling along the ground
 */
this.footballGroundState = "NONE";

/*
 * Track the current bounce animation.
 */
this.footballBounceCount = 0;
this.footballMaximumBounces = 3;

this.footballGroundBounceTimer = 0;
this.footballGroundBounceDuration = 260;

/*
 * Stores the football's scale when each bounce begins.
 */
this.footballBounceHeight = 0;

/*
 * Ground movement settings.
 */
this.footballRollingFriction = 2.8;
this.footballMinimumRollingSpeed = 12;

/*
 * Records the football's normal display size so the
 * flight animation can safely return it to normal.
 */
this.footballBaseScaleX = 1;
this.footballBaseScaleY = 1;

/*
 * Marking system.
 */
this.playerMarkDistance = 30;

/*
 * Prevent the player from immediately marking the
 * football as it leaves their boot.
 */
this.minimumMarkFlightTime = 0.22;

/*
 * Track how far the current disposal has travelled.
 *
 * Under AFL rules, a kick must travel at least
 * approximately 15 metres to be awarded as a mark.
 */
this.footballFlightDistance = 0;

this.minimumMarkDistance =
    this.field.horizontalRadius *
    2 *
    (15 / this.field.fieldLengthMetres);

/*
 * Stores whether the current kick has travelled far
 * enough to qualify for a mark.
 */
this.footballCanBeMarked = false;

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
    this.scale.gameSize.width - 24,
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
)
    .setOrigin(1, 0)
    .setScrollFactor(0)
    .setDepth(1001);
    // Aiming line
    this.aimGraphics = this.add.graphics();
}

createCameraTarget() {
    /*
     * This invisible point represents the current centre
     * of the action.
     */
this.cameraTarget = this.add.zone(
    this.controlledPlayer.x,
    this.controlledPlayer.y,
    1,
    1
);
    /*
     * Follow the target smoothly.
     *
     * Lower values create slower, smoother movement.
     * Higher values make the camera respond faster.
     */
/*
 * Camera tuning values.
 */
this.cameraSettings = {
    horizontalFollowSpeed: 0.11,
    verticalFollowSpeed: 0.11,

    deadzoneWidth: 80,
    deadzoneHeight: 50,

    zoom: 0.92,

    playerLookAheadX: 55,
    footballLookAheadX: 90,
    footballLookAheadY: 25
};

/*
 * Begin centred on the controlled player so the camera
 * does not slowly travel across the world at startup.
 */
this.cameras.main.centerOn(
    this.controlledPlayer.x,
    this.controlledPlayer.y
);

this.cameras.main.startFollow(
    this.cameraTarget,
    false,
    this.cameraSettings.horizontalFollowSpeed,
    this.cameraSettings.verticalFollowSpeed
);

    /*
 * Allow the action to move slightly before the camera
 * begins adjusting.
 *
 * This reduces constant tiny camera movements.
 */
this.cameras.main.setDeadzone(
    this.cameraSettings.deadzoneWidth,
    this.cameraSettings.deadzoneHeight
);

    /*
     * Prevent the camera from showing space outside
     * the larger game world.
     */
    this.cameras.main.setBounds(
        0,
        0,
        WORLD_WIDTH,
        WORLD_HEIGHT
    );

    /*
 * Slightly zoom out so the player can see more of the
 * field and nearby players.
 */
this.cameras.main.setZoom(
    this.cameraSettings.zoom
);

    /*
 * Keep pixel-art movement visually clean while
 * the camera scrolls.
 */
this.cameras.main.roundPixels = true;
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


createPassControls() {
    this.input.on(
        "pointerdown",
        (pointer) => {
            /*
             * Do not start pass aiming when the player
             * presses the movement joystick.
             */
            if (this.isPointerInsideJoystick(pointer)) {
                return;
            }

            /*
             * Also ignore the pointer currently controlling
             * the joystick.
             */
            if (
                this.joystickPointerId !== null &&
                pointer.id === this.joystickPointerId
            ) {
                return;
            }

            this.beginPassAim(pointer);
        }
    );

    this.input.on(
        "pointermove",
        (pointer) => {
            if (
                this.joystickPointerId !== null &&
                pointer.id === this.joystickPointerId
            ) {
                return;
            }

            this.updatePassAim(pointer);
        }
    );

    this.input.on(
        "pointerup",
        (pointer) => {
            if (
                this.joystickPointerId !== null &&
                pointer.id === this.joystickPointerId
            ) {
                return;
            }

            this.releasePassAim(pointer);
        }
    );
}

createTouchControls() {
    /*
     * Joystick dimensions and screen position.
     */
    const joystickRadius = 58;
    const thumbRadius = 27;
    const screenPadding = 28;

const currentScreenWidth =
    this.scale.gameSize.width;

const currentScreenHeight =
    this.scale.gameSize.height;

this.joystickCentreX =
    currentScreenWidth -
    joystickRadius -
    screenPadding;

this.joystickCentreY =
    currentScreenHeight -
    joystickRadius -
    screenPadding;

    this.joystickRadius = joystickRadius;
    this.joystickPointerId = null;

    /*
     * Semi-transparent outer joystick base.
     */
    this.joystickBase = this.add.circle(
        this.joystickCentreX,
        this.joystickCentreY,
        joystickRadius,
        0x111111,
        0.42
    )
        .setStrokeStyle(
            3,
            0xffffff,
            0.45
        )
        .setScrollFactor(0)
        .setDepth(1001)
        .setInteractive(
            new Phaser.Geom.Circle(
                joystickRadius,
                joystickRadius,
                joystickRadius
            ),
            Phaser.Geom.Circle.Contains
        );

    /*
     * Semi-transparent movable joystick thumb.
     */
    this.joystickThumb = this.add.circle(
        this.joystickCentreX,
        this.joystickCentreY,
        thumbRadius,
        0xffffff,
        0.58
    )
        .setStrokeStyle(
            2,
            0x111111,
            0.55
        )
        .setScrollFactor(0)
        .setDepth(1002);

    /*
     * Begin joystick movement.
     */
    this.joystickBase.on(
        "pointerdown",
        (pointer) => {
            if (this.joystickPointerId !== null) {
                return;
            }

            this.joystickPointerId = pointer.id;

            this.updateJoystickFromPointer(pointer);
        }
    );

    /*
     * Continue tracking the joystick pointer even if
     * the finger leaves the outer circle.
     */
    this.input.on(
        "pointermove",
        (pointer) => {
            if (
                this.joystickPointerId === null ||
                pointer.id !== this.joystickPointerId
            ) {
                return;
            }

            this.updateJoystickFromPointer(pointer);
        }
    );

    /*
     * Reset the joystick when the controlling finger
     * is released.
     */
    this.input.on(
        "pointerup",
        (pointer) => {
            if (
                this.joystickPointerId === null ||
                pointer.id !== this.joystickPointerId
            ) {
                return;
            }

            this.resetJoystick();
        }
    );
}

updateJoystickFromPointer(pointer) {
    if (
        !this.joystickThumb ||
        this.joystickPointerId === null
    ) {
        return;
    }

    /*
     * pointer.x and pointer.y are screen coordinates.
     *
     * This is correct because the joystick is fixed
     * to the screen rather than the game world.
     */
    const differenceX =
        pointer.x -
        this.joystickCentreX;

    const differenceY =
        pointer.y -
        this.joystickCentreY;

    const distanceFromCentre =
        Math.sqrt(
            differenceX * differenceX +
            differenceY * differenceY
        );

    /*
     * Prevent the thumb from travelling outside the
     * outer joystick base.
     */
    const clampedDistance =
        Math.min(
            distanceFromCentre,
            this.joystickRadius
        );

    let directionX = 0;
    let directionY = 0;

    if (distanceFromCentre > 0) {
        directionX =
            differenceX /
            distanceFromCentre;

        directionY =
            differenceY /
            distanceFromCentre;
    }

    this.joystickThumb.x =
        this.joystickCentreX +
        directionX *
        clampedDistance;

    this.joystickThumb.y =
        this.joystickCentreY +
        directionY *
        clampedDistance;

    /*
     * Ignore tiny movements near the centre.
     *
     * This prevents accidental movement when the player
     * first places their finger on the joystick.
     */
    const deadzone = 12;

    if (distanceFromCentre < deadzone) {
        this.resetTouchMovement();
        return;
    }

    /*
     * Translate the joystick direction into the existing
     * movement variables.
     *
     * A threshold below 0.35 allows diagonal movement
     * without making it too easy to trigger accidentally.
     */
    const directionThreshold = 0.35;

    this.moveLeft =
        directionX < -directionThreshold;

    this.moveRight =
        directionX > directionThreshold;

    this.moveUp =
        directionY < -directionThreshold;

    this.moveDown =
        directionY > directionThreshold;
}

resetJoystick() {
    this.joystickPointerId = null;

    this.resetTouchMovement();

    if (!this.joystickThumb) {
        return;
    }

    /*
     * Return the thumb to the centre.
     */
    this.joystickThumb.x =
        this.joystickCentreX;

    this.joystickThumb.y =
        this.joystickCentreY;
}

isPointerInsideJoystick(pointer) {
    if (
        this.joystickCentreX === undefined ||
        this.joystickCentreY === undefined ||
        this.joystickRadius === undefined
    ) {
        return false;
    }

    const differenceX =
        pointer.x -
        this.joystickCentreX;

    const differenceY =
        pointer.y -
        this.joystickCentreY;

    const distanceSquared =
        differenceX * differenceX +
        differenceY * differenceY;

    /*
     * Include a small amount of extra space around the
     * visible joystick to make touch input forgiving.
     */
    const touchRadius =
        this.joystickRadius + 14;

    return (
        distanceSquared <=
        touchRadius * touchRadius
    );
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
if (
    !this.hasHomePossession() ||
    this.possessionOwner !==
        this.controlledPlayer
) {
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
        this.controlledPlayer.x,
        this.controlledPlayer.y
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
    this.controlledPlayer.x +
    previewLength;

const previewEndY =
    this.controlledPlayer.y +
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
    this.controlledPlayer.x,
    this.controlledPlayer.y
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
if (
    !this.hasHomePossession() ||
    this.possessionOwner !==
        this.controlledPlayer
) {
    return;
}

    /*
     * Transfer possession from the player to the
     * travelling football.
     */
/*
 * Remember who disposed of the football.
 *
 * This will later help with turnovers, statistics and
 * player-specific kicking attributes.
 */
this.lastDisposalPlayer =
    this.controlledPlayer;

/*
 * The football becomes unowned while travelling.
 */
this.clearPossession();

this.footballInFlight = true;

    /*
 * Briefly prevent the player from recollecting the
 * disposal as it leaves their hands or boot.
 */
this.footballPickupLockTimer =
    this.footballPickupLockDuration;

    this.footballFlightType =
        isKick ? "KICK" : "HANDBALL";

    this.footballFlightTime = 0;

    /*
 * Begin tracking the new disposal.
 */
this.footballFlightDistance = 0;
this.footballCanBeMarked = false;

    /*
     * Convert the horizontal drag into a value
     * between 0 and 1.
     */
    const powerPercentage =
        Phaser.Math.Clamp(
            horizontalDrag /
                this.maximumPassDrag,
            0,
            1
        );

    /*
     * Kicks travel faster and farther.
     *
     * Handballs leave the player more slowly and
     * lose speed sooner.
     */
    const minimumSpeed =
        isKick ? 270 : 165;

    const maximumSpeed =
        isKick ? 520 : 285;

    const launchSpeed =
        Phaser.Math.Linear(
            minimumSpeed,
            maximumSpeed,
            powerPercentage
        );

    /*
     * Retro Footy currently attacks toward the right.
     *
     * Vertical drag remains inverted:
     *
     * Drag down = football travels up.
     * Drag up   = football travels down.
     */
    const verticalDirection =
        Phaser.Math.Clamp(
            -verticalDrag / 100,
            -1,
            1
        );

    const direction =
        new Phaser.Math.Vector2(
            1,
            verticalDirection
        );

    direction.normalize();

    /*
     * Place the football slightly in front of the
     * controlled player before launching it.
     */
this.football.x =
    this.controlledPlayer.x + 18;

this.football.y =
    this.controlledPlayer.y;

    this.footballVelocityX =
        direction.x * launchSpeed;

    this.footballVelocityY =
        direction.y * launchSpeed;

    /*
     * Kicks spin more quickly than handballs.
     *
     * Stronger disposals also spin slightly faster.
     */
    const minimumRotationSpeed =
        isKick ? 540 : 300;

    const maximumRotationSpeed =
        isKick ? 900 : 540;

/*
 * Use a negative rotation speed so the football
 * rotates anticlockwise, creating backward spin
 * while travelling toward the right.
 */
this.footballRotationSpeed =
    -Phaser.Math.Linear(
        minimumRotationSpeed,
        maximumRotationSpeed,
        powerPercentage
    );

    /*
     * Begin each flight from the football's normal
     * visual size.
     */
    this.football.setScale(
        this.footballBaseScaleX,
        this.footballBaseScaleY
    );

    /*
     * Use the outline to show the current disposal.
     */
    this.football.setStrokeStyle(
        2,
        isKick
            ? 0xffd43b
            : 0x66d9ff
    );

    console.log(
        isKick
            ? "Player kicked the football."
            : "Player handballed the football."
    );
}

update(time, delta) {
if (!this.controlledPlayer) {
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

/*
 * Record whether the controlled player is currently
 * moving before normalising the direction.
 */
this.playerIsMoving =
    direction.length() > 0;

if (this.playerIsMoving) {
    direction.normalize();
}

    const moveDistance =
        this.playerSpeed * (delta / 1000);

const previousPlayerX =
    this.controlledPlayer.x;

const previousPlayerY =
    this.controlledPlayer.y;

this.controlledPlayer.x +=
    direction.x * moveDistance;

this.controlledPlayer.y +=
    direction.y * moveDistance;

const actualDistanceMoved =
    Phaser.Math.Distance.Between(
        previousPlayerX,
        previousPlayerY,
        this.controlledPlayer.x,
        this.controlledPlayer.y
    );

this.updateAutomaticBounce(
    actualDistanceMoved,
    delta
);

this.keepPlayerInsideField();
this.updateTeammateSupport(delta);
this.updateOpponentChase(delta);
this.updateFootballFlight(delta);
this.updateFootballMarking();
this.updateFootballGroundPhysics(delta);
this.updateFootballPossession(delta);
this.keepFootballInsideField();

/*
 * Update the camera after all player and football
 * movement has been completed for this frame.
 */
this.updateCameraTarget();
this.updateControlledPlayerIndicator();
}

updateTeammateSupport(delta) {
    if (
        !this.supportPlayer ||
        !this.controlledPlayer
    ) {
        return;
    }

    /*
 * During away possession, the supporting home player
 * also moves toward the opponent as a secondary
 * defender.
 */
if (this.hasAwayPossession()) {
    const defensiveOffsetY =
        this.supportPlayer.y <=
        this.opponent.y
            ? -34
            : 34;

    const targetX =
        this.opponent.x + 18;

    const targetY =
        this.opponent.y +
        defensiveOffsetY;

    const correctedTarget =
        this.getPointInsideField(
            targetX,
            targetY
        );

    const directionToTarget =
        new Phaser.Math.Vector2(
            correctedTarget.x -
                this.supportPlayer.x,

            correctedTarget.y -
                this.supportPlayer.y
        );

    const distanceToTarget =
        directionToTarget.length();

    const stoppingDistance = 30;

    if (
        distanceToTarget >
        stoppingDistance
    ) {
        directionToTarget.normalize();

        const movementDistance =
            Math.min(
                this.teammateData.speed *
                    (delta / 1000),

                distanceToTarget -
                    stoppingDistance
            );

        this.supportPlayer.x +=
            directionToTarget.x *
            movementDistance;

        this.supportPlayer.y +=
            directionToTarget.y *
            movementDistance;
    }

    this.keepObjectInsideField(
        this.supportPlayer
    );

    return;
}

/*
 * When nobody has possession and the football is on
 * the ground, the supporting home player automatically
 * chases the loose football.
 *
 * The user still controls the selected home player.
 */
if (
    !this.possessionOwner &&
    !this.footballInFlight
) {
    const directionToFootball =
        new Phaser.Math.Vector2(
            this.football.x -
                this.supportPlayer.x,

            this.football.y -
                this.supportPlayer.y
        );

    const distanceToFootball =
        directionToFootball.length();

    /*
     * Stop slightly inside the normal pickup distance.
     *
     * updateFootballPossession() will award possession
     * when Blue reaches this distance.
     */
    const stoppingDistance =
        Math.max(
            4,
            this.ballPickupDistance - 4
        );

    if (
        distanceToFootball >
        stoppingDistance
    ) {
        directionToFootball.normalize();

        /*
         * Blue moves slightly faster when contesting
         * a loose football than during normal support.
         */
        const looseBallChaseSpeed = 155;

        const maximumMovement =
            looseBallChaseSpeed *
            (delta / 1000);

        const movementDistance =
            Math.min(
                maximumMovement,
                distanceToFootball -
                    stoppingDistance
            );

        this.supportPlayer.x +=
            directionToFootball.x *
            movementDistance;

        this.supportPlayer.y +=
            directionToFootball.y *
            movementDistance;
    }

    this.keepObjectInsideField(
        this.supportPlayer
    );

    return;
}

    /*
     * The supporting player tries to remain ahead of
     * the currently controlled player.
     */
    const forwardDistance = 115;
    const supportWidth = 65;

    const groundCentreY =
        this.field.centreY;

    let verticalOffset;

    if (
        this.controlledPlayer.y >=
        groundCentreY
    ) {
        verticalOffset =
            -supportWidth;
    } else {
        verticalOffset =
            supportWidth;
    }

    let targetX =
        this.controlledPlayer.x +
        forwardDistance;

    let targetY =
        this.controlledPlayer.y +
        verticalOffset;

    const correctedTarget =
        this.getPointInsideField(
            targetX,
            targetY
        );

    targetX = correctedTarget.x;
    targetY = correctedTarget.y;

    this.teammateData.targetX =
        targetX;

    this.teammateData.targetY =
        targetY;

    const directionToTarget =
        new Phaser.Math.Vector2(
            targetX -
                this.supportPlayer.x,

            targetY -
                this.supportPlayer.y
        );

    const distanceToTarget =
        directionToTarget.length();

    const stoppingDistance = 4;

    if (
        distanceToTarget <=
        stoppingDistance
    ) {
        this.keepObjectInsideField(
            this.supportPlayer
        );

        return;
    }

    directionToTarget.normalize();

    const deltaSeconds =
        delta / 1000;

    const maximumMovement =
        this.teammateData.speed *
        deltaSeconds;

    const movementDistance =
        Math.min(
            maximumMovement,
            distanceToTarget
        );

    this.supportPlayer.x +=
        directionToTarget.x *
        movementDistance;

    this.supportPlayer.y +=
        directionToTarget.y *
        movementDistance;

    this.keepObjectInsideField(
        this.supportPlayer
    );
}

updateOpponentChase(delta) {
    if (
        !this.opponent ||
        !this.controlledPlayer
    ) {
        return;
    }

    const deltaSeconds =
        delta / 1000;

    /*
     * When the opponent has possession, they carry the
     * football toward the left side of the ground.
     */
    if (this.hasAwayPossession()) {
        this.opponentData.state =
            "CARRY";

        const carryTargetX =
            this.opponent.x - 140;

        /*
         * Move slightly toward the centre corridor while
         * advancing.
         */
        const carryTargetY =
            Phaser.Math.Linear(
                this.opponent.y,
                this.field.centreY,
                0.28
            );

        const correctedTarget =
            this.getPointInsideField(
                carryTargetX,
                carryTargetY
            );

        const carryDirection =
            new Phaser.Math.Vector2(
                correctedTarget.x -
                    this.opponent.x,

                correctedTarget.y -
                    this.opponent.y
            );

        if (carryDirection.length() > 0) {
            carryDirection.normalize();
        }

        const carrySpeed = 118;

        this.opponent.x +=
            carryDirection.x *
            carrySpeed *
            deltaSeconds;

        this.opponent.y +=
            carryDirection.y *
            carrySpeed *
            deltaSeconds;

        this.keepObjectInsideField(
            this.opponent
        );

        return;
    }

    /*
     * Chase the home ball carrier during home
     * possession.
     */
    if (this.hasHomePossession()) {
        this.opponentData.state =
            "CHASE";

/*
 * Instead of standing directly on top of the ball
 * carrier, defend slightly goal-side and offset.
 */

const goalSideOffset = 40;

const lateralOffset =
    this.opponent.y < this.possessionOwner.y
        ? -30
        : 30;

const targetX =
    this.possessionOwner.x + goalSideOffset;

const targetY =
    this.possessionOwner.y + lateralOffset;

        this.opponentData.targetX =
            targetX;

        this.opponentData.targetY =
            targetY;

        const directionToPlayer =
            new Phaser.Math.Vector2(
                targetX -
                    this.opponent.x,

                targetY -
                    this.opponent.y
            );

        const distanceToPlayer =
            directionToPlayer.length();

/*
 * Green now applies pressure without standing
 * directly beside the ball carrier.
 */

const pressureDistance = 55;

        if (
            distanceToPlayer <=
            pressureDistance
        ) {
            this.keepObjectInsideField(
                this.opponent
            );

            return;
        }

        directionToPlayer.normalize();

        const maximumMovement =
            this.opponentData.speed *
            deltaSeconds;

        const movementDistance =
            Math.min(
                maximumMovement,
                distanceToPlayer -
                    pressureDistance
            );

        this.opponent.x +=
            directionToPlayer.x *
            movementDistance;

        this.opponent.y +=
            directionToPlayer.y *
            movementDistance;

        this.keepObjectInsideField(
            this.opponent
        );

        return;
    }

/*
 * While a kick is airborne, Green predicts where the
 * football is travelling and moves toward a possible
 * interception point.
 */
if (this.footballInFlight) {
    this.opponentData.state =
        "INTERCEPT_FLIGHT";

    /*
     * Handballs are too short and fast for Green to
     * predictively intercept at this stage.
     *
     * Green will hold position until a handball lands.
     */
    if (
        this.footballFlightType !==
        "KICK"
    ) {
        this.keepObjectInsideField(
            this.opponent
        );

        return;
    }

    const footballVelocity =
        new Phaser.Math.Vector2(
            this.footballVelocityX,
            this.footballVelocityY
        );

    const footballSpeed =
        footballVelocity.length();

    /*
     * Estimate how much farther the football will travel.
     *
     * Kicks currently use an exponential drag value of
     * 1.25 inside updateFootballFlight().
     */
    const kickDragPerSecond = 1.25;

    const estimatedRemainingDistance =
        footballSpeed /
        kickDragPerSecond;

    /*
     * Prevent Green from predicting an interception
     * point too far away.
     *
     * This keeps his movement readable and prevents him
     * from sprinting across the entire field.
     */
    const maximumPredictionDistance = 160;

    const predictionDistance =
        Phaser.Math.Clamp(
            estimatedRemainingDistance,
            35,
            maximumPredictionDistance
        );

    if (footballSpeed > 0) {
        footballVelocity.normalize();
    }

    let interceptionX =
        this.football.x +
        footballVelocity.x *
        predictionDistance;

    let interceptionY =
        this.football.y +
        footballVelocity.y *
        predictionDistance;

    /*
     * Keep the predicted interception point inside the
     * playable oval.
     */
    const correctedInterceptionPoint =
        this.getPointInsideField(
            interceptionX,
            interceptionY
        );

    interceptionX =
        correctedInterceptionPoint.x;

    interceptionY =
        correctedInterceptionPoint.y;

    this.opponentData.targetX =
        interceptionX;

    this.opponentData.targetY =
        interceptionY;

    const directionToInterception =
        new Phaser.Math.Vector2(
            interceptionX -
                this.opponent.x,

            interceptionY -
                this.opponent.y
        );

    const distanceToInterception =
        directionToInterception.length();

    /*
     * Green does not need to stand on the exact predicted
     * point. The existing marking distance will determine
     * whether he is close enough to mark the football.
     */
    const interceptionStoppingDistance =
        8;

    if (
        distanceToInterception <=
        interceptionStoppingDistance
    ) {
        this.keepObjectInsideField(
            this.opponent
        );

        return;
    }

    directionToInterception.normalize();

    /*
     * Green moves faster when reading an airborne kick
     * than during normal defensive positioning.
     */
    const interceptionSpeed = 140;

    const maximumMovement =
        interceptionSpeed *
        deltaSeconds;

    const movementDistance =
        Math.min(
            maximumMovement,
            distanceToInterception -
                interceptionStoppingDistance
        );

    this.opponent.x +=
        directionToInterception.x *
        movementDistance;

    this.opponent.y +=
        directionToInterception.y *
        movementDistance;

    this.keepObjectInsideField(
        this.opponent
    );

    return;
}

/*
 * When nobody owns the football and it is no longer
 * airborne, Green chases the loose ball.
 */
this.opponentData.state =
    "CHASE_LOOSE";

const directionToFootball =
    new Phaser.Math.Vector2(
        this.football.x -
            this.opponent.x,

        this.football.y -
            this.opponent.y
    );

const distanceToFootball =
    directionToFootball.length();

/*
 * Green stops just inside the existing pickup range.
 *
 * updateFootballPossession() will then award him
 * possession when he is close enough.
 */
const looseBallStoppingDistance =
    Math.max(
        4,
        this.ballPickupDistance - 4
    );

if (
    distanceToFootball <=
    looseBallStoppingDistance
) {
    this.keepObjectInsideField(
        this.opponent
    );

    return;
}

directionToFootball.normalize();

/*
 * Green moves faster when attacking a loose football
 * than he does during normal defensive pressure.
 */
const looseBallChaseSpeed = 145;

const maximumMovement =
    looseBallChaseSpeed *
    deltaSeconds;

const movementDistance =
    Math.min(
        maximumMovement,
        distanceToFootball -
            looseBallStoppingDistance
    );

this.opponent.x +=
    directionToFootball.x *
    movementDistance;

this.opponent.y +=
    directionToFootball.y *
    movementDistance;

this.keepObjectInsideField(
    this.opponent
);
}

updateCameraTarget() {
    if (
        !this.cameraTarget ||
!this.controlledPlayer ||
        !this.football ||
        !this.cameraSettings
    ) {
        return;
    }

    /*
     * While the player has possession, frame the camera
     * slightly ahead of the player.
     *
     * Retro Footy currently attacks toward the right.
     */
/*
 * Follow the current ball carrier, regardless of which
 * team owns the football.
 */
if (this.possessionOwner) {
    const possessionLookAheadX =
        this.hasAwayPossession()
            ? -this.cameraSettings
                .playerLookAheadX
            : this.cameraSettings
                .playerLookAheadX;

    this.cameraTarget.x =
        this.possessionOwner.x +
        possessionLookAheadX;

    this.cameraTarget.y =
        this.possessionOwner.y;

    this.keepCameraTargetInsideWorld();
    return;
}

    /*
     * While the football is travelling, use its velocity
     * to look ahead in the direction of the disposal.
     */
    if (this.footballInFlight) {
        const footballDirection =
            new Phaser.Math.Vector2(
                this.footballVelocityX,
                this.footballVelocityY
            );

        if (footballDirection.length() > 0) {
            footballDirection.normalize();
        }

        this.cameraTarget.x =
            this.football.x +
            footballDirection.x *
            this.cameraSettings.footballLookAheadX;

        this.cameraTarget.y =
            this.football.y +
            footballDirection.y *
            this.cameraSettings.footballLookAheadY;

        this.keepCameraTargetInsideWorld();
        return;
    }

    /*
     * When the football is loose and stationary, centre
     * the action on the ball itself.
     */
    this.cameraTarget.x = this.football.x;
    this.cameraTarget.y = this.football.y;

    this.keepCameraTargetInsideWorld();
}

keepCameraTargetInsideWorld() {
    if (!this.cameraTarget) {
        return;
    }

    const camera = this.cameras.main;

    const visibleHalfWidth =
        camera.width /
        camera.zoom /
        2;

    const visibleHalfHeight =
        camera.height /
        camera.zoom /
        2;

    /*
     * Safely calculate the limits even when the
     * browser viewport is unusually large.
     */
    const minimumX =
        Math.min(
            visibleHalfWidth,
            WORLD_WIDTH / 2
        );

    const maximumX =
        Math.max(
            WORLD_WIDTH - visibleHalfWidth,
            WORLD_WIDTH / 2
        );

    const minimumY =
        Math.min(
            visibleHalfHeight,
            WORLD_HEIGHT / 2
        );

    const maximumY =
        Math.max(
            WORLD_HEIGHT - visibleHalfHeight,
            WORLD_HEIGHT / 2
        );

    this.cameraTarget.x =
        Phaser.Math.Clamp(
            this.cameraTarget.x,
            minimumX,
            maximumX
        );

    this.cameraTarget.y =
        Phaser.Math.Clamp(
            this.cameraTarget.y,
            minimumY,
            maximumY
        );
}

getPointInsideField(
    x,
    y,
    horizontalPadding = 14,
    verticalPadding = 18
) {
    if (!this.field) {
        return {
            x: x,
            y: y
        };
    }

    const {
        centreX,
        centreY,
        horizontalRadius,
        verticalRadius
    } = this.field;

    const allowedHorizontalRadius =
        horizontalRadius - horizontalPadding;

    const allowedVerticalRadius =
        verticalRadius - verticalPadding;

    const relativeX = x - centreX;
    const relativeY = y - centreY;

    const ellipseValue =
        (relativeX * relativeX) /
            (
                allowedHorizontalRadius *
                allowedHorizontalRadius
            ) +
        (relativeY * relativeY) /
            (
                allowedVerticalRadius *
                allowedVerticalRadius
            );

    if (ellipseValue <= 1) {
        return {
            x: x,
            y: y
        };
    }

    const correctionScale =
        1 / Math.sqrt(ellipseValue);

    return {
        x:
            centreX +
            relativeX * correctionScale,

        y:
            centreY +
            relativeY * correctionScale
    };
}

keepObjectInsideField(
    gameObject,
    horizontalPadding = 14,
    verticalPadding = 18
) {
    if (!gameObject) {
        return;
    }

    const correctedPosition =
        this.getPointInsideField(
            gameObject.x,
            gameObject.y,
            horizontalPadding,
            verticalPadding
        );

    gameObject.x = correctedPosition.x;
    gameObject.y = correctedPosition.y;
}

updateAutomaticBounce(distanceMoved, delta) {
if (
    !this.hasHomePossession() ||
    this.possessionOwner !==
        this.controlledPlayer
) {
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
if (
    !this.hasHomePossession() ||
    this.possessionOwner !==
        this.controlledPlayer
) {
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

    this.football.x = this.controlledPlayer.x + 10;
    this.football.y =
        this.controlledPlayer.y +
        2 +
        bounceCurve * 20;

    if (progress >= 1) {
        this.isBallBouncing = false;
        this.ballBounceTimer = 0;

        this.football.x = this.controlledPlayer.x + 10;
        this.football.y = this.controlledPlayer.y + 2;
    }
}

updateFootballPossession(delta) {
    if (!this.football) {
        return;
    }

    if (this.footballPickupLockTimer > 0) {
        this.footballPickupLockTimer =
            Math.max(
                0,
                this.footballPickupLockTimer -
                    delta
            );
    }

    /*
     * While possession exists, attach the football to
     * the correct player.
     */
    if (this.possessionOwner) {
        if (
            !this.isBallBouncing ||
            this.hasAwayPossession()
        ) {
            this.attachFootballToPossessionOwner();
        }

        return;
    }

    /*
     * Airborne footballs are handled by the marking
     * system.
     */
    if (this.footballInFlight) {
        return;
    }

    if (this.footballPickupLockTimer > 0) {
        return;
    }

    if (!this.footballIsAvailableForPickup()) {
        return;
    }

    /*
     * Build a list of players close enough to collect
     * the loose football.
     */
    const pickupCandidates = [];

    const controlledPickupDistance =
        this.ballPickupDistance +
        (
            this.playerIsMoving
                ? this.runningPickupBonus
                : 0
        );

    const controlledDistance =
        Phaser.Math.Distance.Between(
            this.controlledPlayer.x,
            this.controlledPlayer.y,
            this.football.x,
            this.football.y
        );

    if (
        controlledDistance <=
        controlledPickupDistance
    ) {
        pickupCandidates.push({
            player:
                this.controlledPlayer,

            distance:
                controlledDistance
        });
    }

    const supportDistance =
        Phaser.Math.Distance.Between(
            this.supportPlayer.x,
            this.supportPlayer.y,
            this.football.x,
            this.football.y
        );

    if (
        supportDistance <=
        this.ballPickupDistance
    ) {
        pickupCandidates.push({
            player:
                this.supportPlayer,

            distance:
                supportDistance
        });
    }

    const opponentDistance =
        Phaser.Math.Distance.Between(
            this.opponent.x,
            this.opponent.y,
            this.football.x,
            this.football.y
        );

    if (
        opponentDistance <=
        this.ballPickupDistance
    ) {
        pickupCandidates.push({
            player:
                this.opponent,

            distance:
                opponentDistance
        });
    }

    if (pickupCandidates.length === 0) {
        return;
    }

    /*
     * When several players reach the football together,
     * award possession to the closest one.
     */
    pickupCandidates.sort(
        (firstCandidate, secondCandidate) =>
            firstCandidate.distance -
            secondCandidate.distance
    );

    this.completeLooseBallPickup(
        pickupCandidates[0].player
    );
}

footballIsAvailableForPickup() {
    /*
     * A stationary or rolling football is always
     * available for collection.
     */
    if (
        this.footballGroundState === "NONE" ||
        this.footballGroundState === "ROLLING"
    ) {
        return true;
    }

    /*
     * During a bounce, only allow collection when the
     * football is near the beginning or end of its arc.
     */
    if (
        this.footballGroundState === "BOUNCING"
    ) {
        const bounceProgress =
            Phaser.Math.Clamp(
                this.footballGroundBounceTimer /
                    this.footballGroundBounceDuration,
                0,
                1
            );

        const bounceCurve =
            Math.sin(
                bounceProgress *
                Math.PI
            );

        return (
            bounceCurve <=
            this.maximumPickupBounceCurve
        );
    }

    return false;
}

completeLooseBallPickup(receivingPlayer) {
    if (!receivingPlayer) {
        return;
    }

    const previousControlledPlayer =
        this.controlledPlayer;

    const receiverIsOpponent =
        receivingPlayer ===
        this.opponent;

    const controlWillSwitch =
        !receiverIsOpponent &&
        receivingPlayer !==
            previousControlledPlayer;

    this.setPossessionOwner(
        receivingPlayer
    );

    if (receiverIsOpponent) {
        console.log(
            "Opponent collected the loose football."
        );

        return;
    }

    if (controlWillSwitch) {
        console.log(
            "Supporting player collected the football. Control switched."
        );

        return;
    }

    console.log(
        this.playerIsMoving
            ? "Player completed a running pickup."
            : "Player collected the loose football."
    );
}

updateFootballFlight(delta) {
    if (!this.footballInFlight) {
        return;
    }

    const deltaSeconds =
        delta / 1000;

    this.footballFlightTime +=
        deltaSeconds;

        /*
 * Record the football's position before moving it so
 * we can measure the distance travelled this frame.
 */
const previousFootballX =
    this.football.x;

const previousFootballY =
    this.football.y;

    /*
     * Move the football using its current velocity.
     */
    this.football.x +=
        this.footballVelocityX *
        deltaSeconds;

    this.football.y +=
        this.footballVelocityY *
        deltaSeconds;

        /*
 * Add this frame's movement to the total disposal
 * distance.
 */
const distanceTravelledThisFrame =
    Phaser.Math.Distance.Between(
        previousFootballX,
        previousFootballY,
        this.football.x,
        this.football.y
    );

this.footballFlightDistance +=
    distanceTravelledThisFrame;

/*
 * Only kicks that have travelled the required distance
 * can result in a mark.
 *
 * Handballs can still be collected later as loose-ball
 * possessions, but they cannot be marked.
 */
this.footballCanBeMarked =
    this.footballFlightType === "KICK" &&
    this.footballFlightDistance >=
        this.minimumMarkDistance;

    /*
     * Rotate the football while it travels.
     */
    this.football.angle +=
        this.footballRotationSpeed *
        deltaSeconds;

    /*
     * Kicks hold their speed for longer.
     *
     * Handballs lose speed more quickly.
     */
    const dragPerSecond =
        this.footballFlightType === "KICK"
            ? 1.25
            : 2.15;

    /*
     * Exponential drag behaves consistently even if
     * the game's frame rate changes.
     */
    const dragMultiplier =
        Math.exp(
            -dragPerSecond *
            deltaSeconds
        );

    this.footballVelocityX *=
        dragMultiplier;

    this.footballVelocityY *=
        dragMultiplier;

    /*
     * Gradually reduce the spin as the football loses
     * speed.
     */
    const rotationDragPerSecond =
        this.footballFlightType === "KICK"
            ? 0.8
            : 1.35;

    const rotationDragMultiplier =
        Math.exp(
            -rotationDragPerSecond *
            deltaSeconds
        );

    this.footballRotationSpeed *=
        rotationDragMultiplier;

    /*
     * Give the flight a subtle visual height effect.
     *
     * The ball grows slightly and then returns toward
     * normal size as it slows.
     *
     * This is purely visual and does not change the
     * football's actual field position.
     */
    const flightPulseSpeed =
        this.footballFlightType === "KICK"
            ? 5
            : 7;

    const maximumScaleIncrease =
        this.footballFlightType === "KICK"
            ? 0.18
            : 0.10;

    const flightPulse =
        Math.max(
            0,
            Math.sin(
                this.footballFlightTime *
                flightPulseSpeed
            )
        );

    const flightScale =
        1 +
        flightPulse *
        maximumScaleIncrease;

    this.football.setScale(
        this.footballBaseScaleX *
            flightScale,

        this.footballBaseScaleY *
            flightScale
    );

    const currentSpeed =
        Math.sqrt(
            this.footballVelocityX *
                this.footballVelocityX +

            this.footballVelocityY *
                this.footballVelocityY
        );

    /*
     * Step 14A currently ends the flight once the ball
     * becomes slow.
     *
     * Step 14B will replace this stopping behaviour
     * with bouncing and rolling.
     */
    const stoppingSpeed =
        this.footballFlightType === "KICK"
            ? 42
            : 32;

if (currentSpeed <= stoppingSpeed) {
    this.startFootballGroundBounce();
}
}

updateFootballMarking() {
    if (!this.footballInFlight) {
        return;
    }

    if (this.footballFlightType !== "KICK") {
        return;
    }

    if (!this.footballCanBeMarked) {
        return;
    }

    if (
        this.footballFlightTime <
        this.minimumMarkFlightTime
    ) {
        return;
    }

    const markingCandidates = [
        this.controlledPlayer,
        this.supportPlayer,
        this.opponent
    ];

    const successfulCandidates = [];

    markingCandidates.forEach(
        (candidatePlayer) => {
            if (!candidatePlayer) {
                return;
            }

            const distanceToFootball =
                Phaser.Math.Distance.Between(
                    candidatePlayer.x,
                    candidatePlayer.y,
                    this.football.x,
                    this.football.y
                );

            if (
                distanceToFootball <=
                this.playerMarkDistance
            ) {
                successfulCandidates.push({
                    player:
                        candidatePlayer,

                    distance:
                        distanceToFootball
                });
            }
        }
    );

    if (
        successfulCandidates.length === 0
    ) {
        return;
    }

    successfulCandidates.sort(
        (firstCandidate, secondCandidate) =>
            firstCandidate.distance -
            secondCandidate.distance
    );

    const closestCandidate =
        successfulCandidates[0];

    const secondCandidate =
        successfulCandidates[1];

    /*
     * A spoil can only occur when two players reach
     * the football at almost the same time.
     */
    if (secondCandidate) {
        const closestIsOpponent =
            closestCandidate.player ===
            this.opponent;

        const secondIsOpponent =
            secondCandidate.player ===
            this.opponent;

        const playersAreOpponents =
            closestIsOpponent !==
            secondIsOpponent;

        const contestDistanceDifference =
            Math.abs(
                closestCandidate.distance -
                secondCandidate.distance
            );

        const spoilContestMargin = 22;

        if (
            playersAreOpponents &&
            contestDistanceDifference <=
                spoilContestMargin
        ) {
            /*
             * Change the flight type so this disposal
             * cannot immediately be marked again.
             */
            this.footballFlightType =
                "SPOIL";

            this.footballCanBeMarked =
                false;

            /*
             * Reduce the forward speed and knock the
             * football sideways away from the contest.
             */
            this.footballVelocityX *=
                0.45;

            const spoilDirection =
                this.opponent.y <=
                this.football.y
                    ? 1
                    : -1;

            this.footballVelocityY =
                spoilDirection * 180;

            this.footballRotationSpeed =
                spoilDirection * 720;

this.football.setStrokeStyle(
    2,
    0xffffff
);

/*
 * Briefly enlarge both contesting players so the
 * spoil is easy to see.
 */
this.tweens.add({
    targets: [
        closestCandidate.player,
        secondCandidate.player
    ],

    scaleX: 1.35,
    scaleY: 1.35,

    duration: 90,
    yoyo: true,

    ease: "Power1"
});

/*
 * Briefly flash both players white.
 */
const originalClosestColour =
    closestCandidate.player.fillColor;

const originalSecondColour =
    secondCandidate.player.fillColor;

closestCandidate.player.setFillStyle(
    0xffffff
);

secondCandidate.player.setFillStyle(
    0xffffff
);

this.time.delayedCall(
    140,
    () => {
        closestCandidate.player.setFillStyle(
            originalClosestColour
        );

        secondCandidate.player.setFillStyle(
            originalSecondColour
        );
    }
);

console.log(
    "The marking contest was spoiled."
);

return;
        }
    }

    this.completePlayerMark(
        closestCandidate.player
    );
}

completePlayerMark(receivingPlayer) {
    if (!receivingPlayer) {
        return;
    }

    const receiverIsOpponent =
        receivingPlayer ===
        this.opponent;

    const previousControlledPlayer =
        this.controlledPlayer;

    const controlWillSwitch =
        !receiverIsOpponent &&
        receivingPlayer !==
            previousControlledPlayer;

    this.setPossessionOwner(
        receivingPlayer
    );

    if (receiverIsOpponent) {
        console.log(
            "Opponent marked the football."
        );

        return;
    }

    console.log(
        controlWillSwitch
            ? "Supporting player marked the football. Control switched."
            : "Controlled player marked the football."
    );
}

startFootballGroundBounce() {
    if (!this.footballInFlight) {
        return;
    }

    /*
     * The football is no longer flying through the air,
     * but it keeps moving as it contacts the ground.
     */
    this.footballInFlight = false;
    this.footballGroundState = "BOUNCING";

    this.footballBounceCount = 0;
    this.footballGroundBounceTimer = 0;

    /*
     * Preserve the disposal direction.
     */
    const movementDirection =
        new Phaser.Math.Vector2(
            this.footballVelocityX,
            this.footballVelocityY
        );

    if (movementDirection.length() > 0) {
        movementDirection.normalize();
    } else {
        movementDirection.set(1, 0);
    }

    /*
     * Give the first bounce enough momentum to remain
     * clearly visible.
     */
    const firstBounceSpeed =
        this.footballFlightType === "KICK"
            ? 105
            : 68;

    this.footballVelocityX =
        movementDirection.x *
        firstBounceSpeed;

    this.footballVelocityY =
        movementDirection.y *
        firstBounceSpeed;

    /*
     * Kicks produce a larger first bounce than
     * handballs.
     */
    this.footballBounceHeight =
        this.footballFlightType === "KICK"
            ? 0.28
            : 0.17;
}

updateFootballGroundPhysics(delta) {
    if (this.footballGroundState === "NONE") {
        return;
    }

    const deltaSeconds =
        delta / 1000;

    /*
     * Continue moving the ball along the field while
     * it bounces or rolls.
     */
    this.football.x +=
        this.footballVelocityX *
        deltaSeconds;

    this.football.y +=
        this.footballVelocityY *
        deltaSeconds;

    /*
     * Keep the existing anticlockwise backspin.
     */
    this.football.angle +=
        this.footballRotationSpeed *
        deltaSeconds;

    if (this.footballGroundState === "BOUNCING") {
        this.updateFootballBounce(delta);
        return;
    }

    if (this.footballGroundState === "ROLLING") {
        this.updateFootballRolling(deltaSeconds);
    }
}

updateFootballBounce(delta) {
    this.footballGroundBounceTimer +=
        delta;

    const bounceProgress =
        Phaser.Math.Clamp(
            this.footballGroundBounceTimer /
                this.footballGroundBounceDuration,
            0,
            1
        );

    /*
     * The football grows and returns to normal size,
     * visually representing it rising from and falling
     * back toward the ground.
     */
    const bounceCurve =
        Math.sin(
            bounceProgress *
            Math.PI
        );

    const bounceScale =
        1 +
        bounceCurve *
        this.footballBounceHeight;

    this.football.setScale(
        this.footballBaseScaleX *
            bounceScale,

        this.footballBaseScaleY *
            bounceScale
    );

    /*
     * Gradually reduce speed throughout the bounce.
     */
    const deltaSeconds =
        delta / 1000;

    const bounceDragMultiplier =
        Math.exp(
            -1.15 *
            deltaSeconds
        );

    this.footballVelocityX *=
        bounceDragMultiplier;

    this.footballVelocityY *=
        bounceDragMultiplier;

    this.footballRotationSpeed *=
        Math.exp(
            -0.9 *
            deltaSeconds
        );

    if (bounceProgress < 1) {
        return;
    }

    this.completeFootballBounce();
}

completeFootballBounce() {
    this.footballBounceCount += 1;
    this.footballGroundBounceTimer = 0;

    this.football.setScale(
        this.footballBaseScaleX,
        this.footballBaseScaleY
    );

    const currentSpeed =
        Math.sqrt(
            this.footballVelocityX *
                this.footballVelocityX +

            this.footballVelocityY *
                this.footballVelocityY
        );

    /*
     * After several bounces, or once there is not enough
     * speed for another clear bounce, begin rolling.
     */
    if (
        this.footballBounceCount >=
            this.footballMaximumBounces ||
        currentSpeed < 35
    ) {
        this.startFootballRolling();
        return;
    }

    /*
     * An Australian football does not always bounce
     * perfectly straight.
     *
     * Apply a small random direction change after each
     * ground impact.
     */
    const maximumDirectionChange =
        this.footballFlightType === "KICK"
            ? 18
            : 10;

    const directionChangeDegrees =
        Phaser.Math.Between(
            -maximumDirectionChange,
            maximumDirectionChange
        );

    const movementDirection =
        new Phaser.Math.Vector2(
            this.footballVelocityX,
            this.footballVelocityY
        );

    movementDirection.rotate(
        Phaser.Math.DegToRad(
            directionChangeDegrees
        )
    );

    /*
     * Each bounce loses a portion of its speed.
     */
    const retainedSpeed =
        currentSpeed *
        0.64;

    movementDirection.normalize();

    this.footballVelocityX =
        movementDirection.x *
        retainedSpeed;

    this.footballVelocityY =
        movementDirection.y *
        retainedSpeed;

    /*
     * Each bounce is visually smaller than the last.
     */
    this.footballBounceHeight *=
        0.58;

    this.footballGroundBounceDuration =
        Math.max(
            150,
            this.footballGroundBounceDuration *
                0.82
        );
}

startFootballRolling() {
    this.footballGroundState = "ROLLING";

    this.footballGroundBounceTimer = 0;
    this.footballBounceHeight = 0;

    this.football.setScale(
        this.footballBaseScaleX,
        this.footballBaseScaleY
    );

    /*
     * Reduce speed slightly when the final bounce
     * transitions into rolling.
     */
    this.footballVelocityX *= 0.72;
    this.footballVelocityY *= 0.72;
}

updateFootballRolling(deltaSeconds) {
    /*
     * Apply frame-rate-independent ground friction.
     */
    const frictionMultiplier =
        Math.exp(
            -this.footballRollingFriction *
            deltaSeconds
        );

    this.footballVelocityX *=
        frictionMultiplier;

    this.footballVelocityY *=
        frictionMultiplier;

    this.footballRotationSpeed *=
        frictionMultiplier;

    const currentSpeed =
        Math.sqrt(
            this.footballVelocityX *
                this.footballVelocityX +

            this.footballVelocityY *
                this.footballVelocityY
        );

    if (
        currentSpeed <=
        this.footballMinimumRollingSpeed
    ) {
        this.stopFootballFlight();
    }
}

stopFootballFlight() {
    this.footballInFlight = false;
    this.footballGroundState = "NONE";

    this.footballVelocityX = 0;
    this.footballVelocityY = 0;

    this.footballRotationSpeed = 0;
this.footballFlightTime = 0;
this.footballFlightDistance = 0;
this.footballCanBeMarked = false;
this.footballFlightType = null;

    this.footballBounceCount = 0;
    this.footballGroundBounceTimer = 0;
    this.footballGroundBounceDuration = 260;
    this.footballBounceHeight = 0;

    /*
     * Return the football to its normal visual size.
     */
    this.football.setScale(
        this.footballBaseScaleX,
        this.footballBaseScaleY
    );

    this.football.setStrokeStyle(
        2,
        0xffffff
    );
}

takeFootballPossession(
    receivingPlayer = this.controlledPlayer
) {
    /*
     * Compatibility wrapper for older gameplay code.
     *
     * All real possession changes now pass through the
     * authoritative possession-owner system.
     */
    this.setPossessionOwner(
        receivingPlayer
    );
}

dropFootball() {
    if (
        !this.hasHomePossession() ||
        this.possessionOwner !==
            this.controlledPlayer
    ) {
        return;
    }

    const droppingPlayer =
        this.controlledPlayer;

    this.clearPossession();

    this.football.x =
        droppingPlayer.x + 24;

    this.football.y =
        droppingPlayer.y;

    this.football.setStrokeStyle(
        2,
        0xffffff
    );
}

keepPlayerInsideField() {
    if (!this.controlledPlayer) {
        return;
    }

    this.keepObjectInsideField(
        this.controlledPlayer,
        12,
        12
    );
}

keepFootballInsideField() {
if (
    !this.football ||
    this.possessionOwner
) {
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

if (
    this.footballInFlight ||
    this.footballGroundState !== "NONE"
) {
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

/*
 * The larger field gives the camera room to move.
 *
 * This is approximately twice the size of the previous
 * on-screen oval.
 */
const ovalHeight = 584;

const ovalWidth =
    ovalHeight *
    (fieldLengthMetres / fieldWidthMetres);

const centreX = WORLD_WIDTH / 2;

/*
 * Position the oval slightly lower than the exact world
 * centre, matching the earlier field presentation.
 */
const centreY = WORLD_HEIGHT / 2 + 23;

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
    const centreSquareSize = 164;

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
    44
);

    // Centre point
    graphics.fillStyle(0xffffff, 1);

graphics.fillRect(
    centreX - 5,
    centreY - 5,
    10,
    10
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

const goalSquareDepth = 60;

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
    const goalLineInset = 16;

    const leftGoalLineX =
        centreX - horizontalRadius + goalLineInset;

    const rightGoalLineX =
        centreX + horizontalRadius - goalLineInset;

    /*
     * The two inner posts are the goalposts.
     * The two outer posts are the behind posts.
     */
const behindPostOffset = 72;
const goalPostOffset = 32;

    const postOffsets = [
        -behindPostOffset,
        -goalPostOffset,
        goalPostOffset,
        behindPostOffset
    ];

    postOffsets.forEach((offset, index) => {
        const isGoalPost = index === 1 || index === 2;

const postDepth = isGoalPost ? 28 : 20;
const postThickness = 6;

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
    /*
     * All scoreboard children use coordinates relative
     * to the centre of this container.
     */
    this.scoreboardContainer = this.add.container(
        this.scale.gameSize.width / 2,
        25
    );

    const mainPanel = this.add.rectangle(
        0,
        0,
        650,
        42,
        0x111111
    ).setStrokeStyle(
        2,
        0xffffff
    );

    const homePanel = this.add.rectangle(
        -233,
        0,
        185,
        34,
        0x9d1f1f
    );

    const centrePanel = this.add.rectangle(
        0,
        0,
        170,
        34,
        0x262626
    );

    const awayPanel = this.add.rectangle(
        233,
        0,
        185,
        34,
        0x184f9e
    );

    const homeNameText = this.add.text(
        -307,
        -12,
        "HOME",
        {
            fontFamily: "Courier New",
            fontSize: "15px",
            color: "#ffffff"
        }
    );

    const homeScoreText = this.add.text(
        -225,
        -12,
        "0.0.0",
        {
            fontFamily: "Courier New",
            fontSize: "15px",
            color: "#ffffff"
        }
    );

    const quarterText = this.add.text(
        0,
        -12,
        "Q1   1:30",
        {
            fontFamily: "Courier New",
            fontSize: "16px",
            color: "#ffffff"
        }
    ).setOrigin(
        0.5,
        0
    );

    const awayScoreText = this.add.text(
        225,
        -12,
        "0.0.0",
        {
            fontFamily: "Courier New",
            fontSize: "15px",
            color: "#ffffff"
        }
    ).setOrigin(
        1,
        0
    );

    const awayNameText = this.add.text(
        307,
        -12,
        "AWAY",
        {
            fontFamily: "Courier New",
            fontSize: "15px",
            color: "#ffffff"
        }
    ).setOrigin(
        1,
        0
    );

    this.scoreboardContainer.add([
        mainPanel,
        homePanel,
        centrePanel,
        awayPanel,
        homeNameText,
        homeScoreText,
        quarterText,
        awayScoreText,
        awayNameText
    ]);

    /*
     * The complete scoreboard ignores camera movement.
     */
    this.scoreboardContainer
        .setScrollFactor(0)
        .setDepth(1000);
}
}

const config = {
    type: Phaser.AUTO,

    /*
     * Phaser inserts the canvas into this element.
     */
    parent: "game-container",

    backgroundColor: "#171717",

    /*
     * Fixed logical game dimensions.
     *
     * Phaser scales this complete view to fit the
     * available PC or iPhone screen.
     */
    width: GAME_WIDTH,
    height: GAME_HEIGHT,

    scale: {
        mode: Phaser.Scale.FIT,

        autoCenter:
            Phaser.Scale.CENTER_BOTH,

        width: GAME_WIDTH,
        height: GAME_HEIGHT
    },

    /*
     * Allows joystick movement and pass dragging
     * to be detected at the same time.
     */
    input: {
        activePointers: 3
    },

    render: {
        pixelArt: true,
        antialias: false,
        roundPixels: true
    },

    scene: MatchScene
};

const game = new Phaser.Game(config);