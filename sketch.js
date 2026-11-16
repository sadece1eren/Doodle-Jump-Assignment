// Doodle Jump
// main game file

// canvas stuff
const W = 400;
const H = 600;

// game variables
let player;
let platforms = [];

// player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 42;
        this.h = 42;
        this.speed = 4;
    }

    // player movement
    move() {
        if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
            this.x -= this.speed;
        }

        if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
            this.x += this.speed;
        }

        // go to the other side
        if (this.x > W) {
            this.x = -this.w;
        }

        if (this.x + this.w < 0) {
            this.x = W;
        }
    }

    // draw player
    draw() {
        fill(90, 240, 160);
        rect(this.x, this.y, this.w, this.h);
    }
}

// intialize the game
function setup() {
    createCanvas(W, H);

    player = new Player(W / 2, H - 100);
}

// main loop
function draw() {
    background(10, 12, 14);

    player.move();
    player.draw();
}
