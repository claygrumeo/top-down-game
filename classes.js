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
    this.width = this.image.width / 4
    this.height = this.image.height
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

/*
 * Boundary (position: {x: Number, y: Number})
 * This class is used for the boundaries. Takes a position.
 */
class Boundary {
  static width = 48;
  static height = 48;

  constructor({ position }) {
    this.position = position;
  }

  draw() {
    ctx.fillStyle = "red";
    ctx.fillRect(
      this.position.x,
      this.position.y,
      Boundary.width,
      Boundary.height
    );
  }
}
