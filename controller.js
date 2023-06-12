/**********
 * CANVAS *
 **********/

// Initialize the canvas with size, get context, and
// fill it with black to start.
const canvas = document.getElementById("gameWindow");
canvas.width = 1024;
canvas.height = 576;
const ctx = canvas.getContext("2d");

// Amount to offset the map so it is properly centered.
// This is also used when calculating boundaries' positions.
const mapOffset = {
  x: -700,
  y: -350,
};

// Organize boundaries data into a 2D grid representing each
// tile from the map
const boundariesMap = [];
for (let i = 0; i < boundaries.length; i += 70) {
  boundariesMap.push(boundaries.slice(i, i + 70));
}

const finalBoundaries = [];
// Create a map of Boundary class items used to determine when
// the player hits a boundary
boundariesMap.forEach((row, i) => {
  row.forEach((symbol, j) => {
    if (symbol === 1025) {
      finalBoundaries.push(
        new Boundary({
          position: {
            x: j * Boundary.width + mapOffset.x,
            y: i * Boundary.height + mapOffset.y,
          },
        })
      );
    }
  });
});

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

// Container for all sprites
const allSprites = [];

// Downward-facing player
const playerDownSprite = new Image();
playerDownSprite.src = "./assets/playerDown.png";
// Upward-facing player
const playerUpSprite = new Image();
playerUpSprite.src = "./assets/playerUp.png";
// Left-facing player
const playerLeftSprite = new Image();
playerLeftSprite.src = "./assets/playerLeft.png";
// Right-facing player
const playerRightSprite = new Image();
playerRightSprite.src = "./assets/playerRight.png";
// Map sprite
const mainMapSprite = new Image();
mainMapSprite.src = "./MapCustom.png";

// Add all sprites to list
allSprites.push(
  playerDownSprite,
  playerUpSprite,
  playerLeftSprite,
  playerRightSprite,
  mainMapSprite
);

// Load images and
let imagesLoaded = 0;
allSprites.forEach((sprite) => {
  sprite.onload = () => {
    imagesLoaded++;

    if (imagesLoaded === allSprites.length) {
      /***********
       * SPRITES *
       ***********/

      const mapSprite = new Sprite({
        image: mainMapSprite,
        position: { x: mapOffset.x, y: mapOffset.y },
        numFrames: 1,
        sprites: {},
      });

      const playerSprite = new Sprite({
        image: playerDownSprite,
        position: {
          x: canvas.width / 2 - playerDownSprite.width / 4 / 2,
          y: canvas.height / 2,
        },
        numFrames: 4,
        sprites: {
          up: playerUpSprite,
          down: playerDownSprite,
          left: playerLeftSprite,
          right: playerRightSprite,
        },
      });

      /*************
       * ANIMATION *
       *************/

      const movables = [mapSprite, ...finalBoundaries];

      function animate() {
        window.requestAnimationFrame(animate);
        // Always draw the map
        if (mapSprite) mapSprite.draw();

        // Uncomment this to see the boundaries -
        // You will see that the map needs some redesign to allow for player
        // passthrough in areas that are a bit tight.
        // finalBoundaries.forEach((boundary) => {
        //   boundary.draw();
        // });

        // Make sure the initial player sprite is loaded at
        // the beginning before any movement can happen
        if (playerDownSprite) {
          // Based on the key, adjust the position of the map to
          // create the illusion of player movement.  Since there is a
          // key pressed, we advanceFrame() to see the walk-cycle.
          if (
            keys.w.pressed &&
            !boundariesPreventMovement({
              movable: playerSprite,
              direction: "up",
            })
          ) {
            movables.forEach((movable) => {
              movable.position.y += 4;
            });
            playerSprite.image = playerSprite.sprites.up;
            playerSprite.draw();
            playerSprite.advanceFrame();
          } else if (
            keys.a.pressed &&
            !boundariesPreventMovement({
              movable: playerSprite,
              direction: "left",
            })
          ) {
            movables.forEach((movable) => {
              movable.position.x += 4;
            });
            playerSprite.image = playerSprite.sprites.left;
            playerSprite.draw();
            playerSprite.advanceFrame();
          } else if (
            keys.s.pressed &&
            !boundariesPreventMovement({
              movable: playerSprite,
              direction: "down",
            })
          ) {
            movables.forEach((movable) => {
              movable.position.y -= 4;
            });
            playerSprite.image = playerSprite.sprites.down;
            playerSprite.draw();
            playerSprite.advanceFrame();
          } else if (
            keys.d.pressed &&
            !boundariesPreventMovement({
              movable: playerSprite,
              direction: "right",
            })
          ) {
            movables.forEach((movable) => {
              movable.position.x -= 4;
            });
            playerSprite.image = playerSprite.sprites.right;
            playerSprite.draw();
            playerSprite.advanceFrame();
          } else {
            // If none of the directional keys are pressed, we need to
            // show the player standing still.  Based on which key was last
            // pressed, show the player standing still in the proper direction.
            switch (lastKey) {
              case "w":
                playerSprite.sprite = playerSprite.sprites.up;
                playerSprite.resetFrame();
                playerSprite.draw();
                break;
              case "a":
                playerSprite.sprite = playerSprite.sprites.left;
                playerSprite.resetFrame();
                playerSprite.draw();
                break;
              case "s":
                playerSprite.sprite = playerSprite.sprites.down;
                playerSprite.resetFrame();
                playerSprite.draw();
                break;
              case "d":
                playerSprite.sprite = playerSprite.sprites.right;
                playerSprite.resetFrame();
                playerSprite.draw();
                break;
            }
          }
        }
      }
      animate();
    }
  };
});

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

// Given two rectangles, see if they overlap
function collisionsExist({ rect1, rect2 }) {
  return (
    rect1.position.x <= rect2.position.x + Boundary.width &&
    rect1.position.x + rect1.width >= rect2.position.x &&
    rect1.position.y <= rect2.position.y + Boundary.height &&
    rect1.position.y + rect1.height >= rect2.position.y
  );
}

// Given a sprite that moves, and the direction it's about to move in,
// Create a comparison to send to collisionsExist
function boundariesPreventMovement({ movable, direction }) {
  let result = false;

  for (let i = 0; i < finalBoundaries.length; i++) {
    let bound;
    switch (direction) {
      case "up":
        bound = {
          ...finalBoundaries[i],
          position: {
            x: finalBoundaries[i].position.x,
            y: finalBoundaries[i].position.y + 4,
          },
        };
        break;
      case "left":
        bound = {
          ...finalBoundaries[i],
          position: {
            x: finalBoundaries[i].position.x + 4,
            y: finalBoundaries[i].position.y,
          },
        };
        break;
      case "down":
        bound = {
          ...finalBoundaries[i],
          position: {
            x: finalBoundaries[i].position.x,
            y: finalBoundaries[i].position.y - 4,
          },
        };
        break;
      case "right":
        bound = {
          ...finalBoundaries[i],
          position: {
            x: finalBoundaries[i].position.x - 4,
            y: finalBoundaries[i].position.y,
          },
        };
        break;
    }

    if (collisionsExist({ rect1: movable, rect2: bound })) {
      console.log("EXIST", movable, bound)
      result = true;
      break;
    }
  }

  return result;
}
