const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const scoreEl = document.querySelector("#score");
const bestEl = document.querySelector("#best");
const finalScoreEl = document.querySelector("#finalScore");
const gameOverEl = document.querySelector("#gameOver");
const restartButton = document.querySelector("#restartButton");
const jumpButton = document.querySelector("#jumpButton");
const slowButton = document.querySelector("#slowButton");
const toneToggle = document.querySelector("#toneToggle");
const gameShell = document.querySelector(".game-shell");

const rabbitCharacter = new Image();
rabbitCharacter.src = "assets/sprites/rabbit_character.png";

const forestBackground = new Image();
forestBackground.src = "assets/sprites/forest_background_no_grass.png";

const grassLayer = new Image();
grassLayer.src = "assets/sprites/grass_layer.png";

const obstacleSprites = {
  hill: new Image(),
  anthill: new Image(),
};
obstacleSprites.hill.src = "assets/sprites/obstacle_hill.png";
obstacleSprites.anthill.src = "assets/sprites/obstacle_anthill.png";

const W = canvas.width;
const H = canvas.height;
const groundY = H * 0.78;
const storageKey = "rabbit-hills-best";
const toneStorageKey = "rabbit-hills-grayscale";
const backgroundLayer = {
  height: 680,
  bottomOffset: 88,
};
const grassLayerSettings = {
  speed: 1.18,
  alpha: 0.96,
  yOffset: 0,
};
const rabbitGroundY = groundY + 30;
const obstacleGroundY = groundY + 38;

const input = {
  jumpHeld: false,
  slowHeld: false,
};

const game = {
  running: true,
  time: 0,
  lastTime: 0,
  score: 0,
  best: Number(localStorage.getItem(storageKey) || 0),
  backgroundX: 0,
  nextHillAt: 1.15,
  hills: [],
  dust: [],
  rabbit: {
    x: W * 0.27,
    y: rabbitGroundY,
    vy: 0,
    width: 92,
    height: 132,
    onGround: true,
    jumpHold: 0,
  },
};

bestEl.textContent = game.best;
setGrayscale(localStorage.getItem(toneStorageKey) === "true");

function resetGame() {
  game.running = true;
  game.time = 0;
  game.lastTime = performance.now();
  game.score = 0;
  game.backgroundX = 0;
  game.nextHillAt = 1.15;
  game.hills = [];
  game.dust = [];
  game.rabbit.y = rabbitGroundY;
  game.rabbit.vy = 0;
  game.rabbit.onGround = true;
  game.rabbit.jumpHold = 0;
  scoreEl.textContent = "0";
  gameOverEl.classList.add("hidden");
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function spawnHill() {
  const anthill = Math.random() > 0.52;
  const width = anthill ? rand(104, 122) : rand(150, 182);
  const height = anthill ? rand(116, 136) : rand(66, 82);

  game.hills.push({
    x: W + width,
    y: obstacleGroundY,
    width,
    height,
    type: anthill ? "anthill" : "hill",
    collisionHeight: anthill ? height * 0.92 : height * 0.78,
    hitLeft: anthill ? 0.12 : 0.22,
    hitRight: anthill ? 0.86 : 0.78,
    passed: false,
    seed: Math.random() * 1000,
  });
}

function currentSpeed() {
  const base = 360 + Math.min(game.time * 8, 170);
  return input.slowHeld ? base * 0.58 : base;
}

function startJump() {
  const rabbit = game.rabbit;
  if (!game.running || !rabbit.onGround) return;
  rabbit.vy = -760;
  rabbit.onGround = false;
  rabbit.jumpHold = 0;
}

function endGame() {
  game.running = false;
  game.best = Math.max(game.best, game.score);
  localStorage.setItem(storageKey, String(game.best));
  bestEl.textContent = game.best;
  finalScoreEl.textContent = game.score;
  gameOverEl.classList.remove("hidden");
}

function update(dt) {
  if (!game.running) return;

  game.time += dt;
  const rabbit = game.rabbit;
  const speed = currentSpeed();
  game.backgroundX = (game.backgroundX + speed * 0.22 * dt) % 10000;

  if (!rabbit.onGround && input.jumpHeld && rabbit.jumpHold < 0.24 && rabbit.vy < -170) {
    rabbit.vy -= 930 * dt;
    rabbit.jumpHold += dt;
  }

  rabbit.vy += 1850 * dt;
  rabbit.y += rabbit.vy * dt;

  if (rabbit.y >= rabbitGroundY) {
    rabbit.y = rabbitGroundY;
    rabbit.vy = 0;
    rabbit.onGround = true;
    rabbit.jumpHold = 0;
  }

  game.nextHillAt -= dt;
  if (game.nextHillAt <= 0) {
    spawnHill();
    game.nextHillAt = rand(1.1, 1.75) - Math.min(game.time * 0.008, 0.28);
  }

  for (const hill of game.hills) {
    hill.x -= speed * dt;
    if (!hill.passed && hill.x + hill.width < rabbit.x - rabbit.width * 0.42) {
      hill.passed = true;
      game.score += 1;
      scoreEl.textContent = game.score;
    }
  }

  game.hills = game.hills.filter((hill) => hill.x + hill.width > -80);

  if (rabbit.onGround && Math.random() < 0.36) {
    game.dust.push({
      x: rabbit.x - 42,
      y: rabbitGroundY + rand(8, 20),
      r: rand(2, 5),
      life: rand(0.35, 0.65),
    });
  }

  for (const puff of game.dust) {
    puff.x -= speed * 0.45 * dt;
    puff.life -= dt;
  }
  game.dust = game.dust.filter((puff) => puff.life > 0);

  if (game.hills.some((hill) => hitsHill(rabbit, hill))) {
    endGame();
  }
}

function hitsHill(rabbit, hill) {
  const rabbitLeft = rabbit.x - rabbit.width * 0.34;
  const rabbitRight = rabbit.x + rabbit.width * 0.3;
  const rabbitFoot = rabbit.y - 8;
  const rabbitTop = rabbit.y - rabbit.height * 0.88;
  const hillLeft = hill.x + hill.width * hill.hitLeft;
  const hillRight = hill.x + hill.width * hill.hitRight;
  const hillTop = hill.y - hill.collisionHeight;

  const horizontal = rabbitRight > hillLeft && rabbitLeft < hillRight;
  const vertical = rabbitFoot > hillTop + 10 && rabbitTop < hill.y;
  return horizontal && vertical;
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawPaper();
  drawScrollingForest();
  drawGrassExtension();
  drawDust();
  for (const hill of game.hills) drawHill(hill);
  drawRabbit(game.rabbit);
  drawGrassForegroundLayer();
  if (!game.running) drawCrashMark(game.rabbit.x + 66, game.rabbit.y - 128);
}

function drawPaper() {
  ctx.fillStyle = "#f4eddc";
  ctx.fillRect(0, 0, W, H);

  ctx.globalAlpha = 0.1;
  for (let y = 0; y < H; y += 18) {
    pencilLine(0, y + Math.sin(y) * 2, W, y + Math.cos(y) * 2, "#866f55", 0.7);
  }
  ctx.globalAlpha = 1;
}

function drawScrollingForest() {
  if (forestBackground.complete && forestBackground.naturalWidth > 0) {
    drawScrollingBackgroundLayer(forestBackground);
    return;
  }

  ctx.save();
  ctx.globalAlpha = 0.78;
  blob(W * 0.72, H * 0.2, 250, 160, "#a9d4da", "#3f3a32", 2, -0.1);
  for (let i = 0; i < 10; i += 1) {
    const x = W * 0.47 + ((i * 71) % 300);
    const y = H * 0.07 + ((i * 49) % 250);
    blob(x, y, 42 + (i % 3) * 13, 20 + (i % 2) * 8, "#f0efe2", "#3f3a32", 1.5, i * 0.18);
  }
  ctx.restore();
  ctx.fillStyle = "#bdd486";
  ctx.beginPath();
  ctx.moveTo(0, groundY + 22);
  for (let x = 0; x <= W; x += 48) {
    ctx.lineTo(x, groundY + Math.sin((x + game.time * 30) / 65) * 8);
  }
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
  pencilLine(0, groundY + 7, W, groundY - 2, "#3f3a32", 3);
}

function drawGrassForegroundLayer() {
  if (!grassLayer.complete || grassLayer.naturalWidth === 0) return;

  drawScrollingBackgroundLayer(grassLayer, grassLayerSettings);
}

function drawScrollingBackgroundLayer(image, settings = {}) {
  const drawHeight = backgroundLayer.height;
  const drawWidth = drawHeight * (image.naturalWidth / image.naturalHeight);
  const bottom = groundY + backgroundLayer.bottomOffset;
  const y = bottom - drawHeight + (settings.yOffset || 0);
  const offset = (game.backgroundX * (settings.speed || 1)) % drawWidth;

  ctx.save();
  ctx.globalAlpha = settings.alpha ?? 1;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  for (let x = -offset - drawWidth; x < W + drawWidth; x += drawWidth) {
    ctx.drawImage(image, x, y, drawWidth, drawHeight);
  }

  ctx.restore();
}

function drawGrassExtension() {
  if (!grassLayer.complete || grassLayer.naturalWidth === 0) return;

  const drawHeight = backgroundLayer.height;
  const drawWidth = drawHeight * (grassLayer.naturalWidth / grassLayer.naturalHeight);
  const bottom = groundY + backgroundLayer.bottomOffset;
  const layerY = bottom - drawHeight + grassLayerSettings.yOffset;
  const sourceTop = grassLayer.naturalHeight * 0.76;
  const sourceHeight = grassLayer.naturalHeight * 0.2;
  const stripHeight = drawHeight * (sourceHeight / grassLayer.naturalHeight);
  const startY = layerY + drawHeight * 0.78;
  const bandStep = stripHeight * 0.08;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  for (let band = 0; startY + band * bandStep < H; band += 1) {
    const y = startY + band * bandStep;
    const depth = Math.min(1, (y - startY) / Math.max(1, H - startY));
    const speed = grassLayerSettings.speed + depth * 0.78;
    const offset = (game.backgroundX * speed) % drawWidth;
    const wave = Math.sin(game.time * 0.8 + band * 1.7) * 7;
    const sourceShift = (band % 4) * grassLayer.naturalHeight * 0.016;
    ctx.globalAlpha = 0.32 + depth * 0.24;

    for (let x = -offset - drawWidth; x < W + drawWidth; x += drawWidth) {
      ctx.drawImage(
        grassLayer,
        0,
        sourceTop + sourceShift,
        grassLayer.naturalWidth,
        sourceHeight,
        x + wave,
        y,
        drawWidth,
        stripHeight,
      );

      ctx.drawImage(
        grassLayer,
        0,
        sourceTop + sourceShift + grassLayer.naturalHeight * 0.028,
        grassLayer.naturalWidth,
        sourceHeight,
        x + drawWidth * 0.5 - wave,
        y + bandStep * 0.5,
        drawWidth,
        stripHeight,
      );
    }
  }

  ctx.restore();
}

function drawDust() {
  for (const puff of game.dust) {
    ctx.globalAlpha = Math.max(0, puff.life * 1.7);
    blob(puff.x, puff.y, puff.r * 3, puff.r * 1.6, "#d9c7a4", "#7a684f", 1, 0);
  }
  ctx.globalAlpha = 1;
}

function drawHill(hill) {
  ctx.save();
  ctx.translate(hill.x, hill.y);

  drawObstacleGroundShadow(hill);

  const sprite = obstacleSprites[hill.type];
  if (sprite.complete && sprite.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(sprite, 0, -hill.height, hill.width, hill.height);
    ctx.restore();
    return;
  }

  const fill = hill.type === "anthill" ? "#d99a47" : "#a7d86d";
  blob(hill.width / 2, -hill.height / 2, hill.width, hill.height, fill, "#3f3a32", 2.4, 0);
  ctx.restore();
}

function drawObstacleGroundShadow(hill) {
  ctx.save();
  ctx.globalAlpha = hill.type === "anthill" ? 0.2 : 0.16;
  ctx.fillStyle = "#5f6b35";
  ctx.beginPath();
  ctx.ellipse(hill.width * 0.5, -4, hill.width * 0.46, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRabbit(rabbit) {
  const t = game.time * (input.slowHeld ? 8 : 13);
  const stride = rabbit.onGround ? Math.max(0, Math.sin(t)) : 0;
  const crouch = rabbit.onGround ? Math.max(0, -Math.sin(t)) : 0;
  const hop = rabbit.onGround ? -stride * 13 + crouch * 2 : 0;
  const x = rabbit.x;
  const y = rabbit.y + hop;

  drawRabbitGroundShadow(rabbit, stride);

  ctx.save();
  ctx.translate(x, y);

  if (rabbitCharacter.complete && rabbitCharacter.naturalWidth > 0) {
    drawRabbitCharacterSprite(t, rabbit.onGround, rabbit.vy);
    ctx.restore();
    return;
  }

  ctx.rotate(rabbit.onGround ? Math.sin(t * 0.5) * 0.025 : -0.08);

  drawDrawnRabbitEars();
  drawDrawnRabbitBody(t, rabbit.onGround);
  drawDrawnRabbitHead();
  ctx.restore();
}

function drawRabbitGroundShadow(rabbit, stride) {
  const air = Math.max(0, rabbitGroundY - rabbit.y);
  const liftFade = Math.max(0.32, 1 - air / 220);

  ctx.save();
  ctx.globalAlpha = 0.16 * liftFade;
  ctx.fillStyle = "#5f6b35";
  ctx.beginPath();
  ctx.ellipse(rabbit.x, rabbitGroundY + 2, 42 - stride * 8, 10 - stride * 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRabbitCharacterSprite(t, onGround, vy) {
  const spriteHeight = 250;
  const spriteWidth = spriteHeight * (rabbitCharacter.naturalWidth / rabbitCharacter.naturalHeight);
  const stride = onGround ? Math.max(0, Math.sin(t)) : 0;
  const crouch = onGround ? Math.max(0, -Math.sin(t)) : 0;
  const squashX = onGround ? 1 + crouch * 0.045 - stride * 0.025 : 0.96;
  const squashY = onGround ? 1 - crouch * 0.035 + stride * 0.04 : 1.06;
  const tilt = onGround ? -0.07 + stride * 0.12 - crouch * 0.05 : Math.max(-0.18, Math.min(0.16, vy / 5200));

  ctx.save();
  ctx.rotate(tilt);
  ctx.scale(squashX, squashY);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(rabbitCharacter, -spriteWidth * 0.5, -spriteHeight + 12, spriteWidth, spriteHeight);
  ctx.restore();
}

function drawDrawnRabbitEars() {
  ctx.save();
  ctx.translate(0, -126);
  ctx.rotate(-0.08);

  drawPetalEar(-16, -14, 30, 126, -0.55);
  drawPetalEar(32, -14, 31, 132, 0.42);

  ctx.restore();
}

function drawPetalEar(x, y, width, height, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = "#edd8c8";
  ctx.strokeStyle = "#3f3a32";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.5);
  ctx.bezierCurveTo(-width * 0.7, height * 0.2, -width * 0.45, -height * 0.43, 0, -height * 0.5);
  ctx.bezierCurveTo(width * 0.6, -height * 0.38, width * 0.58, height * 0.18, 0, height * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f2b8ad";
  ctx.strokeStyle = "#b98683";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.34);
  ctx.bezierCurveTo(-width * 0.28, height * 0.08, -width * 0.2, -height * 0.3, 0, -height * 0.37);
  ctx.bezierCurveTo(width * 0.25, -height * 0.26, width * 0.22, height * 0.06, 0, height * 0.34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawDrawnRabbitBody(t, onGround) {
  const armSwing = onGround ? Math.sin(t) * 5 : -4;
  const legSwing = onGround ? Math.sin(t + Math.PI * 0.5) * 5 : -7;

  ctx.save();
  ctx.translate(0, -38);

  ctx.fillStyle = "#f6cfe0";
  ctx.strokeStyle = "#3f3a32";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-27, -24);
  ctx.lineTo(24, -22);
  ctx.lineTo(32, 36);
  ctx.bezierCurveTo(14, 48, -13, 48, -31, 35);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  pencilLine(-29, -13, -46, 12 + armSwing, "#3f3a32", 4);
  pencilLine(25, -12, 42, 10 - armSwing, "#3f3a32", 4);
  pencilLine(-14, 38, -21 + legSwing, 66, "#3f3a32", 4);
  pencilLine(12, 38, 22 - legSwing, 66, "#3f3a32", 4);
  blob(-25 + legSwing, 68, 24, 12, "#edd8c8", "#3f3a32", 2, -0.1);
  blob(25 - legSwing, 68, 24, 12, "#edd8c8", "#3f3a32", 2, 0.1);

  drawSmallCarrot();
  ctx.restore();
}

function drawSmallCarrot() {
  ctx.fillStyle = "#e88945";
  ctx.strokeStyle = "#3f3a32";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-6, -6);
  ctx.lineTo(7, -6);
  ctx.lineTo(0, 13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  pencilLine(-2, -9, -9, -17, "#3e7c4e", 2);
  pencilLine(2, -9, 9, -17, "#3e7c4e", 2);
  pencilLine(0, -9, 0, -18, "#3e7c4e", 2);
}

function drawDrawnRabbitHead() {
  ctx.save();
  ctx.translate(0, -118);

  blob(0, 0, 86, 74, "#efd8c7", "#3f3a32", 3.2, 0.02);

  // Маленькие неровные щечки и шерстка делают силуэт ближе к детскому рисунку.
  pencilLine(-36, -4, -48, 1, "#3f3a32", 3);
  pencilLine(36, -4, 48, 1, "#3f3a32", 3);
  pencilLine(-18, -34, -10, -43, "#3f3a32", 2.4);
  pencilLine(-7, -35, 0, -45, "#3f3a32", 2.4);

  blob(-19, -4, 18, 22, "#2c2b28", "#2c2b28", 1, -0.12);
  blob(18, -4, 18, 22, "#2c2b28", "#2c2b28", 1, 0.1);
  blob(-15, -10, 5, 6, "#fff8eb", "#fff8eb", 1, 0);
  blob(22, -10, 5, 6, "#fff8eb", "#fff8eb", 1, 0);

  blob(0, 13, 9, 7, "#3f3a32", "#3f3a32", 1, 0);
  pencilLine(-4, 21, 0, 25, "#3f3a32", 2);
  pencilLine(0, 25, 6, 21, "#3f3a32", 2);

  pencilLine(-36, 8, -61, 3, "#3f3a32", 1.4);
  pencilLine(-36, 15, -63, 17, "#3f3a32", 1.4);
  pencilLine(36, 8, 61, 3, "#3f3a32", 1.4);
  pencilLine(36, 15, 63, 17, "#3f3a32", 1.4);
  ctx.restore();
}

function drawCrashMark(x, y) {
  ctx.save();
  ctx.strokeStyle = "#d84c3f";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  for (let i = 0; i < 8; i += 1) {
    const a = (Math.PI * 2 * i) / 8;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12);
    ctx.lineTo(x + Math.cos(a) * 38, y + Math.sin(a) * 38);
    ctx.stroke();
  }
  ctx.restore();
}

function blob(x, y, width, height, fill, stroke, lineWidth, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  const steps = 18;
  for (let i = 0; i <= steps; i += 1) {
    const a = (Math.PI * 2 * i) / steps;
    const wobble = 1 + Math.sin(i * 2.7 + width) * 0.055 + Math.cos(i * 1.9 + height) * 0.04;
    const px = Math.cos(a) * width * 0.5 * wobble;
    const py = Math.sin(a) * height * 0.5 * wobble;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function pencilLine(x1, y1, x2, y2, color, width) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  for (let i = 0; i < 2; i += 1) {
    ctx.globalAlpha = i === 0 ? 0.78 : 0.38;
    ctx.beginPath();
    const wobble = (i + 1) * 1.7;
    ctx.moveTo(x1 + Math.sin(y1 + i) * wobble, y1 + Math.cos(x1 + i) * wobble);
    ctx.lineTo(x2 + Math.sin(y2 + i) * wobble, y2 + Math.cos(x2 + i) * wobble);
    ctx.stroke();
  }
  ctx.restore();
}

function loop(now) {
  const dt = Math.min((now - game.lastTime) / 1000, 0.033);
  game.lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function bindHold(button, key, onPress) {
  const press = (event) => {
    event.preventDefault();
    if (!input[key] && onPress) onPress();
    input[key] = true;
    button.classList.add("is-pressed");
  };
  const release = (event) => {
    event.preventDefault();
    input[key] = false;
    button.classList.remove("is-pressed");
  };

  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
}

bindHold(jumpButton, "jumpHeld", startJump);
bindHold(slowButton, "slowHeld");

window.addEventListener("keydown", (event) => {
  if (event.code === "ArrowUp" || event.code === "KeyW") {
    event.preventDefault();
    if (!input.jumpHeld) startJump();
    input.jumpHeld = true;
    jumpButton.classList.add("is-pressed");
  }

  if (event.code === "Space" || event.code === "ArrowRight" || event.code === "KeyD") {
    event.preventDefault();
    input.slowHeld = true;
    slowButton.classList.add("is-pressed");
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code === "ArrowUp" || event.code === "KeyW") {
    event.preventDefault();
    input.jumpHeld = false;
    jumpButton.classList.remove("is-pressed");
  }

  if (event.code === "Space" || event.code === "ArrowRight" || event.code === "KeyD") {
    event.preventDefault();
    input.slowHeld = false;
    slowButton.classList.remove("is-pressed");
  }
});

restartButton.addEventListener("click", resetGame);

toneToggle.addEventListener("click", () => {
  const enabled = toneToggle.getAttribute("aria-pressed") !== "true";
  setGrayscale(enabled);
});

function setGrayscale(enabled) {
  gameShell.classList.toggle("grayscale", enabled);
  toneToggle.setAttribute("aria-pressed", String(enabled));
  localStorage.setItem(toneStorageKey, String(enabled));
}

game.lastTime = performance.now();
requestAnimationFrame(loop);
