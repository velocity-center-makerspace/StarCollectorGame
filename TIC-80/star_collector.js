// title:   Star Collector
// author:  Jack Gaskins, makerspace@csmd.edu
// desc:    collect stars with your rocket, but watch out for asteroids!
// site:    https://www.csmd.edu/makerspace
// license: MIT License
// version: 1.0
// script:  js

//  EDITABLE CONSTANTS
const PLAYER_SPEED = 3; // will be divided by delta
const ITEM_SPEED = 3; // movement per SPAWN_TIME
const MAX_SPAWNED = 16; // maximum spawned
const SPAWN_TIME = 250; // how often an item should spawn in ms
const POINTS_PER_STAR = 1;

const STARTING_LIVES = 3;
const LIVES_LOST_PER_ASTEROID = 1;
let lives = STARTING_LIVES;

// COLORS
const NIGHT = 0;
const PURPLE = 1;
const RED = 2;
const ORANGE = 3;
const YELLOW = 4;
const LIME = 5;
const GREEN = 6;
const TEAL = 7;
const NAVY = 8;
const BLUE = 9;
const SKY = 10;
const CYAN = 11;
const WHITE = 12;
const LIGHT_GRAY = 13;
const MID_GRAY = 14;
const DARK_GRAY = 15;

// DO NOT DELETE OR CHANGE CONSTANTS BELOW THIS COMMENT
let delta = 0; // represents tick per frame
let started = false;
let score = 0;
let lastSpawn = 0;

const SCREEN_WIDTH = 240;
const SCREEN_HEIGHT = 136;
const CENTER_X = SCREEN_WIDTH / 2;
const CENTER_Y = SCREEN_HEIGHT / 2;
const TEXT_SIZE = 6;

// KEYS
const SPACE = 48;
const A = 1;
const D = 4;
const LEFT = 60;
const RIGHT = 61;

// SPRITES
var FALLING_ITEMS = [];

const ROCKET = {
  id: 256,
  size: 32,
  hbx: 0,
};
// add hitbox width and height because can't use 'this' in object literal
ROCKET.hbw = ROCKET.size - 2 * (ROCKET.size / 4);
ROCKET.hbh = ROCKET.size - ROCKET.size / 4;

const STAR = {
  id: 260,
  size: 16,
};

const ASTEROID = {
  id: 262,
  size: 16,
};

const HEART = {
  id: 264,
  size: 8,
};

// ROCKET POSITION
const ROCKET_Y = SCREEN_HEIGHT - ROCKET.size;
let ROCKET_X = CENTER_X - ROCKET.size / 2;

const assert = (expr, msg) => {
  if (typeof expr == "boolean") {
    if (expr) {
      return;
    }

    trace(msg.toString(), RED);
    exit();
    return;
  }

  let err = "cannot assert non-boolean expression";

  trace(err, RED);
  exit();
  return;
};

// map() remap callback in JavaScript receives (tile,x,y) and returns tile or [tile,flip,rotate].

function TIC() {
  let GAME_OVER = lives <= 0; // game over condition

  if (key(SPACE) && !started) {
    lastSpawn = time();
    started = true;
  }

  if (!started) {
    showStart("STAR COLLECTOR");
  }

  if (started && !GAME_OVER) {
    runGame();
  }

  if (started && GAME_OVER) {
    gameOver();
    if (key(SPACE) && started) {
      started = false;
      lives = STARTING_LIVES;
      score = 0;
    }
  }

  // NOTE: use for debugging
  /* if (delta % 60 == 0) {
    trace(`Lives: ${lives}, GAME_OVER: ${GAME_OVER}`);
  } */

  delta++;
}

function showStart(text) {
  assert(typeof text == "string", "non-string passed to showStart");

  let x = CENTER_X - (text.length * TEXT_SIZE) / 2;
  let y = CENTER_Y - TEXT_SIZE / 2;

  cls(CYAN);
  print(text, x, y);

  let startText = "PRESS SPACE TO START";
  x = CENTER_X - (startText.length * TEXT_SIZE) / 2;
  y += TEXT_SIZE + 2;
  print(startText, x, y);
}

function runGame() {
  cls(NIGHT);
  map();

  moveRocket();
  drawScore();
  drawHearts();
  addFallingItems();
}

function gameOver() {
  showGameOver("GAME OVER");
  lastSpawn = 0;
  FALLING_ITEMS = [];
  ROCKET_X = CENTER_X - ROCKET.size / 2;
}

function showGameOver(text) {
  assert(typeof text == "string", "non-string passed to showStart");

  let x = CENTER_X - (text.length * TEXT_SIZE) / 2;
  let y = CENTER_Y - TEXT_SIZE / 2;

  cls(CYAN);
  print(text, x, y, RED);

  let scoreText = `FINAL SCORE: ${score}`;
  x = CENTER_X - (scoreText.length * TEXT_SIZE) / 2;
  y += TEXT_SIZE + 2;
  print(scoreText, x, y);

  let continueText = "PRESS SPACE TO CONTINUE";
  x = CENTER_X - (continueText.length * TEXT_SIZE) / 2;
  y += TEXT_SIZE + 2;
  print(continueText, x, y);
}

function drawHearts() {
  let x = SCREEN_WIDTH - 1 - HEART.size;
  let y = 1;

  for (let i = 0; i < lives; i++) {
    drawSprite(HEART.id, HEART.size, x, y);
    x -= HEART.size + 1;
  }
}

function handleHit(id) {
  assert(
    id != ROCKET.id,
    "cannot pass rocket into handleHit; falling items ONLY",
  );

  if (id == STAR.id) {
    score += POINTS_PER_STAR;
    return;
  }

  if (id == ASTEROID.id) {
    lives -= LIVES_LOST_PER_ASTEROID;
    return;
  }
}

function addFallingItems() {
  if (FALLING_ITEMS.length < MAX_SPAWNED) {
    const items = [STAR, ASTEROID];
    let index = Math.floor(Math.random() * items.length);
    spawnItem(items[index]);
  }

  for (let i = 0; i < FALLING_ITEMS.length; i++) {
    FALLING_ITEMS[i].y += ITEM_SPEED;
  }

  // remove items
  FALLING_ITEMS = FALLING_ITEMS.filter(
    (item) => !item.isHit && item.y < SCREEN_HEIGHT + item.size,
  );

  for (const item of FALLING_ITEMS) {
    drawHitbox(item.hbx, item.y, item.hbw, item.hbh);
    drawSprite(item.id, item.size, item.x, item.y);
    hitsRocket(item);
    if (item.isHit) {
      handleHit(item.id);
    }
  }
}

function hitsRocket(item) {
  let LeftEdgeInRange =
    item.hbx >= ROCKET.hbx && item.hbx <= ROCKET.hbx + ROCKET.hbw;
  let RightEdgeInRange =
    item.hbx + item.hbw >= ROCKET.hbx &&
    item.hbx + item.hbw <= ROCKET.hbx + ROCKET.hbw;
  let XInRange = LeftEdgeInRange || RightEdgeInRange;

  let BottomEdgeInRange =
    item.y + item.hbh >= ROCKET_Y && item.y + item.hbh <= ROCKET_Y + ROCKET.hbh;
  let TopEdgeInRange = item.y >= ROCKET_Y && item.y <= ROCKET_Y + ROCKET.hbh;
  let YInRange = BottomEdgeInRange || TopEdgeInRange;

  if (XInRange && YInRange) {
    item.isHit = true;
  }
}

function spawnItem(item) {
  let x = item.size * randomSlot(item.size);
  let y = -item.size;
  let hbx = x + item.size / 4;
  let hbw = item.size - 2 * (item.size / 4);
  let hbh = item.size - item.size / 4;

  if (time() - lastSpawn >= SPAWN_TIME) {
    lastSpawn = time();

    drawHitbox(hbx, y, hbw, hbh);
    drawSprite(item.id, item.size, x, y);

    FALLING_ITEMS.push({
      id: item.id,
      size: item.size,
      x: x,
      y: y,
      hbx: hbx,
      hbw: hbw,
      hbh: hbh,
      isHit: false,
    });
  }
}

function randomSlot(size) {
  assert(typeof size == "number", "size of item must be number in randomSlot");
  assert(
    size >= 0,
    "negative number cannot not be passed as size in randomSlot",
  );

  let slots = Math.floor(SCREEN_WIDTH / size);

  return Math.floor(Math.random() * slots);
}

function drawScore() {
  let score_text = "SCORE: " + score;
  let x = 1;
  let y = 1;
  print(score_text, x, y, CYAN);
}

function moveRocket() {
  let x = ROCKET_X;

  if (key(A) || key(LEFT)) {
    x -= PLAYER_SPEED;
  }

  if (key(D) || key(RIGHT)) {
    x += PLAYER_SPEED;
  }

  ROCKET_X = Math.max(0, Math.min(SCREEN_WIDTH - ROCKET.size, x));
  ROCKET.hbx = ROCKET_X + ROCKET.size / 4;

  drawHitbox(ROCKET.hbx, ROCKET_Y, ROCKET.hbw, ROCKET.hbh);
  drawSprite(ROCKET.id, ROCKET.size, ROCKET_X, ROCKET_Y);
}

function drawHitbox(x, y, w, h) {
  let color = NIGHT;
  rect(x, y, w, h, color);
}

function drawSprite(id, rsize, x, y) {
  assert(
    typeof x == "number",
    "non-number cannot be used for sprite x-coordinate",
  );
  assert(
    typeof y == "number",
    "non-number cannot be used for sprite y-coordinate",
  );

  let size = rsize / 8;

  assert(size <= 16, "sprite size cannot exceed 16 blocks");

  let colorKey = 0; // transparency on NIGHT
  let scale = 1; // default
  let flip = 0; // no flip; default
  let rotate = 0; // no rotate; default

  spr(id, x, y, colorKey, scale, flip, rotate, size, size);
}
