class Sprite {
  constructor({ position, image }) {
    this.position = position;
    this.image = image;
  }

  draw() {
    ctx.drawImage(this.image, this.position.x, this.position.y);
  }
}

const canvas = document.getElementById("gameWindow");
canvas.width = 1024;
canvas.height = 576;
const ctx = canvas.getContext("2d");

ctx.fillStyle = "black";
ctx.fillRect(0, 0, canvas.width, canvas.height);

const keys = {
  w: {
    pressed: false
  },
  a: {
    pressed: false
  },
  s: {
    pressed: false
  },
  d: {
    pressed: false
  },
};

const playerDown = new Image();
playerDown.src = "./assets/playerDown.png";

const mainMap = new Image();
mainMap.src = "./MapCustom.png";
const mapSprite = new Sprite({
  image: mainMap,
  position: { x: -700, y: -350 },
});

function animate() {
  window.requestAnimationFrame(animate);
  mapSprite.draw();
  ctx.drawImage(
    playerDown,
    0,
    0,
    playerDown.width / 4,
    playerDown.height,
    canvas.width / 2 - playerDown.width / 4,
    canvas.height / 2,
    playerDown.width / 4,
    playerDown.height
  );

  if (keys.w.pressed) mapSprite.position.y += 3;
  if (keys.a.pressed) mapSprite.position.x += 3;
  if (keys.s.pressed) mapSprite.position.y -= 3;
  if (keys.d.pressed) mapSprite.position.x -= 3;
}

animate();

let lastKey = "s";

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
