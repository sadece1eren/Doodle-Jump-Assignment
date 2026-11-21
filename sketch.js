// Doodle Jump
// main game file

// canvas stuff
const W = 400;
const H = 600;

// game variables
let player;
let platforms = [];
let dustParticles = []; // little puffs that appear when the robot jumps/lands
let camY = 0;
let maxY;

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
        this.onGround = false;
        this.prevBottom = y + this.h;

        this.facingDir = 1;   // -1 left, 1 right — used so the eyes "look" where you're going
        this.squashTimer = 0; // counts down after landing, drives the squash animation
        this.wasOnGround = false; // lets us detect the exact frame we touch down
    }

    update() {
        this.wasOnGround = this.onGround; // remember before we reset it below
        this.prevBottom = this.y + this.h;
        this.vy += this.gravity;
        this.y += this.vy;
        this.onGround = false;

        if (this.squashTimer > 0) this.squashTimer--;
    }

    jump() {
        if (this.onGround) {
            this.vy = this.jumpForce;
            this.onGround = false;
            spawnDust(this.x + this.w / 2, this.y + this.h, 8); // dust kicks off the ground
        }
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

        if (keyIsDown(UP_ARROW) || keyIsDown(87) || keyIsDown(32)) {
            player.jump();
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

class Platforms {
    constructor(x, y, w) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = 14;
    }

    draw() {
        fill(80, 255, 170);
        rect(this.x, this.y, this.w, this.h);
    }
}

function checkPlatforms() {
    if (player.vy < 0) return;

    for (let p of platforms) {
        let bottom = player.y + player.h;

        let landing = player.prevBottom <= p.y && bottom >= p.y;
        let overlapX = player.x + player.w > p.x && player.x < p.x + p.w;

        if (landing && overlapX) {
            player.y = p.y - player.h;
            player.vy = 0;

            if (!player.wasOnGround) {
                // the exact frame we touch down — trigger squash + a small dust puff
                player.squashTimer = 8;
                spawnDust(player.x + player.w / 2, player.y + player.h, 5);
            }

            player.onGround = true;
        }
    }
}

function updateCam() {
    //camera follows the player upwards only
    let limit = camY + H * 0.4;
    if (player.y < limit) {
        camY = player.y - H * 0.4;
    }
}

function platformGenerator() {
    while (maxY > camY - 100) {
        maxY -= random(70, 110);
        let w = random(70, 110);
        platforms.push(new Platforms(random(0, W - w), maxY, w));
    }
}

function removePlatforms() {
    //remove platforms that are below the screen
    platforms = platforms.filter(p => p.y < camY + H + 50);
}

function resetGame() {
    //start or restart game
    player = new Player(W / 2, H - 100);
    platforms = [];
    dustParticles = [];
    camY = 0;

    //ground full width
    platforms.push(new Platforms(0, H - 40, W));
    maxY = H - 40;

    platformGenerator();
}

// intialize the game
function setup() {
    createCanvas(W, H);
    resetGame();
}

// main loop
function draw() {
    background(10, 12, 14);

    player.move();
    player.update();
    checkPlatforms();
    updateCam();
    platformGenerator();
    removePlatforms();

    if (player.y > camY + H) {
        //player fell below the screen -> restart
        resetGame();
    }

    //everything inside push/pop is drawn relative to the camera
    push();
    translate(0, -camY);

    for (let p of platforms) {
        p.draw();
    }

    for (let d of dustParticles) {
        d.update();
        d.draw();
    }
    dustParticles = dustParticles.filter(d => !d.isDead());

    player.draw();

    pop();
}
