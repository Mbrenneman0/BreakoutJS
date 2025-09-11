console.log("script is loading");

////////////////////////////////
////// Global Variables ////////
////////////////////////////////

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let timestamp = 0, lastTimestamp = 0;

let leftPressed = false, rightPressed = false, spaceBarPressed = false;

const Directions = {
    NORTH: 270,
    EAST: 0,
    SOUTH: 90,
    WEST: 180,
    NORTHEAST: 315,
    SOUTHEAST: 45,
    SOUTHWEST: 135,
    NORTHWEST: 225,
}



////////////////////////////////
/////////// Classes ////////////
////////////////////////////////

class Ball
{
    constructor(radius = 5, x = 0, y = 0, direction = 45, velocity = 1, isCaught = true)
    {
        this.radius = radius;
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.velocity = velocity;
        this.isCaught = isCaught;
    }

    resetBall(paddle){
        this.x = paddle.x;
        this.y = paddle.y-5-paddle.height/2
        this.isCaught = true;
        this.direction = Directions.SOUTH;
    }
    drawBall()
    {
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    moveBall(time)
    {
        // New X = Starting X + Distance * cos(Angle in Radians)  
        // New Y = Starting Y + Distance * sin(Angle in Radians)

        let distance = this.velocity*time;
        
        this.x = this.x + distance * Math.cos(radians(this.direction));
        this.y = this.y + distance * Math.sin(radians(this.direction));

    }

    bounce(collisionAngle, overlap)
    {
        // push the ball out of the bounding box at the inverse of the collision angle
        
        this.x = this.x + overlap * Math.cos(radians(translateAngle(collisionAngle,180)));
        this.y = this.y + overlap * Math.sin(radians(translateAngle(collisionAngle,180)));

        //mirror angles:
        let collisionAxis = translateAngle(collisionAngle, -90) //gets the perpendicular axis
        let newDirection = translateAngle(this.direction, (collisionAxis -this.direction)*2);

        this.direction = newDirection;
    }
    
}

class Paddle
{
    constructor(width, height, x, y)
    {
        this.width = width;
        this.height = height;

        //x and y coordinate should be center of object
        this.x = x;
        this.y = y;
        this.updateBounds();
        this.velocity = 300;
    }

    drawPaddle()
    {
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.fillRect(this.left, this.top, this.width, this.height);
        ctx.fill();
    }

    movePaddle(time)
    {
        if(leftPressed)
        {
            this.x = this.x - this.velocity*time;
            this.updateBounds();
        }
        if(rightPressed)
        {
            this.x = this.x + this.velocity*time;
            this.updateBounds();
        }
    }
    
    collision(direction)
    {
        if(direction === Directions.WEST)
        {
            this.x = this.width/2;
            this.updateBounds();
        }
        else if(direction === Directions.EAST)
        {
            this.x = canvas.width-this.width/2;
            this.updateBounds();
        }
    }

    updateBounds()
    {
        this.left = this.x - this.width/2;
        this.top = this.y - this.height/2;
        this.right = this.x + this.width/2;
        this.bottom = this.y + this.height/2;
    }
}

class Block
{
    constructor(width, height, x, y, health)
    {
        this.width = width
        this.height = height;
        this.x = x;
        this.y = y;
        this.health = health;
        this.updateBounds();
    }

    drawBlock()
    {
        if(this.health === 1)
        {
            ctx.fillStyle = '#0000ff';
        }
        else if(this.health === 2)
        {
            ctx.fillStyle = '#00ff00';
        }
        else if(this.health === 3)
        {
            ctx.fillStyle = '#ffff00';
        }
        else if(this.health === 4)
        {
            ctx.fillStyle = '#ffaa00';
        }
        else
        {
            ctx.fillStyle = '#ff0000';
        }
        ctx.beginPath();
        ctx.fillRect(this.left, this.top, this.width, this.height);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.left, this.top, this.width, this.height);
    }

    updateBounds()
    {
        this.left = this.x - this.width/2;
        this.top = this.y - this.height/2;
        this.right = this.x + this.width/2;
        this.bottom = this.y + this.height/2;
    }
}


////////////////////////////////
//// Object Declerations ///////
////////////////////////////////

const paddle = new Paddle(60, 5, canvas.width/2, canvas.height-10);
const ball = new Ball(5, paddle.x, paddle.y-5-paddle.height/2, Directions.SOUTH, 200);
let blockArray = new Array();
for(let x = 0; x < 8; x++)
{
    for(let y = 0; y < 6; y++)
    {
        blockArray.push(new Block(canvas.width/8, 10, canvas.width/16 + (canvas.width/8)*x, 5 + 10*y, Math.ceil((6-y)/2+2)));
    }
}
addEventListener("keydown", keyDownHandler, false);
addEventListener("keyup", keyUpHandler, false);

////////////////////////////////
/////// Initialization /////////
////////////////////////////////

if(!ctx)
{
    console.log("Unable to initialize CanvasRenderContex2d.\nCheck browser support.");
}

ctx.fillStyle = '#FFFFFF';
ctx.fillRect(0,0, canvas.width, canvas.height);


gameLoop(0) // start game loop


////////////////////////////////
////////// Main Loop ///////////
////////////////////////////////


function gameLoop(timestamp)
{
    /*
    This function contains the main logic of the game is calledback when the browser is ready to render another frame
    */
   
    //first few frames, timestamp is NaN, this cycles requestAnimationFrame a few times until it returns a number.
    if(isNaN(timestamp))
    {
        console.log("NaN timestamp");
        requestAnimationFrame(gameLoop);
    }


    //Calculate time difference
    const deltaTime = Number(seconds(timestamp - lastTimestamp));
    lastTimestamp = timestamp;

    updateGameState(deltaTime);
    drawframe();
    requestAnimationFrame(gameLoop); //loops the game logic each frame
}



////////////////////////////////
/////// Core Functions /////////
////////////////////////////////



function drawframe()
{
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0,0, canvas.width, canvas.height);
    
    ball.drawBall();
    paddle.drawPaddle();
    for(let iter = 0; iter < blockArray.length; iter++)
    {
        blockArray[iter].drawBlock();
    }
}

function updateGameState(time)
{
    if(ball.isCaught === false)
    {
        ball.moveBall(time);
    }
    else
    {
        lastPosition = paddle.x;
    }
    paddle.movePaddle(time);
    if(ball.isCaught === true)
    {
        ball.x += paddle.x - lastPosition;
    }
    collisionDetection();

    //check health of each block after collisions
    for(let iter = 0; iter < blockArray.length; iter++)
    {
        if(blockArray[iter].health <= 0)
        {
            blockArray.splice(iter,1) //removes the object at index iter
        }
    }
}

function collisionDetection()
{
    let overlap = 0; // used to store how far into another object an object has colided

    //check paddle collision with canvas bounds

    if(paddle.left < 0)
    {
        paddle.collision(Directions.WEST);
    }
    else if(paddle.right > canvas.width)
    {
        paddle.collision(Directions.EAST);
    }

    // check ball collision with paddle

    let closestX = clamp(ball.x, paddle.left, paddle.right);
    let closestY = clamp(ball.y, paddle.top, paddle.bottom);

    if(getDistance(ball.x, ball.y, closestX, closestY) < ball.radius)
    {
        if(!ball.isCaught)
        {
            if(spaceBarPressed)
            {
                ball.isCaught = true;
            }
            else
            {
                let impactAngle = getAngle(ball.x,ball.y,closestX,closestY)
                ball.bounce(impactAngle, ball.radius-getDistance(ball.x,ball.y,closestX,closestY));
                
                // paddle aiming:
                // generate a direction based on the point of impact on the paddle, and combine that with the direction of the ball as a weighted average of the two directions
                // this allows the player to aim the ball more effectively

                if(impactAngle === Directions.SOUTH) //only if the ball hits the top of the paddle
                {
                    let impactPosition = (closestX - paddle.x)/(paddle.width/2); //gets the position of impact on the paddle as a percentage. -100% = left, 0% = center, 100% = right
                    let aimAngle = Directions.NORTH + 45*impactPosition;

                    ball.direction = (ball.direction + aimAngle*0.5)/1.5;
                }


            }
        }
    }

    //check collision with blocks

    for(let iter = 0; iter < blockArray.length; iter++)
    {
        let closestX = clamp(ball.x, blockArray[iter].left, blockArray[iter].right);
        let closestY = clamp(ball.y, blockArray[iter].top, blockArray[iter].bottom);

        if(getDistance(ball.x, ball.y, closestX, closestY) < ball.radius)
        {
            ball.bounce(getAngle(ball.x,ball.y,closestX,closestY), ball.radius-getDistance(ball.x,ball.y,closestX,closestY));
            blockArray[iter].health -= 1;
        }
    }

    //check ball collision with canvas bounds

    if(ball.y-ball.radius < 0) //top bound
    {
        overlap = Math.abs(ball.y-ball.radius);
        ball.bounce(Directions.NORTH, overlap);
    }
    if(ball.x-ball.radius < 0) //left bound
    {
        overlap = Math.abs(ball.x-ball.radius);
        ball.bounce(Directions.WEST, overlap);
    }
    if(ball.x+ball.radius > canvas.width) //right bound
    {
        overlap = Math.abs((ball.x+ball.radius)-canvas.width);
        ball.bounce(Directions.EAST, overlap);
    }
    if(ball.y-ball.radius > canvas.height) //bottom bound
    {
        ball.resetBall(paddle);
    }
    
}


////////////////////////////////
/////// Helper Functions ///////
////////////////////////////////



function seconds(milliseconds)
{
    //milliseconds to seconds
    return milliseconds/1000;
}

function radians(degrees)
{
    //degrees to radians
    return degrees * (Math.PI / 180);
}

function degrees(radians)
{
    return radians * (180 / Math.PI);
}

function translateAngle(originDegrees, translateBy)
{
    
    //return the degrees plus the angle to translate by, ensuring it is not greater than 360 or less than 0
    let newAngle = originDegrees + translateBy;
    while(newAngle > 360)
    {
        newAngle -= 360;
    }
    while(newAngle < 0)
    {
        newAngle += 360;
    }
    return newAngle;
}

function clamp(num, min, max)
{
    return Math.min(Math.max(num,min), max);
}

function getDistance(x1,y1,x2,y2)
{
    return Math.sqrt(Math.pow(x1-x2,2) + Math.pow(y1-y2,2));
}

function getAngle(x1, y1, x2, y2)
{
    return (degrees(Math.atan2(y2-y1, x2-x1)));
}

function keyDownHandler(event)
{
    if(event.code === "ArrowLeft")
    {
        leftPressed = true;
        console.log('left down');
    }
    if(event.code === "ArrowRight")
    {
        rightPressed = true;
        console.log('right down');
    }
    if(event.code === "Space")
    {
        spaceBarPressed = true;
        console.log('space down');
    }
}

function keyUpHandler(event)
{
    if(event.code === "ArrowLeft")
    {
        leftPressed = false;
        console.log('left up');
    }
    if(event.code === "ArrowRight")
    {
        rightPressed = false;
        console.log('right up');
    }
    if(event.code === "Space")
    {
        spaceBarPressed = false;
        console.log('space up');
        if(ball.isCaught)
        {
            ball.isCaught = false;
        }
    }
}