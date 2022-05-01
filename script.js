const canvas = document.getElementById("game-canvas");
const btnStart = document.getElementById("button-start");
const elPoints = document.getElementById("points");
const elLives = document.getElementById("lives");
const elTimeLeft = document.getElementById("timeLeft");
const elTreats = document.getElementById("treats");
const ctx = canvas.getContext("2d");
const GRAVITY = 1;
const PLAYER_POWERS = {
  NONE: 'none',
  SUPER: 'super',
  FIREBALL: 'fireball',
  INVINCIBLE: 'invincible',
  ONEUP: '1up',
}

const ACTIONS = {
  BREAKBLOCK: { points: 50 },
  COLLECTTREAT: { points: 200 },
  COLLECTPOWERUP: { points: 1000 },
  BLOCKMONSTER: { points: 200 },//[100,200,400,500,800,1000,2000,4000,5000,8000,PLAYER_POWERS.ONEUP]},
  STOMPMONSTER: { points: 100 },//[100,200,400,500,800,1000,2000,4000,5000,8000,PLAYER_POWERS.ONEUP]},
  FIREBALLMONSTER: { points: 200 },
  ROOMBAMONSTER: { points: 500 },//[500,800,1000,2000,4000,5000,8000,PLAYER_POWERS.ONEUP]},
  KICKROOMBA: { points: 400 },
  REMAININGSECOND: { points: 50 },
  ONEUP: { points: 1000 },
  INVINCIBLEMONSTER: { points: 400 },
  FINISHLEVELHEIGHT: {points: 50}
}


const COLLISIONRESULT = {
  NOHIT: 'no-hit',
  TAKEHIT: 'take-hit',
  FATALHIT: 'fatal-hit'
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
  oneLiveUpEffect: loadAudio('./audio/one-live-up.mp3', 0.7),
  fireballHitBlockEffect: loadAudio('./audio/shoot.ogg', 1),
  whisleEffect: loadAudio('./audio/whisle.ogg', 1),
  winJingle: loadAudio('./audio/winjingle.ogg', 1),
}

const imageStore = {
  surpriseBlock: loadImage("./img/surprise-block.png"),
  disabledBlock: loadImage("./img/disabled-block.png"),
  brownBlock: loadImage("./img/brown-wooden-block.png"),
  debrisBrownBlock: loadImage("./img/debris-brown-wooden-block.png"),
  redBlock: loadImage("./img/red-wooden-block.png"),
  blueBlock: loadImage("./img/blue-wooden-block.png"),
  floorBlock: loadImage("./img/floor-block.png"),
  pipe: loadImage("./img/pipe.png"),
  player: loadImage("./img/player.png"),
  monsterKokoa: loadImage("./img/kokoa.png"),
  monsterCatRoomba: loadImage("./img/cat-roomba.png"),
  background: loadImage("./img/background.jpg"),
  powerUp: loadImage("./img/power-up.png"),
  treat: loadImage("./img/treat2-Sheet.png"),
  treatJump: loadImage("./img/treat-jump-Sheet.png"),
  teepee: loadImage("./img/teepee.png"),
  teepeeFront: loadImage("./img/teepee-front.png"),
  enterTeepee: loadImage("./img/enter-teepee-sprite-Sheet.png"),
}
let teepeeX;

function startGame() {
  btnStart.classList.add('hide');
  game.start();
  audioStore.backgroundMusic.play();
  requestAnimationFrame(animate);
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


class Game {
  constructor() {
    this.points = 0;
    this.treats = 0;
    this.lives = 3;
    this.treatsToGetLive = 10;
    this.map = { end: 9550 };
    this.timeEnd = null;
    this.timeLeft = null;
    this.started = false;
  }

  update() {
    if (this.started) {
      const currentTime = Date.now();
      this.timeLeft = Math.max(Math.ceil((this.timeEnd - currentTime) / 1000), 0);

      if (this.timeLeft <= 15)
        elTimeLeft.classList.add('out-of-time');
      else
        elTimeLeft.classList.remove('out-of-time');
    }
    this.draw();
  }

  start(levelDuration = 90000) {
    this.started = true;
    this.timeLeft = Math.floor(levelDuration / 1000);
    this.timeEnd = Date.now() + levelDuration;
  }

  applyBonusPointsForTimeLeft() {
    if (this.timeLeft > 0) {
      setTimeout(() => {
        this.addPoints({ action: ACTIONS.REMAININGSECOND, times: 1, show: false })
        playAudio(audioStore.whisleEffect)
        this.timeLeft = Math.floor(this.timeLeft - 1);
        this.applyBonusPointsForTimeLeft();
      }, 100);
    }
  }


  finish() {
    this.started = false;
  }

  addPoints({ action = ACTIONS.STOMPMONSTER, times = 1, show = true, position = { x: 0, y: 0 } }) {
    if (show) {
      effects.push(new PointEffect({ position, value: action.points * times }));
      if (action === ACTIONS.ONEUP) effects.push(new PointEffect({ position: { x: position.x + 10, y: position.y - 20 }, value: '1UP' }));
    }
    this.points += action.points * times;
  }

  addLives(plusLives) {
    this.lives += plusLives
    playAudio(audioStore.oneLiveUpEffect);
  }

  addTreats(plusTreats) {
    this.treats += plusTreats
    playAudio(audioStore.whisleEffect);

    if (this.treats >= this.treatsToGetLive) {
      this.addLives(Math.floor(this.treats / this.treatsToGetLive));
      this.treats = this.treats % this.treatsToGetLive;
    }
  }

  draw() {
    elTreats.textContent = this.treats;
    elLives.textContent = this.lives;
    elPoints.textContent = this.points;
    const timeMilitarFormat = '' + (10000 + Math.floor(this.timeLeft / 60) * 100 + this.timeLeft % 60);
    elTimeLeft.textContent = timeMilitarFormat.substring(1, 3) + ":" + timeMilitarFormat.substring(3, 5);
  }
}

class Effect {
  position = { x: 0, y: 0 };
  velocity = { x: 0, y: 0 };
  dimensions = { width: 20, height: 20 };
  sprite = null;
  run = 'once';

  constructor({
    position,
    velocity = { x: 0, y: 0 },
    dimensions = { width: 20, height: 20 },
    sprite = null,
    run = 'once',
    applyGravity = true
  }) {
    this.velocity = velocity;
    this.position = position;
    this.dimensions = dimensions;
    this.sprite = sprite;
    this.run = run;
    this.applyGravity = applyGravity;
  }

  update(fps) {
    if (this.applyGravity)
      this.velocity.y += (GRAVITY);
    this.position.y += (this.velocity.y);
    this.position.x += (this.velocity.x);

    if (this.run !== 'once-and-stay-in-last-frame' || (this.run === 'once-and-stay-in-last-frame' && this.sprite.framesCurrent + 1 !== this.sprite.framesCount))
      this.sprite.nextFrame(fps, 1);

    this.draw();

    if (
      this.position.x + this.dimensions.width - scrollX < 0 ||
      this.position.x - scrollX > canvas.width ||
      this.position.y > canvas.height ||
      (this.run === 'once' && this.sprite.framesCurrent + 1 === this.sprite.framesCount)
    ) {
      //if out of view or it showed all frames and it was runOnce then remove object 
      effects.splice(effects.indexOf(this), 1);
    }

  }

  draw() {
    this.sprite.draw({
      position: this.position,
      dimensions: this.dimensions
    });
  }

}

class PointEffect extends Effect {
  constructor({
    position,
    velocity = { x: 0.5, y: -1 },
    value,
    expireAfter = 1500,
  }) {
    super({
      position,
      velocity,
      dimensions: { width: 20, height: 20 },
      applyGravity: false
    });
    this.value = value;
    this.expireTime = Date.now() + expireAfter;
  }

  update() {
    if (this.applyGravity)
      this.velocity.y += (GRAVITY);
    this.position.y += (this.velocity.y);
    this.position.x += (this.velocity.x);

    if (Date.now() >= this.expireTime) {
      effects.splice(effects.indexOf(this), 1);
      return;
    }
    this.draw();
  }

  draw() {
    ctx.font = '7px "Press Start 2P"';
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.strokeStyle = 'rgba(128,128,128,0.5)'
    ctx.strokeText(this.value, this.position.x + 1 - scrollX, this.position.y + 1);
    ctx.fillText(this.value, this.position.x - scrollX, this.position.y);
  }

}

class Debris {
  position = { x: 0, y: 0 };
  velocity = { x: 0, y: 0 };
  dimensions = { width: 20, height: 20 };
  color = "lightbrown";
  img = null;

  constructor({
    position,
    velocity = { x: 0, y: 0 },
    dimensions = { width: 20, height: 20 },
    color = "lightbrown"
  }) {
    this.velocity = velocity;
    this.position = position;
    this.dimensions = dimensions;
    this.color = color;

    if (color === "lightbrown") {
      this.img = imageStore.debrisBrownBlock
    }

  }

  update(fps) {
    this.velocity.y += (GRAVITY),
      this.position.y += (this.velocity.y);
    this.position.x += (this.velocity.x);

    if (
      this.position.x + this.dimensions.width - scrollX < 0 ||
      this.position.x - scrollX > canvas.width ||
      this.position.y > canvas.height
    ) {
      //if out of view then destroy object
      debris.splice(debris.indexOf(this), 1);
    }

    this.draw();
  }

  draw() {
    if (
      this.position.x + this.dimensions.width - scrollX > 0 &&
      this.position.x - scrollX < canvas.width
    ) { // only draw if platform is visible in the screen
      if (this.img !== null) {
        ctx.drawImage(
          this.img,
          0,
          0,
          this.dimensions.width,
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
          this.dimensions.height,
          this.position.x - scrollX,
          this.position.y,
          this.dimensions.width,
          this.dimensions.height
        );
      }
    }
  }

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
      case color === "multitreat":
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
      case color === "treat":
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
      if (this.color === 'treat' || this.color === 'powerup' || this.color === '1up' || this.color === 'starhidden' || this.color === 'star') {
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
        } else if (this.color === 'treat') {
          const treatEffect = new Effect({
            position: { x: this.position.x, y: this.position.y - 50 },
            dimensions: { width: 50, height: 50 },
            velocity: { x: 0, y: -16 },
            run: 'once',
            sprite: new Sprite({
              img: imageStore.treat,
              framesCount: 11,
              position: { x: 0, y: 0 },
              offset: { x: 64, y: 0 },
              printOffset: { x: 0, y: 0 },
              dimensions: { width: 64, height: 64 },
              margin: { top: 7, bottom: 7, left: 7, right: 7 },
              framesRefreshFrequency: 2,
            })
          })
          effects.push(treatEffect);
          game.addTreats(1);
          game.addPoints({ action: ACTIONS.COLLECTTREAT, position: { x: this.position.x + 15, y: this.position.y - 20 } });
        }
        // if 1up - create 1up on top of platform and add to powerup array, play sound
        // if star or starhidden - create 1up on top of platform and add to powerup array, play sound
        this.color = 'disabled'
        this.img = imageStore.disabledBlock;
      }
      if (this.color === 'multitreat') {
        const treatEffect = new Effect({
          position: { x: this.position.x, y: this.position.y - 50 },
          dimensions: { width: 50, height: 50 },
          velocity: { x: 0, y: -16 },
          run: 'once',
          sprite: new Sprite({
            img: imageStore.treat,
            framesCount: 11,
            position: { x: 0, y: 0 },
            offset: { x: 64, y: 0 },
            printOffset: { x: 0, y: 0 },
            dimensions: { width: 64, height: 64 },
            margin: { top: 7, bottom: 7, left: 7, right: 7 },
            framesRefreshFrequency: 2,
          })
        })
        effects.push(treatEffect);
        game.addTreats(1);
        game.addPoints({ action: ACTIONS.COLLECTTREAT, position: { x: this.position.x + 15, y: this.position.y - 20 } });

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
          game.addPoints({ action: ACTIONS.BLOCKMONSTER, position: { x: monster.position.x, y: monster.position.y - 20 } });

          monster.die(() => monsters.splice(monsters.indexOf(monster), 1))
          break;
        }
      }
    }
  }

  update(fps) {
    this.velocity.y += GRAVITY,
      this.position.y += (this.velocity.y);
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


  setSprites() {
    switch (this.color) {
      case 'cat-with-roomba':
        this.sprites = {
          runRight: new Sprite({
            img: imageStore.monsterCatRoomba,
            framesCount: 4,
            position: { x: 0, y: 64 },
            offset: { x: 64, y: 0 },
            printOffset: { x: 0, y: 2 },
            dimensions: { width: 64, height: 64 },
            margin: { top: 0, bottom: 0, right: 9, left: 9 },
            framesFrequency: 3,
          }),
          runLeft: new Sprite({
            img: imageStore.monsterCatRoomba,
            framesCount: 4,
            position: { x: 0, y: 0 },
            offset: { x: 64, y: 0 },
            printOffset: { x: 0, y: 2 },
            dimensions: { width: 64, height: 64 },
            margin: { top: 0, bottom: 0, right: 9, left: 9 },
            framesFrequency: 3,
          })
        }
        break;
      case 'cat':
        this.sprites = {
          runRight: new Sprite({
            img: imageStore.monsterCatRoomba,
            framesCount: 4,
            position: { x: 0, y: 64 },
            offset: { x: 64, y: 0 },
            printOffset: { x: 0, y: 2 },
            dimensions: { width: 64, height: 64 - 16 },
            margin: { top: 0, bottom: 0, right: 9, left: 9 },
            framesFrequency: 3,
          }),
          runLeft: new Sprite({
            img: imageStore.monsterCatRoomba,
            framesCount: 4,
            position: { x: 0, y: 0 },
            offset: { x: 64, y: 0 },
            printOffset: { x: 0, y: 2 },
            dimensions: { width: 64, height: 64 - 16 },
            margin: { top: 0, bottom: 0, right: 9, left: 9 },
            framesFrequency: 3,
          })
        }
        break;
      default:
        this.sprites = {
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
          })
        }
    }

    this.sprite = this.sprites.runLeft;

  }

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
    this.stomped = false;
    this.setSprites();

  }

  update(fps) {
    if (this.isDying) {

      if (!this.stomped) {
        this.position.y += (this.velocity.y);
        this.velocity.y += (GRAVITY);
      }

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

    this.sprite.nextFrame(fps, 1);

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

    this.position.y += (this.velocity.y);
    this.velocity.y += (GRAVITY);

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

    this.position.x += (this.velocity.x);

    this.draw();
  }

  draw() {
    //draw only if it is in canvas window
    if (
      this.position.x + this.dimensions.width - scrollX > 0 &&
      this.position.x - scrollX < canvas.width
    ) {
      if (!this.sprite) {
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

  stompedByPlayer() {
    this.die(() => monsters.splice(monsters.indexOf(this), 1), true);
    return COLLISIONRESULT.NOHIT
  }

  collisionByPlayer() {
    return COLLISIONRESULT.TAKEHIT
  }

  die(cb, stomped = false) {
    playAudio(audioStore.monsterStompEffect);
    this.isAlive = false;
    this.isDying = true;
    this.stomped = stomped;

    if (this.color === "cat-with-roomba") {
      if (this.stomped) {
        this.dimensions.height = this.dimensions.height - 16 //remove roomba height
        this.color = "cat"
        this.setSprites();
        // add the roomba as new monster
        monsters.push(new MonsterRoomba({
          position: { x: this.position.x, y: this.position.y + this.dimensions.height - 16 },
          dimensions: { width: this.dimensions.width, height: 16 },
          velocity: { x: 0, y: 0 },
          color: 'roomba'
        }));

      }
      this.stomped = false
      this.velocity.y = -10; //make the monster jump and later fall
      this.dimensions.height = -this.dimensions.height  //invert sprite vertically
      setTimeout(cb, 2000);
      return;
    }


    if (stomped && this.color === 'brown') {
      this.position.x -= 5;
      this.dimensions.width += 10;
      this.position.y = this.position.y + this.dimensions.height - 10;
      this.dimensions.height = 10;
      setTimeout(cb, 250);
    } else {
      this.stomped = false
      this.velocity.y = -10; //make the monster jump and later fall
      this.dimensions.height = -this.dimensions.height  //invert sprite vertically
      setTimeout(cb, 2000);
    }
  }

}

class MonsterRoomba extends Monster {
  setSprites() {
    this.sprites = {
      runRight: new Sprite({
        img: imageStore.monsterCatRoomba,
        framesCount: 4,
        position: { x: 0, y: 64 + 49 },
        offset: { x: 64, y: 0 },
        printOffset: { x: 0, y: 2 },
        dimensions: { width: 64, height: 16 },
        margin: { top: 0, bottom: 0, right: 9, left: 9 },
        framesFrequency: 3,
      }),
      runLeft: new Sprite({
        img: imageStore.monsterCatRoomba,
        framesCount: 4,
        position: { x: 0, y: 0 + 49 },
        offset: { x: 64, y: 0 },
        printOffset: { x: 0, y: 2 },
        dimensions: { width: 64, height: 16 },
        margin: { top: 0, bottom: 0, right: 9, left: 9 },
        framesFrequency: 3,
      })
    }
    this.sprite = this.sprites.runLeft;
  }

  update(fps) {
    super.update(fps);

    //check collision with other monsters
    for (let i = 0; i < monsters.length; i++) {
      const monster = monsters[i];
      // if monster is close to become visible
      if (monster.position.x + monster.dimensions.width - scrollX > - canvas.width / 3 &&
        monster.position.x - scrollX < canvas.width + canvas.width / 3)
        if (
          monster !== this &&
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
          game.addPoints({ action: ACTIONS.ROOMBAMONSTER, position: { x: monster.position.x, y: monster.position.y - 20 } });
          monster.die(() => monsters.splice(monsters.indexOf(monster), 1));
        }
    }

  }

  draw() {
    super.draw();
  }

  stompedByPlayer() {
    if (this.velocity.x !== 0) {
      this.velocity.x = 0;
      game.addPoints({ action: ACTIONS.STOMPMONSTER, position: { x: this.position.x, y: this.position.y - 20 } });
    } else {
      if (player.position.x + player.dimensions.width / 2 < this.position.x + this.dimensions.width / 2)
        this.velocity.x = 10
      else
        this.velocity.x = -10;
      game.addPoints({ action: ACTIONS.KICKROOMBA, position: { x: this.position.x, y: this.position.y - 20 } });
    }
    return COLLISIONRESULT.NOHIT
  }

  collisionByPlayer() {
    if (this.velocity.x !== 0)
      return COLLISIONRESULT.TAKEHIT;

    if (player.position.x + player.dimensions.width / 2 < this.position.x + this.dimensions.width / 2)
      this.velocity.x = 10
    else
      this.velocity.x = -10
    game.addPoints({ action: ACTIONS.KICKROOMBA, position: { x: this.position.x, y: this.position.y - 20 } });
    return COLLISIONRESULT.NOHIT;

  }

  die(cb, stomped = false) {
    playAudio(audioStore.monsterStompEffect);
    this.isAlive = false;
    this.isDying = true;
    this.stomped = false
    this.velocity.y = -10; //make the monster jump and later fall
    this.dimensions.height = -this.dimensions.height  //invert sprite vertically
    setTimeout(cb, 2000);
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
  margin = { top: 0, right: 0, left: 0, bottom: 0 };

  constructor({
    img,
    framesCount,
    position,
    offset,
    dimensions,
    framesRefreshFrequency = 5,
    printOffset = { x: 0, y: 0 },
    margin = { top: 0, right: 0, left: 0, bottom: 0 }
  }) {
    this.img = img;
    this.framesCount = framesCount;
    this.position = position;
    this.offset = offset;
    this.dimensions = dimensions;
    this.framesRefreshFrequency = framesRefreshFrequency;
    this.margin = margin;
    this.printOffset = printOffset;
  }

  draw({ position, dimensions, growingHeight = null, offsetMode = 0 }) {

    if (growingHeight === null) {
      growingHeight = dimensions.height;
    }

    const growingHeightCalc = this.dimensions.height * growingHeight / dimensions.height;

    //factors used to flip sprite horizontally or vertically based on negative dimensions
    const factorX = Math.sign(dimensions.width);
    const factorY = Math.sign(dimensions.height);


    //calculate where to print full sprite based on sprite size, margins, and object -player, monster, etc- size
    const srcImgX = this.position.x + this.offset.x * this.framesCurrent + offsetMode;
    const srcImgY = this.position.y + this.offset.y * this.framesCurrent;
    const srcImgWidth = this.dimensions.width;
    const srcImgHeight = growingHeightCalc;
    const destX = factorX * (position.x - scrollX + this.printOffset.x);
    const destY = factorY * (position.y + this.printOffset.y + dimensions.height - growingHeight);
    const destWidth = dimensions.width;
    const destHeight = growingHeight;

    const imgWithinSpriteWidth = srcImgWidth - this.margin.left - this.margin.right;
    const imgWithinSpriteHeight = srcImgHeight - this.margin.top - this.margin.bottom;

    const destMarginLeft = this.margin.left * dimensions.width / imgWithinSpriteWidth
    const destMarginRight = this.margin.right * dimensions.width / imgWithinSpriteWidth
    const destMarginTop = this.margin.top * dimensions.height / imgWithinSpriteHeight
    const destMarginBottom = this.margin.bottom * dimensions.height / imgWithinSpriteHeight

    ctx.save();

    if (factorX < 0 || factorY < 0) {
      ctx.scale(factorX, factorY);
    }

    ctx.drawImage(
      this.img,
      Math.ceil(srcImgX),
      Math.ceil(srcImgY),
      Math.ceil(srcImgWidth),
      Math.ceil(srcImgHeight),
      Math.ceil(destX - destMarginLeft),
      Math.ceil(destY - destMarginTop),
      Math.ceil(destWidth + destMarginLeft + destMarginRight),
      Math.ceil(destHeight + destMarginTop + destMarginBottom)
    );

    ctx.restore();

  }

  nextFrame(fps, speedBooster) {
    this.framesRefreshCount += 1;
    if (this.framesRefreshCount > this.framesRefreshFrequency / speedBooster) {
      this.framesRefreshCount = 0;
      this.framesCurrent = (this.framesCurrent + 1) % this.framesCount;
    }
  }
}

class Player {
  constructor() {
    this.position = { x: 150, y: 450 };
    this.velocity = { x: 0, y: 0 };
    this.dimensions = { width: 40, height: 40 };
    this.resizeDimensions = { ...this.dimensions };
    this.direction = "right";
    this.isJumping = true;
    this.isAlive = true;
    this.coolingDown = false;
    this.isDiying = false;
    this.hasWon = false;
    this.isWinning = false;
    this.powers = PLAYER_POWERS.NONE;
    this.isInvincible = false
    this.offsetModes = {
      none: 0,
      super: 192,
      fireball: 192 * 2,
      invincible: 192 * 3
    }
    this.sprites = {
      runRight: new Sprite({
        img: imageStore.player,
        framesCount: 2,
        position: { x: 0, y: 0 },
        offset: { x: 128, y: 0 },
        printOffset: { x: 0, y: 2 },
        dimensions: { width: 64, height: 64 },
        margin: { top: 22, right: 11, bottom: 0, left: 11 }
      }),
      runLeft: new Sprite({
        img: imageStore.player,
        framesCount: 2,
        position: { x: 0, y: 64 },
        offset: { x: 128, y: 0 },
        printOffset: { x: 0, y: 2 },
        dimensions: { width: 64, height: 64 },
        margin: { top: 22, right: 11, bottom: 0, left: 11 }
      }),
      standRight: new Sprite({
        img: imageStore.player,
        framesCount: 3,
        position: { x: 0, y: 4 * 64 },
        offset: { x: 64, y: 0 },
        printOffset: { x: 0, y: 2 },
        dimensions: { width: 64, height: 64 },
        margin: { top: 22, right: 11, bottom: 0, left: 11 }
      }),
      standLeft: new Sprite({
        img: imageStore.player,
        framesCount: 3,
        position: { x: 0, y: 5 * 64 },
        offset: { x: 64, y: 0 },
        printOffset: { x: 0, y: 2 },
        dimensions: { width: 64, height: 64 },
        margin: { top: 22, right: 11, bottom: 0, left: 11 }
      }),
      jumpRight: new Sprite({
        img: imageStore.player,
        framesCount: 1,
        position: { x: 0, y: 6 * 64 },
        offset: { x: 64, y: 0 },
        printOffset: { x: 0, y: 2 },
        dimensions: { width: 64, height: 64 },
        margin: { top: 22, right: 11, bottom: 0, left: 11 }
      }),
      jumpLeft: new Sprite({
        img: imageStore.player,
        framesCount: 1,
        position: { x: 0, y: 7 * 64 },
        offset: { x: 64, y: 0 },
        printOffset: { x: 0, y: 2 },
        dimensions: { width: 64, height: 64 },
        margin: { top: 22, right: 11, bottom: 0, left: 11 }
      }),
      fallRight: new Sprite({
        img: imageStore.player,
        framesCount: 1,
        position: { x: 64, y: 6 * 64 },
        offset: { x: 64, y: 0 },
        printOffset: { x: 0, y: 2 },
        dimensions: { width: 64, height: 64 },
        margin: { top: 22, right: 11, bottom: 0, left: 11 }
      }),
      fallLeft: new Sprite({
        img: imageStore.player,
        framesCount: 1,
        position: { x: 64, y: 7 * 64 },
        offset: { x: 64, y: 0 },
        printOffset: { x: 0, y: 2 },
        dimensions: { width: 64, height: 64 },
        margin: { top: 22, right: 11, bottom: 0, left: 11 }
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
    if (this.powers === PLAYER_POWERS.FIREBALL && !this.coolingDown && !this.poweringDown) {
      if (this.direction === 'right') {
        fireballs.push(new FireBall({
          position: { x: this.position.x + this.dimensions.width - 12, y: this.position.y + this.dimensions.height / 3 },
          dimensions: { width: 12, height: 12 },
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
          position: { x: this.position.x - 6, y: this.position.y + this.dimensions.height / 3 },
          dimensions: { width: 12, height: 12 },
          velocity: { x: -13, y: 4 },
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
      }, 1000);
    }
  }

  update(fps) {
    if (this.isDying) {
      this.velocity.y += (GRAVITY);
      this.position.y += (this.velocity.y);
      this.draw();
    }

    if (!this.isAlive) return;

    if (this.hasWon) return;

    if (this.isWinning) {
      if (this.position.x < teepeeX + imageStore.teepee.width / 2 - this.dimensions.width / 2) {
        this.velocity.x = 5;
      } else {
        this.velocity.x = 0;
        effects.push(new Effect({
          position: { x: teepeeX + imageStore.teepee.width / 2 - (this.dimensions.width / 2), y: 500 - this.dimensions.height },
          dimensions: { width: this.dimensions.width, height: this.dimensions.height },
          velocity: { x: 0, y: 0 },
          run: 'once-and-stay-in-last-frame',
          applyGravity: false,
          sprite: new Sprite({
            img: imageStore.enterTeepee,
            framesCount: 9,
            position: { x: 0, y: 0 },
            offset: { x: 64, y: 0 },
            printOffset: { x: 0, y: 2 },
            dimensions: { width: 64, height: 64 },
            margin: { top: 22, bottom: 0, left: 11, right: 11 },
            framesRefreshFrequency: 12,
          })
        }));
        //add front of Teepee as top layer to create illusion of entering the Teepee
        effects.push(new Effect({
          position: { x: teepeeX, y: 504 - imageStore.teepeeFront.height },
          dimensions: { width: imageStore.teepeeFront.width, height: imageStore.teepeeFront.height },
          velocity: { x: 0, y: 0 },
          run: 'once-and-stay-in-last-frame',
          applyGravity: false,
          sprite: new Sprite({
            img: imageStore.teepeeFront,
            framesCount: 1,
            position: { x: 0, y: 0 },
            offset: { x: 0, y: 0 },
            printOffset: { x: 0, y: 0 },
            dimensions: { width: imageStore.teepeeFront.width, height: imageStore.teepeeFront.height },
            margin: { top: 0, bottom: 0, left: 0, right: 0 },
            framesRefreshFrequency: 1,
          })
        }));
        setTimeout(() => {
          game.applyBonusPointsForTimeLeft();
        }, 2000);
        this.hasWon = true;
        return;
      }
    }

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

    this.sprite.nextFrame(fps, speedBooster);

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
        (rectCollision( // head
          this.position.x + (this.direction === 'right' ? this.dimensions.width / 2 : 0),
          this.position.y + this.velocity.y,
          this.dimensions.width / 2,
          this.dimensions.height / 2,
          platform.position.x,
          platform.position.y,
          platform.dimensions.width,
          platform.dimensions.height
        ) ||
          rectCollision( // body
            this.position.x,
            this.position.y + this.dimensions.height / 2 + this.velocity.y,
            this.dimensions.width,
            this.dimensions.height / 2,
            platform.position.x,
            platform.position.y,
            platform.dimensions.width,
            platform.dimensions.height
          ))
      ) {
        if (this.position.y > platform.position.y) {
          this.position.y = platform.position.y + platform.dimensions.height;

          platform.hitByPlayer(this.powers, 'bottom');
          if (this.powers !== PLAYER_POWERS.NONE && platform.color === "lightbrown" && !this.poweringDown) {
            debris.push(new Debris({
              position: { x: platform.position.x, y: platform.position.y },
              velocity: { x: -4, y: -20 },
              dimensions: { width: 16, height: 16 },
              color: "lightbrown"
            }));
            debris.push(new Debris({
              position: { x: platform.position.x + platform.dimensions.width - 16, y: platform.position.y },
              velocity: { x: 4, y: -20 },
              dimensions: { width: 16, height: 16 },
              color: "lightbrown"
            }));
            debris.push(new Debris({
              position: { x: platform.position.x, y: platform.position.y + platform.dimensions.height - 16 },
              velocity: { x: -4, y: -10 },
              dimensions: { width: 16, height: 16 },
              color: "lightbrown"
            }));
            debris.push(new Debris({
              position: { x: platform.position.x + platform.dimensions.width - 16, y: platform.position.y + platform.dimensions.height - 16 },
              velocity: { x: 4, y: -10 },
              dimensions: { width: 16, height: 16 },
              color: "lightbrown"
            }));
            game.addPoints({ action: ACTIONS.BREAKBLOCK, position: { x: platform.position.x, y: platform.position.y - 20 } });
            platforms.splice(i, 1);
          }
        }
        this.velocity.y = 0;
        break;
      }
    }

    this.position.y += (this.velocity.y);
    this.velocity.y += (GRAVITY);

    // check collissions with platforms horizontally
    for (let i = 0; i < platforms.length; i++) {
      const platform = platforms[i];
      if (
        platform.visible &&
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
        if (this.isInvincible) {
          game.addPoints({ action: ACTIONS.INVINCIBLEMONSTER, position: { x: monster.position.x, y: monster.position.y - 20 } });
          monster.die(() => monsters.splice(monsters.indexOf(monster), 1));
        }
        else if (this.position.y + this.dimensions.height <
          monster.position.y + 2 * monster.dimensions.height / 3 &&
          this.velocity.y > 0
        ) {
          // Player stomp on top of monster
          game.addPoints({ action: ACTIONS.STOMPMONSTER, position: { x: monster.position.x, y: monster.position.y - 20 } });
          monster.stompedByPlayer();
          this.velocity.y = -10
        }
        else {
          // Player hit from bottom or side the monster
          if (monster.collisionByPlayer() === COLLISIONRESULT.TAKEHIT) {
            if (this.powers === PLAYER_POWERS.NONE && !this.poweringDown)
              this.die(() => {
                alert("you lose!");
                location.reload(false);
              });
            else {
              this.poweringDown = true;
              this.powers = PLAYER_POWERS.NONE;
              this.resizeDimensions = { width: 40, height: 40 }
              setTimeout(() => {this.poweringDown = false }, 1500);
            }
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
              this.resizeDimensions = { width: 48, height: 48 }
            }
            playAudio(audioStore.powerUpAppliedEffect);
            game.addPoints({ action: ACTIONS.COLLECTPOWERUP, position: { x: this.position.x, y: this.position.y - 20 } });
            break;
          case PLAYER_POWERS.FIREBALL:
            if (this.powers === PLAYER_POWERS.NONE || this.powers === PLAYER_POWERS.SUPER) {
              this.powers = PLAYER_POWERS.FIREBALL
              this.resizeDimensions = { width: 48, height: 48 }
            }
            playAudio(audioStore.powerUpAppliedEffect);
            game.addPoints({ action: ACTIONS.COLLECTPOWERUP, position: { x: this.position.x, y: this.position.y - 20 } });
            break;
          case PLAYER_POWERS.INVINCIBLE:
            //dont play power up effect, just accelerate bacgkround music
            this.isInvincible = true;
            game.addPoints({ action: ACTIONS.COLLECTPOWERUP, position: { x: this.position.x, y: this.position.y - 20 } });
            audioStore.backgroundMusic.playbackRate = 1.5
            setTimeout(() => {
              audioStore.backgroundMusic.playbackRate = 0.75
            }, 6500);
            setTimeout(() => {
              this.isInvincible = false;
              audioStore.backgroundMusic.playbackRate = 1
            }, 8000);
            break;
          case PLAYER_POWERS.ONEUP:
            game.addPoints({ action: ACTIONS.ONEUP, position: { x: this.position.x, y: this.position.y - 20 } });
            game.addLives(1);
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

    // check move beyond end of map
    if (this.position.x + this.velocity.x + this.dimensions.width > game.map.end) {
      this.velocity.x = 0;
    }

    this.position.x += (this.velocity.x);

    this.draw();
  }

  draw() {

    let mode = this.powers;
    if (this.isInvincible)
      mode = 'invincible';

    if (this.sprite) {
      if (!this.poweringDown || this.sprite.framesRefreshCount % 4 !== 0)
        this.sprite.draw({
          position: this.position,
          dimensions: this.dimensions,
          offsetMode: this.offsetModes[mode]
        });
    }
  }

  win() {
    this.isWinning = true;
  }

  die(cb) {
    audioStore.backgroundMusic.pause();
    audioStore.loseMusic.play();
    this.isAlive = false;
    this.isDying = true;
    this.velocity.y = -20;
    this.dimensions.height = -this.dimensions.height  //invert sprite vertically
    this.sprite = this.sprites.standLeft;
    setTimeout(cb, 2000);
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

const game = new Game();
const player = new Player();
const debris = [];
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
    color: 'treat'
  }),
  new Platform({
    position: { x: 650, y: 100 },
    dimensions: { width: 50, height: 50 },
    collisions: { horizontal: true, vertical: true },
    color: 'treat'
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
    color: 'treat'
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
    color: 'multitreat'
  }),
  new Platform({
    position: { x: 2650 + 23 * 50, y: 100 },
    dimensions: { width: 50, height: 50 },
    color: 'treat'
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
    color: 'treat'
  }),
  new Platform({
    position: { x: 2650 + 37 * 50, y: 300 },
    dimensions: { width: 1 * 50, height: 50 },
    color: 'treat'
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
    color: 'treat'
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
    color: 'treat'
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
    color: 'treat'
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

const effects = [];

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
    position: { x: 4400, y: 500 - 64 },
    dimensions: { width: 46, height: 64 },
    color: "cat-with-roomba",
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

let lastAnimationFrameTime = Date.now();
let realLastTime = Date.now();

function animate(newTimestamp) {
  canvas.width = 960;
  canvas.height = 540;

  const expectedFPS = 60;

  const now = newTimestamp

  let deltaTime = 1000 / expectedFPS;

  if (newTimestamp !== 0)
    deltaTime = now - lastAnimationFrameTime

  lastAnimationFrameTime = newTimestamp

  fps = 1;

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

  platforms.forEach((platform) => platform.update(fps));
  //Teepee
  teepeeX = game.map.end - canvas.width / 3 - imageStore.teepee.width / 2;
  if (teepeeX + imageStore.teepee.width - scrollX > 0 && teepeeX - scrollX < canvas.width) {
    ctx.drawImage(
      imageStore.teepee,
      teepeeX - scrollX,
      504 - imageStore.teepee.height,
      imageStore.teepee.width,
      imageStore.teepee.height);
  }

  powerUps.forEach((powerUp) => powerUp.update(fps));
  player.update(fps);
  fireballs.forEach((fireball) => fireball.update(fps));
  monsters.forEach((monster) => monster.update(fps));
  debris.forEach((debris_one) => debris_one.update(fps));
  effects.forEach((effect) => effect.update(fps));
  game.update();

  //adjust scroll right side
  if (player.position.x - scrollX > canvas.width / 2) {
    scrollX = (player.position.x - canvas.width / 2);
    if (scrollX > game.map.end - canvas.width) scrollX = game.map.end - canvas.width
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
    (player.position.y + player.dimensions.height / 2 > canvas.height ||
      game.timeLeft === 0) &&
    player.isAlive && !player.isWinning && !player.hasWon
  ) {
    game.finish();
    player.die(() => {
      alert("you lose!");
      location.reload(false);
    });
  }

  //check for winning condition
  if (
    player.position.x > game.map.end - canvas.width &&
    player.isAlive &&
    !player.hasWon &&
    !player.isWinning
  ) {
    game.finish();
    audioStore.winJingle.play();
    audioStore.backgroundMusic.pause();
    //debugger;
    game.addPoints({
      action: ACTIONS.FINISHLEVELHEIGHT,
      position: { x: player.position.x, y: Math.max(player.position.y - 20, 100) },
      times: Math.floor((canvas.height - player.position.y) / 5)
    });
    player.win();
  }



  requestAnimationFrame(animate);
}

addEventListener("keydown", ({ key }) => {
  switch (key) {
    case "w":
    case "W":
    case "ArrowUp":
      if (!player.isJumping && (player.velocity.y == GRAVITY || player.velocity.y == GRAVITY)) {
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

  update(fps) {

    this.framesCountToActivate += 1;
    if (this.framesCountToActivate >= this.activationFrames) {
      this.isActivated = true;
    }

    if (this.isActivated) {

      if (this.sprite !== null) this.sprite.nextFrame(fps, 1);

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

  update(fps) {

    if (this.sprite !== null) this.sprite.nextFrame(fps, 1);

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

      this.position.y += (this.velocity.y);
      this.velocity.y += (GRAVITY);

      // check colission with monsters
      for (let i = 0; i < monsters.length; i++) {
        const monster = monsters[i];
        if (
          monster.isActivated &&
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
          game.addPoints({ action: ACTIONS.FIREBALLMONSTER, position: { x: monster.position.x, y: monster.position.y - 20 } });
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


      this.position.x += (this.velocity.x);
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
    if (hitBlock &&
      this.position.x + this.dimensions.width - scrollX > 0 &&
      this.position.x - scrollX < canvas.width &&
      this.position.y < canvas.height) {
      playAudio(audioStore.fireballHitBlockEffect);
    }
    this.isAlive = false;
    this.isDying = true;
    if (this.sprites.explote) this.sprite = this.sprites.explote
    setTimeout(cb, 300);
  }

}



