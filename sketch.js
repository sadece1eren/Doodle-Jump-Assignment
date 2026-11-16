// Doodle Jump
// main game file

// canvas stuff
const W = 400;
const H = 600;

// game variables
let player;
let platforms = [];
let camY = 0;
let maxY;

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
    }

    update(){
        this.prevBottom = this.y + this.h;
        this.vy += this.gravity;
        this.y += this.vy;
        this.onGround = false;
    }

    jump(){
        if(this.onGround){
            this.vy = this.jumpForce;
            this.onGround = false;
        }
    }

    // player movement
    move() {
        if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
            this.x -= this.speed;
        }

        if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
            this.x += this.speed;
        }

        if (keyIsDown(UP_ARROW) || keyIsDown(87) || keyIsDown(32)){
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

    // draw player
    draw() {
        fill(90, 240, 160);
        rect(this.x, this.y, this.w, this.h);
    }
}

class Platforms{
    constructor(x, y, w){
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = 14;
    }

    draw(){
        fill(80, 255, 170);
        rect(this.x, this.y, this.w, this.h);
    }
}

function checkPlatforms(){
    if(player.vy < 0) return;

    for(let p of platforms){
        let bottom = player.y + player.h;

        let landing = player.prevBottom <= p.y && bottom >= p.y;
        let overlapX = player.x + player.w > p.x && player.x < p.x + p.w;

        if (landing && overlapX) {
            player.y = p.y - player.h;
            player.vy = 0;
            player.onGround = true;
        }
    }
}

function updateCam(){
    //camera follows the player upwards only
    let limit = camY + H * 0.4;
    if(player.y < limit){
        camY = player.y - H * 0.4;
    }
}

function platformGenerator(){
    while(maxY > camY -100){
        maxY -= random(70, 110);
        let w = random(70, 110);
        platforms.push(new Platforms(random(0, W - w), maxY, w));
    }
}

function removePlatforms() {
    //remove platforms that are below the screen
    platforms = platforms.filter(p => p.y < camY + H + 50);
}

function resetGame(){
    //start or restart game
    player = new Player(W / 2, H-100);
    platforms = [];
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

    if(player.y > camY + H){
        //player fell below the screen -> restart
        resetGame();
    }

    //everything inside push/pop is drawn relative to the camera
    push();
    translate(0, -camY);

    for(let p of platforms) {
        p.draw();
    }
    player.draw();

    pop();
}
