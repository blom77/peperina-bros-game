const canvas = document.getElementById("game-canvas");
const btnStart = document.getElementById("button-start");
const ctx = canvas.getContext("2d");
const GRAVITY = 1;

const audioStore = {
  backgroundMusic: loadAudio('./audio/background-music.mp3.ogg',0.2,true),
  monsterStompEffect: loadAudio('./audio/monster-stomp.ogg',0.7),
  monsterStompEffect2: loadAudio('./audio/monster-stomp.ogg',0.7),
  jumpEffect: loadAudio("./audio/jump.mp3.ogg")
}

const imageStore = {
  brownBlock: loadImage("./img/brown-wooden-block.png"),
  redBlock: loadImage("./img/red-wooden-block.png"), 
  blueBlock:  loadImage("./img/blue-wooden-block.png"), 
  floorBlock: loadImage("./img/floor-block.png"),
  player: loadImage("./img/player.png"),
  monsterKokoa: loadImage("./img/kokoa.png"),
  background: loadImage("./img/background.jpg"),
}

btnStart.addEventListener('click', () => { audioStore.backgroundMusic.play(); animate(); })
document.addEventListener('keypress', ({key}) => { if (key==="Enter") { audioStore.backgroundMusic.play(); animate(); }}) 

function rectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
  return x1 < x2 + w2 && x2 < x1 + w1 && y1 < y2 + h2 && y2 < y1 + h1;
}

function loadAudio(src, volume = 0.3
  , loop = false) {
  var audio = document.createElement("audio");
  audio.volume = volume;
  audio.loop = loop;
  audio.src = src;
  return audio;
}

function loadImage(src) {
  const img = document.createElement("img");
  img.src = src;
  return img;
}

class Platform {
  position = { x: 0, y: 0 };
  velocity = { x: 0, y: 0 };
  dimensions = { width: 50, height: 100 };
  collisions = { vertical: false, horizontal: false };
  color = "blue";
  img = null;

  constructor({
    position,
    dimensions,
    color = "blue",
    collisions = { vertical: false, horizontal: false },
  }) {
    this.position = position;
    this.dimensions = dimensions;
    this.color = color;
    this.collisions = collisions;
    switch (true) {
      case color === "blue":
        this.img = imageStore.brownBlock
        break;
      case color === "lightgreen":
        this.img = imageStore.floorBlock;
        break;
    }
  }

  update() {
    this.draw();
  }

  draw() {
    if (this.img !== null) {
      let x = 0;
      while (this.img.width > 0 && x < this.dimensions.width) {
        //only draw if the block is visible in the screen
        if (
          this.position.x + this.dimensions.width - scrollX + x > 0 &&
          this.position.x - scrollX + x < canvas.width
        ) {
          ctx.drawImage(
            this.img,
            0,
            0,
            this.img.width,
            this.img.height,
            this.position.x - scrollX + x,
            this.position.y,
            this.img.width,
            this.dimensions.height
          );
        }
        x += this.img.width;
      }
    } else if (this.color !== "blue" || this.position.y > 400) {
      ctx.fillStyle = this.color;
      ctx.fillRect(
        this.position.x - scrollX,
        this.position.y,
        this.dimensions.width,
        this.dimensions.height
      );
    } else {
      ctx.drawImage(
        imageStore.brownBlock,
        0,
        0,
        this.dimensions.width,
        50,
        this.position.x - scrollX,
        this.position.y,
        this.dimensions.width,
        this.dimensions.height
      );
    }
  }
}

class Monster {
  position = { x: 30, y: 0 };
  velocity = { x: 0, y: 0 };
  dimensions = { width: 40, height: 40 };
  color = "brown";
  isJumping = true;
  isAlive = true;
  isDying = false;
  isActivated = false;
  activationOffset = 0;
  direction = "left";

  sprites = {
    runRight: new Sprite({
      img: imageStore.monsterKokoa,
      framesCount: 4,
      position: { x: 24, y: 160 },
      offset: { x: 128, y: 0 },
      printOffset: { x: 0, y: 4 },
      dimensions: { width: 92, height: 86 },
      framesFrequency: 3,
    }),
    runLeft: new Sprite({
      img: imageStore.monsterKokoa,
      framesCount: 4,
      position: { x: 14, y: 416 },
      offset: { x: 128, y: 0 },
      printOffset: { x: 0, y: 4 },
      dimensions: { width: 92, height: 86 },
      framesFrequency: 3,
    }),
  };
  sprite = this.sprites.runLeft;

  constructor({
    position,
    dimensions,
    color = "brown",
    velocity = { x: -3, y: 0 },
    activationOffset = 0,
  }) {
    this.position = position;
    this.dimensions = dimensions;
    this.velocity = velocity;
    this.color = color;
    this.activationOffset = activationOffset;
  }

  update() {
    if (this.isDying) {
      this.draw();
    }

    if (!this.isAlive) return;

    // if monster is not activated, check if it is entering screen
    if (!this.isActivated) {
      if (this.position.x - this.activationOffset < scrollX + canvas.width) {
        this.isActivated = true;
      }
    }

    if (!this.isActivated) return;

    switch (true) {
      case this.velocity.x > 0:
        this.sprite = this.sprites.runRight;
        break;
      case this.velocity.x < 0:
        this.sprite = this.sprites.runLeft;
        break;
    }

    this.sprite.nextFrame(1);

    // check collisions with platforms from top to down
    for (let i = 0; i < platforms.length; i++) {
      const platform = platforms[i];
      if (
        this.position.y + this.dimensions.height <= platform.position.y &&
        this.position.y + this.dimensions.height + this.velocity.y >=
        platform.position.y &&
        this.position.x + this.velocity.x <
        platform.position.x + platform.dimensions.width &&
        this.position.x + this.dimensions.width + this.velocity.x >
        platform.position.x
      ) {
        this.position.y = platform.position.y - this.dimensions.height;
        this.velocity.y = 0;
        this.isJumping = false;
        break;
      }
    }

    // check collisions with platforms from bottom to top
    for (let i = 0; i < platforms.length; i++) {
      const platform = platforms[i];
      if (
        platform.collisions.vertical &&
        rectCollision(
          this.position.x,
          this.position.y + this.velocity.y,
          this.dimensions.width,
          this.dimensions.height,
          platform.position.x,
          platform.position.y,
          platform.dimensions.width,
          platform.dimensions.height
        )
      ) {
        if (this.position.y > platform.position.y) {
          this.position.y = platform.position.y + platform.dimensions.height;
          //hit platform from bottom
          //to manage here what to do with hit platforms,
          //for instance delete them with explosion animation: platforms.splice(i,1);
        }
        this.velocity.y = 0;
        break;
      }
    }

    this.position.y += this.velocity.y;
    this.velocity.y += GRAVITY;

    // check collissions with platforms horizontally
    for (let i = 0; i < platforms.length; i++) {
      const platform = platforms[i];
      if (
        platform.collisions.horizontal &&
        rectCollision(
          this.position.x + this.velocity.x,
          this.position.y,
          this.dimensions.width,
          this.dimensions.height,
          platform.position.x,
          platform.position.y,
          platform.dimensions.width,
          platform.dimensions.height
        )
      ) {
        this.velocity.x = -this.velocity.x;
        break;
      }
    }

    // check move beyond start of map
    if (this.position.x + this.velocity.x < 0) {
      this.velocity.x = -this.velocity.x;
    }

    this.position.x += this.velocity.x;

    this.draw();
  }

  draw() {
    //draw only if it is in canvas window
    if (
      this.position.x + this.dimensions.width - scrollX > 0 &&
      this.position.x - scrollX < canvas.width
    ) {
      if (this.color !== "brown") {
        ctx.fillStyle = this.color;
        ctx.fillRect(
          this.position.x - scrollX,
          this.position.y,
          this.dimensions.width,
          this.dimensions.height
        );
      } else {
        this.sprite.draw({
          position: this.position,
          dimensions: this.dimensions,
        });
      }
    }
  }

  die(cb) {
    if(audioStore.monsterStompEffect.paused) 
      audioStore.monsterStompEffect.play();
    else 
      audioStore.monsterStompEffect2.play();
    this.isAlive = false;
    this.isDying = true;
    this.position.x -= 5;
    this.dimensions.width += 10;
    this.position.y = this.position.y + this.dimensions.height - 10;
    this.dimensions.height = 10;
    setTimeout(cb, 250);
  }
}

class Sprite {
  img = null;
  framesCount = 3;
  framesCurrent = 0;
  framesRefreshFrequency = 5;
  framesRefreshCount = 0;
  position = { x: 0, y: 0 };
  offset = { x: 0, y: 0 };
  printOffset = { x: 0, y: 0 };
  dimensions = { width: 0, height: 0 };

  constructor({
    img,
    framesCount,
    position,
    offset,
    dimensions,
    framesFrequency = 5,
    printOffset = { x: 0, y: 0 }
  }) {
    this.img = img;
    this.framesCount = framesCount;
    this.position = position;
    this.offset = offset;
    this.dimensions = dimensions;
    this.framesFrequency = framesFrequency;
    this.printOffset = printOffset;
  }

  draw({ position, dimensions }) {
    ctx.drawImage(
      this.img,
      this.position.x + this.offset.x * this.framesCurrent,
      this.position.y + this.offset.y * this.framesCurrent,
      this.dimensions.width,
      this.dimensions.height,
      position.x - scrollX + this.printOffset.x,
      position.y + this.printOffset.y,
      dimensions.width,
      dimensions.height
    );
  }

  nextFrame(speedBooster) {
    this.framesRefreshCount++;
    if (this.framesRefreshCount > this.framesRefreshFrequency / speedBooster) {
      this.framesRefreshCount = 0;
      this.framesCurrent = (this.framesCurrent + 1) % this.framesCount;
    }
  }
}

class Player {
  position = { x: 100, y: 425 };
  velocity = { x: 0, y: 0 };
  dimensions = { width: 50, height: 50 };
  direction = "right";
  isJumping = true;
  isAlive = true;
  isDiying = false;
  sprites = {
    runRight: new Sprite({
      img: imageStore.player,
      framesCount: 3,
      position: { x: 15, y: 30 },
      offset: { x: 48, y: 0 },
      printOffset: { x: 0, y: 2 },
      dimensions: { width: 18, height: 18 },
    }),
    runLeft: new Sprite({
      img: imageStore.player,
      framesCount: 3,
      position: { x: 15, y: 78 },
      offset: { x: 48, y: 0 },
      printOffset: { x: 0, y: 2 },
      dimensions: { width: 18, height: 18 },
    }),
    standRight: new Sprite({
      img: imageStore.player,
      framesCount: 1,
      position: { x: 63, y: 30 },
      offset: { x: 0, y: 0 },
      printOffset: { x: 0, y: 2 },
      dimensions: { width: 18, height: 18 },
    }),
    standLeft: new Sprite({
      img: imageStore.player,
      framesCount: 1,
      position: { x: 63, y: 78 },
      offset: { x: 0, y: 0 },
      printOffset: { x: 0, y: 2 },
      dimensions: { width: 18, height: 18 },
    }),
  };
  sprite = this.sprites.standRight;

  constructor() { }

  jump() {
    this.isJumping = true;
    this.velocity.y = -22;
    audioStore.jumpEffect.play();
  }

  update() {
    if (this.isDying) {
      this.position.y += this.velocity.y;
      this.velocity.y += GRAVITY;
      this.draw();
    }

    if (!this.isAlive) return;

    switch (true) {
      case this.direction === "right" && this.velocity.x === 0:
        this.sprite = this.sprites.standRight;
        break;
      case this.direction === "right" && this.velocity.x !== 0:
        this.sprite = this.sprites.runRight;
        break;
      case this.direction === "left" && this.velocity.x === 0:
        this.sprite = this.sprites.standLeft;
        break;
      case this.direction === "left" && this.velocity.x !== 0:
        this.sprite = this.sprites.runLeft;
        break;
    }

    this.sprite.nextFrame(speedBooster);

    // check collisions with platforms from top to down
    for (let i = 0; i < platforms.length; i++) {
      const platform = platforms[i];
      if (
        this.position.y + this.dimensions.height <= platform.position.y &&
        this.position.y + this.dimensions.height + this.velocity.y >=
        platform.position.y &&
        this.position.x + this.velocity.x <
        platform.position.x + platform.dimensions.width &&
        this.position.x + this.dimensions.width + this.velocity.x >
        platform.position.x
      ) {
        this.position.y = platform.position.y - this.dimensions.height;
        this.velocity.y = 0;
        this.isJumping = false;
        break;
      }
    }

    // check collisions with platforms from bottom to top
    for (let i = 0; i < platforms.length; i++) {
      const platform = platforms[i];
      if (
        platform.collisions.vertical &&
        rectCollision(
          this.position.x,
          this.position.y + this.velocity.y,
          this.dimensions.width,
          this.dimensions.height,
          platform.position.x,
          platform.position.y,
          platform.dimensions.width,
          platform.dimensions.height
        )
      ) {
        if (this.position.y > platform.position.y) {
          this.position.y = platform.position.y + platform.dimensions.height;
          //hit platform from bottom
          //to manage here what to do with hit platforms,
          //for instance delete them with explosion animation: platforms.splice(i,1);
        }
        this.velocity.y = 0;
        break;
      }
    }

    this.position.y += this.velocity.y;
    this.velocity.y += GRAVITY;

    // check collissions with platforms horizontally
    for (let i = 0; i < platforms.length; i++) {
      const platform = platforms[i];
      if (
        platform.collisions.horizontal &&
        rectCollision(
          this.position.x + this.velocity.x,
          this.position.y,
          this.dimensions.width,
          this.dimensions.height,
          platform.position.x,
          platform.position.y,
          platform.dimensions.width,
          platform.dimensions.height
        )
      ) {
        this.velocity.x = 0;
        break;
      }
    }

    // check collissions with monsters
    for (let i = 0; i < monsters.length; i++) {
      const monster = monsters[i];
      if (
        monster.isAlive &&
        rectCollision(
          this.position.x + this.velocity.x,
          this.position.y,
          this.dimensions.width,
          this.dimensions.height,
          monster.position.x,
          monster.position.y,
          monster.dimensions.width,
          monster.dimensions.height
        )
      ) {
        if (
          this.position.y + this.dimensions.height <
          monster.position.y + monster.dimensions.height / 2 &&
          this.velocity.y > 0
        ) {
          monster.die(() => monsters.splice(i, 1));
          this.velocity.y = -10;
        } else {
          this.die(() => {
            alert("you lose!");
            location.reload(false);
          });
        }
        break;
      }
    }

    // check move beyond start of map
    if (this.position.x + this.velocity.x < 0) {
      this.velocity.x = 0;
    }

    this.position.x += this.velocity.x;

    this.draw();
  }

  draw() {
    if (this.sprite) {
      this.sprite.draw({
        position: this.position,
        dimensions: this.dimensions,
      });
    }
  }

  die(cb) {
    this.isAlive = false;
    this.isDying = true;
    this.velocity.y = -20;
    setTimeout(cb, 1000);
  }
}

const player = new Player();
const platforms = [
  new Platform({
    position: { x: 0, y: 500 },
    dimensions: { width: 2500, height: 50 },
    color: "lightgreen",
  }),
  new Platform({
    position: { x: 350, y: 300 },
    dimensions: { width: 50, height: 50 },
    collisions: { horizontal: true, vertical: true },
  }),
  new Platform({
    position: { x: 650, y: 100 },
    dimensions: { width: 50, height: 50 },
    collisions: { horizontal: true, vertical: true },
  }),
  new Platform({
    position: { x: 550, y: 300 },
    dimensions: { width: 250, height: 50 },
    collisions: { horizontal: true, vertical: true },
  }),
  new Platform({
    position: { x: 900, y: 400 },
    dimensions: { width: 80, height: 100 },
    color: "green",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 1300, y: 370 },
    dimensions: { width: 80, height: 130 },
    color: "green",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 1600, y: 350 },
    dimensions: { width: 80, height: 150 },
    color: "green",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 2000, y: 350 },
    dimensions: { width: 80, height: 150 },
    color: "green",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 2650, y: 500 },
    dimensions: { width: 15 * 50, height: 50 },
    color: "lightgreen",
  }),
  new Platform({
    position: { x: 2950, y: 300 },
    dimensions: { width: 3 * 50, height: 50 },
  }),
  new Platform({
    position: { x: 3100, y: 100 },
    dimensions: { width: 8 * 50, height: 50 },
  }),
  new Platform({
    position: { x: 2650 + 11 * 50, y: 500 },
    dimensions: { width: 3550, height: 50 },
    color: "lightgreen",
  }),
  new Platform({
    position: { x: 2650 + 20 * 50, y: 100 },
    dimensions: { width: 4 * 50, height: 50 },
  }),
  new Platform({
    position: { x: 2650 + 28 * 50, y: 300 },
    dimensions: { width: 2 * 50, height: 50 },
  }),
  new Platform({
    position: { x: 2650 + 34 * 50, y: 300 },
    dimensions: { width: 1 * 50, height: 50 },
  }),
  new Platform({
    position: { x: 2650 + 37 * 50, y: 300 },
    dimensions: { width: 1 * 50, height: 50 },
  }),
  new Platform({
    position: { x: 2650 + 37 * 50, y: 100 },
    dimensions: { width: 1 * 50, height: 50 },
  }),
  new Platform({
    position: { x: 2650 + 40 * 50, y: 300 },
    dimensions: { width: 1 * 50, height: 50 },
  }),
  new Platform({
    position: { x: 2650 + 46 * 50, y: 300 },
    dimensions: { width: 1 * 50, height: 50 },
  }),
  new Platform({
    position: { x: 2650 + 49 * 50, y: 100 },
    dimensions: { width: 3 * 50, height: 50 },
  }),
  new Platform({
    position: { x: 2650 + 56 * 50, y: 100 },
    dimensions: { width: 4 * 50, height: 50 },
  }),
  new Platform({
    position: { x: 2650 + 57 * 50, y: 100 },
    dimensions: { width: 2 * 50, height: 50 },
  }),
  new Platform({
    position: { x: 2650 + 62 * 50, y: 450 },
    dimensions: { width: 1 * 50, height: 1 * 50 },
    color: "darkred",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 2650 + 63 * 50, y: 400 },
    dimensions: { width: 1 * 50, height: 2 * 50 },
    color: "darkred",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 2650 + 64 * 50, y: 350 },
    dimensions: { width: 1 * 50, height: 3 * 50 },
    color: "darkred",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 2650 + 65 * 50, y: 300 },
    dimensions: { width: 1 * 50, height: 4 * 50 },
    color: "darkred",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 2650 + 68 * 50, y: 300 },
    dimensions: { width: 1 * 50, height: 4 * 50 },
    color: "darkred",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 2650 + 69 * 50, y: 350 },
    dimensions: { width: 1 * 50, height: 3 * 50 },
    color: "darkred",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 2650 + 70 * 50, y: 400 },
    dimensions: { width: 1 * 50, height: 2 * 50 },
    color: "darkred",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 2650 + 71 * 50, y: 450 },
    dimensions: { width: 1 * 50, height: 1 * 50 },
    color: "darkred",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 2650 + 62 * 50 + 15 * 50, y: 450 },
    dimensions: { width: 1 * 50, height: 1 * 50 },
    color: "darkred",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 2650 + 63 * 50 + 15 * 50, y: 400 },
    dimensions: { width: 1 * 50, height: 2 * 50 },
    color: "darkred",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 2650 + 64 * 50 + 15 * 50, y: 350 },
    dimensions: { width: 1 * 50, height: 3 * 50 },
    color: "darkred",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 2650 + 65 * 50 + 15 * 50, y: 300 },
    dimensions: { width: 1 * 50, height: 4 * 50 },
    color: "darkred",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 2650 + 66 * 50 + 15 * 50, y: 300 },
    dimensions: { width: 1 * 50, height: 4 * 50 },
    color: "darkred",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 2650 + 69 * 50 + 15 * 50, y: 300 },
    dimensions: { width: 1 * 50, height: 4 * 50 },
    color: "darkred",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 2650 + 70 * 50 + 15 * 50, y: 350 },
    dimensions: { width: 1 * 50, height: 3 * 50 },
    color: "darkred",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 2650 + 71 * 50 + 15 * 50, y: 400 },
    dimensions: { width: 1 * 50, height: 2 * 50 },
    color: "darkred",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 2650 + 69 * 50 + 15 * 50, y: 500 },
    dimensions: { width: 57 * 50, height: 50 },
    color: "lightgreen",
  }),
  new Platform({
    position: { x: 2650 + 72 * 50 + 15 * 50, y: 450 },
    dimensions: { width: 1 * 50, height: 1 * 50 },
    color: "darkred",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 2650 + 72 * 50 + 20 * 50, y: 400 },
    dimensions: { width: 80, height: 100 },
    color: "green",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 2650 + 72 * 50 + 25 * 50, y: 300 },
    dimensions: { width: 4 * 50, height: 50 },
    collisions: { horizontal: true, vertical: true },
  }),
  new Platform({
    position: { x: 3200 + 96 * 50 + 20, y: 400 },
    dimensions: { width: 80, height: 100 },
    color: "green",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 3200 + 98 * 50, y: 450 },
    dimensions: { width: 1 * 50, height: 1 * 50 },
    color: "darkred",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 3200 + 99 * 50, y: 400 },
    dimensions: { width: 1 * 50, height: 2 * 50 },
    color: "darkred",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 3200 + 100 * 50, y: 350 },
    dimensions: { width: 1 * 50, height: 3 * 50 },
    color: "darkred",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 3200 + 101 * 50, y: 300 },
    dimensions: { width: 1 * 50, height: 4 * 50 },
    color: "darkred",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 3200 + 102 * 50, y: 250 },
    dimensions: { width: 1 * 50, height: 5 * 50 },
    color: "darkred",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 3200 + 103 * 50, y: 200 },
    dimensions: { width: 1 * 50, height: 6 * 50 },
    color: "darkred",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 3200 + 104 * 50, y: 150 },
    dimensions: { width: 1 * 50, height: 7 * 50 },
    color: "darkred",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 3200 + 105 * 50, y: 100 },
    dimensions: { width: 1 * 50, height: 8 * 50 },
    color: "darkred",
    collisions: { horizontal: true, vertical: false },
  }),
  new Platform({
    position: { x: 3200 + 106 * 50, y: 100 },
    dimensions: { width: 1 * 50, height: 8 * 50 },
    color: "darkred",
    collisions: { horizontal: true, vertical: false },
  }),
];
const monsters = [
  new Monster({
    position: { x: 700, y: 439 },
    dimensions: { width: 60, height: 57 },
  }),
  new Monster({
    position: { x: 1400, y: 439 },
    dimensions: { width: 60, height: 57 },
  }),
  new Monster({
    position: { x: 1800, y: 439 },
    dimensions: { width: 60, height: 57 },
  }),
  new Monster({
    position: { x: 1880, y: 439 },
    dimensions: { width: 60, height: 57 },
    activationOffset: 80,
  }),
  new Monster({
    position: { x: 3110, y: 60 - 17 },
    dimensions: { width: 60, height: 57 },
  }),
  new Monster({
    position: { x: 3190, y: 60 - 17 },
    dimensions: { width: 60, height: 57 },
    activationOffset: 80,
  }),
  new Monster({
    position: { x: 3900, y: 439 },
    dimensions: { width: 60, height: 57 },
  }),
  new Monster({
    position: { x: 3980, y: 439 },
    dimensions: { width: 60, height: 57 },
    activationOffset: 80,
  }),
  new Monster({
    position: { x: 4400, y: 439 },
    dimensions: { width: 60, height: 57 },
    color: "lightgreen",
  }),
  new Monster({
    position: { x: 4750, y: 439 },
    dimensions: { width: 60, height: 57 },
  }),
  new Monster({
    position: { x: 4830, y: 439 },
    dimensions: { width: 60, height: 57 },
    activationOffset: 80,
  }),
  new Monster({
    position: { x: 5250, y: 439 },
    dimensions: { width: 60, height: 57 },
  }),
  new Monster({
    position: { x: 5330, y: 439 },
    dimensions: { width: 60, height: 57 },
    activationOffset: 80,
  }),
  new Monster({
    position: { x: 5450, y: 439 },
    dimensions: { width: 60, height: 57 },
  }),
  new Monster({
    position: { x: 5530, y: 439 },
    dimensions: { width: 60, height: 57 },
    activationOffset: 80,
  }),
  new Monster({
    position: { x: 7800, y: 439 },
    dimensions: { width: 60, height: 57 },
  }),
  new Monster({
    position: { x: 7880, y: 439 },
    dimensions: { width: 60, height: 57 },
    activationOffset: 80,
  }),
];
let scrollX = 0;
let speedBooster = 1;
const backgroundImg = imageStore.background

function playBackgroundMusic() {
  var myAudio = document.createElement("audio");
  myAudio.src = "./audio/background-music.mp3.ogg";
  myAudio.play();
  // myAudio.pause();
}

function animate() {
  canvas.width = 960;
  canvas.height = 540;

  const scrollXBackground = (scrollX / 2) % Math.floor(backgroundImg.width / 2);
  ctx.drawImage(
    backgroundImg,
    scrollXBackground,
    0,
    960,
    540,
    0,
    0,
    canvas.width,
    canvas.height
  );
  ctx.drawImage(
    backgroundImg,
    scrollXBackground * 2,
    500,
    960,
    40,
    0,
    500,
    canvas.width,
    40
  );
  ctx.fillStyle =
    "rgba(0,0,0," + Math.round((scrollX / 25000) * 100) / 100 + ")";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  platforms.forEach((platform) => platform.update());
  player.update();
  monsters.forEach((monster) => monster.update());

  //adjust scroll right side
  if (player.position.x - scrollX > canvas.width / 2) {
    scrollX = player.position.x - canvas.width / 2;
  }

  //adjust scroll left side
  if (player.position.x - scrollX < canvas.width / 5) {
    scrollX =
      player.position.x - canvas.width / 5 < 0
        ? 0
        : player.position.x - canvas.width / 5;
  }

  //check for losing condition
  if (
    player.position.y + player.dimensions.height / 2 > canvas.height &&
    player.isAlive
  ) {
    player.die(() => {
      alert("you lose!");
      location.reload(false);
    });
  }

  requestAnimationFrame(animate);
}

addEventListener("keydown", ({ key }) => {
  switch (key) {
    case "w":
    case "W":
    case "ArrowUp":
      if (!player.isJumping && player.velocity.y == GRAVITY) {
        player.jump();
      }
      break;
    case "d":
    case "D":
    case "ArrowRight":
      player.velocity.x = 5 * speedBooster;
      player.direction = "right";
      break;
    case "a":
    case "A":
    case "ArrowLeft":
      player.velocity.x = -5 * speedBooster;
      player.direction = "left";
      break;
    case "Control":
      speedBooster = 1.75;
      if (player.velocity.x > 0) {
        player.velocity.x = 5 * speedBooster;
      } else if (player.velocity.x < 0) {
        player.velocity.x = -5 * speedBooster;
      }
      break;
  }
});

addEventListener("keyup", ({ key }) => {
  switch (key) {
    case "d":
    case "D":
    case "a":
    case "A":
    case "ArrowRight":
    case "ArrowLeft":
      player.velocity.x = 0;
      break;
    case "Control":
      player.velocity.x = player.velocity.x / speedBooster;
      speedBooster = 1;
      break;
  }
});


