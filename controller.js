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
  position: { x: mapOffset.x, y: mapOffset.y },
});

/*************
 * ANIMATION *
 *************/

const testBound = new Boundary({ position: { x: 600, y: 300 } });
const movables = [mapSprite, ...finalBoundaries, testBound];

function animate() {
  window.requestAnimationFrame(animate);
  // Always draw the map
  mapSprite.draw();

  // Uncomment this to see the boundaries - 
  // You will see that the map needs some redesign to allow for player
  // passthrough in areas that are a bit tight. 
  // finalBoundaries.forEach((boundary) => {
  //   boundary.draw();
  // });

  // testBound.draw();
  // Make sure the initial player sprite is loaded at
  // the beginning before any movement can happen
  if (playerDownSprite) {
    // Based on the key, adjust the position of the map to
    // create the illusion of player movement.  Since there is a
    // key pressed, we advanceFrame() to see the walk-cycle.
    if (keys.w.pressed && !boundariesPreventMovement({ direction: "up" })) {
      movables.forEach((movable) => {
        movable.position.y += 4;
      });
      playerUpSprite.draw();
      playerUpSprite.advanceFrame();
    } else if (
      keys.a.pressed &&
      !boundariesPreventMovement({ direction: "left" })
    ) {
      movables.forEach((movable) => {
        movable.position.x += 4;
      });
      playerLeftSprite.draw();
      playerLeftSprite.advanceFrame();
    } else if (
      keys.s.pressed &&
      !boundariesPreventMovement({ direction: "down" })
    ) {
      movables.forEach((movable) => {
        movable.position.y -= 4;
      });
      playerDownSprite.draw();
      playerDownSprite.advanceFrame();
    } else if (
      keys.d.pressed &&
      !boundariesPreventMovement({ direction: "right" })
    ) {
      movables.forEach((movable) => {
        movable.position.x -= 4;
      });
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

function collisionsExist({ rect1, rect2 }) {
  return (
    rect1.position.x <= rect2.position.x + Boundary.width &&
    rect1.position.x + rect1.width >= rect2.position.x &&
    rect1.position.y <= rect2.position.y + Boundary.height &&
    rect1.position.y + rect1.height >= rect2.position.y
  );
}

function boundariesPreventMovement({ direction }) {
  let result = false;

  for (let i = 0; i < finalBoundaries.length; i++) {
    let bound;
    let player;
    switch (direction) {
      case "up":
        bound = {
          ...finalBoundaries[i],
          position: {
            x: finalBoundaries[i].position.x,
            y: finalBoundaries[i].position.y + 4,
          },
        };
        player = playerUpSprite;
        break;
      case "left":
        bound = {
          ...finalBoundaries[i],
          position: {
            x: finalBoundaries[i].position.x + 4,
            y: finalBoundaries[i].position.y,
          },
        };
        player = playerLeftSprite;
        break;
      case "down":
        bound = {
          ...finalBoundaries[i],
          position: {
            x: finalBoundaries[i].position.x,
            y: finalBoundaries[i].position.y - 4,
          },
        };
        player = playerDownSprite;
        break;
      case "right":
        bound = {
          ...finalBoundaries[i],
          position: {
            x: finalBoundaries[i].position.x - 4,
            y: finalBoundaries[i].position.y,
          },
        };
        player = playerRightSprite;
        break;
    }

    if (collisionsExist({ rect1: player, rect2: bound })) {
      result = true;
      break;
    }
  }

  return result;
}
