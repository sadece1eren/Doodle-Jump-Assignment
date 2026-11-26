// Doodle Jump
// main game file

// canvas stuff
const W = 400;
const H = 600;

// colors
const GREEN = [90, 240, 160];
const WHITE = [210, 240, 220];

// game variables
let player;
let platforms = [];
let dustParticles = []; // little puffs that appear when the robot jumps/lands
let camY = 0;
let maxY;

let score = 0;
let highScore = 0;
let gameState = "start"; // "start" | "playing" | "gameover"
let debugOn = false;
let paused = false;
let jumpCount = 0; // how many times we've bounced this run
let startTime = 0; // millis() when the run started, used to show survival time
let finalTime = 0; // survival time, frozen the moment the run ends

// a single dust puff
class Dust {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = random(-1.5, 1.5);
        this.vy = random(-2, -0.5);
        this.size = random(6, 12);
        this.life = 255; // acts as alpha, counts down to 0
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.05; // slight drift so it settles instead of flying forever
        this.life -= 14;
    }

    draw() {
        noStroke();
        fill(210, 210, 210, this.life);
        circle(this.x, this.y, this.size);
    }

    isDead() {
        return this.life <= 0;
    }
}

function spawnDust(x, y, count) {
    for (let i = 0; i < count; i++) {
        dustParticles.push(new Dust(x, y));
    }
}

// player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 42;
        this.h = 42;
        this.speed = 5;

        this.vy = 0;
        this.gravity = 0.6;
        this.jumpForce = -13;
        this.prevBottom = y + this.h;

        this.facingDir = 1;   // -1 left, 1 right — used so the eyes "look" where you're going
        this.squashTimer = 0; // counts down after landing, drives the squash animation
    }

    // player jump (auto-triggered on landing, not a manual key)
    jump() {
        this.vy = this.jumpForce;
        spawnDust(this.x + this.w / 2, this.y + this.h, 8); // dust kicks off the ground
        jumpCount++;
    }

    update() {
        this.prevBottom = this.y + this.h;
        this.vy += this.gravity;
        this.y += this.vy;

        if (this.squashTimer > 0) this.squashTimer--;
    }

    // player movement
    move() {
        if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
            this.x -= this.speed;
            this.facingDir = -1;
        }

        if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
            this.x += this.speed;
            this.facingDir = 1;
        }

        // go to the other side
        if (this.x > W) {
            this.x = -this.w;
        }

        if (this.x + this.w < 0) {
            this.x = W;
        }
    }

    // draw player — a little robot
    draw() {
        push();
        translate(this.x + this.w / 2, this.y + this.h / 2); // origin = robot's center

        // squash & stretch
        let scaleX = 1;
        let scaleY = 1;

        if (this.squashTimer > 0) {
            // just landed squish flat, easing back to normal over a few frames
            let t = this.squashTimer / 8;
            scaleY = 1 - t * 0.35;
            scaleX = 1 + t * 0.35;
        } else if (this.vy < -2) {
            // launching upward: stretch tall and thin
            let t = constrain(map(this.vy, -2, -13, 0, 1), 0, 1);
            scaleY = 1 + t * 0.25;
            scaleX = 1 - t * 0.15;
        }

        scale(scaleX, scaleY);
        rectMode(CENTER);

        const w = this.w;
        const h = this.h;
        const headH = h * 0.42;
        const bodyH = h - headH;
        const headY = -h / 2 + headH / 2;
        const bodyY = h / 2 - bodyH / 2;

        // antenna with a blinking light on top
        stroke(30);
        strokeWeight(2);
        line(0, headY - headH / 2, 0, headY - headH / 2 - h * 0.18);
        noStroke();
        fill(frameCount % 40 < 20 ? color(255, 90, 90) : color(255, 190, 90));
        circle(0, headY - headH / 2 - h * 0.18, w * 0.14);

        // head
        stroke(30);
        strokeWeight(2);
        fill(205, 228, 232);
        rect(0, headY, w * 0.8, headH, 6);

        // eyes — blink occasionally, look slightly toward movement direction
        const lookX = this.facingDir * 2;
        const blinking = frameCount % 150 > 144;
        noStroke();
        fill(20);
        if (blinking) {
            rect(-w * 0.16 + lookX, headY, w * 0.16, 2);
            rect(w * 0.16 + lookX, headY, w * 0.16, 2);
        } else {
            circle(-w * 0.16 + lookX, headY, w * 0.14);
            circle(w * 0.16 + lookX, headY, w * 0.14);
        }

        // torso
        stroke(30);
        strokeWeight(2);
        fill(95, 165, 205);
        rect(0, bodyY, w * 0.95, bodyH, 6);

        // chest light
        noStroke();
        fill(90, 230, 210);
        rect(0, bodyY, w * 0.3, bodyH * 0.3, 3);

        // arms, gentle idle sway
        const armSway = sin(frameCount * 0.15) * 2;
        stroke(30);
        strokeWeight(2);
        fill(95, 165, 205);
        rect(-w * 0.58, bodyY + armSway, w * 0.18, bodyH * 0.55, 4);
        rect(w * 0.58, bodyY - armSway, w * 0.18, bodyH * 0.55, 4);

        // legs
        noStroke();
        fill(75, 135, 175);
        rect(-w * 0.22, h / 2 - h * 0.06, w * 0.24, h * 0.14, 3);
        rect(w * 0.22, h / 2 - h * 0.06, w * 0.24, h * 0.14, 3);

        // thruster flames while launching upward
        if (this.vy < -1) {
            fill(255, 160, 60, 220);
            const flameH = map(-this.vy, 1, 13, 4, 18);
            triangle(-w * 0.22 - 4, h / 2, -w * 0.22 + 4, h / 2, -w * 0.22, h / 2 + flameH);
            triangle(w * 0.22 - 4, h / 2, w * 0.22 + 4, h / 2, w * 0.22, h / 2 + flameH);
        }

        pop();
    }
}

// normal platform
class Platform {
    constructor(x, y, w) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = 14;
        this.type = "normal";
    }

    update() {}

    // breaking platforms override this to stop counting as landable once broken
    isLandable() {
        return true;
    }

    draw() {
        noStroke();
        fill(80, 255, 170);
        rect(this.x, this.y, this.w, this.h);
    }
}

// moving platform — slides left/right, bounces off the screen edges
class MovingPlatform extends Platform {
    constructor(x, y, w) {
        super(x, y, w);
        this.type = "moving";
        this.speed = random(1, 2.5) * (random() < 0.5 ? -1 : 1);
    }

    update() {
        this.x += this.speed;

        if (this.x < 0 || this.x + this.w > W) {
            this.speed *= -1;
        }

        this.x = constrain(this.x, 0, W - this.w);
    }

    draw() {
        noStroke();
        fill(90, 170, 255);
        rect(this.x, this.y, this.w, this.h);
    }
}

// breaking platform — crumbles and fades out once you land on it
class BreakingPlatform extends Platform {
    constructor(x, y, w) {
        super(x, y, w);
        this.type = "breaking";
        this.broken = false;
        this.breakTimer = 0;
    }

    update() {
        if (this.broken) {
            this.breakTimer++;
        }
    }

    isLandable() {
        return !this.broken;
    }

    draw() {
        noStroke();

        if (!this.broken) {
            fill(255, 120, 90);
            rect(this.x, this.y, this.w, this.h);

            stroke(190, 70, 50);
            strokeWeight(1.5);
            line(this.x + this.w * 0.3, this.y + 2, this.x + this.w * 0.38, this.y + this.h - 2);
            line(this.x + this.w * 0.65, this.y + 2, this.x + this.w * 0.57, this.y + this.h - 2);
            noStroke();
        } else {
            fill(255, 120, 90, max(0, 255 - this.breakTimer * 15));
            rect(this.x, this.y + this.breakTimer * 2, this.w / 2 - 2, this.h);
            rect(this.x + this.w / 2 + 2, this.y + this.breakTimer * 3, this.w / 2 - 2, this.h);
        }
    }
}

// choose random platform type
function randomPlatform(x, y, w) {
    let r = random();

    if (r < 0.15) return new BreakingPlatform(x, y, w);
    if (r < 0.40) return new MovingPlatform(x, y, w);

    return new Platform(x, y, w);
}

// check for a landing and auto-bounce the player
function checkPlatforms() {
    if (player.vy < 0) return; // only check while falling

    let bottom = player.y + player.h;

    for (let p of platforms) {
        if (!p.isLandable()) continue;

        let landing = player.prevBottom <= p.y + 2 && bottom >= p.y;
        let overlapX = player.x + player.w > p.x + 6 && player.x < p.x + p.w - 6;

        if (landing && overlapX) {
            player.y = p.y - player.h;
            player.jump();
            player.squashTimer = 8;

            if (p instanceof BreakingPlatform) {
                p.broken = true;
            }

            break; // only one landing per frame
        }
    }
}

// camera follows the player upwards only
function updateCam() {
    let limit = camY + H * 0.4;

    if (player.y < limit) {
        camY = player.y - H * 0.4;
    }
}

// keep generating platforms above the camera
function platformGenerator() {
    while (maxY > camY - 100) {
        maxY -= random(70, 110);
        let w = random(70, 110);
        platforms.push(randomPlatform(random(0, W - w), maxY, w));
    }
}

// remove platforms that are below the screen, or fully faded breaking ones
function removePlatforms() {
    platforms = platforms.filter(p => p.y < camY + H + 50 && !(p.broken && p.breakTimer > 18));
}

// start or restart game
function resetGame() {
    player = new Player(W / 2, H - 100);
    platforms = [];
    dustParticles = [];
    camY = 0;
    score = 0;
    jumpCount = 0;
    startTime = millis();

    // ground, full width
    platforms.push(new Platform(0, H - 40, W));
    maxY = H - 40;

    platformGenerator();
}

function startGame() {
    resetGame();
    gameState = "playing";
}

// draw score
function drawScore() {
    textFont("Courier New");
    fill(...WHITE);
    textSize(18);

    textAlign(LEFT, TOP);
    text("SCORE " + score, 12, 12);

    textAlign(RIGHT, TOP);
    fill(...GREEN);
    text("BEST " + highScore, W - 12, 12);
}

// start screen
function drawStartScreen() {
    textFont("Courier New");

    fill(...GREEN);
    textAlign(CENTER, CENTER);
    textSize(32);
    text("> DOODLE_JUMP", W / 2, H / 2 - 110);

    fill(...WHITE);
    textSize(14);
    text("ARROW KEYS or A / D to move", W / 2, H / 2 - 40);
    text("Land on platforms. Don't fall!", W / 2, H / 2 - 16);

    noFill();
    stroke(...GREEN);
    strokeWeight(2);
    rect(W / 2 - 80, H / 2 + 20, 160, 44, 3);

    noStroke();
    fill(...GREEN);
    textSize(16);
    text("[ SPACE ] RUN", W / 2, H / 2 + 42);

    if (highScore > 0) {
        fill(...WHITE);
        textSize(13);
        text("BEST: " + highScore, W / 2, H / 2 + 95);
    }
}

// game over screen
function drawGameOver() {
    textFont("Courier New");

    fill(255, 100, 80);
    textAlign(CENTER, CENTER);
    textSize(30);
    text("> GAME OVER", W / 2, H / 2 - 80);

    fill(...WHITE);
    textSize(18);
    text("SCORE: " + score, W / 2, H / 2 - 30);

    fill(...GREEN);
    textSize(16);
    text("BEST: " + highScore, W / 2, H / 2 + 5);

    fill(...WHITE);
    textSize(13);
    text("Jumps: " + jumpCount + "   Time: " + finalTime + "s", W / 2, H / 2 + 35);

    fill(...GREEN);
    textSize(16);
    text("[ R ] RESTART", W / 2, H / 2 + 65);
}

// paused overlay
function drawPausedOverlay() {
    noStroke();
    fill(8, 9, 11, 180);
    rect(0, 0, W, H);

    textFont("Courier New");
    textAlign(CENTER, CENTER);
    fill(...GREEN);
    textSize(26);
    text("PAUSED", W / 2, H / 2 - 10);

    fill(...WHITE);
    textSize(14);
    text("[ P ] RESUME", W / 2, H / 2 + 24);
    text("[ Q ] QUIT TO MENU", W / 2, H / 2 + 48);
}

// debug overlay
function drawDebugOverlay() {
    textFont("Courier New");
    textAlign(LEFT, TOP);
    textSize(11);
    fill(...GREEN);

    text("fps: " + Math.round(frameRate()), 12, H - 70);
    text("platforms: " + platforms.length, 12, H - 56);
    text("camY: " + Math.round(camY), 12, H - 42);
    text("vy: " + player.vy.toFixed(2), 12, H - 28);
}

// initialize the game
function setup() {
    createCanvas(W, H);
    highScore = Number(localStorage.getItem("doodleHighScore")) || 0;
    resetGame();
}

// main loop
function draw() {
    background(10, 12, 14);

    if (gameState === "start") {
        drawStartScreen();
        return;
    }

    if (gameState === "gameover") {
        drawScore();
        drawGameOver();
        return;
    }

    // gameState === "playing" from here on
    if (!paused) {
        player.move();
        player.update();
        checkPlatforms();
        updateCam();

        for (let p of platforms) {
            p.update();
        }

        platformGenerator();
        removePlatforms();

        for (let d of dustParticles) {
            d.update();
        }
        dustParticles = dustParticles.filter(d => !d.isDead());

        score = floor(-camY / 10);

        if (score > highScore) {
            highScore = score;
            localStorage.setItem("doodleHighScore", highScore);
        }

        if (player.y > camY + H) {
            gameState = "gameover";
            finalTime = floor((millis() - startTime) / 1000); // freeze it here, not every frame on the game-over screen
        }
    }

    // everything inside push/pop is drawn relative to the camera
    push();
    translate(0, -camY);

    for (let p of platforms) {
        p.draw();
    }

    for (let d of dustParticles) {
        d.draw();
    }

    player.draw();

    pop();

    drawScore();
    if (debugOn) drawDebugOverlay();
    if (paused) drawPausedOverlay();
}

// keyboard controls
function keyPressed() {
    if (key === "`") {
        debugOn = !debugOn;
    }

    if (gameState === "playing" && (key === "p" || key === "P")) {
        paused = !paused;
    }

    if (paused && (key === "q" || key === "Q")) {
        paused = false;
        gameState = "start";
    }

    if (gameState === "start" && key === " ") {
        startGame();
    }

    else if (gameState === "gameover" && (key === "r" || key === "R")) {
        startGame();
    }
}

// click to start
function mousePressed() {
    if (gameState === "start" || gameState === "gameover") {
        startGame();
    }
}
