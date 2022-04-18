const canvas = document.getElementById("game-canvas");
const btnStart = document.getElementById("button-start");
const ctx = canvas.getContext("2d");
const GRAVITY = 1;
const PLAYER_POWERS = {
  NONE: 'none',
  SUPER: 'super',
  FIREBALL: 'fireball',
  INVINCIBLE: 'invincible',
  ONEUP: '1up',
}

const audioStore = {
  backgroundMusic: loadAudio('./audio/background-music.mp3.ogg', 0.2, true),
  loseMusic: loadAudio('./audio/lose.ogg', 1),
  monsterStompEffect: loadAudio('./audio/monster-stomp.ogg', 0.7),
  monsterStompEffect2: loadAudio('./audio/monster-stomp.ogg', 0.7),
  jumpEffect: loadAudio("./audio/jump.mp3.ogg"),
  fireEffect: loadAudio('./audio/shoot.ogg', 1),
  powerUpEffect: loadAudio('./audio/power-up.mp3', 1),
  powerUpAppliedEffect: loadAudio('./audio/power-up-applied2.mp3', 0.7),
  oneLiveUpEffect: loadAudio('./audio/one-live-up.mp3', 1),
  fireballHitBlockEffect: loadAudio('./audio/shoot.ogg', 1),
}

const imageStore = {
  surpriseBlock: loadImage("./img/surprise-block.png"),
  disabledBlock: loadImage("./img/disabled-block.png"),
  brownBlock: loadImage("./img/brown-wooden-block.png"),
  redBlock: loadImage("./img/red-wooden-block.png"),
  blueBlock: loadImage("./img/blue-wooden-block.png"),
  floorBlock: loadImage("./img/floor-block.png"),
  pipe: loadImage("./img/pipe.png"),
  player: loadImage("./img/player.png"),
  monsterKokoa: loadImage("./img/kokoa.png"),
  background: loadImage("./img/background.jpg"),
  powerUp: loadImage("./img/power-up.png"),
}

function startGame() {
  btnStart.classList.add('hide');
  audioStore.backgroundMusic.play();
  animate();
}

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

function playAudio(audio) {
  if (!audio.paused) {
    audio.pause();
    audio.currentTime = 0;
  }
  audio.play();
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
  color = "lightbrown";
  img = null;
  visible = true;

  constructor({
    position,
    dimensions,
    color = "lightbrown",
    collisions = { vertical: true, horizontal: true },
    visible = true,
  }) {
    this.position = position;
    this.maxY = position.y
    this.dimensions = dimensions;
    this.color = color;
    this.collisions = collisions;
    this.visible = visible;
    switch (true) {
      case color === "lightbrown":
      case color === "multicoin":
      case color === "starhidden":
        this.img = imageStore.brownBlock
        break;
      case color === "darkred":
        this.img = imageStore.redBlock;
        break;
      case color === "lightgreen":
        this.img = imageStore.floorBlock;
        break;
      case color === "green":
        this.img = imageStore.pipe;
        break;
      case color === "powerup":
      case color === "coin":
      case color === "1up":
      case color === "star":
        this.img = imageStore.surpriseBlock
        break;
      case color === "disabled":
        this.img = imageStore.disabledBlock
        break;
    }
  }

  hitByPlayer(powers, from = 'bottom') {
    if (!this.visible) {
      this.visible = true;
    }

    if (this.color === 'disabled') return;

    if (from === 'bottom') {
      if (this.color === 'coin' || this.color === 'powerup' || this.color === '1up' || this.color === 'starhidden' || this.color === 'star') {
        // if coin - add coin to count, play sound and animate coin sprite
        // if powerup - check player powers and deternmine type of power up, based on that create power up on top of platform and add to power up array, play sound
        if (this.color === 'powerup') {
          switch (powers) {
            case PLAYER_POWERS.SUPER:
            case PLAYER_POWERS.FIREBALL:
              powerUps.push(new PowerUp({
                position: { x: this.position.x, y: this.position.y - 50 },
                dimensions: { width: 50, height: 50 },
                type: PLAYER_POWERS.FIREBALL,
                velocity: { x: 0, y: 0 },
                sprite: new Sprite({
                  img: imageStore.powerUp,
                  framesCount: 3,
                  position: { x: 0, y: 50 },
                  offset: { x: 50, y: 0 },
                  printOffset: { x: 0, y: 0 },
                  dimensions: { width: 50, height: 50 },
                  framesRefreshFrequency: 6,
                }),
                activationFrames: 30,
              }));
              playAudio(audioStore.powerUpEffect);
              break;
            case PLAYER_POWERS.NONE:
              powerUps.push(new PowerUp({
                position: { x: this.position.x, y: this.position.y - 50 },
                dimensions: { width: 50, height: 50 },
                type: PLAYER_POWERS.SUPER,
                velocity: { x: 3, y: 0 },
                sprite: new Sprite({
                  img: imageStore.powerUp,
                  framesCount: 12,
                  position: { x: 0, y: 0 },
                  offset: { x: 50, y: 0 },
                  printOffset: { x: 0, y: 0 },
                  dimensions: { width: 50, height: 50 },
                  framesRefreshFrequency: 10,
                }),
                activationFrames: 30,
              }));
              playAudio(audioStore.powerUpEffect);
              break;
          }
        } else if (this.color === '1up') {
          powerUps.push(new PowerUp({
            position: { x: this.position.x, y: this.position.y - 50 },
            dimensions: { width: 50, height: 50 },
            type: PLAYER_POWERS.ONEUP,
            velocity: { x: -3, y: 0 },
            sprite: new Sprite({
              img: imageStore.powerUp,
              framesCount: 8,
              position: { x: 0, y: 150 },
              offset: { x: 50, y: 0 },
              printOffset: { x: 0, y: 0 },
              dimensions: { width: 50, height: 50 },
              framesRefreshFrequency: 12,
            }),
            activationFrames: 20,
          }));
          playAudio(audioStore.powerUpEffect);
        } else if (this.color === 'star' || this.color === 'starhidden') {
          powerUps.push(new PowerUp({
            position: { x: this.position.x, y: this.position.y - 50 },
            dimensions: { width: 50, height: 50 },
            type: PLAYER_POWERS.INVINCIBLE,
            velocity: { x: 3, y: -14 },
            sprite: new Sprite({
              img: imageStore.powerUp,
              framesCount: 1,
              position: { x: 0, y: 100 },
              offset: { x: 50, y: 0 },
              printOffset: { x: 0, y: 0 },
              dimensions: { width: 50, height: 50 },
              framesRefreshFrequency: 10,
            }),
          }));
          playAudio(audioStore.powerUpEffect);
        }
        // if 1up - create 1up on top of platform and add to powerup array, play sound
        // if star or starhidden - create 1up on top of platform and add to powerup array, play sound
        this.color = 'disabled'
        this.img = imageStore.disabledBlock;
      }
      if (this.color === 'multicoin') {
        // if multicoin - add coint to count, play sound, animate coin sprite, set timer to disable
        setTimeout(() => {
          this.color = 'disabled'
          this.img = imageStore.disabledBlock;
        }, 3000);
      }
      this.velocity.y = -5
      for (let i = 0; i < monsters.length; i++) {
        const monster = monsters[i];
        if (rectCollision(this.position.x, this.position.y - 5, this.dimensions.width, this.dimensions.height,
          monster.position.x, monster.position.y, monster.dimensions.width, monster.dimensions.height)) {
          monster.die(() => monsters.splice(monsters.indexOf(monster), 1))
          break;
        }
      }
    }
  }

  update() {
    this.velocity.y += GRAVITY
    this.position.y += this.velocity.y;
    if (this.position.y >= this.maxY) {
      this.velocity.y = 0;
      this.position.y = this.maxY;
    }
    this.draw();
  }

  draw() {
    if (!this.visible) return;

    if (
      this.position.x + this.dimensions.width - scrollX > 0 &&
      this.position.x - scrollX < canvas.width
    ) { // only draw if platform is visible in the screen
      if (this.img !== null && this.color !== 'green') {
        let x = 0;
        while (this.img.width > 0 && x < this.dimensions.width) {
          let y = 0
          while (this.img.width > 0 && y < this.dimensions.height) {
            ctx.drawImage(
              this.img,
              0,
              0,
              this.img.width,
              this.img.height,
              this.position.x - scrollX + x,
              this.position.y + y,
              this.img.width,
              this.img.height
            );
            y += this.img.height;
          }
          x += this.img.width;
        }
      } else if (this.color === "green") {
        ctx.drawImage(
          this.img,
          0,
          0,
          this.img.width,
          this.dimensions.height,
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
        platform.visible &&
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
    playAudio(audioStore.monsterStompEffect);
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
    framesRefreshFrequency = 5,
    printOffset = { x: 0, y: 0 }
  }) {
    this.img = img;
    this.framesCount = framesCount;
    this.position = position;
    this.offset = offset;
    this.dimensions = dimensions;
    this.framesRefreshFrequency = framesRefreshFrequency;
    this.printOffset = printOffset;
  }

  draw({ position, dimensions, growingHeight = null }) {

    if (growingHeight === null) {
      growingHeight = dimensions.height;
    }

    const growingHeightCalc = this.dimensions.height * growingHeight / dimensions.height;

    ctx.drawImage(
      this.img,
      this.position.x + this.offset.x * this.framesCurrent,
      this.position.y + this.offset.y * this.framesCurrent,
      this.dimensions.width,
      growingHeightCalc,
      position.x - scrollX + this.printOffset.x,
      position.y + this.printOffset.y + dimensions.height - growingHeight,
      dimensions.width,
      growingHeight
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
  constructor() {
    this.position = { x: 100, y: 425 };
    this.velocity = { x: 0, y: 0 };
    this.dimensions = { width: 40, height: 40 };
    this.resizeDimensions = { ...this.dimensions };
    this.direction = "right";
    this.isJumping = true;
    this.isAlive = true;
    this.coolingDown = false;
    this.isDiying = false;
    this.powers = PLAYER_POWERS.NONE;
    this.isInvincible = false
    this.sprites = {
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
        framesCount: 3,
        position: { x: 15, y: 4 * 48 + 30 },
        offset: { x: 48, y: 0 },
        printOffset: { x: 0, y: 2 },
        dimensions: { width: 18, height: 18 },
      }),
      standLeft: new Sprite({
        img: imageStore.player,
        framesCount: 3,
        position: { x: 15, y: 5 * 48 + 30 },
        offset: { x: 48, y: 0 },
        printOffset: { x: 0, y: 2 },
        dimensions: { width: 18, height: 18 },
      }),
      jumpRight: new Sprite({
        img: imageStore.player,
        framesCount: 1,
        position: { x: 15, y: 6 * 48 + 30 },
        offset: { x: 48, y: 0 },
        printOffset: { x: 0, y: 2 },
        dimensions: { width: 18, height: 18 },
      }),
      jumpLeft: new Sprite({
        img: imageStore.player,
        framesCount: 1,
        position: { x: 15, y: 7 * 48 + 30 },
        offset: { x: 48, y: 0 },
        printOffset: { x: 0, y: 2 },
        dimensions: { width: 18, height: 18 },
      }),
      fallRight: new Sprite({
        img: imageStore.player,
        framesCount: 1,
        position: { x: 15 + 48, y: 6 * 48 + 30 },
        offset: { x: 48, y: 0 },
        printOffset: { x: 0, y: 2 },
        dimensions: { width: 18, height: 18 },
      }),
      fallLeft: new Sprite({
        img: imageStore.player,
        framesCount: 1,
        position: { x: 15 + 48, y: 7 * 48 + 30 },
        offset: { x: 48, y: 0 },
        printOffset: { x: 0, y: 2 },
        dimensions: { width: 18, height: 18 },
      }),
    };
    this.sprite = this.sprites.standRight;
    this.poweringDown = false

  }

  jump() {
    this.isJumping = true;
    this.velocity.y = -22;
    playAudio(audioStore.jumpEffect);
  }

  fire() {
    if (this.powers === PLAYER_POWERS.FIREBALL && !this.coolingDown) {
      if (this.direction === 'right') {
        fireballs.push(new FireBall({
          position: { x: this.position.x + this.dimensions.width, y: this.position.y + this.dimensions.height / 3 },
          dimensions: { width: 10, height: 10 },
          velocity: { x: 13, y: 4 },
          sprites: {
            fire: new Sprite({
              img: imageStore.powerUp,
              framesCount: 7,
              position: { x: 0, y: 204 },
              offset: { x: 24, y: 0 },
              printOffset: { x: 0, y: 0 },
              dimensions: { width: 12, height: 12 },
              framesRefreshFrequency: 10,
            }),
            explote: new Sprite({
              img: imageStore.powerUp,
              framesCount: 7,
              position: { x: 0, y: 216 },
              offset: { x: 24, y: 0 },
              printOffset: { x: 0, y: 0 },
              dimensions: { width: 12, height: 12 },
              framesRefreshFrequency: 3,
            })
          },
        }));
      } else {
        fireballs.push(new FireBall({
          position: { x: this.position.x, y: this.position.y + this.dimensions.height / 3 },
          dimensions: { width: 16, height: 16 },
          velocity: { x: -13, y: 3.5 },
          sprites: {
            fire: new Sprite({
              img: imageStore.powerUp,
              framesCount: 7,
              position: { x: 0, y: 204 },
              offset: { x: 24, y: 0 },
              printOffset: { x: 0, y: 0 },
              dimensions: { width: 12, height: 12 },
              framesRefreshFrequency: 10,
            }),
            explote: new Sprite({
              img: imageStore.powerUp,
              framesCount: 7,
              position: { x: 0, y: 216 },
              offset: { x: 24, y: 0 },
              printOffset: { x: 0, y: 0 },
              dimensions: { width: 12, height: 12 },
              framesRefreshFrequency: 3,
            })
          },
        }));
      }
      playAudio(audioStore.fireEffect)
      this.coolingDown = true;
      setTimeout(() => {
        this.coolingDown = false;
      }, 100);
    }
  }

  update() {
    if (this.isDying) {
      this.position.y += this.velocity.y;
      this.velocity.y += GRAVITY;
      this.draw();
    }

    if (!this.isAlive) return;

    switch (true) {
      case this.direction === "right" && this.velocity.x === 0 && this.velocity.y === GRAVITY:
        this.sprite = this.sprites.standRight;
        break;
      case this.direction === "right" && this.velocity.x !== 0 && this.velocity.y === GRAVITY:
        this.sprite = this.sprites.runRight;
        break;
      case this.direction === "left" && this.velocity.x === 0 && this.velocity.y === GRAVITY:
        this.sprite = this.sprites.standLeft;
        break;
      case this.direction === "left" && this.velocity.x !== 0 && this.velocity.y === GRAVITY:
        this.sprite = this.sprites.runLeft;
        break;
      case this.direction === "right" && this.velocity.y < GRAVITY:
        this.sprite = this.sprites.jumpRight;
        break;
      case this.direction === "right" && this.velocity.y > GRAVITY:
        this.sprite = this.sprites.fallRight;
        break;
      case this.direction === "left" && this.velocity.y < GRAVITY:
        this.sprite = this.sprites.jumpLeft;
        break;
      case this.direction === "left" && this.velocity.y > GRAVITY:
        this.sprite = this.sprites.fallLeft;
        break;
    }

    this.sprite.nextFrame(speedBooster);

    // resize height if needed
    if (this.dimensions.height < this.resizeDimensions.height) {
      this.dimensions.height += 1;
      this.position.y -= 1;
    } else if (this.dimensions.height > this.resizeDimensions.height) {
      this.dimensions.height -= 1;
      this.position.y += 1;
    }

    // resize width if needed
    if (this.dimensions.width < this.resizeDimensions.width) {
      this.dimensions.width += 1;
      this.position.x -= 1;
    } else if (this.dimensions.width > this.resizeDimensions.width) {
      this.dimensions.width -= 1;
      this.position.x += 1;
    }


    // check collisions with platforms from top to down
    for (let i = 0; i < platforms.length; i++) {
      const platform = platforms[i];
      if (
        this.velocity.y > 0 &&
        platform.visible &&
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
        this.velocity.y < 0 &&
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
          //for instance delete them with explosion animation: 
          //if powers, destroy the block
          //if no powers, just move the block
          platform.hitByPlayer(this.powers, 'bottom');
          if (this.powers !== PLAYER_POWERS.NONE && platform.color === "lightbrown")
            platforms.splice(i, 1);
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
          monster.die(() => monsters.splice(monsters.indexOf(monster), 1));
          this.velocity.y = -10;
        } else {
          if (this.isInvincible) {
            monster.die(() => monsters.splice(monsters.indexOf(monster), 1));
          }
          else if (this.powers === PLAYER_POWERS.NONE) {
            this.die(() => {
              alert("you lose!");
              location.reload(false);
            });
          } else {
            //play powerdown sound effect
            this.poweringDown = true;
            this.resizeDimensions = { width: 40, height: 40 }
            //sprite for powering down here
            setTimeout(() => { this.powers = PLAYER_POWERS.NONE, this.poweringDown = false }, 2000);
          }
        }
        break;
      }
    }

    // check collissions with powerups
    for (let i = 0; i < powerUps.length; i++) {
      const powerUp = powerUps[i];
      if (
        rectCollision(
          this.position.x + this.velocity.x,
          this.position.y,
          this.dimensions.width,
          this.dimensions.height,
          powerUp.position.x,
          powerUp.position.y,
          powerUp.dimensions.width,
          powerUp.dimensions.height
        )
      ) {
        switch (powerUp.type) {
          case PLAYER_POWERS.SUPER:
            if (this.powers === PLAYER_POWERS.NONE) {
              this.powers = PLAYER_POWERS.SUPER
              this.resizeDimensions = { width: 50, height: 50 }
            }
            playAudio(audioStore.powerUpAppliedEffect);
            break;
          case PLAYER_POWERS.FIREBALL:
            if (this.powers === PLAYER_POWERS.NONE || this.powers === PLAYER_POWERS.SUPER) {
              this.powers = PLAYER_POWERS.FIREBALL
              this.resizeDimensions = { width: 50, height: 50 }
            }
            playAudio(audioStore.powerUpAppliedEffect);
            break;
          case PLAYER_POWERS.INVINCIBLE:
            playAudio(audioStore.powerUpAppliedEffect);
            this.isInvincible = true;
            setTimeout(() => {
              this.isInvincible = false;
            }, 7000);
            break;
          case PLAYER_POWERS.ONEUP:
            playAudio(audioStore.oneLiveUpEffect);
            //play powerup audio effect
            break;
        }
        powerUps.splice(i, 1);
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

    if (this.isInvincible) {
      ctx.fillStyle = 'orange'
    } else {
      switch (this.powers) {
        case PLAYER_POWERS.NONE:
          ctx.fillStyle = 'transparent'
          break;
        case PLAYER_POWERS.SUPER:
          ctx.fillStyle = 'yellow'
          break;
        case PLAYER_POWERS.FIREBALL:
          ctx.fillStyle = 'red'
          break;
      }
    }

    ctx.fillRect(this.position.x - scrollX, this.position.y, 10, 10)

  }

  die(cb) {
    audioStore.backgroundMusic.pause();
    audioStore.loseMusic.play();
    this.isAlive = false;
    this.isDying = true;
    this.velocity.y = -20;
    setTimeout(cb, 1000);
  }
}

function createPlatformBlocks({ position, dimensions, color, collisions, blockWidth = undefined, blockHeight = undefined }) {
  const platformBlocks = [];
  if (blockWidth == undefined) blockWidth = dimensions.width;
  if (blockHeight == undefined) blockHeight = dimensions.height;
  let x = 0;
  while (x < dimensions.width) {
    let y = 0;
    while (y < dimensions.height) {
      platformBlocks.push(new Platform({
        position: { x: position.x + x, y: position.y + y },
        dimensions: { width: blockWidth, height: blockHeight },
        color: color,
        collisions: collisions
      }));
      y += blockHeight;
    }
    x += blockWidth;
  }

  return platformBlocks;

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
    color: 'coin'
  }),
  new Platform({
    position: { x: 650, y: 100 },
    dimensions: { width: 50, height: 50 },
    collisions: { horizontal: true, vertical: true },
    color: 'coin'
  }),
  new Platform({
    position: { x: 550, y: 300 },
    dimensions: { width: 50, height: 50 },
    collisions: { horizontal: true, vertical: true },
  }),
  new Platform({
    position: { x: 600, y: 300 },
    dimensions: { width: 50, height: 50 },
    collisions: { horizontal: true, vertical: true },
    color: 'powerup'
  }),
  new Platform({
    position: { x: 650, y: 300 },
    dimensions: { width: 50, height: 50 },
    collisions: { horizontal: true, vertical: true },
  }),
  new Platform({
    position: { x: 700, y: 300 },
    dimensions: { width: 50, height: 50 },
    collisions: { horizontal: true, vertical: true },
    color: 'coin'
  }),
  new Platform({
    position: { x: 750, y: 300 },
    dimensions: { width: 50, height: 50 },
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
    position: { x: 2000 + 7 * 50, y: 300 },
    dimensions: { width: 50, height: 50 },
    color: "1up",
    collisions: { horizontal: true, vertical: true },
    visible: false
  }),
  new Platform({
    position: { x: 2650, y: 500 },
    dimensions: { width: 15 * 50, height: 50 },
    color: "lightgreen",
  }),
  new Platform({
    position: { x: 2950, y: 300 },
    dimensions: { width: 50, height: 50 },
  }),
  new Platform({
    position: { x: 3000, y: 300 },
    dimensions: { width: 50, height: 50 },
    color: 'powerup'
  }),
  new Platform({
    position: { x: 3050, y: 300 },
    dimensions: { width: 50, height: 50 },
  }),
  ...createPlatformBlocks({
    blockWidth: 50,
    position: { x: 3100, y: 100 },
    dimensions: { width: 8 * 50, height: 50 },
  }),
  new Platform({
    position: { x: 2650 + 11 * 50, y: 500 },
    dimensions: { width: 3550, height: 50 },
    color: "lightgreen",
  }),
  ...createPlatformBlocks({
    blockWidth: 50,
    position: { x: 2650 + 20 * 50, y: 100 },
    dimensions: { width: 3 * 50, height: 50 },
  }),
  new Platform({
    position: { x: 2650 + 23 * 50, y: 300 },
    dimensions: { width: 50, height: 50 },
    color: 'multicoin'
  }),
  new Platform({
    position: { x: 2650 + 23 * 50, y: 100 },
    dimensions: { width: 50, height: 50 },
    color: 'coin'
  }),
  new Platform({
    position: { x: 2650 + 28 * 50, y: 300 },
    dimensions: { width: 50, height: 50 },
  }),
  new Platform({
    position: { x: 2650 + 29 * 50, y: 300 },
    dimensions: { width: 50, height: 50 },
    color: 'starhidden'
  }),
  new Platform({
    position: { x: 2650 + 34 * 50, y: 300 },
    dimensions: { width: 1 * 50, height: 50 },
    color: 'coin'
  }),
  new Platform({
    position: { x: 2650 + 37 * 50, y: 300 },
    dimensions: { width: 1 * 50, height: 50 },
    color: 'coin'
  }),
  ...createPlatformBlocks({
    blockWidth: 50,
    position: { x: 2650 + 37 * 50, y: 100 },
    dimensions: { width: 1 * 50, height: 50 },
    color: 'powerup'
  }),
  new Platform({
    position: { x: 2650 + 40 * 50, y: 300 },
    dimensions: { width: 1 * 50, height: 50 },
    color: 'coin'
  }),
  new Platform({
    position: { x: 2650 + 46 * 50, y: 300 },
    dimensions: { width: 1 * 50, height: 50 },
  }),
  ...createPlatformBlocks({
    blockWidth: 50,
    position: { x: 2650 + 49 * 50, y: 100 },
    dimensions: { width: 3 * 50, height: 50 },
  }),
  new Platform({
    position: { x: 2650 + 56 * 50, y: 100 },
    dimensions: { width: 50, height: 50 },
  }),
  ...createPlatformBlocks({
    blockWidth: 50,
    position: { x: 2650 + 57 * 50, y: 100 },
    dimensions: { width: 2 * 50, height: 50 },
    color: 'coin'
  }),
  new Platform({
    position: { x: 2650 + 59 * 50, y: 100 },
    dimensions: { width: 50, height: 50 },
  }),
  ...createPlatformBlocks({
    blockWidth: 50,
    position: { x: 2650 + 57 * 50, y: 300 },
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
    dimensions: { width: 50, height: 50 },
    collisions: { horizontal: true, vertical: true },
  }),
  ...createPlatformBlocks({
    blockWidth: 50,
    position: { x: 2650 + 73 * 50 + 25 * 50, y: 300 },
    dimensions: { width: 2 * 50, height: 50 },
    collisions: { horizontal: true, vertical: true },
    color: 'coin'
  }),
  new Platform({
    position: { x: 2650 + 75 * 50 + 25 * 50, y: 300 },
    dimensions: { width: 50, height: 50 },
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

const powerUps = [];

const fireballs = [];

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
  powerUps.forEach((powerUp) => powerUp.update());
  player.update();
  fireballs.forEach((fireball) => fireball.update());
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
    case ' ':
      player.fire();
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

btnStart.addEventListener('click', () => startGame())
addEventListener('keypress', ({ key }) => { if (key === 'Enter') startGame() }, { once: true })


class PowerUp {
  position = { x: 30, y: 0 };
  velocity = { x: 0, y: 0 };
  dimensions = { width: 40, height: 40 };
  type = "powerup"; // 1up, star, ... 
  isJumping = true;
  isActivated = false;

  sprites = {};
  sprite = null
  framesCountToActivate = 0

  constructor({
    position,
    dimensions,
    type = "powerup",
    velocity = { x: 3, y: 0 },
    sprite = null,
    activationFrames = 0
  }) {
    this.position = position;
    this.dimensions = dimensions;
    this.velocity = velocity;
    this.bounceVelocity = velocity.y;
    this.type = type;
    this.sprite = sprite;
    this.isActivated = false;
    this.activationFrames = activationFrames;
    this.framesCountToActivate = 0;

  }

  update() {

    this.framesCountToActivate++;
    if (this.framesCountToActivate >= this.activationFrames) {
      this.isActivated = true;
    }

    if (this.isActivated) {

      if (this.sprite !== null) this.sprite.nextFrame(1);

      // check collisions with platforms from top to down
      for (let i = 0; i < platforms.length; i++) {
        const platform = platforms[i];
        if (
          platform.visible &&
          this.position.y + this.dimensions.height <= platform.position.y &&
          this.position.y + this.dimensions.height + this.velocity.y >=
          platform.position.y &&
          this.position.x + this.velocity.x <
          platform.position.x + platform.dimensions.width &&
          this.position.x + this.dimensions.width + this.velocity.x >
          platform.position.x
        ) {
          this.position.y = platform.position.y - this.dimensions.height;
          this.velocity.y = this.bounceVelocity;
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
    }

    this.draw();
  }

  draw() {
    //draw only if it is in canvas window
    if (
      this.position.x + this.dimensions.width - scrollX > 0 &&
      this.position.x - scrollX < canvas.width
    ) {

      let height = this.dimensions.height
      if (this.framesCountToActivate < this.activationFrames) {
        height = Math.ceil(this.dimensions.height * this.framesCountToActivate / this.activationFrames);
      }

      if (this.sprite == null) {
        switch (this.type) {
          case PLAYER_POWERS.SUPER: ctx.fillStyle = "yellow"; break;
          case PLAYER_POWERS.FIREBALL: ctx.fillStyle = "red"; break;
          case PLAYER_POWERS.INVINCIBLE: ctx.fillStyle = "gold"; break;
          case PLAYER_POWERS.ONEUP: ctx.fillStyle = "lightgreen"; break;
          default: ctx.fillStyle = "blue"; break;
        }
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
          growingHeight: height
        });
      }
    }
  }
}

class FireBall {
  position = { x: 30, y: 0 };
  velocity = { x: 0, y: 0 };
  dimensions = { width: 5, height: 5 };
  isJumping = true;
  isAlive = true;

  sprites = {};
  sprite = null

  constructor({
    position,
    dimensions,
    velocity = { x: 5, y: 5 },
    sprites = {}
  }) {
    this.position = position;
    this.dimensions = dimensions;
    this.velocity = velocity;
    this.bounceVelocity = -Math.abs(velocity.y * 3);
    this.sprites = sprites
    if (this.sprites.fire) this.sprite = this.sprites.fire;
  }

  update() {

    if (this.sprite !== null) this.sprite.nextFrame(1);

    if (this.isAlive) {

      // check collisions with platforms from top to down
      for (let i = 0; i < platforms.length; i++) {
        const platform = platforms[i];
        if (
          platform.visible &&
          this.position.y + this.dimensions.height <= platform.position.y &&
          this.position.y + this.dimensions.height + this.velocity.y >=
          platform.position.y &&
          this.position.x + this.velocity.x <
          platform.position.x + platform.dimensions.width &&
          this.position.x + this.dimensions.width + this.velocity.x >
          platform.position.x
        ) {
          this.position.y = platform.position.y - this.dimensions.height;
          this.velocity.y = this.bounceVelocity;
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
          }
          this.velocity.y = 0;
          break;
        }
      }

      this.position.y += this.velocity.y;
      this.velocity.y += GRAVITY;

      // check colission with monsters
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
          monster.die(() => monsters.splice(monsters.indexOf(monster), 1));
          fireballs.splice(fireballs.indexOf(this), 1);
          return;
        }
      }

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
          this.die(() => fireballs.splice(fireballs.indexOf(this), 1), true);
          return;
        }
      }

      // check move beyond start of map
      if (this.position.x + this.velocity.x < 0) {
        fireballs.splice(fireballs.indexOf(this), 1);
        return;
      }

      // check move beyond bottom of canvas
      if (this.position.y + this.velocity.y > canvas.height) {
        fireballs.splice(fireballs.indexOf(this), 1);
        return;
      }


      this.position.x += this.velocity.x;
    }

    this.draw();
  }

  draw() {
    //draw only if it is in canvas window
    if (
      this.position.x + this.dimensions.width - scrollX > 0 &&
      this.position.x - scrollX < canvas.width
    ) {
      if (this.sprite == null) {
        ctx.fillStyle = "red"
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

  die(cb, hitBlock = false) {
    if (hitBlock) {
      playAudio(audioStore.fireballHitBlockEffect);
    }
    this.isAlive = false;
    this.isDying = true;
    if (this.sprites.explote) this.sprite = this.sprites.explote
    setTimeout(cb, 300);
  }
  
}
