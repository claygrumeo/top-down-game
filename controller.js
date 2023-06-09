/***********
 * CLASSES *
 ***********/

/*
 * Sprite (position: {x: Number, y: Number}, image: Image)
 * This class is used for the map. Takes a position object with
 * an x and y coordinate and an Image.
 */
class Sprite {
  constructor({ position, image }) {
    this.position = position;
    this.image = image;
  }

  draw() {
    ctx.drawImage(this.image, this.position.x, this.position.y);
  }
}

/*
 * PlayerSprite (image: Image)
 * This class is used for the character. It doesn't take a position, as
 * we always want the character in the same spot (near the center of the canvas).
 */
class PlayerSprite {
  constructor({ image }) {
    this.frame = 0;
    this.canStep = true;
    this.image = image;
    this.position = {
      x: canvas.width / 2 - this.image.width / 4 / 2,
      y: canvas.height / 2,
    };
  }

  // Draw the character on the canvas properly cropped by which
  // frame it's currently on in the walk-cycle.
  draw() {
    const sliceWidth = this.image.width / 4;
    const cropStartX = this.frame * sliceWidth;
    ctx.drawImage(
      this.image,
      cropStartX, // Crop x start
      0, // Crop y start
      sliceWidth, // Crop width
      this.image.height, // Crop height
      this.position.x, // Position x
      this.position.y, // Position y
      sliceWidth, // width
      this.image.height // height
    );
  }

  // Private function to advance the frame
  #advanceFrameAction() {
    if (this.frame === 3) {
      this.frame = 0;
    } else {
      this.frame += 1;
    }
  }

  // This is a throttled version of #advanceFrameAction that
  // can only be called once every 100 ms so that the walk cycle 
  // looks properly timed.
  throttledAdvance = throttle(this.#advanceFrameAction, 100);

  // Exposing the throttled function with a nicer name
  advanceFrame() {
    this.throttledAdvance();
  }

  // Reset the frame to 0 which we do when the player stops
  // moving so that there is no walk-cycle animation.
  resetFrame() {
    this.frame = 0;
  }
}

/**********
 * CANVAS *
 **********/

// Initialize the canvas with size, get context, and 
// fill it with black to start.
const canvas = document.getElementById("gameWindow");
canvas.width = 1024;
canvas.height = 576;
const ctx = canvas.getContext("2d");
ctx.fillStyle = "black";
ctx.fillRect(0, 0, canvas.width, canvas.height);

/*******
 * I/O *
 *******/

// This object keeps track of which keys are pressed.
// It is referenced in the animation loop to determine how
// to draw the character.
const keys = {
  w: {
    pressed: false,
  },
  a: {
    pressed: false,
  },
  s: {
    pressed: false,
  },
  d: {
    pressed: false,
  },
};

// We track the last key to produce proper behavior when the user
// presses a second key.  Also so we know which character sprite to 
// draw when the user stops pressing directional keys.
let lastKey = "s";

// When the user presses a key, check and see if another is pressed, and 
// "un-press" it if so.  Then set the currently pressed key in the keys object.
window.addEventListener("keydown", (e) => {
  if (e.key !== lastKey) keys[lastKey].pressed = false;
  switch (e.key) {
    case "w":
      lastKey = "w";
      keys.w.pressed = true;
      break;
    case "a":
      lastKey = "a";
      keys.a.pressed = true;
      break;
    case "s":
      lastKey = "s";
      keys.s.pressed = true;
      break;
    case "d":
      lastKey = "d";
      keys.d.pressed = true;
      break;
  }
});

// On keyup, set the proper "pressed" value to false.
window.addEventListener("keyup", (e) => {
  switch (e.key) {
    case "w":
      keys.w.pressed = false;
      break;
    case "a":
      keys.a.pressed = false;
      break;
    case "s":
      keys.s.pressed = false;
      break;
    case "d":
      keys.d.pressed = false;
      break;
  }
});

/**********
 * ASSETS *
 **********/

// Downward-facing player
const playerDown = new Image();
playerDown.src = "./assets/playerDown.png";
let playerDownSprite;
playerDown.onload = () => {
  playerDownSprite = new PlayerSprite({
    image: playerDown,
  });
};

// Upward-facing player
const playerUp = new Image();
playerUp.src = "./assets/playerUp.png";
let playerUpSprite;
playerUp.onload = () => {
  playerUpSprite = new PlayerSprite({
    image: playerUp,
  });
};

// Left-facing player
const playerLeft = new Image();
playerLeft.src = "./assets/playerLeft.png";
let playerLeftSprite;
playerLeft.onload = () => {
  playerLeftSprite = new PlayerSprite({
    image: playerLeft,
  });
};

// Right-facing player
const playerRight = new Image();
playerRight.src = "./assets/playerRight.png";
let playerRightSprite;
playerRight.onload = () => {
  playerRightSprite = new PlayerSprite({
    image: playerRight,
  });
};

// Map sprite
const mainMap = new Image();
mainMap.src = "./MapCustom.png";
const mapSprite = new Sprite({
  image: mainMap,
  position: { x: -700, y: -350 },
});

/*************
 * ANIMATION *
 *************/
function animate() {
  window.requestAnimationFrame(animate);
  // Always draw the map
  mapSprite.draw();

  // Make sure the initial player sprite is loaded at
  // the beginning before any movement can happen
  if (playerDownSprite) {
    // Based on the key, adjust the position of the map to
    // create the illusion of player movement.  Since there is a 
    // key pressed, we advanceFrame() to see the walk-cycle.
    if (keys.w.pressed) {
      mapSprite.position.y += 3;
      playerUpSprite.draw();
      playerUpSprite.advanceFrame();
    } else if (keys.a.pressed) {
      mapSprite.position.x += 3;
      playerLeftSprite.draw();
      playerLeftSprite.advanceFrame();
    } else if (keys.s.pressed) {
      mapSprite.position.y -= 3;
      playerDownSprite.draw();
      playerDownSprite.advanceFrame();
    } else if (keys.d.pressed) {
      mapSprite.position.x -= 3;
      playerRightSprite.draw();
      playerRightSprite.advanceFrame();
    } else {
      // If none of the directional keys are pressed, we need to
      // show the player standing still.  Based on which key was last
      // pressed, show the player standing still in the proper direction.
      switch (lastKey) {
        case "w":
          playerUpSprite.resetFrame();
          playerUpSprite.draw();
          break;
        case "a":
          playerLeftSprite.resetFrame();
          playerLeftSprite.draw();
          break;
        case "s":
          playerDownSprite.resetFrame();
          playerDownSprite.draw();
          break;
        case "d":
          playerRightSprite.resetFrame();
          playerRightSprite.draw();
          break;
      }
    }
  }
}

animate();

/**********
 * HELPERS *
 ***********/

// This function is used to throttle another function such
// that it can't be called until after a certain delay in milliseconds.
function throttle(func, delay) {
  let canCall = true;

  return function () {
    if (canCall) {
      func.apply(this);
      canCall = false;

      setTimeout(() => {
        canCall = true;
      }, delay);
    }
  };
}
