/***********
 * CLASSES *
 ***********/

/*
 * Sprite (position: {x: Number, y: Number}, image: Image)
 * This class is used for all sprites.
 */
class Sprite {
  constructor({ position, image, numFrames, sprites }) {
    this.position = position;
    this.image = image;
    this.numFrames = numFrames;
    this.sprites = sprites;
    this.activeFrame = 0;
    this.width = this.image.width / this.numFrames;
  }

  draw() {
    const cropStartX = this.activeFrame * this.width;
    ctx.drawImage(
      this.image,
      cropStartX, // Crop x start
      0, // Crop y start
      this.width, // Crop width
      this.image.height, // Crop height
      this.position.x, // Position x
      this.position.y, // Position y
      this.width, // width
      this.image.height // height
    );
  }

  // Private function to advance the frame
  #advanceFrameAction() {
    if (this.activeFrame === (this.numFrames - 1)) {
      this.activeFrame = 0;
    } else {
      this.activeFrame += 1;
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
