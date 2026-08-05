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
this.createAwayTeammate();
this.createFormationSystem();

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

/*
 * Start the match using the same centre formation used
 * for quarter and after-score restarts.
 */
this.applyCentreFormation();

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

    /*
 * Keep the temporary fatigue display in the
 * upper-left corner.
 */
if (this.fatigueDebugText) {
    this.fatigueDebugText.setPosition(
        14,
        76
    );
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

/*
 * Calibrated AFL running movement.
 *
 * These values produce approximately:
 * 15 metres in 2.4 seconds
 * 50 metres in 7 seconds
 */
/*
 * Off-ball maximum running speed.
 */
this.playerSpeed = 31.5;

/*
 * Ball carriers move more slowly so defenders can
 * close space and complete tackles.
 *
 * A defender starting 15 metres behind should catch
 * the carrier after approximately 30 metres.
 */
this.ballCarrierSpeed = 21;

this.playerAcceleration = 37;
this.playerDeceleration = 50;

/*
 * Each home player stores their own movement velocity
 * because control can switch between Red and Blue.
 */
this.player.movementVelocityX = 0;
this.player.movementVelocityY = 0;

/*
 * Home player role.
 */
this.player.role = "MIDFIELDER";

/*
 * Temporary prototype marking attributes.
 *
 * These will later come from each player's permanent
 * roster ratings.
 */
this.player.markingAbility = 72;
this.player.strength = 68;

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
speed: 30,
    targetX: this.teammate.x,
    targetY: this.teammate.y,
    hasBall: false
};

this.teammate.movementVelocityX = 0;
this.teammate.movementVelocityY = 0;

/*
 * Home teammate role.
 */
this.teammate.role = "FORWARD";

/*
 * Blue is currently the strongest prototype marker.
 */
this.teammate.markingAbility = 78;
this.teammate.strength = 72;
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
/*
 * Stop leftover movement from transferring between
 * controlled players.
 */
previousControlledPlayer
    .movementVelocityX = 0;

previousControlledPlayer
    .movementVelocityY = 0;

newControlledPlayer
    .movementVelocityX = 0;

newControlledPlayer
    .movementVelocityY = 0;

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

isAwayPlayer(playerObject) {
    return (
        playerObject === this.opponent ||
        playerObject === this.awayTeammate
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
        this.possessionOwner === this.opponent ||
        this.possessionOwner === this.awayTeammate
    );
}

clearPossession() {
    /*
     * Remove possession from every player.
     */
this.possessionOwner = null;
this.possessionTimer = 0;

    this.playerHasBall = false;

    if (this.teammateData) {
        this.teammateData.hasBall = false;
    }

if (this.opponentData) {
    this.opponentData.hasBall = false;
}

if (this.awayTeammateData) {
    this.awayTeammateData.hasBall = false;
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

/*
 * Begin a fresh possession timer whenever ownership
 * changes.
 */
this.possessionTimer = 0;

/*
 * Allow Green to make one new disposal whenever
 * he gains possession.
 */
if (
    newOwner === this.opponent ||
    newOwner === this.awayTeammate
) {
    this.aiDisposalCompleted = false;
}

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

if (this.awayTeammateData) {
    this.awayTeammateData.hasBall =
        newOwner === this.awayTeammate;
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

const awayBallCarrier =
    this.possessionOwner;

const redDistance =
    Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        awayBallCarrier.x,
        awayBallCarrier.y
    );

const blueDistance =
    Phaser.Math.Distance.Between(
        this.teammate.x,
        this.teammate.y,
        awayBallCarrier.x,
        awayBallCarrier.y
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
speed: 30,
    targetX: this.opponent.x,
    targetY: this.opponent.y,
    hasBall: false
};

/*
 * Away player role.
 */
this.opponent.role = "DEFENDER";

/*
 * Green receives balanced defensive marking ratings.
 */
this.opponent.markingAbility = 74;
this.opponent.strength = 76;
}

createAwayTeammate() {
    /*
     * Second away player.
     *
     * This player begins as Green's forward and will
     * later provide attacking leads and defensive cover.
     */
    this.awayTeammate =
        this.add.rectangle(
            this.field.centreX - 155,
            this.field.centreY - 95,
            22,
            30,
            0x35c45a
        );

    this.awayTeammate.setStrokeStyle(
        3,
        0xffffff
    );

    this.awayTeammateData = {
        team: "away",
        state: "HOLD_POSITION",
        speed: 30,
        targetX:
            this.awayTeammate.x,
        targetY:
            this.awayTeammate.y,
        hasBall: false
    };

    this.awayTeammate.movementVelocityX =
        0;

    this.awayTeammate.movementVelocityY =
        0;

    /*
     * Temporary role and marking attributes.
     */
    this.awayTeammate.role =
        "FORWARD";

    this.awayTeammate.markingAbility =
        73;

    this.awayTeammate.strength =
        69;
}

createFormationSystem() {

    /*
     * Prototype centre-bounce formation.
     *
     * Future steps will replace this with
     * multiple formations and role-based movement.
     */
    this.formations = {

        centreBounce: {

            MIDFIELDER: {
                x: this.field.centreX - 120,
                y: this.field.centreY
            },

            FORWARD: {
                x: this.field.centreX - 40,
                y: this.field.centreY + 80
            },

DEFENDER: {
    x: this.field.centreX + 120,
    y: this.field.centreY
},

AWAY_FORWARD: {
    x: this.field.centreX + 40,
    y: this.field.centreY - 80
}

        }

    };

    console.log(
        "Formation system initialised."
    );
}

applyCentreFormation() {
    const formation =
        this.formations.centreBounce;

    /*
     * Place every player in the shared centre-restart
     * formation.
     */
    this.player.setPosition(
        formation.MIDFIELDER.x,
        formation.MIDFIELDER.y
    );

    this.teammate.setPosition(
        formation.FORWARD.x,
        formation.FORWARD.y
    );

    this.opponent.setPosition(
        formation.DEFENDER.x,
        formation.DEFENDER.y
    );

    this.awayTeammate.setPosition(
    formation.AWAY_FORWARD.x,
    formation.AWAY_FORWARD.y
);

    /*
     * Return the football to the exact centre.
     */
    if (this.football) {
        this.football.setPosition(
            this.field.centreX,
            this.field.centreY
        );

this.footballVelocityX = 0;
this.footballVelocityY = 0;

this.footballGroundState =
    "NONE";

/*
 * Clear every restriction left over from the previous
 * scoring passage so the centre football can be
 * collected immediately.
 */
this.footballPickupLockTimer = 0;

this.footballInFlight = false;
this.footballFlightType = null;
this.footballFlightTime = 0;
this.footballFlightDistance = 0;
this.footballCanBeMarked = false;

this.footballBounceCount = 0;
this.footballGroundBounceTimer = 0;

this.scoreDetected = false;
this.lastScoreResult = null;

/*
 * Clear contest and stoppage states left over from the
 * previous passage of play.
 */
this.stoppageActive = false;
this.stoppageType = null;
this.stoppageRestartScheduled = false;
this.trappedBallTimer = 0;

this.isTackleActive = false;
this.tackleTimer = 0;
this.activeTackler = null;

this.freeKickProtectedPlayer = null;
this.freeKickProtectionTimer = 0;

this.awayPressurePlayer = null;
this.awayCoverPlayer = null;

this.footballHeight = 0;
this.currentMaximumFootballHeight = 0;

this.football.setVisible(true);
this.football.setScale(
    this.footballBaseScaleX,
    this.footballBaseScaleY
);

this.football.setStrokeStyle(
    2,
    0xffffff
);

if (this.airborneFootball) {
    this.airborneFootball
        .setVisible(false)
        .setScale(1);
}

if (this.footballShadow) {
    this.footballShadow
        .setVisible(false)
        .setScale(1)
        .setAlpha(0.3);
}

/*
 * The centre football is loose and immediately
 * available for collection.
 */
this.footballPickupLockTimer = 0;
this.footballCanBeMarked = false;

    }

/*
 * Remove movement left over from the previous
 * passage of play for all four players.
 */
this.player.movementVelocityX = 0;
this.player.movementVelocityY = 0;

this.teammate.movementVelocityX = 0;
this.teammate.movementVelocityY = 0;

this.awayTeammate.movementVelocityX = 0;
this.awayTeammate.movementVelocityY = 0;

    /*
     * Keep fatigue tracking aligned with the teleported
     * player positions.
     */
    if (
        this.playerPreviousFatigueX !==
        undefined
    ) {
        this.playerPreviousFatigueX =
            this.player.x;

        this.playerPreviousFatigueY =
            this.player.y;

        this.teammatePreviousFatigueX =
            this.teammate.x;

        this.teammatePreviousFatigueY =
            this.teammate.y;

this.opponentPreviousFatigueX =
    this.opponent.x;

this.opponentPreviousFatigueY =
    this.opponent.y;

this.awayTeammatePreviousFatigueX =
    this.awayTeammate.x;

this.awayTeammatePreviousFatigueY =
    this.awayTeammate.y;
    }

    /*
     * Red begins as the controlled home player.
     */
    if (
        this.controlledPlayer &&
        this.controlledPlayer !==
            this.player
    ) {
        this.switchControlledPlayer(
            this.player
        );
    }

    this.updateControlledPlayerIndicator();
}

createFootball() {
this.football = this.add.ellipse(
    this.field.centreX + 75,
    this.field.centreY + 25,
        15,
        9,
        0x9a5a2b
    );

this.football.setStrokeStyle(
    2,
    0xffffff
);

this.football.setDepth(11);

/*
 * A ground shadow makes the football's visual height
 * easier to read during kicks and handballs.
 */
this.footballShadow =
    this.add.ellipse(
        this.football.x,
        this.football.y + 5,
        12,
        5,
        0x000000,
        0.3
    )
    .setDepth(10)
    .setVisible(false);

    /*
 * Separate airborne football graphic.
 *
 * The original football remains at the logical ground
 * position used by scoring, boundaries and contests.
 */
this.airborneFootball =
    this.add.ellipse(
        this.football.x,
        this.football.y,
        15,
        9,
        0x9a5a2b
    )
    .setStrokeStyle(
        2,
        0xffffff
    )
    .setDepth(12)
    .setVisible(false);

/*
 * Genuine gameplay height value.
 */
this.footballHeight = 0;

/*
 * Maximum visual height in pixels.
 */
this.maximumKickHeight = 58;
this.maximumHandballHeight = 22;

/*
 * The selected height for the current disposal.
 */
this.currentMaximumFootballHeight = 0;

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
 * After a dropped mark or spoil, briefly prevent pickup
 * so the football visibly reaches the ground before the
 * loose-ball contest begins.
 */
this.contestPickupLockDuration = 180;

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
 * Estimated duration of the current disposal.
 *
 * This is used only for visual height and trajectory
 * calibration.
 */
this.footballEstimatedFlightDuration = 0;

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
 * Players can only mark the football once it descends
 * within this height above the ground plane.
 */
this.maximumMarkableFootballHeight = 18;

/*
 * Tackling system.
 */
this.tackleDistance = 26;

/*
 * Prevent tackle messages from repeating every frame.
 */
this.isTackleActive = false;

/*
 * Players remain engaged briefly once a tackle begins.
 */
this.tackleTimer = 0;
/*
 * A tackle with prior opportunity is resolved after
 * approximately 0.45 seconds.
 */
this.tackleDuration = 450;

/*
 * The ball carrier can continue driving their legs,
 * but movement is heavily reduced during the tackle.
 */
this.tackleMovementMultiplier = 0.28;

/*
 * Store the defender currently involved in the tackle.
 */
this.activeTackler = null;

/*
 * Simplified tackle-contact detection.
 *
 * A tackler whose centre is sufficiently above the
 * carrier's centre is treated as making high contact.
 */
/*
 * Every tackle has a 5% chance of being ruled high.
 */
/*
 * Every tackle has a 5% chance of being ruled high.
 */
this.highTackleChance = 0.05;
this.currentTackleIsHigh = false;

/*
 * Tackles initiated from behind the carrier have a
 * 3% chance of being ruled push in the back.
 */
this.pushInBackChance = 0.03;
this.currentTackleIsPushInBack = false;

/*
 * Free-kick restart protection.
 */
this.freeKickProtectedPlayer = null;
this.freeKickProtectionTimer = 0;
this.freeKickProtectionDuration = 900;

/*
 * Tacklers briefly recover after completing or
 * cancelling a tackle.
 */
this.tackleFatigueTimer = 0;
this.tackleFatigueDuration = 700;
this.fatiguedTackler = null;

/*
 * Track how long the current player has possessed
 * the football.
 */
this.possessionTimer = 0;

/*
 * Possession longer than this counts as prior
 * opportunity during future tackle decisions.
 */
this.priorOpportunityDuration = 1200;

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

/*
 * Scoring detection.
 */
this.scoreDetected = false;
this.lastScoreResult = null;

/*
 * Match scoring.
 */
this.homeGoals = 0;
this.homeBehinds = 0;
this.awayGoals = 0;
this.awayBehinds = 0;

/*
 * Match and quarter structure.
 *
 * Four 90-second quarters produce approximately
 * six minutes of active match time.
 */
this.currentQuarter = 1;

this.quarterDuration = 90 * 1000;
this.quarterTimeRemaining =
    this.quarterDuration;

this.quarterBreakDuration = 2200;

this.quarterBreakActive = false;
this.matchFinished = false;

/*
 * Fatigue system.
 */
this.maximumFatigue = 100;
this.minimumFatigue = 35;

this.fatigueDrainPerSecond = 0.9;
this.fatigueRecoveryPerSecond = 0.45;

/*
 * Players recover 18 energy points between quarters.
 *
 * Fatigue still carries across the match because this
 * does not automatically return everyone to 100.
 */
this.quarterBreakFatigueRecovery = 18;

this.playerFatigue = this.maximumFatigue;
this.teammateFatigue = this.maximumFatigue;
this.opponentFatigue = this.maximumFatigue;
this.awayTeammateFatigue =
    this.maximumFatigue;

/*
 * Store previous positions so fatigue can use actual
 * player movement rather than physics-body velocity.
 */
this.playerPreviousFatigueX =
    this.player.x;

this.playerPreviousFatigueY =
    this.player.y;

this.teammatePreviousFatigueX =
    this.teammate.x;

this.teammatePreviousFatigueY =
    this.teammate.y;

this.opponentPreviousFatigueX =
    this.opponent.x;

this.opponentPreviousFatigueY =
    this.opponent.y;

    this.awayTeammatePreviousFatigueX =
    this.awayTeammate.x;

this.awayTeammatePreviousFatigueY =
    this.awayTeammate.y;

/*
 * Maximum speed reduction at minimum energy.
 *
 * A player at 35 energy runs at 88% of normal speed.
 */
this.minimumFatigueSpeedMultiplier =
    0.88;

    /*
 * At minimum energy, acceleration is reduced to 85%.
 */
this.minimumFatigueAccelerationMultiplier =
    0.85;

/*
 * At minimum energy, defensive pressure retains
 * 82% of its normal effectiveness.
 */
this.minimumFatiguePressureMultiplier =
    0.82;

/*
 * At minimum energy, shepherding retains
 * 80% of its normal effectiveness.
 */
this.minimumFatigueShepherdMultiplier =
    0.80;

this.maximumFatigueDisposalError = 18;

/*
 * Temporary fatigue debugging display.
 *
 * Set this to false after fatigue balancing is complete.
 */
this.showFatigueDebug = true;

/*
 * When the siren sounds during a disposal, the quarter
 * waits until the football is no longer in flight.
 */
this.quarterSirenPending = false;

/*
 * Stoppage system.
 */
this.stoppageActive = false;
this.stoppageType = null;

this.stoppageX = 0;
this.stoppageY = 0;

/*
 * A stationary football contested by opposing players
 * for this long will create a ball-up.
 */
this.trappedBallTimer = 0;
this.trappedBallDuration = 900;
this.trappedContestDistance = 34;

/*
 * Stoppage restart timing.
 */
this.stoppageRestartDelay = 1100;
this.stoppageRestartScheduled = false;

/*
 * Basic AI disposal system.
 *
 * Step 16E will replace the alternating test behaviour
 * with genuine decision-making.
 */
/*
 * AI possession decision settings.
 */
this.aiMinimumDecisionTime = 650;
this.aiMaximumHoldTime = 1500;
this.aiDisposalCompleted = false;

/*
 * Team support and pressure settings.
 */
this.pressureDistance = 72;
this.strongPressureDistance = 38;

this.pressureSpeedMultiplier = 0.88;
this.strongPressureSpeedMultiplier = 0.74;

this.shepherdDistance = 48;
this.shepherdSlowMultiplier = 0.72;

    // Drag aiming
    this.isAimingPass = false;
    this.aimPointerId = null;

/*
 * Fixed world position from which the slingshot
 * direction is calculated.
 */
this.aimStartX = 0;
this.aimStartY = 0;

/*
 * Current finger position.
 */
this.aimCurrentX = 0;
this.aimCurrentY = 0;

/*
 * Actual touch-down position.
 *
 * This remains separate from the football-centred aim
 * origin so a stationary tap cannot accidentally pass.
 */
this.aimTouchStartX = 0;
this.aimTouchStartY = 0;

/*
 * A movement of only a few pixels is treated as a tap.
 * Any larger deliberate drag produces a handball.
 */
this.minimumIntentionalDrag = 3;

/*
 * This remains the drag distance at which handball
 * power begins increasing above its minimum value.
 */
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

/*
 * Temporary fatigue display used during development.
 */
this.fatigueDebugText =
    this.add.text(
        14,
        76,
        "",
        {
            fontFamily: "Courier New",
            fontSize: "13px",
            color: "#ffffff",
            backgroundColor: "#222222",
            padding: {
                x: 7,
                y: 5
            }
        }
    )
    .setScrollFactor(0)
    .setDepth(1001)
    .setVisible(
        this.showFatigueDebug
    );
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

moveValueTowards(
    currentValue,
    targetValue,
    maximumChange
) {
    if (
        Math.abs(
            targetValue - currentValue
        ) <= maximumChange
    ) {
        return targetValue;
    }

    return (
        currentValue +
        Math.sign(
            targetValue - currentValue
        ) *
        maximumChange
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

/*
 * Centre the slingshot axis on the football rather
 * than wherever the player's finger first touched.
 */
this.aimStartX =
    this.football.x;

this.aimStartY =
    this.football.y;

/*
 * Store the actual touch-down position separately so
 * we can distinguish a deliberate drag from a tap.
 */
this.aimTouchStartX =
    pointerX;

this.aimTouchStartY =
    pointerY;

this.aimCurrentX =
    pointerX;

this.aimCurrentY =
    pointerY;

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
    this.aimCurrentX -
    this.aimStartX;

const dragY =
    this.aimCurrentY -
    this.aimStartY;

/*
 * The drag vector determines the disposal direction.
 *
 * The football travels opposite to the drag,
 * matching Retro Bowl's controls.
 */
/*
 * Slingshot aiming:
 *
 * Pulling left aims right.
 * Pulling right aims left.
 * Pulling up aims down.
 * Pulling down aims up.
 */
const aimDirection =
    new Phaser.Math.Vector2(
        -dragX,
        -dragY
    );
if (aimDirection.length() > 0) {
    aimDirection.normalize();
}

/*
 * Total drag distance controls disposal power.
 *
 * This gives horizontal, vertical and diagonal
 * disposals the same potential range.
 */
const disposalDragDistance =
    Phaser.Math.Clamp(
        Math.sqrt(
            dragX * dragX +
            dragY * dragY
        ),
        0,
        this.maximumPassDrag
    );

    /*
     * Vertical aiming remains inverted:
     *
     * Drag down = aim upward
     * Drag up   = aim downward
     */
    const aimedVerticalOffset =
        -dragY;

const isKick =
    disposalDragDistance >=
    this.handballKickThreshold;

    /*
     * Preview distance grows with disposal power.
     *
     * Step 16C.2 will calibrate this more precisely
     * against the real football flight.
     */
/*
 * Use the same separated power ranges as the real
 * disposal code.
 */
let previewPowerPercentage;

if (isKick) {
previewPowerPercentage =
    Phaser.Math.Clamp(
        (
            disposalDragDistance -
            this.handballKickThreshold
        ) /
        (
            this.maximumPassDrag -
            this.handballKickThreshold
        ),
        0,
        1
    );
} else {
/*
 * Drags shorter than minimumPassDrag still display a
 * minimum-strength handball rather than being rejected.
 */
const effectiveHandballDrag =
    Math.max(
        disposalDragDistance,
        this.minimumPassDrag
    );

previewPowerPercentage =
    Phaser.Math.Clamp(
        (
            effectiveHandballDrag -
            this.minimumPassDrag
        ) /
        (
            this.handballKickThreshold -
            this.minimumPassDrag
        ),
        0,
        1
    );
}

/*
 * These must match launchFootball().
 */
const previewMinimumSpeed =
    120;

const previewMaximumSpeed =
    isKick ? 380 : 165;

const previewLaunchSpeed =
    Phaser.Math.Linear(
        previewMinimumSpeed,
        previewMaximumSpeed,
        previewPowerPercentage
    );

const previewDragPerSecond =
    isKick ? 1.25 : 2.15;

const previewStoppingSpeed =
    isKick ? 42 : 32;

/*
 * With exponential drag, the distance travelled before
 * reaching the stopping speed is:
 *
 * (initial speed - stopping speed) / drag
 */
const previewLength =
    Math.max(
        0,
        (
            previewLaunchSpeed -
            previewStoppingSpeed
        ) /
        previewDragPerSecond
    );

const previewDirection =
    aimDirection.clone();

const startX =
    this.controlledPlayer.x + 10;

const startY =
    this.controlledPlayer.y;

const endX =
    startX +
    previewDirection.x *
        previewLength;

const endY =
    startY +
    previewDirection.y *
        previewLength;

    /*
     * A quadratic curve uses one control point between
     * the kicker and target.
     *
     * Moving the control point upward creates the
     * visible football-flight arc.
     */
    const controlX =
        Phaser.Math.Linear(
            startX,
            endX,
            0.5
        );

/*
 * Stronger disposals receive a higher visual arc.
 */
const arcHeight =
    isKick
        ? Phaser.Math.Linear(
            22,
            62,
            previewPowerPercentage
        )
        : Phaser.Math.Linear(
            10,
            18,
            previewPowerPercentage
        );

    const controlY =
        Phaser.Math.Linear(
            startY,
            endY,
            0.5
        ) -
        arcHeight;

    /*
     * Kicks use more dots because they travel farther.
     */
    const dotCount =
        isKick ? 14 : 8;

    const trajectoryColour =
        isKick
            ? 0xffffff
            : 0x66d9ff;

            /*
 * Determine how uncertain the disposal should appear.
 *
 * Stationary and unpressured disposals remain precise.
 */
const carrierMovementSpeed =
    Math.sqrt(
        this.controlledPlayer
            .movementVelocityX ** 2 +

        this.controlledPlayer
            .movementVelocityY ** 2
    );

const previewWasMoving =
    carrierMovementSpeed > 5;

const previewWasPressured =
    this.isTackleActive;

/*
 * Uncertainty is shown by hiding more of the
 * trajectory near the landing zone.
 */
let hiddenTrajectoryPercentage = 0;

if (previewWasMoving) {
    hiddenTrajectoryPercentage +=
        isKick ? 0.14 : 0.10;
}

if (previewWasPressured) {
    hiddenTrajectoryPercentage +=
        isKick ? 0.24 : 0.18;
}

hiddenTrajectoryPercentage =
    Phaser.Math.Clamp(
        hiddenTrajectoryPercentage,
        0,
        0.38
    );

const visibleTrajectoryLimit =
    1 -
    hiddenTrajectoryPercentage;

    /*
     * Draw individual points along the curved path.
     */
    for (
        let dotIndex = 1;
        dotIndex <= dotCount;
        dotIndex++
    ) {
        const progress =
            dotIndex /
            dotCount;

            /*
 * Do not draw the final dots when the disposal is
 * uncertain.
 */
if (
    progress >
    visibleTrajectoryLimit
) {
    continue;
}

        const inverseProgress =
            1 - progress;

        /*
         * Quadratic Bézier curve:
         *
         * start → control point → end
         */
        const dotX =
            inverseProgress *
                inverseProgress *
                startX +
            2 *
                inverseProgress *
                progress *
                controlX +
            progress *
                progress *
                endX;

        const dotY =
            inverseProgress *
                inverseProgress *
                startY +
            2 *
                inverseProgress *
                progress *
                controlY +
            progress *
                progress *
                endY;

        /*
         * Fade the final few dots slightly.
         *
         * This represents the intended path without
         * guaranteeing perfect accuracy.
         */
const dotAlpha = 1;

        /*
         * Make the middle dots slightly larger to
         * suggest the ball reaching its highest point.
         */
        const heightCurve =
            Math.sin(
                progress *
                Math.PI
            );

/*
 * Keep trajectory dots small and consistent.
 */
const dotRadius =
    isKick ? 2 : 1.8;

        this.aimGraphics.fillStyle(
            trajectoryColour,
            dotAlpha
        );

this.aimGraphics.fillCircle(
    dotX,
    dotY,
    dotRadius
);

    }

const fingerMovementDistance =
    Phaser.Math.Distance.Between(
        this.aimTouchStartX,
        this.aimTouchStartY,
        this.aimCurrentX,
        this.aimCurrentY
    );

if (
    fingerMovementDistance <
    this.minimumIntentionalDrag
) {
    this.passTypeText.setText(
        "DRAG TO PASS"
    );
} else if (isKick) {
        this.passTypeText.setText(
            "KICK"
        );
    } else {
        this.passTypeText.setText(
            "HANDBALL"
        );
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

/*
 * Disposal direction and power are measured from the
 * football-centred slingshot origin.
 */
const dragX =
    this.aimCurrentX -
    this.aimStartX;

const dragY =
    this.aimCurrentY -
    this.aimStartY;

const disposalDragDistance =
    Phaser.Math.Clamp(
        Math.sqrt(
            dragX * dragX +
            dragY * dragY
        ),
        0,
        this.maximumPassDrag
    );

/*
 * Intent is measured from the actual touch-down point.
 *
 * This prevents a tap beside the football from being
 * mistaken for a deliberate handball.
 */
const fingerMovementDistance =
    Phaser.Math.Distance.Between(
        this.aimTouchStartX,
        this.aimTouchStartY,
        this.aimCurrentX,
        this.aimCurrentY
    );

/*
 * Ignore taps and extremely tiny accidental movements,
 * but accept every deliberate drag as a disposal.
 */
if (
    fingerMovementDistance <
    this.minimumIntentionalDrag
) {
    this.cancelPassAim();
    return;
}

const isKick =
    disposalDragDistance >=
    this.handballKickThreshold;

this.launchFootball(
    dragX,
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
    /*
     * Keep the signed drag values for direction, but use
     * total drag distance when calculating disposal power.
     */
    const disposalDragDistance =
        Phaser.Math.Clamp(
            Math.sqrt(
                horizontalDrag * horizontalDrag +
                verticalDrag * verticalDrag
            ),
            0,
            this.maximumPassDrag
        );
if (
    !this.hasHomePossession() ||
    this.possessionOwner !==
        this.controlledPlayer
) {
    return;
}

/*
 * A legal disposal during a tackle ends the tackle
 * before the football leaves the player.
 */
/*
 * Record whether pressure was active before clearing
 * the tackle.
 */
const disposalWasPressured =
    this.isTackleActive;

/*
 * Record whether the player was moving before
 * possession and tackle states are cleared.
 */
const disposalWasMoving =
    this.playerIsMoving;

if (this.isTackleActive) {
    /*
     * The tackler still requires a brief recovery even
     * when the carrier completes a legal disposal.
     */
    if (this.activeTackler) {
        this.fatiguedTackler =
            this.activeTackler;

        this.tackleFatigueTimer =
            this.tackleFatigueDuration;
    }

    this.isTackleActive = false;
    this.tackleTimer = 0;
    this.activeTackler = null;

    console.log(
        "Legal disposal completed during tackle."
    );
}

    /*
     * Transfer possession from the player to the
     * travelling football.
     */

    /*
 * Disposing of the football ends any remaining
 * free-kick protection.
 */
if (
    this.freeKickProtectedPlayer ===
    this.controlledPlayer
) {
    this.freeKickProtectedPlayer =
        null;

    this.freeKickProtectionTimer = 0;
}

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
 * Allow the new kick to register a score.
 */
this.scoreDetected = false;
this.lastScoreResult = null;

    /*
 * Begin tracking the new disposal.
 */
this.footballFlightDistance = 0;
this.footballCanBeMarked = false;

    /*
     * Convert the horizontal drag into a value
     * between 0 and 1.
     */
/*
 * Kicks and handballs use separate power ranges.
 *
 * This lets the shortest kick begin near 15 metres
 * while handballs remain within approximately
 * 10–15 metres.
 */
let powerPercentage;

if (isKick) {
    /*
     * Kicks begin at the kick threshold and increase
     * toward maximum power.
     */
    powerPercentage =
        Phaser.Math.Clamp(
            (
                disposalDragDistance -
                this.handballKickThreshold
            ) /
            (
                this.maximumPassDrag -
                this.handballKickThreshold
            ),
            0,
            1
        );
} else {
    /*
     * Any deliberate short drag produces at least the
     * minimum handball power.
     */
    const effectiveHandballDrag =
        Math.max(
            disposalDragDistance,
            this.minimumPassDrag
        );

    powerPercentage =
        Phaser.Math.Clamp(
            (
                effectiveHandballDrag -
                this.minimumPassDrag
            ) /
            (
                this.handballKickThreshold -
                this.minimumPassDrag
            ),
            0,
            1
        );
}

    /*
     * Kicks travel faster and farther.
     *
     * Handballs leave the player more slowly and
     * lose speed sooner.
     */
/*
 * Calibrated disposal ranges:
 *
 * Kick:
 * minimum approximately 15 metres
 * average approximately 42 metres
 * maximum approximately 65 metres
 *
 * Handball:
 * approximately 10–15 metres
 */
const minimumSpeed =
    isKick ? 120 : 120;

const maximumSpeed =
    isKick ? 380 : 165;

    const launchSpeed =
        Phaser.Math.Linear(
            minimumSpeed,
            maximumSpeed,
            powerPercentage
        );

        /*
 * Estimate when the football will slow to the point
 * where ground-bounce physics begins.
 */
const flightDragPerSecond =
    isKick ? 1.25 : 2.15;

const flightStoppingSpeed =
    isKick ? 42 : 32;

this.footballEstimatedFlightDuration =
    Math.log(
        launchSpeed /
        flightStoppingSpeed
    ) /
    flightDragPerSecond;

    /*
     * Retro Footy currently attacks toward the right.
     *
     * Vertical drag remains inverted:
     *
     * Drag down = football travels up.
     * Drag up   = football travels down.
     */
/*
 * Launch opposite to the drag direction so the real
 * disposal follows the slingshot trajectory preview.
 */
const disposalVector =
    new Phaser.Math.Vector2(
        -horizontalDrag,
        -verticalDrag
    );

if (disposalVector.length() > 0) {
    disposalVector.normalize();
}

let horizontalDirection =
    disposalVector.x;

let verticalDirection =
    disposalVector.y;

/*
 * Calculate disposal inaccuracy from movement and
 * tackling pressure.
 */
let maximumAccuracyError = 0;

if (disposalWasMoving) {
    maximumAccuracyError +=
        isKick ? 0.10 : 0.06;
}

if (disposalWasPressured) {
    maximumAccuracyError +=
        isKick ? 0.32 : 0.22;
}

if (maximumAccuracyError > 0) {
    verticalDirection +=
        Phaser.Math.FloatBetween(
            -maximumAccuracyError,
            maximumAccuracyError
        );

    verticalDirection =
        Phaser.Math.Clamp(
            verticalDirection,
            -1,
            1
        );
}

/*
 * Fatigue introduces additional vertical disposal
 * inaccuracy.
 *
 * getFatigueDisposalError() returns a pixel-style
 * error value between 0 and 18. Convert that into the
 * same direction scale used by verticalDirection.
 */
const fatigueError =
    this.getFatigueDisposalError(
        this.controlledPlayer
    );

const fatigueDirectionError =
    fatigueError / 100;

verticalDirection +=
    Phaser.Math.FloatBetween(
        -fatigueDirectionError,
        fatigueDirectionError
    );

verticalDirection =
    Phaser.Math.Clamp(
        verticalDirection,
        -1,
        1
    );

const direction =
    new Phaser.Math.Vector2(
        horizontalDirection,
        verticalDirection
    );

direction.normalize();

    /*
     * Place the football slightly in front of the
     * controlled player before launching it.
     */
/*
 * Begin the disposal at the logical ground position
 * beside the controlled player.
 */
this.football.x =
    this.controlledPlayer.x +
    direction.x * 18;

this.football.y =
    this.controlledPlayer.y +
    direction.y * 18;

/*
 * Select the maximum height for this disposal.
 */
this.footballHeight = 0;

this.currentMaximumFootballHeight =
    isKick
        ? Phaser.Math.Linear(
            34,
            this.maximumKickHeight,
            powerPercentage
        )
        : Phaser.Math.Linear(
            12,
            this.maximumHandballHeight,
            powerPercentage
        );

/*
 * Hide the logical football while its airborne graphic
 * displays the visible arc.
 */
this.football.setVisible(false);

if (this.airborneFootball) {
    this.airborneFootball
        .setPosition(
            this.football.x,
            this.football.y
        )
        .setScale(1)
        .setAngle(
            this.football.angle
        )
        .setStrokeStyle(
            2,
            isKick
                ? 0xffd43b
                : 0x66d9ff
        )
        .setVisible(true);
}

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

    if (this.footballShadow) {
    this.footballShadow
        .setPosition(
            this.football.x,
            this.football.y + 5
        )
        .setScale(1)
        .setAlpha(0.3)
        .setVisible(true);
}

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

/*
 * Update the match clock before normal gameplay.
 */
this.updateQuarterTimer(delta);
this.updatePlayerFatigue(delta);
this.updateFatigueDebugDisplay();

/*
 * Freeze gameplay during quarter breaks and after
 * the final siren.
 */
if (
    this.quarterBreakActive ||
    this.matchFinished
) {
    this.updateCameraTarget();
    this.updateControlledPlayerIndicator();

    return;
}

/*
 * Count down free-kick protection.
 */

if (this.freeKickProtectionTimer > 0) {
    this.freeKickProtectionTimer =
        Math.max(
            0,
            this.freeKickProtectionTimer - delta
        );

    if (
        this.freeKickProtectionTimer === 0
    ) {
        this.freeKickProtectedPlayer =
            null;

        console.log(
            "Free-kick protection ended."
        );
    }
}

/*
 * Count down the current tackle-fatigue period.
 */

if (this.tackleFatigueTimer > 0) {
    this.tackleFatigueTimer =
        Math.max(
            0,
            this.tackleFatigueTimer - delta
        );

    if (this.tackleFatigueTimer === 0) {
        this.fatiguedTackler = null;

        console.log(
            "Tackler recovered."
        );
    }
}

/*
 * Count how long the current ball carrier has held
 * possession.
 */
if (this.possessionOwner) {
    this.possessionTimer += delta;
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

const inputDirection =
    new Phaser.Math.Vector2(
        horizontalDirection,
        verticalDirection
    );

const playerHasMovementInput =
    inputDirection.length() > 0;

if (playerHasMovementInput) {
    inputDirection.normalize();
}

/*
 * Tackled ball carriers retain the existing movement
 * reduction from Step 15C.
 */
let movementSpeedMultiplier = 1;

if (
    this.isTackleActive &&
    this.possessionOwner ===
        this.controlledPlayer
) {
    movementSpeedMultiplier =
        this.tackleMovementMultiplier;
}

/*
 * The controlled player runs more slowly while
 * carrying the football.
 */
const controlledPlayerHasBall =
    this.possessionOwner ===
    this.controlledPlayer;

const currentMaximumSpeed =
    controlledPlayerHasBall
        ? this.ballCarrierSpeed
        : this.playerSpeed;

/*
 * Nearby defensive pressure slightly reduces the
 * home ball carrier's effective movement speed.
 */
const pressureMovementMultiplier =
    this.controlledMovementPressureMultiplier ??
    1;

const controlledFatigueMultiplier =
    this.getFatigueSpeedMultiplier(
        this.controlledPlayer
    );

const targetSpeed =
    currentMaximumSpeed *
    movementSpeedMultiplier *
    pressureMovementMultiplier *
    controlledFatigueMultiplier;

const targetVelocityX =
    inputDirection.x *
    targetSpeed;

const targetVelocityY =
    inputDirection.y *
    targetSpeed;

const deltaSeconds =
    delta / 1000;

/*
 * Use acceleration while movement input exists.
 * Use stronger deceleration when the controls are released.
 */
/*
 * Tired players accelerate and turn slightly more
 * slowly, but retain normal stopping responsiveness.
 */
const fatigueAccelerationMultiplier =
    this.getFatigueAccelerationMultiplier(
        this.controlledPlayer
    );

const velocityChangeRate =
    playerHasMovementInput
        ? this.playerAcceleration *
            fatigueAccelerationMultiplier
        : this.playerDeceleration;

const maximumVelocityChange =
    velocityChangeRate *
    deltaSeconds;

this.controlledPlayer.movementVelocityX =
    this.moveValueTowards(
        this.controlledPlayer
            .movementVelocityX,

        targetVelocityX,
        maximumVelocityChange
    );

this.controlledPlayer.movementVelocityY =
    this.moveValueTowards(
        this.controlledPlayer
            .movementVelocityY,

        targetVelocityY,
        maximumVelocityChange
    );

/*
 * The player counts as moving whenever they still have
 * meaningful momentum, even after input is released.
 */
const currentMovementSpeed =
    Math.sqrt(
        this.controlledPlayer
            .movementVelocityX ** 2 +

        this.controlledPlayer
            .movementVelocityY ** 2
    );

this.playerIsMoving =
    currentMovementSpeed > 5;

const previousPlayerX =
    this.controlledPlayer.x;

const previousPlayerY =
    this.controlledPlayer.y;

this.controlledPlayer.x +=
    this.controlledPlayer
        .movementVelocityX *
    deltaSeconds;

this.controlledPlayer.y +=
    this.controlledPlayer
        .movementVelocityY *
    deltaSeconds;

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

/*
 * Decide which Green player pressures and which one
 * covers before either defender moves.
 */
this.updateAwayDefensiveAssignments();

this.updateOpponentChase(delta);
this.updateAwayTeammateSupport(delta);
this.updateTeamPressure();
this.updateAIDisposal();
this.updateFootballFlight(delta);
this.updateFootballMarking();
this.updateFootballGroundPhysics(delta);

/*
 * End the quarter once the after-the-siren disposal
 * has fully resolved.
 */
if (
    this.quarterSirenPending &&
    !this.footballInFlight
) {
    this.quarterSirenPending = false;
    this.endQuarter();
}
this.updateStoppageDetection(delta);

if (!this.stoppageActive) {
    this.updateFootballPossession(delta);
    this.updateTackleDetection(delta);
}

/*
 * Update the camera after all player and football
 * movement has been completed for this frame.
 */
this.updateCameraTarget();
this.updateControlledPlayerIndicator();
}

updateQuarterTimer(delta) {
    if (
        this.matchFinished ||
        this.quarterBreakActive
    ) {
        return;
    }

    this.quarterTimeRemaining =
        Math.max(
            0,
            this.quarterTimeRemaining -
                delta
        );

    this.updateQuarterDisplay();

if (
    this.quarterTimeRemaining === 0
) {
    /*
     * Allow an existing disposal to finish after the
     * siren before ending the quarter.
     */
    if (this.footballInFlight) {
        this.quarterSirenPending = true;
        return;
    }

    this.endQuarter();
}
}

updateQuarterDisplay() {
    if (!this.quarterText) {
        return;
    }

    const totalSeconds =
        Math.ceil(
            this.quarterTimeRemaining /
                1000
        );

    const minutes =
        Math.floor(
            totalSeconds / 60
        );

    const seconds =
        totalSeconds % 60;

    const formattedSeconds =
        String(seconds).padStart(
            2,
            "0"
        );

    this.quarterText.setText(
        `Q${this.currentQuarter}   ${minutes}:${formattedSeconds}`
    );
}

endQuarter() {
    if (
        this.quarterBreakActive ||
        this.matchFinished
    ) {
        return;
    }

    this.quarterSirenPending = false;

    /*
     * Cancel the current passage of play.
     */
    this.clearPossession();
    this.stopFootballFlight();

    this.scoreDetected = false;
    this.lastScoreResult = null;

    this.stoppageActive = false;
    this.stoppageType = null;
    this.stoppageRestartScheduled =
        false;

    this.isTackleActive = false;
    this.tackleTimer = 0;
    this.activeTackler = null;

    this.freeKickProtectedPlayer = null;
    this.freeKickProtectionTimer = 0;

    this.resetTouchMovement();
    this.cancelPassAim();

    /*
     * The end of the fourth quarter is full time.
     */
    if (this.currentQuarter >= 4) {
        this.finishMatch();
        return;
    }

    this.quarterBreakActive = true;

    this.passTypeText.setText(
        `END OF Q${this.currentQuarter}`
    );

    if (this.quarterText) {
        this.quarterText.setText(
            `Q${this.currentQuarter}   0:00`
        );
    }

    console.log(
        `End of quarter ${this.currentQuarter}.`
    );

    this.time.delayedCall(
        this.quarterBreakDuration,
        () => {
            this.startNextQuarter();
        }
    );
}

recoverFatigueForQuarterBreak() {
    /*
     * Restore part of each player's energy without
     * completely removing accumulated match fatigue.
     */
    this.playerFatigue =
        Phaser.Math.Clamp(
            this.playerFatigue +
                this.quarterBreakFatigueRecovery,
            this.minimumFatigue,
            this.maximumFatigue
        );

    this.teammateFatigue =
        Phaser.Math.Clamp(
            this.teammateFatigue +
                this.quarterBreakFatigueRecovery,
            this.minimumFatigue,
            this.maximumFatigue
        );

    this.opponentFatigue =
        Phaser.Math.Clamp(
            this.opponentFatigue +
                this.quarterBreakFatigueRecovery,
            this.minimumFatigue,
            this.maximumFatigue
        );

        this.awayTeammateFatigue =
    Phaser.Math.Clamp(
        this.awayTeammateFatigue +
            this.quarterBreakFatigueRecovery,
        this.minimumFatigue,
        this.maximumFatigue
    );

    console.log(
        "Quarter-break fatigue recovery applied.",
        {
            red: Math.round(
                this.playerFatigue
            ),
            blue: Math.round(
                this.teammateFatigue
            ),
            green: Math.round(
                this.opponentFatigue
            )
        }
    );
}

startNextQuarter() {
    if (
        !this.quarterBreakActive ||
        this.matchFinished
    ) {
        return;
    }

    this.currentQuarter++;

    this.quarterTimeRemaining =
        this.quarterDuration;

    this.quarterBreakActive = false;

    this.quarterSirenPending = false;

this.passTypeText.setText("");

/*
 * Restore part of each player's energy before the new
 * quarter begins.
 */
this.recoverFatigueForQuarterBreak();

this.resetPlayersForQuarter();

this.updateQuarterDisplay();

    console.log(
        `Quarter ${this.currentQuarter} started.`
    );
}

resetPlayersForQuarter() {
    this.clearPossession();
    this.stopFootballFlight();

    this.applyCentreFormation();
}

finishMatch() {
    this.matchFinished = true;
    this.quarterBreakActive = false;

    this.quarterTimeRemaining = 0;

    this.clearPossession();
    this.stopFootballFlight();

    this.resetTouchMovement();
    this.cancelPassAim();

    if (this.quarterText) {
        this.quarterText.setText(
            "FULL TIME"
        );
    }

    this.passTypeText.setText(
        "FULL TIME"
    );

    console.log(
        "Full time."
    );
}

updateFatigueDebugDisplay() {
    if (!this.fatigueDebugText) {
        return;
    }

    this.fatigueDebugText.setVisible(
        this.showFatigueDebug
    );

    if (!this.showFatigueDebug) {
        return;
    }

    const redFatigue =
        Math.round(
            this.playerFatigue
        );

    const blueFatigue =
        Math.round(
            this.teammateFatigue
        );

const darkGreenFatigue =
    Math.round(
        this.opponentFatigue
    );

const lightGreenFatigue =
    Math.round(
        this.awayTeammateFatigue
    );

this.fatigueDebugText.setText(
    [
        `RED ENERGY:    ${redFatigue}`,
        `BLUE ENERGY:   ${blueFatigue}`,
        `DARK GREEN:    ${darkGreenFatigue}`,
        `LIGHT GREEN:   ${lightGreenFatigue}`
    ]
);
}

updatePlayerFatigue(delta) {
    /*
     * Do not apply normal standing recovery during
     * quarter breaks or after full time.
     *
     * Quarter recovery is handled once by
     * recoverFatigueForQuarterBreak().
     */
    if (
        this.quarterBreakActive ||
        this.matchFinished
    ) {
        return;
    }

    const deltaSeconds =
        delta / 1000;

    /*
     * Measure actual movement completed during the
     * previous frame.
     */
    const playerDistanceMoved =
        Phaser.Math.Distance.Between(
            this.playerPreviousFatigueX,
            this.playerPreviousFatigueY,
            this.player.x,
            this.player.y
        );

    const teammateDistanceMoved =
        Phaser.Math.Distance.Between(
            this.teammatePreviousFatigueX,
            this.teammatePreviousFatigueY,
            this.teammate.x,
            this.teammate.y
        );

    const opponentDistanceMoved =
        Phaser.Math.Distance.Between(
            this.opponentPreviousFatigueX,
            this.opponentPreviousFatigueY,
            this.opponent.x,
            this.opponent.y
        );

        const awayTeammateDistanceMoved =
    Phaser.Math.Distance.Between(
        this.awayTeammatePreviousFatigueX,
        this.awayTeammatePreviousFatigueY,
        this.awayTeammate.x,
        this.awayTeammate.y
    );

    /*
     * Convert frame movement into pixels per second.
     */
    const playerMovementSpeed =
        deltaSeconds > 0
            ? playerDistanceMoved /
                deltaSeconds
            : 0;

    const teammateMovementSpeed =
        deltaSeconds > 0
            ? teammateDistanceMoved /
                deltaSeconds
            : 0;

    const opponentMovementSpeed =
        deltaSeconds > 0
            ? opponentDistanceMoved /
                deltaSeconds
            : 0;

            const awayTeammateMovementSpeed =
    deltaSeconds > 0
        ? awayTeammateDistanceMoved /
            deltaSeconds
        : 0;

    /*
     * Update one player's energy.
     */
    const calculateFatigue = (
        currentFatigue,
        movementSpeed
    ) => {
        /*
         * Running near normal speed drains energy.
         * Standing or moving slowly permits recovery.
         */
        if (movementSpeed > 18) {
            currentFatigue -=
                this.fatigueDrainPerSecond *
                deltaSeconds;
        } else {
            currentFatigue +=
                this.fatigueRecoveryPerSecond *
                deltaSeconds;
        }

        return Phaser.Math.Clamp(
            currentFatigue,
            this.minimumFatigue,
            this.maximumFatigue
        );
    };

    this.playerFatigue =
        calculateFatigue(
            this.playerFatigue,
            playerMovementSpeed
        );

    this.teammateFatigue =
        calculateFatigue(
            this.teammateFatigue,
            teammateMovementSpeed
        );

    this.opponentFatigue =
        calculateFatigue(
            this.opponentFatigue,
            opponentMovementSpeed
        );

        this.awayTeammateFatigue =
    calculateFatigue(
        this.awayTeammateFatigue,
        awayTeammateMovementSpeed
    );

    /*
     * Save current positions for the next frame.
     */
    this.playerPreviousFatigueX =
        this.player.x;

    this.playerPreviousFatigueY =
        this.player.y;

    this.teammatePreviousFatigueX =
        this.teammate.x;

    this.teammatePreviousFatigueY =
        this.teammate.y;

    this.opponentPreviousFatigueX =
        this.opponent.x;

    this.opponentPreviousFatigueY =
        this.opponent.y;

        this.awayTeammatePreviousFatigueX =
    this.awayTeammate.x;

this.awayTeammatePreviousFatigueY =
    this.awayTeammate.y;
}

getPlayerFatigue(
    playerObject
) {
    if (playerObject === this.player) {
        return this.playerFatigue;
    }

    if (playerObject === this.teammate) {
        return this.teammateFatigue;
    }

if (playerObject === this.opponent) {
    return this.opponentFatigue;
}

if (
    playerObject ===
    this.awayTeammate
) {
    return this.awayTeammateFatigue;
}

return this.maximumFatigue;
}

getFatigueSpeedMultiplier(
    playerObject
) {
    const fatigue =
        this.getPlayerFatigue(
            playerObject
        );

    /*
     * Convert energy from 35–100 into progress
     * from 0–1.
     */
    const fatiguePercentage =
        Phaser.Math.Clamp(
            (
                fatigue -
                this.minimumFatigue
            ) /
            (
                this.maximumFatigue -
                this.minimumFatigue
            ),
            0,
            1
        );

    return Phaser.Math.Linear(
        this.minimumFatigueSpeedMultiplier,
        1,
        fatiguePercentage
    );
}

getFatigueAccelerationMultiplier(
    playerObject
) {
    const fatigue =
        this.getPlayerFatigue(
            playerObject
        );

    const fatiguePercentage =
        Phaser.Math.Clamp(
            (
                fatigue -
                this.minimumFatigue
            ) /
            (
                this.maximumFatigue -
                this.minimumFatigue
            ),
            0,
            1
        );

    return Phaser.Math.Linear(
        this.minimumFatigueAccelerationMultiplier,
        1,
        fatiguePercentage
    );
}

getFatiguePressureMultiplier(
    playerObject
) {
    const fatigue =
        this.getPlayerFatigue(
            playerObject
        );

    const fatiguePercentage =
        Phaser.Math.Clamp(
            (
                fatigue -
                this.minimumFatigue
            ) /
            (
                this.maximumFatigue -
                this.minimumFatigue
            ),
            0,
            1
        );

    return Phaser.Math.Linear(
        this.minimumFatiguePressureMultiplier,
        1,
        fatiguePercentage
    );
}

getFatigueShepherdMultiplier(
    playerObject
) {
    const fatigue =
        this.getPlayerFatigue(
            playerObject
        );

    const fatiguePercentage =
        Phaser.Math.Clamp(
            (
                fatigue -
                this.minimumFatigue
            ) /
            (
                this.maximumFatigue -
                this.minimumFatigue
            ),
            0,
            1
        );

    return Phaser.Math.Linear(
        this.minimumFatigueShepherdMultiplier,
        1,
        fatiguePercentage
    );
}

getFatigueDisposalError(
    playerObject
) {
    const fatigue =
        this.getPlayerFatigue(
            playerObject
        );

    const fatiguePercentage =
        Phaser.Math.Clamp(
            (
                fatigue -
                this.minimumFatigue
            ) /
            (
                this.maximumFatigue -
                this.minimumFatigue
            ),
            0,
            1
        );

    /*
     * Fresh players receive almost no fatigue penalty.
     * Very tired players receive the full penalty.
     */
    return Phaser.Math.Linear(
        this.maximumFatigueDisposalError,
        0,
        fatiguePercentage
    );
}

updateTeammateSupport(delta) {
    if (
        !this.supportPlayer ||
        !this.controlledPlayer
    ) {
        return;
    }

    /*
     * During away possession, the supporting home
     * player moves toward the away ball carrier as a
     * secondary defender.
     */
    if (this.hasAwayPossession()) {
        const awayBallCarrier =
            this.possessionOwner;

        const defensiveOffsetY =
            this.supportPlayer.y <=
            awayBallCarrier.y
                ? -34
                : 34;

        const targetX =
            awayBallCarrier.x + 18;

        const targetY =
            awayBallCarrier.y +
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

            const movementSpeed =
                this.teammateData.speed *
                this.getFatigueSpeedMultiplier(
                    this.supportPlayer
                );

            const movementDistance =
                Math.min(
                    movementSpeed *
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
     * During home possession, seek a position that
     * advances the football toward the right-side goals.
     */
    if (this.hasHomePossession()) {
        const ballCarrier =
            this.possessionOwner;

        const homeScoringEndX =
            this.field.rightGoalLineX;

        const distanceToScoringEnd =
            Math.max(
                0,
                homeScoringEndX -
                    ballCarrier.x
            );

        /*
         * Use a longer lead in the back half and a
         * shorter, more controlled lead near goal.
         */
        const forwardLeadDistance =
            Phaser.Math.Clamp(
                distanceToScoringEnd * 0.28,
                58,
                112
            );

        /*
         * Choose the side offering the most separation
         * from the closest Green defender.
         */
        const upperOptionY =
            ballCarrier.y - 62;

        const lowerOptionY =
            ballCarrier.y + 62;

        const upperDarkGreenDistance =
            Phaser.Math.Distance.Between(
                ballCarrier.x +
                    forwardLeadDistance,
                upperOptionY,
                this.opponent.x,
                this.opponent.y
            );

        const upperLightGreenDistance =
            Phaser.Math.Distance.Between(
                ballCarrier.x +
                    forwardLeadDistance,
                upperOptionY,
                this.awayTeammate.x,
                this.awayTeammate.y
            );

        const lowerDarkGreenDistance =
            Phaser.Math.Distance.Between(
                ballCarrier.x +
                    forwardLeadDistance,
                lowerOptionY,
                this.opponent.x,
                this.opponent.y
            );

        const lowerLightGreenDistance =
            Phaser.Math.Distance.Between(
                ballCarrier.x +
                    forwardLeadDistance,
                lowerOptionY,
                this.awayTeammate.x,
                this.awayTeammate.y
            );

        const upperSpaceScore =
            Math.min(
                upperDarkGreenDistance,
                upperLightGreenDistance
            );

        const lowerSpaceScore =
            Math.min(
                lowerDarkGreenDistance,
                lowerLightGreenDistance
            );

        const selectedTargetY =
            upperSpaceScore >=
            lowerSpaceScore
                ? upperOptionY
                : lowerOptionY;

        let targetX =
            ballCarrier.x +
            forwardLeadDistance;

        let targetY =
            selectedTargetY;

        /*
         * Near goal, move into a scoring lane rather
         * than running beyond the posts.
         */
        const maximumAttackingX =
            homeScoringEndX - 34;

        targetX =
            Math.min(
                targetX,
                maximumAttackingX
            );

        /*
         * Do not let the support player fall behind the
         * ball carrier during normal attacking play.
         */
        targetX =
            Math.max(
                targetX,
                ballCarrier.x + 34
            );

        const correctedTarget =
            this.getPointInsideField(
                targetX,
                targetY
            );

        targetX =
            correctedTarget.x;

        targetY =
            correctedTarget.y;

        this.teammateData.state =
            "ATTACKING_OPTION";

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

        const stoppingDistance = 8;

        if (
            distanceToTarget >
            stoppingDistance
        ) {
            directionToTarget.normalize();

            const movementSpeed =
                this.teammateData.speed *
                this.getFatigueSpeedMultiplier(
                    this.supportPlayer
                );

            const movementDistance =
                Math.min(
                    movementSpeed *
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
     * When the ball is loose, move toward it as the
     * existing possession system decides who collects.
     */
    const directionToFootball =
        new Phaser.Math.Vector2(
            this.football.x -
                this.supportPlayer.x,

            this.football.y -
                this.supportPlayer.y
        );

    const distanceToFootball =
        directionToFootball.length();

    const looseBallStoppingDistance =
        Math.max(
            4,
            this.ballPickupDistance - 4
        );

    if (
        distanceToFootball >
        looseBallStoppingDistance
    ) {
        directionToFootball.normalize();

        const movementSpeed =
            this.teammateData.speed *
                this.getFatigueSpeedMultiplier(
                    this.supportPlayer
                );

        const movementDistance =
            Math.min(
                movementSpeed *
                    (delta / 1000),

                distanceToFootball -
                    looseBallStoppingDistance
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
}

updateAwayDefensiveAssignments() {
    /*
     * Keep the current assignments outside home
     * possession so other away-team behaviours can run.
     */
    if (
        !this.hasHomePossession() ||
        !this.possessionOwner ||
        !this.opponent ||
        !this.awayTeammate
    ) {
        this.awayPressurePlayer = null;
        this.awayCoverPlayer = null;

        return;
    }

    const ballCarrier =
        this.possessionOwner;

    const darkGreenDistance =
        Phaser.Math.Distance.Between(
            this.opponent.x,
            this.opponent.y,
            ballCarrier.x,
            ballCarrier.y
        );

    const lightGreenDistance =
        Phaser.Math.Distance.Between(
            this.awayTeammate.x,
            this.awayTeammate.y,
            ballCarrier.x,
            ballCarrier.y
        );

    /*
     * The closest Green player pressures the carrier.
     * The other Green player protects the receiver.
     */
    if (
        darkGreenDistance <=
        lightGreenDistance
    ) {
        this.awayPressurePlayer =
            this.opponent;

        this.awayCoverPlayer =
            this.awayTeammate;
    } else {
        this.awayPressurePlayer =
            this.awayTeammate;

        this.awayCoverPlayer =
            this.opponent;
    }
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

/*
 * Away-team ball carriers use the same calibrated
 * carrying speed as home players.
 */
/*
 * Combined home pressure slows Green while carrying.
 */
const opponentFatigueMultiplier =
    this.getFatigueSpeedMultiplier(
        this.opponent
    );

const carrySpeed =
    this.ballCarrierSpeed *
    (
        this.opponentMovementMultiplier ??
        1
    ) *
    opponentFatigueMultiplier;

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
 * Shared two-defender structure during home
 * possession.
 */
if (this.hasHomePossession()) {
    const ballCarrier =
        this.possessionOwner;

    const likelyReceiver =
        this.supportPlayer;

    let targetX;
    let targetY;

    if (
        this.awayPressurePlayer ===
        this.opponent
    ) {
        /*
         * Dark Green applies direct pressure while
         * remaining slightly goal-side.
         */
        this.opponentData.state =
            "PRESSURE_CARRIER";

        const goalSideOffset = 24;

        const lateralOffset =
            this.opponent.y <=
            ballCarrier.y
                ? -16
                : 16;

        targetX =
            ballCarrier.x +
            goalSideOffset;

        targetY =
            ballCarrier.y +
            lateralOffset;
    } else {
        /*
         * Dark Green protects the likely receiving
         * player and the passing lane.
         */
        this.opponentData.state =
            "COVER_RECEIVER";

        const receiverTargetX =
            this.teammateData?.targetX ??
            likelyReceiver.x;

        const receiverTargetY =
            this.teammateData?.targetY ??
            likelyReceiver.y;

        targetX =
            Phaser.Math.Linear(
                ballCarrier.x,
                receiverTargetX,
                0.68
            ) + 22;

        targetY =
            Phaser.Math.Linear(
                ballCarrier.y,
                receiverTargetY,
                0.68
            );
    }

    const correctedTarget =
        this.getPointInsideField(
            targetX,
            targetY
        );

    const directionToTarget =
        new Phaser.Math.Vector2(
            correctedTarget.x -
                this.opponent.x,

            correctedTarget.y -
                this.opponent.y
        );

    const distanceToTarget =
        directionToTarget.length();

    const stoppingDistance =
        this.awayPressurePlayer ===
            this.opponent
            ? 10
            : 16;

    if (
        distanceToTarget >
        stoppingDistance
    ) {
        directionToTarget.normalize();

        const movementSpeed =
            this.opponentData.speed *
            this.getFatigueSpeedMultiplier(
                this.opponent
            );

        const movementDistance =
            Math.min(
                movementSpeed *
                    deltaSeconds,
                distanceToTarget -
                    stoppingDistance
            );

        this.opponent.x +=
            directionToTarget.x *
            movementDistance;

        this.opponent.y +=
            directionToTarget.y *
            movementDistance;
    }

    this.keepObjectInsideField(
        this.opponent
    );

    return;
}

    /*
     * Chase the home ball carrier during home
     * possession.
     */
/*
 * During home possession, Green balances direct
 * pressure with defensive coverage.
 */
if (this.hasHomePossession()) {
    this.opponentData.state =
        "DEFENSIVE_ZONE";

    const ballCarrier =
        this.possessionOwner;

const likelyReceiver =
    this.supportPlayer;

/*
 * Use the supporting player's current lead target as
 * the likely destination of the next disposal.
 */
const likelyReceiverTargetX =
    this.teammateData?.targetX ??
    likelyReceiver.x;

const likelyReceiverTargetY =
    this.teammateData?.targetY ??
    likelyReceiver.y;

    /*
     * Measure Green's distance from the ball carrier
     * and the likely receiving player.
     */
    const distanceToCarrier =
        Phaser.Math.Distance.Between(
            this.opponent.x,
            this.opponent.y,
            ballCarrier.x,
            ballCarrier.y
        );

const distanceToReceiver =
    Phaser.Math.Distance.Between(
        this.opponent.x,
        this.opponent.y,
        likelyReceiverTargetX,
        likelyReceiverTargetY
    );

    /*
     * Green pressures the carrier when close enough.
     *
     * Otherwise, Green protects the space between the
     * carrier, receiver and attacking goal.
     */
/*
 * Green pressures the carrier when already close, but
 * otherwise protects the most dangerous passing lane.
 */
const directPressureRange = 78;

const emergencyPressureRange = 46;

    let targetX;
    let targetY;

if (
    distanceToCarrier <=
        emergencyPressureRange ||
    (
        distanceToCarrier <=
            directPressureRange &&
        distanceToReceiver >
            distanceToCarrier + 28
    )
) {
        this.opponentData.state =
            "PRESSURE_CARRIER";

        /*
         * Defend slightly goal-side of the carrier.
         */
        const goalSideOffset = 26;

        const lateralOffset =
            this.opponent.y <
            ballCarrier.y
                ? -18
                : 18;

        targetX =
            ballCarrier.x +
            goalSideOffset;

        targetY =
            ballCarrier.y +
            lateralOffset;
    } else {
        this.opponentData.state =
            "COVER_RECEIVER";

        /*
         * Position Green between the likely receiver
         * and the attacking goal.
         */
        const receiverGoalSideOffset = 34;

/*
 * Cover the lane between the carrier and the receiver's
 * lead destination rather than simply standing beside
 * the receiver.
 */
const laneCoveragePercentage = 0.62;

targetX =
    Phaser.Math.Linear(
        ballCarrier.x,
        likelyReceiverTargetX,
        laneCoveragePercentage
    ) +
    receiverGoalSideOffset;

targetY =
    Phaser.Math.Linear(
        ballCarrier.y,
        likelyReceiverTargetY,
        laneCoveragePercentage
    );

    /*
 * Do not allow Green to move so far toward the receiver
 * that the ball carrier has a completely open corridor.
 */
const maximumCarrierSeparation = 115;

const targetDistanceFromCarrier =
    Phaser.Math.Distance.Between(
        ballCarrier.x,
        ballCarrier.y,
        targetX,
        targetY
    );

if (
    targetDistanceFromCarrier >
    maximumCarrierSeparation
) {
    const directionFromCarrier =
        new Phaser.Math.Vector2(
            targetX - ballCarrier.x,
            targetY - ballCarrier.y
        );

    if (
        directionFromCarrier.length() > 0
    ) {
        directionFromCarrier.normalize();
    }

    targetX =
        ballCarrier.x +
        directionFromCarrier.x *
            maximumCarrierSeparation;

    targetY =
        ballCarrier.y +
        directionFromCarrier.y *
            maximumCarrierSeparation;
}
    }

    /*
     * Keep Green's defensive target inside the oval.
     */
    const correctedTarget =
        this.getPointInsideField(
            targetX,
            targetY
        );

    targetX =
        correctedTarget.x;

    targetY =
        correctedTarget.y;

    this.opponentData.targetX =
        targetX;

    this.opponentData.targetY =
        targetY;

    const directionToTarget =
        new Phaser.Math.Vector2(
            targetX -
                this.opponent.x,

            targetY -
                this.opponent.y
        );

    const distanceToTarget =
        directionToTarget.length();

    /*
     * Prevent constant tiny movements around the
     * defensive target.
     */
const zoningStoppingDistance =
    this.opponentData.state ===
        "PRESSURE_CARRIER"
        ? 8
        : 14;

    if (
        distanceToTarget <=
        zoningStoppingDistance
    ) {
        this.keepObjectInsideField(
            this.opponent
        );

        return;
    }

    directionToTarget.normalize();

/*
 * A nearby supporting player can shepherd Green and
 * temporarily reduce his defensive movement.
 */
const maximumMovement =
    this.opponentData.speed *
    (
        this.opponentMovementMultiplier ??
        1
    ) *
    this.getFatigueSpeedMultiplier(
        this.opponent
    ) *
    deltaSeconds;

    const movementDistance =
        Math.min(
            maximumMovement,
            distanceToTarget -
                zoningStoppingDistance
        );

    this.opponent.x +=
        directionToTarget.x *
        movementDistance;

    this.opponent.y +=
        directionToTarget.y *
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
    const interceptionSpeed = 31.5;

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
const looseBallChaseSpeed =
    31.5 *
    this.getFatigueSpeedMultiplier(
        this.opponent
    );

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

updateAwayTeammateSupport(delta) {
    if (
        !this.awayTeammate ||
        !this.awayTeammateData
    ) {
        return;
    }

    const deltaSeconds =
        delta / 1000;

    /*
     * When Green has possession, the lighter Green
     * player creates a forward leading option.
     */
    if (this.hasAwayPossession()) {

        this.awayTeammateData.state =
            "LEAD";

        const ballCarrier =
            this.possessionOwner;

        const forwardLeadDistance = 90;
        const sidewaysDistance = 55;

        const movementDirection =
            new Phaser.Math.Vector2(
                -1,
                0
            );

        const sidewaysDirection =
            new Phaser.Math.Vector2(
                0,
                1
            );

        const leadSide =
            this.awayTeammate.y <
            ballCarrier.y
                ? -1
                : 1;

        let targetX =
            ballCarrier.x +
            movementDirection.x *
                forwardLeadDistance +
            sidewaysDirection.x *
                sidewaysDistance *
                leadSide;

        let targetY =
            ballCarrier.y +
            movementDirection.y *
                forwardLeadDistance +
            sidewaysDirection.y *
                sidewaysDistance *
                leadSide;

        const correctedTarget =
            this.getPointInsideField(
                targetX,
                targetY
            );

        targetX = correctedTarget.x;
        targetY = correctedTarget.y;

        this.awayTeammateData.targetX =
            targetX;

        this.awayTeammateData.targetY =
            targetY;
    }

/*
 * During home possession, follow the shared pressure
 * and coverage assignments.
 */
else if (this.hasHomePossession()) {
    const ballCarrier =
        this.possessionOwner;

    const likelyReceiver =
        this.supportPlayer;

    let targetX;
    let targetY;

    if (
        this.awayPressurePlayer ===
        this.awayTeammate
    ) {
        /*
         * Light Green applies direct pressure while
         * staying slightly goal-side.
         */
        this.awayTeammateData.state =
            "PRESSURE_CARRIER";

        const goalSideOffset = 24;

        const lateralOffset =
            this.awayTeammate.y <=
            ballCarrier.y
                ? -16
                : 16;

        targetX =
            ballCarrier.x +
            goalSideOffset;

        targetY =
            ballCarrier.y +
            lateralOffset;
    } else {
        /*
         * Light Green protects the receiver and blocks
         * the most likely disposal lane.
         */
        this.awayTeammateData.state =
            "COVER_RECEIVER";

        const receiverTargetX =
            this.teammateData?.targetX ??
            likelyReceiver.x;

        const receiverTargetY =
            this.teammateData?.targetY ??
            likelyReceiver.y;

        targetX =
            Phaser.Math.Linear(
                ballCarrier.x,
                receiverTargetX,
                0.68
            ) + 22;

        targetY =
            Phaser.Math.Linear(
                ballCarrier.y,
                receiverTargetY,
                0.68
            );
    }

    const correctedTarget =
        this.getPointInsideField(
            targetX,
            targetY
        );

    this.awayTeammateData.targetX =
        correctedTarget.x;

    this.awayTeammateData.targetY =
        correctedTarget.y;
}

    /*
     * When the football is loose, continue using the
     * existing loose-ball behaviour.
     */
    else {

        this.awayTeammateData.state =
            "CHASE_LOOSE";

        this.awayTeammateData.targetX =
            this.football.x;

        this.awayTeammateData.targetY =
            this.football.y;
    }

    const direction =
        new Phaser.Math.Vector2(
            this.awayTeammateData.targetX -
                this.awayTeammate.x,

            this.awayTeammateData.targetY -
                this.awayTeammate.y
        );

    const distance =
        direction.length();

    if (distance <= 8) {

        this.keepObjectInsideField(
            this.awayTeammate
        );

        return;
    }

    direction.normalize();

    const movementSpeed =
        this.awayTeammateData.speed *
        this.getFatigueSpeedMultiplier(
            this.awayTeammate
        );

    const movement =
        Math.min(
            movementSpeed *
                deltaSeconds,
            distance
        );

    this.awayTeammate.x +=
        direction.x *
        movement;

    this.awayTeammate.y +=
        direction.y *
        movement;

    this.keepObjectInsideField(
        this.awayTeammate
    );
}

updateTeamPressure() {
    /*
     * Reset pressure values every frame.
     */
    this.homePressureOnOpponent = 0;
    this.awayPressureOnCarrier = 0;

    this.opponentMovementMultiplier = 1;
    this.controlledMovementPressureMultiplier = 1;

    /*
     * Green applies pressure to the home ball carrier.
     */
    if (this.hasHomePossession()) {
        const distanceToCarrier =
            Phaser.Math.Distance.Between(
                this.opponent.x,
                this.opponent.y,
                this.possessionOwner.x,
                this.possessionOwner.y
            );

/*
 * Green's fatigue reduces how strongly he can pressure
 * the home ball carrier.
 */
const greenPressureEffectiveness =
    this.getFatiguePressureMultiplier(
        this.opponent
    );

if (
    distanceToCarrier <=
    this.strongPressureDistance
) {
    this.awayPressureOnCarrier = 2;

    const normalSlowAmount =
        1 -
        this.strongPressureSpeedMultiplier;

    this.controlledMovementPressureMultiplier =
        1 -
        normalSlowAmount *
        greenPressureEffectiveness;
} else if (
    distanceToCarrier <=
    this.pressureDistance
) {
    this.awayPressureOnCarrier = 1;

    const normalSlowAmount =
        1 -
        this.pressureSpeedMultiplier;

    this.controlledMovementPressureMultiplier =
        1 -
        normalSlowAmount *
        greenPressureEffectiveness;
}

        /*
         * The supporting home player can shepherd Green
         * when positioned close to the contest.
         */
        const distanceFromSupportToGreen =
            Phaser.Math.Distance.Between(
                this.supportPlayer.x,
                this.supportPlayer.y,
                this.opponent.x,
                this.opponent.y
            );

        const supportIsNearCarrier =
            Phaser.Math.Distance.Between(
                this.supportPlayer.x,
                this.supportPlayer.y,
                this.possessionOwner.x,
                this.possessionOwner.y
            ) <= this.shepherdDistance + 28;

if (
    distanceFromSupportToGreen <=
        this.shepherdDistance &&
    supportIsNearCarrier
) {
    const shepherdEffectiveness =
        this.getFatigueShepherdMultiplier(
            this.supportPlayer
        );

    const normalShepherdSlowAmount =
        1 -
        this.shepherdSlowMultiplier;

    this.opponentMovementMultiplier =
        1 -
        normalShepherdSlowAmount *
        shepherdEffectiveness;
}
    }

    /*
     * Red and Blue combine pressure when Green has
     * possession.
     */
    if (this.hasAwayPossession()) {
        const controlledDistance =
            Phaser.Math.Distance.Between(
                this.controlledPlayer.x,
                this.controlledPlayer.y,
                this.opponent.x,
                this.opponent.y
            );

        const supportDistance =
            Phaser.Math.Distance.Between(
                this.supportPlayer.x,
                this.supportPlayer.y,
                this.opponent.x,
                this.opponent.y
            );

let nearbyHomeDefenders = 0;
let combinedPressureEffectiveness = 0;

if (
    controlledDistance <=
    this.pressureDistance
) {
    nearbyHomeDefenders++;

    combinedPressureEffectiveness +=
        this.getFatiguePressureMultiplier(
            this.controlledPlayer
        );
}

if (
    supportDistance <=
    this.pressureDistance
) {
    nearbyHomeDefenders++;

    combinedPressureEffectiveness +=
        this.getFatiguePressureMultiplier(
            this.supportPlayer
        );
}

this.homePressureOnOpponent =
    nearbyHomeDefenders;

if (nearbyHomeDefenders > 0) {
    const averagePressureEffectiveness =
        combinedPressureEffectiveness /
        nearbyHomeDefenders;

    const basePressureMultiplier =
        nearbyHomeDefenders >= 2
            ? this.strongPressureSpeedMultiplier
            : this.pressureSpeedMultiplier;

    const normalSlowAmount =
        1 -
        basePressureMultiplier;

    this.opponentMovementMultiplier =
        1 -
        normalSlowAmount *
        averagePressureEffectiveness;
}            
controlledDistance <=
            this.pressureDistance
            {
            nearbyHomeDefenders++;
        }

        if (
            supportDistance <=
            this.pressureDistance
        ) {
            nearbyHomeDefenders++;
        }

        this.homePressureOnOpponent =
            nearbyHomeDefenders;

        if (nearbyHomeDefenders >= 2) {
            this.opponentMovementMultiplier =
                this.strongPressureSpeedMultiplier;
        } else if (nearbyHomeDefenders === 1) {
            this.opponentMovementMultiplier =
                this.pressureSpeedMultiplier;
        }
    }
}

updateAIDisposal() {
    if (!this.hasAwayPossession()) {
        return;
    }

    if (this.aiDisposalCompleted) {
        return;
    }

    if (this.isTackleActive) {
        return;
    }

    const distanceToControlledDefender =
        Phaser.Math.Distance.Between(
            this.opponent.x,
            this.opponent.y,
            this.controlledPlayer.x,
            this.controlledPlayer.y
        );

    const distanceToSupportDefender =
        Phaser.Math.Distance.Between(
            this.opponent.x,
            this.opponent.y,
            this.supportPlayer.x,
            this.supportPlayer.y
        );

    const nearestDefenderDistance =
        Math.min(
            distanceToControlledDefender,
            distanceToSupportDefender
        );

    const distanceToAwayGoal =
        this.opponent.x -
        this.field.leftGoalLineX;

    /*
     * Green disposes earlier when under pressure.
     */
/*
 * Use both distance and combined team pressure when
 * deciding how quickly Green should dispose.
 */
const combinedHomePressure =
    this.homePressureOnOpponent ?? 0;

const underStrongPressure =
    nearestDefenderDistance <= 55 ||
    combinedHomePressure >= 2;

const underModeratePressure =
    nearestDefenderDistance <= 95 ||
    combinedHomePressure >= 1;

    const decisionTime =
        underStrongPressure
            ? this.aiMinimumDecisionTime
            : underModeratePressure
                ? 900
                : this.aiMaximumHoldTime;

    if (
        this.possessionTimer <
        decisionTime
    ) {
        return;
    }

    let isKick = true;

    /*
     * Handball when strongly pressured and a short
     * escape disposal is more realistic.
     */
    if (underStrongPressure) {
        isKick = false;
    }

    /*
     * Prefer kicking when Green is close enough to
     * attack the left-side scoring area.
     */
    if (distanceToAwayGoal < 190) {
        isKick = true;
    }

    /*
     * Choose disposal distance.
     */
    const targetDistance =
        isKick
            ? Phaser.Math.Clamp(
                distanceToAwayGoal,
                110,
                245
            )
            : Phaser.Math.Between(
                42,
                60
            );

    /*
     * Aim generally toward the left-side goal corridor.
     */
    const goalCorridorInfluence =
        isKick ? 0.55 : 0.25;

    const targetY =
        Phaser.Math.Linear(
            this.opponent.y,
            this.field.centreY,
            goalCorridorInfluence
        ) +
        Phaser.Math.Between(
            isKick ? -38 : -22,
            isKick ? 38 : 22
        );

    const rawTargetX =
        this.opponent.x -
        targetDistance;

    const correctedTarget =
        this.getPointInsideField(
            rawTargetX,
            targetY
        );

    this.aiDisposalCompleted = true;

    this.launchAIFootball(
        correctedTarget.x,
        correctedTarget.y,
        isKick
    );

    console.log(
        isKick
            ? "AI decision: kick."
            : "AI decision: handball."
    );
}

launchAIFootball(
    targetX,
    targetY,
    isKick
) {
    if (!this.hasAwayPossession()) {
        return;
    }

    const disposingPlayer =
        this.opponent;

        /*
 * An AI disposal ends Green's free-kick protection.
 */
if (
    this.freeKickProtectedPlayer ===
    disposingPlayer
) {
    this.freeKickProtectedPlayer =
        null;

    this.freeKickProtectionTimer = 0;
}

    /*
     * Use a medium-strength kick or handball for this
     * first AI disposal prototype.
     */
/*
 * Calculate disposal power from the selected target
 * distance.
 */
const targetDistance =
    Phaser.Math.Distance.Between(
        disposingPlayer.x,
        disposingPlayer.y,
        targetX,
        targetY
    );

let powerPercentage;

if (isKick) {
    powerPercentage =
        Phaser.Math.Clamp(
            (
                targetDistance - 62
            ) /
            (
                269 - 62
            ),
            0,
            1
        );
} else {
    powerPercentage =
        Phaser.Math.Clamp(
            (
                targetDistance - 41
            ) /
            (
                62 - 41
            ),
            0,
            1
        );
}

    const minimumSpeed = 120;

    const maximumSpeed =
        isKick ? 380 : 165;

    const launchSpeed =
        Phaser.Math.Linear(
            minimumSpeed,
            maximumSpeed,
            powerPercentage
        );

/*
 * Fatigue slightly shifts Green's selected target
 * before the kick direction is calculated.
 */
const fatigueError =
    this.getFatigueDisposalError(
        disposingPlayer
    );

const adjustedTargetX =
    targetX +
    Phaser.Math.FloatBetween(
        -fatigueError,
        fatigueError
    );

const adjustedTargetY =
    targetY +
    Phaser.Math.FloatBetween(
        -fatigueError,
        fatigueError
    );

const direction =
    new Phaser.Math.Vector2(
        adjustedTargetX -
            disposingPlayer.x,

        adjustedTargetY -
            disposingPlayer.y
    );

if (direction.length() === 0) {
    direction.set(-1, 0);
} else {
    direction.normalize();
}

    /*
     * The travelling football becomes unowned.
     */
    this.lastDisposalPlayer =
        disposingPlayer;

    this.clearPossession();

    this.footballInFlight = true;

    this.footballPickupLockTimer =
        this.footballPickupLockDuration;

    this.footballFlightType =
        isKick ? "KICK" : "HANDBALL";

    this.footballFlightTime = 0;
    this.footballFlightDistance = 0;
    this.footballCanBeMarked = false;

    this.scoreDetected = false;
    this.lastScoreResult = null;

    /*
     * Estimate the flight duration for the height and
     * shadow system added in Step 16C.2.
     */
    const flightDragPerSecond =
        isKick ? 1.25 : 2.15;

    const flightStoppingSpeed =
        isKick ? 42 : 32;

    this.footballEstimatedFlightDuration =
        Math.log(
            launchSpeed /
            flightStoppingSpeed
        ) /
        flightDragPerSecond;

/*
 * Begin Green's disposal in the selected launch
 * direction rather than always on his left side.
 */
this.football.x =
    disposingPlayer.x +
    direction.x * 18;

this.football.y =
    disposingPlayer.y +
    direction.y * 18;

/*
 * Give Green the same genuine height system as the
 * controlled home players.
 */
this.footballHeight = 0;

this.currentMaximumFootballHeight =
    isKick
        ? Phaser.Math.Linear(
            34,
            this.maximumKickHeight,
            powerPercentage
        )
        : Phaser.Math.Linear(
            12,
            this.maximumHandballHeight,
            powerPercentage
        );

this.football.setVisible(false);

if (this.airborneFootball) {
    this.airborneFootball
        .setPosition(
            this.football.x,
            this.football.y
        )
        .setScale(1)
        .setAngle(
            this.football.angle
        )
        .setStrokeStyle(
            2,
            isKick
                ? 0xffd43b
                : 0x66d9ff
        )
        .setVisible(true);
}

this.footballVelocityX =
    direction.x *
    launchSpeed;

    this.footballVelocityY =
        direction.y *
        launchSpeed;

    const minimumRotationSpeed =
        isKick ? 540 : 300;

    const maximumRotationSpeed =
        isKick ? 900 : 540;

    /*
     * Reverse the spin direction for a disposal
     * travelling toward the left.
     */
    this.footballRotationSpeed =
        Phaser.Math.Linear(
            minimumRotationSpeed,
            maximumRotationSpeed,
            powerPercentage
        );

    this.football.setScale(
        this.footballBaseScaleX,
        this.footballBaseScaleY
    );

    this.football.setStrokeStyle(
        2,
        isKick
            ? 0xffd43b
            : 0x66d9ff
    );

    if (this.footballShadow) {
        this.footballShadow
            .setPosition(
                this.football.x,
                this.football.y + 5
            )
            .setScale(1)
            .setAlpha(0.3)
            .setVisible(true);
    }

    console.log(
        isKick
            ? "Green kicked the football."
            : "Green handballed the football."
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

updateStoppageDetection(delta) {
    if (
        !this.football ||
        this.stoppageActive ||
        this.scoreDetected
    ) {
        return;
    }

    /*
     * Boundary detection.
     *
     * A carried football cannot be out of bounds because
     * players are already restricted to the oval.
     */
if (
    !this.possessionOwner &&
    !this.footballIsInsideField()
) {
    const boundaryPoint =
        this.getPointInsideField(
            this.football.x,
            this.football.y,
            0,
            0
        );

    /*
     * A kick crossing the boundary while still
     * airborne is out on the full.
     */
    const isOutOnFull =
        this.footballInFlight &&
        this.footballFlightType ===
            "KICK" &&
        this.lastDisposalPlayer;

    if (isOutOnFull) {
        this.startOutOnFullFreeKick(
            boundaryPoint.x,
            boundaryPoint.y
        );

        return;
    }

    /*
     * A handball, bouncing kick or loose football
     * crossing the boundary produces a throw-in.
     */
    this.startStoppage(
        "BOUNDARY",
        boundaryPoint.x,
        boundaryPoint.y
    );

    return;
}

    /*
     * A trapped-ball contest can only occur when the
     * football is loose and on the ground.
     */
    if (
        this.possessionOwner ||
        this.footballInFlight ||
        this.footballGroundState ===
            "BOUNCING"
    ) {
        this.trappedBallTimer = 0;
        return;
    }

    const homeDistance =
        Math.min(
            Phaser.Math.Distance.Between(
                this.player.x,
                this.player.y,
                this.football.x,
                this.football.y
            ),

            Phaser.Math.Distance.Between(
                this.teammate.x,
                this.teammate.y,
                this.football.x,
                this.football.y
            )
        );

    const awayDistance =
        Phaser.Math.Distance.Between(
            this.opponent.x,
            this.opponent.y,
            this.football.x,
            this.football.y
        );

    const homePlayerIsContesting =
        homeDistance <=
        this.trappedContestDistance;

    const awayPlayerIsContesting =
        awayDistance <=
        this.trappedContestDistance;

    const footballSpeed =
        Math.sqrt(
            this.footballVelocityX ** 2 +
            this.footballVelocityY ** 2
        );

    const footballIsNearlyStationary =
        footballSpeed < 14;

    if (
        homePlayerIsContesting &&
        awayPlayerIsContesting &&
        footballIsNearlyStationary
    ) {
        this.trappedBallTimer +=
            delta;

        if (
            this.trappedBallTimer >=
            this.trappedBallDuration
        ) {
            this.startStoppage(
                "BALL_UP",
                this.football.x,
                this.football.y
            );
        }

        return;
    }

    this.trappedBallTimer = 0;
}

startStoppage(
    stoppageType,
    stoppageX,
    stoppageY
) {
    if (this.stoppageActive) {
        return;
    }

this.stoppageActive = true;
this.stoppageType =
    stoppageType;

this.stoppageRestartScheduled =
    false;

    this.stoppageX =
        stoppageX;

    this.stoppageY =
        stoppageY;

    this.trappedBallTimer = 0;

    this.clearPossession();
    this.stopFootballFlight();

    this.football.x =
        stoppageX;

    this.football.y =
        stoppageY;

    this.footballVelocityX = 0;
    this.footballVelocityY = 0;
    this.footballGroundState =
        "NONE";

    this.resetTouchMovement();
    this.cancelPassAim();

if (stoppageType === "BOUNDARY") {
    this.passTypeText.setText(
        "OUT OF BOUNDS"
    );

    console.log(
        "Boundary throw-in required."
    );
} else {
    this.passTypeText.setText(
        "BALL UP"
    );

    console.log(
        "Ball-up required."
    );
}

/*
 * Schedule one automatic restart.
 */
if (!this.stoppageRestartScheduled) {
    this.stoppageRestartScheduled =
        true;

    this.time.delayedCall(
        this.stoppageRestartDelay,
        () => {
            this.restartStoppage();
        }
    );
}

/*
 * End startStoppage().
 */
}

startOutOnFullFreeKick(
    boundaryX,
    boundaryY
) {
    if (this.stoppageActive) {
        return;
    }

    /*
     * Determine which team receives the free kick.
     */
    let freeKickReceiver;

if (
    this.isHomePlayer(
        this.lastDisposalPlayer
    )
) {
    /*
     * A home-player kick went out on the full.
     *
     * Award the free kick to whichever Green player
     * is closest to the boundary location.
     */
    const darkGreenDistance =
        Phaser.Math.Distance.Between(
            this.opponent.x,
            this.opponent.y,
            boundaryX,
            boundaryY
        );

    const lightGreenDistance =
        Phaser.Math.Distance.Between(
            this.awayTeammate.x,
            this.awayTeammate.y,
            boundaryX,
            boundaryY
        );

    freeKickReceiver =
        darkGreenDistance <=
        lightGreenDistance
            ? this.opponent
            : this.awayTeammate;
} else {
        /*
         * Green's kick went out on the full.
         * Award the free kick to the nearest home player.
         */
        const redDistance =
            Phaser.Math.Distance.Between(
                this.player.x,
                this.player.y,
                boundaryX,
                boundaryY
            );

        const blueDistance =
            Phaser.Math.Distance.Between(
                this.teammate.x,
                this.teammate.y,
                boundaryX,
                boundaryY
            );

        freeKickReceiver =
            redDistance <= blueDistance
                ? this.player
                : this.teammate;
    }

    this.stoppageActive = true;
    this.stoppageType =
        "OUT_ON_FULL";

    this.stoppageX =
        boundaryX;

    this.stoppageY =
        boundaryY;

    this.clearPossession();
    this.stopFootballFlight();

    this.footballVelocityX = 0;
    this.footballVelocityY = 0;

    /*
     * Move the free-kick location slightly inside
     * the oval.
     */
    const inwardDirection =
        new Phaser.Math.Vector2(
            this.field.centreX -
                boundaryX,

            this.field.centreY -
                boundaryY
        );

    if (inwardDirection.length() > 0) {
        inwardDirection.normalize();
    }

    const freeKickX =
        boundaryX +
        inwardDirection.x * 24;

    const freeKickY =
        boundaryY +
        inwardDirection.y * 24;

    freeKickReceiver.setPosition(
        freeKickX,
        freeKickY
    );

    this.keepObjectInsideField(
        freeKickReceiver
    );

    /*
     * Stop the other players from standing directly
     * on the free-kick receiver.
     */
/*
 * Position the remaining players around the free kick.
 *
 * One opposition player stands the mark while the
 * other two players provide wider support and coverage.
 */
const oppositionSpacing = 44;
const supportSpacing = 64;
const sidewaysSpacing = 38;

const sidewaysDirection =
    new Phaser.Math.Vector2(
        -inwardDirection.y,
        inwardDirection.x
    );

if (this.isAwayPlayer(freeKickReceiver)) {
    /*
     * Away-team free kick.
     *
     * The nearest home player stands the mark.
     */
    const redDistance =
        Phaser.Math.Distance.Between(
            this.player.x,
            this.player.y,
            freeKickX,
            freeKickY
        );

    const blueDistance =
        Phaser.Math.Distance.Between(
            this.teammate.x,
            this.teammate.y,
            freeKickX,
            freeKickY
        );

    const playerOnMark =
        redDistance <= blueDistance
            ? this.player
            : this.teammate;

    const homeSupportPlayer =
        playerOnMark === this.player
            ? this.teammate
            : this.player;

    const awaySupportPlayer =
        freeKickReceiver === this.opponent
            ? this.awayTeammate
            : this.opponent;

    playerOnMark.setPosition(
        freeKickX +
            inwardDirection.x *
                oppositionSpacing,

        freeKickY +
            inwardDirection.y *
                oppositionSpacing
    );

    homeSupportPlayer.setPosition(
        freeKickX +
            inwardDirection.x *
                supportSpacing +
            sidewaysDirection.x *
                sidewaysSpacing,

        freeKickY +
            inwardDirection.y *
                supportSpacing +
            sidewaysDirection.y *
                sidewaysSpacing
    );

    awaySupportPlayer.setPosition(
        freeKickX -
            inwardDirection.x *
                46 -
            sidewaysDirection.x *
                sidewaysSpacing,

        freeKickY -
            inwardDirection.y *
                46 -
            sidewaysDirection.y *
                sidewaysSpacing
    );
} else {
    /*
     * Home-team free kick.
     *
     * The nearest Green player stands the mark.
     */
    const darkGreenDistance =
        Phaser.Math.Distance.Between(
            this.opponent.x,
            this.opponent.y,
            freeKickX,
            freeKickY
        );

    const lightGreenDistance =
        Phaser.Math.Distance.Between(
            this.awayTeammate.x,
            this.awayTeammate.y,
            freeKickX,
            freeKickY
        );

    const playerOnMark =
        darkGreenDistance <=
        lightGreenDistance
            ? this.opponent
            : this.awayTeammate;

    const awaySupportPlayer =
        playerOnMark === this.opponent
            ? this.awayTeammate
            : this.opponent;

    const homeSupportPlayer =
        freeKickReceiver === this.player
            ? this.teammate
            : this.player;

    playerOnMark.setPosition(
        freeKickX +
            inwardDirection.x *
                oppositionSpacing,

        freeKickY +
            inwardDirection.y *
                oppositionSpacing
    );

    awaySupportPlayer.setPosition(
        freeKickX +
            inwardDirection.x *
                supportSpacing -
            sidewaysDirection.x *
                sidewaysSpacing,

        freeKickY +
            inwardDirection.y *
                supportSpacing -
            sidewaysDirection.y *
                sidewaysSpacing
    );

    homeSupportPlayer.setPosition(
        freeKickX -
            inwardDirection.x *
                46 +
            sidewaysDirection.x *
                sidewaysSpacing,

        freeKickY -
            inwardDirection.y *
                46 +
            sidewaysDirection.y *
                sidewaysSpacing
    );
}

this.keepObjectInsideField(
    this.player
);

this.keepObjectInsideField(
    this.teammate
);

this.keepObjectInsideField(
    this.opponent
);

this.keepObjectInsideField(
    this.awayTeammate
);

/*
 * Remove movement left over from before the free kick.
 */
this.player.movementVelocityX = 0;
this.player.movementVelocityY = 0;

this.teammate.movementVelocityX = 0;
this.teammate.movementVelocityY = 0;

this.awayTeammate.movementVelocityX = 0;
this.awayTeammate.movementVelocityY = 0;

/*
 * Update fatigue tracking after teleporting players.
 */
this.playerPreviousFatigueX =
    this.player.x;

this.playerPreviousFatigueY =
    this.player.y;

this.teammatePreviousFatigueX =
    this.teammate.x;

this.teammatePreviousFatigueY =
    this.teammate.y;

this.opponentPreviousFatigueX =
    this.opponent.x;

this.opponentPreviousFatigueY =
    this.opponent.y;

this.awayTeammatePreviousFatigueX =
    this.awayTeammate.x;

this.awayTeammatePreviousFatigueY =
    this.awayTeammate.y;

    this.resetTouchMovement();
    this.cancelPassAim();

    this.passTypeText.setText(
        "OUT ON FULL"
    );

    console.log(
        "Out on the full. Opposition free kick."
    );

    /*
     * Briefly display the decision before awarding
     * possession.
     */
    this.time.delayedCall(
        850,
        () => {
            if (
                !this.stoppageActive ||
                this.stoppageType !==
                    "OUT_ON_FULL"
            ) {
                return;
            }

            this.stoppageActive = false;
            this.stoppageType = null;

            this.passTypeText.setText(
                ""
            );

            this.setPossessionOwner(
                freeKickReceiver
            );

            /*
 * Protect the free-kick receiver after play resumes.
 */
this.freeKickProtectedPlayer =
    freeKickReceiver;

this.freeKickProtectionTimer =
    this.freeKickProtectionDuration;

            this.updateControlledPlayerIndicator();

            console.log(
                "Out-on-the-full free kick restarted play."
            );
        }
    );
}

restartStoppage() {
    if (!this.stoppageActive) {
        return;
    }

    if (
        this.stoppageType ===
        "BOUNDARY"
    ) {
        this.restartBoundaryThrowIn();
    } else if (
        this.stoppageType ===
        "BALL_UP"
    ) {
        this.restartBallUp();
    }
}

restartBoundaryThrowIn() {
    const restartX =
        this.stoppageX;

    const restartY =
        this.stoppageY;

    /*
     * Find a direction pointing from the boundary
     * toward the middle of the oval.
     */
    const inwardDirection =
        new Phaser.Math.Vector2(
            this.field.centreX -
                restartX,

            this.field.centreY -
                restartY
        );

    if (inwardDirection.length() > 0) {
        inwardDirection.normalize();
    }

    const sidewaysDirection =
        new Phaser.Math.Vector2(
            -inwardDirection.y,
            inwardDirection.x
        );

    /*
     * Place the players on opposite sides of the
     * throw-in location.
     */
    this.player.setPosition(
        restartX +
            inwardDirection.x * 38 +
            sidewaysDirection.x * 24,

        restartY +
            inwardDirection.y * 38 +
            sidewaysDirection.y * 24
    );

    this.teammate.setPosition(
        restartX +
            inwardDirection.x * 58 -
            sidewaysDirection.x * 32,

        restartY +
            inwardDirection.y * 58 -
            sidewaysDirection.y * 32
    );

this.opponent.setPosition(
    restartX +
        inwardDirection.x * 38 -
        sidewaysDirection.x * 24,

    restartY +
        inwardDirection.y * 38 -
        sidewaysDirection.y * 24
);

/*
 * Light Green begins slightly deeper and on the
 * opposite side from Blue.
 */
this.awayTeammate.setPosition(
    restartX +
        inwardDirection.x * 58 +
        sidewaysDirection.x * 32,

    restartY +
        inwardDirection.y * 58 +
        sidewaysDirection.y * 32
);

this.keepObjectInsideField(
    this.player
);

    this.keepObjectInsideField(
        this.teammate
    );

this.keepObjectInsideField(
    this.opponent
);

this.keepObjectInsideField(
    this.awayTeammate
);

/*
 * The restart teleports all four players, so update
 * fatigue reference positions immediately.
 */
this.playerPreviousFatigueX =
    this.player.x;

this.playerPreviousFatigueY =
    this.player.y;

this.teammatePreviousFatigueX =
    this.teammate.x;

this.teammatePreviousFatigueY =
    this.teammate.y;

this.opponentPreviousFatigueX =
    this.opponent.x;

this.opponentPreviousFatigueY =
    this.opponent.y;

this.awayTeammatePreviousFatigueX =
    this.awayTeammate.x;

this.awayTeammatePreviousFatigueY =
    this.awayTeammate.y;

/*
 * Throw the football inward and slightly upward
 * along the ground view.
 */
    this.football.x =
        restartX +
        inwardDirection.x * 8;

    this.football.y =
        restartY +
        inwardDirection.y * 8;

    this.footballVelocityX =
        inwardDirection.x * 115;

    this.footballVelocityY =
        inwardDirection.y * 115;

    this.footballInFlight = true;
    this.footballFlightType =
        "THROW_IN";

    this.footballFlightTime = 0;
    this.footballFlightDistance = 0;
    this.footballCanBeMarked = false;

    this.footballEstimatedFlightDuration =
        0.75;

    this.footballRotationSpeed = 420;

    this.football.setStrokeStyle(
        2,
        0xffffff
    );

    if (this.footballShadow) {
        this.footballShadow
            .setPosition(
                this.football.x,
                this.football.y + 5
            )
            .setVisible(true);
    }

    this.finishStoppageRestart();

    console.log(
        "Boundary throw-in restarted play."
    );
}

restartBallUp() {
    const restartX =
        this.stoppageX;

    const restartY =
        this.stoppageY;

    /*
     * A ball-up close to the middle uses the shared
     * centre-restart formation.
     */
    const distanceFromCentre =
        Phaser.Math.Distance.Between(
            restartX,
            restartY,
            this.field.centreX,
            this.field.centreY
        );

    const isCentreBallUp =
        distanceFromCentre <= 40;

    if (isCentreBallUp) {
        /*
         * applyCentreFormation() already positions all
         * four players and resets their movement.
         */
        this.applyCentreFormation();
    } else {
        /*
         * Red and dark Green begin closest to the
         * field ball-up.
         */
        this.player.setPosition(
            restartX - 28,
            restartY
        );

        this.opponent.setPosition(
            restartX + 28,
            restartY
        );

        /*
         * Blue and light Green begin outside the
         * contest on opposite sides.
         */
        this.teammate.setPosition(
            restartX,
            restartY + 48
        );

        this.awayTeammate.setPosition(
            restartX,
            restartY - 48
        );

        this.keepObjectInsideField(
            this.player
        );

        this.keepObjectInsideField(
            this.teammate
        );

        this.keepObjectInsideField(
            this.opponent
        );

        this.keepObjectInsideField(
            this.awayTeammate
        );
    }

    /*
     * Remove movement left over from before the
     * stoppage.
     */
    this.player.movementVelocityX = 0;
    this.player.movementVelocityY = 0;

    this.teammate.movementVelocityX = 0;
    this.teammate.movementVelocityY = 0;

    this.awayTeammate.movementVelocityX = 0;
    this.awayTeammate.movementVelocityY = 0;

    /*
     * Update fatigue reference positions so player
     * teleportation is not counted as running.
     */
    this.playerPreviousFatigueX =
        this.player.x;

    this.playerPreviousFatigueY =
        this.player.y;

    this.teammatePreviousFatigueX =
        this.teammate.x;

    this.teammatePreviousFatigueY =
        this.teammate.y;

    this.opponentPreviousFatigueX =
        this.opponent.x;

    this.opponentPreviousFatigueY =
        this.opponent.y;

    this.awayTeammatePreviousFatigueX =
        this.awayTeammate.x;

    this.awayTeammatePreviousFatigueY =
        this.awayTeammate.y;

    /*
     * Send the football slightly away from the exact
     * restart point so the nearest player can contest it.
     */
    const randomDirection =
        Phaser.Math.RandomXY(
            new Phaser.Math.Vector2(),
            1
        );

    this.football.x =
        restartX;

    this.football.y =
        restartY;

    this.footballVelocityX =
        randomDirection.x * 65;

    this.footballVelocityY =
        randomDirection.y * 65;

    this.footballInFlight = true;

    this.footballFlightType =
        "BALL_UP";

    this.footballFlightTime = 0;
    this.footballFlightDistance = 0;
    this.footballCanBeMarked = false;

    this.footballEstimatedFlightDuration =
        0.55;

    this.footballRotationSpeed = 360;

    /*
     * Ball-ups use a low football height.
     */
    this.footballHeight = 0;
    this.currentMaximumFootballHeight = 16;

    this.football.setVisible(false);

    if (this.airborneFootball) {
        this.airborneFootball
            .setPosition(
                this.football.x,
                this.football.y
            )
            .setScale(1)
            .setStrokeStyle(
                2,
                0xffffff
            )
            .setVisible(true);
    }

    this.football.setStrokeStyle(
        2,
        0xffffff
    );

    if (this.footballShadow) {
        this.footballShadow
            .setPosition(
                this.football.x,
                this.football.y + 5
            )
            .setScale(1)
            .setAlpha(0.3)
            .setVisible(true);
    }

    this.finishStoppageRestart();

    console.log(
        "Ball-up restarted play."
    );
}

finishStoppageRestart() {
    this.stoppageActive = false;
    this.stoppageType = null;

    this.stoppageRestartScheduled =
        false;

    this.trappedBallTimer = 0;

    this.footballPickupLockTimer =
        260;

    this.passTypeText.setText("");

    this.isTackleActive = false;
    this.tackleTimer = 0;
    this.activeTackler = null;

    /*
     * Remove old movement momentum.
     */
    this.player.movementVelocityX = 0;
    this.player.movementVelocityY = 0;

    this.teammate.movementVelocityX = 0;
    this.teammate.movementVelocityY = 0;

    this.updateControlledPlayerIndicator();
}

updateFootballPossession(delta) {
    if (!this.football) {
        return;
    }

    /*
 * Do not allow players to collect the football after
 * a score has been detected.
 */
if (this.scoreDetected) {
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

/*
 * Include the lighter Green player in loose-ball
 * possession contests.
 */
const awayTeammateDistance =
    Phaser.Math.Distance.Between(
        this.awayTeammate.x,
        this.awayTeammate.y,
        this.football.x,
        this.football.y
    );

if (
    awayTeammateDistance <=
    this.ballPickupDistance
) {
    pickupCandidates.push({
        player:
            this.awayTeammate,

        distance:
            awayTeammateDistance
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

        this.updateScoreDetection(
    previousFootballX
);

if (this.scoreDetected) {
    return;
}

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
let dragPerSecond;

if (
    this.footballFlightType === "KICK"
) {
    dragPerSecond = 1.25;
} else if (
    this.footballFlightType ===
        "THROW_IN" ||
    this.footballFlightType ===
        "BALL_UP"
) {
    dragPerSecond = 2.4;
} else {
    dragPerSecond = 2.15;
}

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
 * Convert flight time into progress:
 *
 * 0   = launch
 * 0.5 = apex
 * 1   = landing
 */
const safeFlightDuration =
    Math.max(
        0.01,
        this.footballEstimatedFlightDuration
    );

const flightProgress =
    Phaser.Math.Clamp(
        this.footballFlightTime /
            safeFlightDuration,
        0,
        1
    );

/*
 * The sine curve creates a smooth rise and descent.
 */
const flightHeightCurve =
    Math.sin(
        flightProgress *
        Math.PI
    );

this.footballHeight =
    flightHeightCurve *
    this.currentMaximumFootballHeight;

/*
 * The logical football remains on the ground plane.
 * The separate airborne graphic is raised visually.
 */
if (this.airborneFootball) {
    const airborneScale =
        1 +
        flightHeightCurve *
        (
            this.footballFlightType ===
                "KICK"
                ? 0.18
                : 0.10
        );

    this.airborneFootball
        .setPosition(
            this.football.x,
            this.football.y -
                this.footballHeight
        )
        .setScale(
            airborneScale
        )
        .setAngle(
            this.football.angle
        )
        .setVisible(true);
}

/*
 * The shadow remains at the football's logical ground
 * position and becomes smaller near the apex.
 */
if (this.footballShadow) {
    const shadowScaleX =
        1 -
        flightHeightCurve * 0.38;

    const shadowScaleY =
        1 -
        flightHeightCurve * 0.25;

    const shadowAlpha =
        0.30 -
        flightHeightCurve * 0.18;

    this.footballShadow
        .setPosition(
            this.football.x,
            this.football.y + 5
        )
        .setScale(
            shadowScaleX,
            shadowScaleY
        )
        .setAlpha(
            shadowAlpha
        )
        .setVisible(true);
}

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

updateScoreboard() {
    if (
        this.lastScoreResult === "GOAL"
    ) {
        this.homeGoals++;
    } else if (
        this.lastScoreResult === "BEHIND"
    ) {
        this.homeBehinds++;
    }

    const homeTotal =
        this.homeGoals * 6 +
        this.homeBehinds;

    const awayTotal =
        this.awayGoals * 6 +
        this.awayBehinds;

    this.homeScoreText.setText(
        `${this.homeGoals}.${this.homeBehinds} (${homeTotal})`
    );

    this.awayScoreText.setText(
        `${this.awayGoals}.${this.awayBehinds} (${awayTotal})`
    );
}

updateScoreDetection(
    previousFootballX
) {
    if (this.scoreDetected) {
        return;
    }

    /*
     * Only kicks can currently register scores.
     */
    if (
        this.footballFlightType !==
        "KICK"
    ) {
        return;
    }

    const {
        centreY,
        rightGoalLineX,
        goalPostOffset,
        behindPostOffset
    } = this.field;

    /*
     * Detect the exact frame where the football crosses
     * from inside the field to beyond the goal line.
     */
    const crossedRightGoalLine =
        previousFootballX <
            rightGoalLineX &&
        this.football.x >=
            rightGoalLineX;

    if (!crossedRightGoalLine) {
        return;
    }

    const distanceFromGoalCentre =
        Math.abs(
            this.football.y -
            centreY
        );

    let scoreResult = "MISS";

    if (
        distanceFromGoalCentre <
        goalPostOffset
    ) {
        scoreResult = "GOAL";
    } else if (
        distanceFromGoalCentre <
        behindPostOffset
    ) {
        scoreResult = "BEHIND";
    }

    this.scoreDetected = true;
    this.lastScoreResult =
        scoreResult;

        /*
 * Update the scoreboard immediately.
 */
this.updateScoreboard();

    /*
     * Stop the football on the scoring line.
     *
     * Step 15N will add the scoreboard update and
     * restart sequence.
     */
    this.football.x =
        rightGoalLineX;

    this.stopFootballFlight();

    /*
 * Keep the result visible until the scoreboard and
 * restart system is added in Step 15N.
 */
this.time.delayedCall(
    1500,
    () => {

        if (this.passTypeText) {
            this.passTypeText.setText("");
        }

        this.restartAfterScore();

    }
);

if (scoreResult === "GOAL") {
    this.passTypeText.setText(
        "GOAL!"
    );

    console.log("GOAL!");
} else if (
    scoreResult === "BEHIND"
) {
    this.passTypeText.setText(
        "BEHIND"
    );

    console.log("BEHIND.");
} else {
    this.passTypeText.setText(
        "MISSED"
    );

    console.log(
        "The shot missed the scoring posts."
    );
}
}

restartAfterScore() {
    /*
     * Do not restart an old scoring passage after a
     * quarter has ended.
     */
    if (
        this.quarterBreakActive ||
        this.matchFinished
    ) {
        this.scoreDetected = false;
        this.lastScoreResult = null;

        return;
    }

/*
 * Return the match to the shared centre formation.
 */
this.clearPossession();
this.stopFootballFlight();

this.applyCentreFormation();

    console.log(
        "Centre restart."
    );
}

calculateMarkingContestScore(
    candidatePlayer,
    distanceToFootball
) {
    if (!candidatePlayer) {
        return 0;
    }

    const markingAbility =
        candidatePlayer.markingAbility ??
        70;

    const strength =
        candidatePlayer.strength ??
        70;

    /*
     * Positioning quality ranges from:
     *
     * 100 = directly beneath the drop point
     * 0   = at the outer marking-distance limit
     */
    const positioningQuality =
        Phaser.Math.Clamp(
            100 -
            (
                distanceToFootball /
                this.playerMarkDistance
            ) *
            100,
            0,
            100
        );

    /*
     * Contest weighting:
     *
     * Marking ability: 50%
     * Positioning:      30%
     * Strength:         20%
     */
    const baseContestScore =
        markingAbility * 0.50 +
        positioningQuality * 0.30 +
        strength * 0.20;

    /*
     * Small randomness prevents identical contests from
     * always producing exactly the same result.
     */
    const randomVariation =
        Phaser.Math.FloatBetween(
            -6,
            6
        );

    return (
        baseContestScore +
        randomVariation
    );
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

/*
 * Work out whether the football is rising or falling.
 *
 * The apex occurs halfway through the estimated flight.
 */
const safeFlightDuration =
    Math.max(
        0.01,
        this.footballEstimatedFlightDuration
    );

const flightProgress =
    Phaser.Math.Clamp(
        this.footballFlightTime /
            safeFlightDuration,
        0,
        1
    );

const footballIsDescending =
    flightProgress >= 0.5;

/*
 * A high football passes over players underneath it.
 *
 * Marking becomes available only after the football
 * begins descending and returns within reach.
 */
const footballIsWithinMarkingHeight =
    this.footballHeight <=
    this.maximumMarkableFootballHeight;

if (
    !footballIsDescending ||
    !footballIsWithinMarkingHeight
) {
    return;
}

const markingCandidates = [
    this.controlledPlayer,
    this.supportPlayer,
    this.opponent,
    this.awayTeammate
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
        distanceToFootball,

    contestScore:
        this.calculateMarkingContestScore(
            candidatePlayer,
            distanceToFootball
        )
});
            }
        }
    );

    if (
        successfulCandidates.length === 0
    ) {
        return;
    }

/*
 * Higher contest scores are placed first.
 */
successfulCandidates.sort(
    (firstCandidate, secondCandidate) =>
        secondCandidate.contestScore -
        firstCandidate.contestScore
);

    const closestCandidate =
        successfulCandidates[0];

const secondCandidate =
    successfulCandidates[1];

/*
 * When only one player reaches the football, calculate
 * whether they complete the uncontested mark.
 */
if (!secondCandidate) {
    const markingAbility =
        closestCandidate.player
            .markingAbility ??
        70;

    const positioningQuality =
        Phaser.Math.Clamp(
            1 -
            (
                closestCandidate.distance /
                this.playerMarkDistance
            ),
            0,
            1
        );

    /*
     * A well-positioned average player should normally
     * complete an uncontested mark, while poor markers
     * can occasionally drop it.
     */
    const uncontestedMarkChance =
        Phaser.Math.Clamp(
            0.55 +
            markingAbility * 0.004 +
            positioningQuality * 0.12,
            0.60,
            0.97
        );

    const markCompleted =
        Math.random() <
        uncontestedMarkChance;

    if (!markCompleted) {
        /*
         * The football is dropped and becomes a loose
         * ground-ball opportunity.
         */
this.footballFlightType =
    "DROPPED_MARK";

this.footballCanBeMarked =
    false;

/*
 * A dropped mark loses most of its forward speed but
 * continues falling toward the ground.
 */
this.footballVelocityX *=
    0.30;

this.footballVelocityY *=
    0.30;

/*
 * Prevent immediate collection while the dropped ball
 * completes its landing.
 */
this.footballPickupLockTimer =
    this.contestPickupLockDuration;

        this.footballRotationSpeed =
            Phaser.Math.FloatBetween(
                -540,
                540
            );

this.passTypeText.setText(
    "DROPPED MARK"
);

this.time.delayedCall(
    650,
    () => {
        if (
            this.passTypeText &&
            this.passTypeText.text ===
                "DROPPED MARK"
        ) {
            this.passTypeText.setText(
                ""
            );
        }
    }
);

console.log(
    "Uncontested mark dropped."
);

        return;
    }
}

/*
 * A spoil can only occur when opposing players achieve
 * similar contest scores.
 */
if (secondCandidate) {
/*
 * Determine each candidate's team rather than checking
 * only for the original darker Green player.
 */
const closestIsHome =
    this.isHomePlayer(
        closestCandidate.player
    );

const secondIsHome =
    this.isHomePlayer(
        secondCandidate.player
    );

const playersAreOpponents =
    closestIsHome !==
    secondIsHome;

/*
 * A close contest-score result produces a spoil.
 *
 * A clearer score advantage produces a completed mark
 * for the higher-ranked candidate.
 */
const contestScoreDifference =
    Math.abs(
        closestCandidate.contestScore -
        secondCandidate.contestScore
    );

const spoilContestMargin = 10;

if (
    playersAreOpponents &&
    contestScoreDifference <=
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
 * Prevent either contesting player from instantly
 * collecting the spoil before it reaches the ground.
 */
this.footballPickupLockTimer =
    this.contestPickupLockDuration;

            /*
             * Reduce the forward speed and knock the
             * football sideways away from the contest.
             */
            this.footballVelocityX *=
                0.45;

/*
 * Deflect the ball away from the player who finished
 * second in the marking contest.
 */
const spoilDirection =
    secondCandidate.player.y <=
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

if (this.airborneFootball) {
    this.airborneFootball.setStrokeStyle(
        2,
        0xffffff
    );
}

if (this.airborneFootball) {
    this.airborneFootball.setStrokeStyle(
        2,
        0xffffff
    );
}

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

this.passTypeText.setText(
    "SPOIL"
);

this.time.delayedCall(
    650,
    () => {
        if (
            this.passTypeText &&
            this.passTypeText.text ===
                "SPOIL"
        ) {
            this.passTypeText.setText(
                ""
            );
        }
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

/*
 * The football has returned to ground level.
 */
this.footballHeight = 0;
this.currentMaximumFootballHeight = 0;

this.football.setVisible(true);

if (this.airborneFootball) {
    this.airborneFootball
        .setVisible(false)
        .setScale(1);
}

if (this.footballShadow) {
    this.footballShadow.setVisible(
        false
    );
}

this.football.setScale(
    this.footballBaseScaleX,
    this.footballBaseScaleY
);

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
let firstBounceSpeed;

if (
    this.footballFlightType ===
    "KICK"
) {
    firstBounceSpeed = 105;
} else if (
    this.footballFlightType ===
    "HANDBALL"
) {
    firstBounceSpeed = 68;
} else if (
    this.footballFlightType ===
    "SPOIL"
) {
    /*
     * Spoils should deflect into a genuine loose-ball
     * contest rather than stopping beneath the players.
     */
    firstBounceSpeed = 82;
} else if (
    this.footballFlightType ===
    "DROPPED_MARK"
) {
    /*
     * Dropped marks normally fall close to the marking
     * contest with only limited forward movement.
     */
    firstBounceSpeed = 48;
} else {
    firstBounceSpeed = 60;
}

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
if (
    this.footballFlightType ===
    "KICK"
) {
    this.footballBounceHeight =
        0.28;
} else if (
    this.footballFlightType ===
    "HANDBALL"
) {
    this.footballBounceHeight =
        0.17;
} else if (
    this.footballFlightType ===
    "SPOIL"
) {
    this.footballBounceHeight =
        0.22;
} else if (
    this.footballFlightType ===
    "DROPPED_MARK"
) {
    this.footballBounceHeight =
        0.14;
} else {
    this.footballBounceHeight =
        0.16;
}
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

this.footballEstimatedFlightDuration = 0;

this.footballHeight = 0;
this.currentMaximumFootballHeight = 0;

this.football.setVisible(true);

if (this.airborneFootball) {
    this.airborneFootball
        .setVisible(false)
        .setScale(1);
}

if (this.footballShadow) {
    this.footballShadow.setVisible(
        false
    );
}

if (this.football) {
    this.football.setScale(
        this.footballBaseScaleX,
        this.footballBaseScaleY
    );
}

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

updateTackleDetection(delta) {
    /*
     * Tackling only occurs while a player owns
     * the football.
     */
    if (!this.possessionOwner) {
        this.isTackleActive = false;
        this.tackleTimer = 0;
        this.activeTackler = null;
        return;
    }

    /*
 * The player receiving a free kick cannot be tackled
 * during the brief protected restart period.
 */
if (
    this.freeKickProtectedPlayer ===
        this.possessionOwner &&
    this.freeKickProtectionTimer > 0
) {
    this.isTackleActive = false;
    this.tackleTimer = 0;
    this.activeTackler = null;

    return;
}

let defender = null;

if (this.hasAwayPossession()) {
    /*
     * The user controls the selected home defender
     * against whichever Green player has possession.
     */
    defender =
        this.controlledPlayer;
} else if (this.hasHomePossession()) {
    /*
     * Once a tackle has started, keep using the same
     * Green tackler until the contest is resolved.
     */
    if (
        this.isTackleActive &&
        this.activeTackler &&
        this.isAwayPlayer(
            this.activeTackler
        )
    ) {
        defender =
            this.activeTackler;
    } else {
        /*
         * Compare both Green defenders and select the
         * one closest to the home ball carrier.
         */
        const darkGreenDistance =
            Phaser.Math.Distance.Between(
                this.opponent.x,
                this.opponent.y,
                this.possessionOwner.x,
                this.possessionOwner.y
            );

        const lightGreenDistance =
            Phaser.Math.Distance.Between(
                this.awayTeammate.x,
                this.awayTeammate.y,
                this.possessionOwner.x,
                this.possessionOwner.y
            );

        defender =
            darkGreenDistance <=
            lightGreenDistance
                ? this.opponent
                : this.awayTeammate;
    }
}

    if (!defender) {
        this.isTackleActive = false;
        this.tackleTimer = 0;
        this.activeTackler = null;
        return;
    }

    /*
 * A fatigued defender cannot begin another tackle
 * until their recovery timer finishes.
 */
if (
    !this.isTackleActive &&
    defender === this.fatiguedTackler &&
    this.tackleFatigueTimer > 0
) {
    return;
}

    const tackleDistance =
        Phaser.Math.Distance.Between(
            defender.x,
            defender.y,
            this.possessionOwner.x,
            this.possessionOwner.y
        );

    const tackleCanContinue =
        tackleDistance <=
            this.tackleDistance ||
        (
            this.isTackleActive &&
            defender === this.activeTackler
        );

    if (!tackleCanContinue) {
        this.isTackleActive = false;
        this.tackleTimer = 0;
        this.activeTackler = null;
        return;
    }

    /*
     * Start a new tackle.
     */
if (!this.isTackleActive) {
    this.isTackleActive = true;
    this.activeTackler =
        defender;

    /*
     * In the current top-down prototype, a tackler
     * positioned too far above the carrier represents
     * contact above the legal tackling zone.
     */
/*
 * Roll once when the tackle begins.
 *
 * Phaser.Math.FloatBetween() returns a value between
 * 0 and 1. Values below 0.05 represent a 5% chance.
 */
/*
 * Roll for a high tackle first.
 */
this.currentTackleIsHigh =
    Phaser.Math.FloatBetween(
        0,
        1
    ) < this.highTackleChance;

if (this.currentTackleIsHigh) {
    const infringedCarrier =
        this.possessionOwner;

    this.startHighTackleFreeKick(
        infringedCarrier,
        defender
    );

    return;
}

/*
 * Determine whether the tackler began the tackle from
 * behind the ball carrier.
 *
 * Home attacks right:
 * behind the home carrier = lower x-position.
 *
 * Away attacks left:
 * behind Green = higher x-position.
 */
const carrierIsHomePlayer =
    this.isHomePlayer(
        this.possessionOwner
    );

const tackleStartedFromBehind =
    carrierIsHomePlayer
        ? defender.x <
            this.possessionOwner.x
        : defender.x >
            this.possessionOwner.x;

/*
 * Only rear tackles can produce push in the back.
 */
this.currentTackleIsPushInBack =
    tackleStartedFromBehind &&
    Phaser.Math.FloatBetween(
        0,
        1
    ) < this.pushInBackChance;

if (
    this.currentTackleIsPushInBack
) {
    const infringedCarrier =
        this.possessionOwner;

    this.startPushInBackFreeKick(
        infringedCarrier,
        defender
    );

    return;
}

/*
 * Give immediate visual feedback when a tackle
 * begins.
 */
this.tweens.add({
    targets: [
        defender,
        this.possessionOwner
    ],

    scaleX: 1.20,
    scaleY: 1.20,

    duration: 80,
    yoyo: true,

    ease: "Power1"
});

/*
 * Briefly flash both players.
 *
 * Store the actual player objects involved in the
 * tackle. Possession may be cleared if the carrier
 * disposes before this delayed reset runs.
 */
const tacklingPlayer =
    defender;

const tackledPlayer =
    this.possessionOwner;

const defenderOriginalColour =
    tacklingPlayer.fillColor;

const carrierOriginalColour =
    tackledPlayer.fillColor;

tacklingPlayer.setFillStyle(
    0xffffff
);

tackledPlayer.setFillStyle(
    0xffffff
);

this.time.delayedCall(
    100,
    () => {
        /*
         * Restore the exact players that began the
         * tackle rather than relying on the current
         * possession owner.
         */
        if (tacklingPlayer) {
            tacklingPlayer.setFillStyle(
                defenderOriginalColour
            );
        }

        if (tackledPlayer) {
            tackledPlayer.setFillStyle(
                carrierOriginalColour
            );
        }
    }
);

console.log(
    "Tackle started."
);

    /*
     * Complete the tackle after the engagement
     * duration has passed.
     */
    this.time.delayedCall(
        this.tackleDuration,
        () => {
            this.completeTackleSpill();
        }
    );
}

    /*
     * Continue the tackle until the timer expires.
     */
    /*
 * Keep the tackler attached while the delayed
 * completion timer is active.
 */
if (
    this.isTackleActive &&
    this.possessionOwner
) {
    const directionToCarrier =
        new Phaser.Math.Vector2(
            this.possessionOwner.x -
                defender.x,

            this.possessionOwner.y -
                defender.y
        );

    if (directionToCarrier.length() > 0) {
        directionToCarrier.normalize();
    }

    const tackleAttachmentDistance = 12;

    defender.x =
        this.possessionOwner.x -
        directionToCarrier.x *
            tackleAttachmentDistance;

    defender.y =
        this.possessionOwner.y -
        directionToCarrier.y *
            tackleAttachmentDistance;

    this.keepObjectInsideField(
        defender
    );
}

return;

}

startHighTackleFreeKick(
    freeKickReceiver,
    offendingTackler
) {
    if (
        !freeKickReceiver ||
        !offendingTackler
    ) {
        return;
    }

    /*
     * Cancel the normal tackle outcome.
     */
    this.isTackleActive = false;
    this.tackleTimer = 0;
    this.activeTackler = null;
    this.currentTackleIsHigh = false;

    /*
     * The offending tackler still enters the normal
     * tackle-fatigue period.
     */
    this.fatiguedTackler =
        offendingTackler;

    this.tackleFatigueTimer =
        this.tackleFatigueDuration;

    /*
     * Move the tackler a short distance away so the
     * same contact does not immediately trigger again.
     */
    const separationDirection =
        new Phaser.Math.Vector2(
            offendingTackler.x -
                freeKickReceiver.x,

            offendingTackler.y -
                freeKickReceiver.y
        );

    if (
        separationDirection.length() === 0
    ) {
        separationDirection.set(
            1,
            0
        );
    } else {
        separationDirection.normalize();
    }

    offendingTackler.x =
        freeKickReceiver.x +
        separationDirection.x * 42;

    offendingTackler.y =
        freeKickReceiver.y +
        separationDirection.y * 42;

    this.keepObjectInsideField(
        offendingTackler
    );

    /*
     * Keep possession with the infringed player.
     */
    this.setPossessionOwner(
        freeKickReceiver
    );

    /*
 * Protect the infringed player from an immediate
 * repeat tackle.
 */
this.freeKickProtectedPlayer =
    freeKickReceiver;

this.freeKickProtectionTimer =
    this.freeKickProtectionDuration;

    this.resetTouchMovement();
    this.cancelPassAim();

    this.passTypeText.setText(
        "HIGH TACKLE"
    );

    console.log(
        "High tackle. Free kick to the ball carrier."
    );

    this.time.delayedCall(
        850,
        () => {
            if (this.passTypeText) {
                this.passTypeText.setText(
                    ""
                );
            }
        }
    );
}

startPushInBackFreeKick(
    freeKickReceiver,
    offendingTackler
) {
    if (
        !freeKickReceiver ||
        !offendingTackler
    ) {
        return;
    }

    /*
     * Cancel the normal tackle result.
     */
    this.isTackleActive = false;
    this.tackleTimer = 0;
    this.activeTackler = null;

    this.currentTackleIsHigh = false;
    this.currentTackleIsPushInBack =
        false;

    /*
     * The offending player still requires tackle
     * recovery.
     */
    this.fatiguedTackler =
        offendingTackler;

    this.tackleFatigueTimer =
        this.tackleFatigueDuration;

    /*
     * Move the offender away from the carrier so the
     * tackle cannot immediately restart.
     */
    const separationDirection =
        new Phaser.Math.Vector2(
            offendingTackler.x -
                freeKickReceiver.x,

            offendingTackler.y -
                freeKickReceiver.y
        );

    if (
        separationDirection.length() ===
        0
    ) {
        separationDirection.set(
            1,
            0
        );
    } else {
        separationDirection.normalize();
    }

    offendingTackler.x =
        freeKickReceiver.x +
        separationDirection.x * 42;

    offendingTackler.y =
        freeKickReceiver.y +
        separationDirection.y * 42;

    this.keepObjectInsideField(
        offendingTackler
    );

    /*
     * The infringed carrier keeps possession.
     */
    this.setPossessionOwner(
        freeKickReceiver
    );

    /*
 * Protect the infringed player from an immediate
 * repeat tackle.
 */
this.freeKickProtectedPlayer =
    freeKickReceiver;

this.freeKickProtectionTimer =
    this.freeKickProtectionDuration;

    this.resetTouchMovement();
    this.cancelPassAim();

    this.passTypeText.setText(
        "PUSH IN THE BACK"
    );

    console.log(
        "Push in the back. Free kick to the ball carrier."
    );

    this.time.delayedCall(
        850,
        () => {
            if (this.passTypeText) {
                this.passTypeText.setText(
                    ""
                );
            }
        }
    );
}

completeTackleSpill() {
/*
 * Cancel the tackle outcome if the carrier disposed
 * of the football before the tackle completed.
 */
if (
    !this.isTackleActive ||
    !this.possessionOwner ||
    this.currentTackleIsHigh ||
    this.currentTackleIsPushInBack
) {
    this.isTackleActive = false;
    this.tackleTimer = 0;
    this.activeTackler = null;

    this.currentTackleIsHigh = false;
    this.currentTackleIsPushInBack =
        false;

    return;
}

const ballCarrier =
    this.possessionOwner;

const successfulTackler =
    this.activeTackler;

    /*
 * Start the tackler's recovery period.
 */
if (successfulTackler) {
    this.fatiguedTackler =
        successfulTackler;

    this.tackleFatigueTimer =
        this.tackleFatigueDuration;
}

const hadPriorOpportunity =
    this.possessionTimer >=
    this.priorOpportunityDuration;

/*
 * Reset the active tackle before resolving
 * possession.
 */
this.isTackleActive = false;
this.tackleTimer = 0;
this.activeTackler = null;

this.currentTackleIsHigh = false;
this.currentTackleIsPushInBack =
    false;

/*
 * A carrier with prior opportunity is penalised
 * holding the ball.
 */
if (
    hadPriorOpportunity &&
    successfulTackler
) {
    this.setPossessionOwner(
        successfulTackler
    );

    console.log(
        "Holding the ball. Free kick to the tackler."
    );

    return;
}

console.log(
    "No prior opportunity. Ball spilled."
);

    const spillDirection =
        this.hasAwayPossession()
            ? -1
            : 1;

    this.clearPossession();

    /*
     * Prevent an immediate recollection.
     */
    this.footballPickupLockTimer = 450;

    /*
     * Place the football clearly outside the normal
     * 24-pixel collection distance.
     */
    this.football.x =
        ballCarrier.x +
        spillDirection * 40;

    this.football.y =
        ballCarrier.y +
        Phaser.Math.Between(
            -14,
            14
        );

    /*
     * Start the ground-bounce system directly.
     */
    this.footballInFlight = false;
    this.footballFlightType =
        "TACKLE_SPILL";

    this.footballGroundState =
        "BOUNCING";

    this.footballBounceCount = 0;
    this.footballGroundBounceTimer = 0;
    this.footballGroundBounceDuration = 220;
    this.footballBounceHeight = 0.2;

    this.footballVelocityX =
        spillDirection * 125;

    this.footballVelocityY =
        Phaser.Math.Between(
            -55,
            55
        );

    this.footballRotationSpeed =
        spillDirection * 540;

    this.football.setScale(
        this.footballBaseScaleX,
        this.footballBaseScaleY
    );

    this.football.setStrokeStyle(
        2,
        0xffffff
    );

    this.isTackleActive = false;
    this.tackleTimer = 0;
    this.activeTackler = null;

    console.log(
        "Ball spilled from tackle."
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

footballIsInsideField(
    x = this.football.x,
    y = this.football.y
) {
    if (!this.field) {
        return true;
    }

    const relativeX =
        x - this.field.centreX;

    const relativeY =
        y - this.field.centreY;

    const ellipseValue =
        (
            relativeX *
            relativeX
        ) /
        (
            this.field.horizontalRadius *
            this.field.horizontalRadius
        ) +
        (
            relativeY *
            relativeY
        ) /
        (
            this.field.verticalRadius *
            this.field.verticalRadius
        );

    return ellipseValue <= 1;
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
this.field.behindPostOffset = behindPostOffset;
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

this.homeScoreText = this.add.text(
    -225,
    -12,
    "0.0 (0)",
        {
            fontFamily: "Courier New",
            fontSize: "15px",
            color: "#ffffff"
        }
    );

this.quarterText = this.add.text(
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

this.awayScoreText = this.add.text(
    225,
    -12,
    "0.0 (0)",
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
this.homeScoreText,
this.quarterText,
this.awayScoreText,
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