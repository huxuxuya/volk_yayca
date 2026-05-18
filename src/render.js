window.RabbitGame = window.RabbitGame || {};

(() => {
  const { BACKGROUND, CANVAS, GRASS, WORLD, clamp, isReady } = window.RabbitGame;

  function createRenderer(canvas, assets) {
    const ctx = canvas.getContext("2d");
    return {
      draw(game) {
        ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);
        drawPaper(ctx);
        drawForest(ctx, assets.forest, game);
        drawGrassExtension(ctx, assets.grass, game);
        drawDust(ctx, game.dust);
        for (const obstacle of game.obstacles) drawObstacle(ctx, assets, obstacle);
        drawRabbit(ctx, assets.rabbit, game.rabbit, game.time);
        drawGrassForeground(ctx, assets.grass, game);
        if (!game.running) drawCrashMark(ctx, game.rabbit.x + 66, game.rabbit.y - 128);
      },
    };
  }

  function drawPaper(ctx) {
    ctx.fillStyle = "#f4eddc";
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

    ctx.save();
    ctx.globalAlpha = 0.1;
    for (let y = 0; y < CANVAS.height; y += 18) {
      pencilLine(ctx, 0, y + Math.sin(y) * 2, CANVAS.width, y + Math.cos(y) * 2, "#866f55", 0.7);
    }
    ctx.restore();
  }

  function drawForest(ctx, image, game) {
    if (!isReady(image)) return;
    drawScrollingImage(ctx, image, game.backgroundX, { speed: 1, alpha: 1 });
  }

  function drawGrassForeground(ctx, image, game) {
    if (!isReady(image)) return;
    drawScrollingImage(ctx, image, game.backgroundX, GRASS);
  }

  function drawScrollingImage(ctx, image, backgroundX, settings) {
    const drawHeight = BACKGROUND.height;
    const drawWidth = drawHeight * (image.naturalWidth / image.naturalHeight);
    const bottom = WORLD.groundY + BACKGROUND.bottomOffset;
    const y = bottom - drawHeight + (settings.yOffset || 0);
    const offset = (backgroundX * (settings.speed || 1)) % drawWidth;

    ctx.save();
    ctx.globalAlpha = settings.alpha ?? 1;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    for (let x = -offset - drawWidth; x < CANVAS.width + drawWidth; x += drawWidth) {
      ctx.drawImage(image, x, y, drawWidth, drawHeight);
    }
    ctx.restore();
  }

  function drawGrassExtension(ctx, image, game) {
    if (!isReady(image)) return;

    const drawHeight = BACKGROUND.height;
    const drawWidth = drawHeight * (image.naturalWidth / image.naturalHeight);
    const bottom = WORLD.groundY + BACKGROUND.bottomOffset;
    const layerY = bottom - drawHeight + GRASS.yOffset;
    const sourceTop = image.naturalHeight * 0.76;
    const sourceHeight = image.naturalHeight * 0.2;
    const stripHeight = drawHeight * (sourceHeight / image.naturalHeight);
    const startY = layerY + drawHeight * 0.78;
    const bandStep = stripHeight * 0.08;

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    for (let band = 0; startY + band * bandStep < CANVAS.height; band += 1) {
      const y = startY + band * bandStep;
      const depth = Math.min(1, (y - startY) / Math.max(1, CANVAS.height - startY));
      const speed = GRASS.speed + depth * 0.78;
      const offset = (game.backgroundX * speed) % drawWidth;
      const wave = Math.sin(game.time * 0.8 + band * 1.7) * 7;
      const sourceShift = (band % 4) * image.naturalHeight * 0.016;
      ctx.globalAlpha = 0.32 + depth * 0.24;

      for (let x = -offset - drawWidth; x < CANVAS.width + drawWidth; x += drawWidth) {
        ctx.drawImage(image, 0, sourceTop + sourceShift, image.naturalWidth, sourceHeight, x + wave, y, drawWidth, stripHeight);
        ctx.drawImage(
          image,
          0,
          sourceTop + sourceShift + image.naturalHeight * 0.028,
          image.naturalWidth,
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

  function drawDust(ctx, dust) {
    for (const puff of dust) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, puff.life * 1.7);
      ctx.fillStyle = "#d9c7a4";
      ctx.strokeStyle = "#7a684f";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(puff.x, puff.y, puff.r * 2.2, puff.r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawObstacle(ctx, assets, obstacle) {
    const image = assets[obstacle.sprite];
    if (!isReady(image)) return;

    ctx.save();
    ctx.translate(obstacle.x, obstacle.y);
    if (obstacle.lane === "ground") drawGroundShadow(ctx, obstacle);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, 0, -obstacle.height, obstacle.width, obstacle.height);
    ctx.restore();
  }

  function drawGroundShadow(ctx, obstacle) {
    ctx.save();
    ctx.globalAlpha = obstacle.type === "anthill" ? 0.2 : 0.16;
    ctx.fillStyle = "#5f6b35";
    ctx.beginPath();
    ctx.ellipse(obstacle.width * 0.5, -4, obstacle.width * 0.46, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawRabbit(ctx, image, rabbit, time) {
    if (!isReady(image)) return;

    const cycle = time * (rabbit.crouching ? 7 : 13);
    const stride = rabbit.onGround && !rabbit.crouching ? Math.max(0, Math.sin(cycle)) : 0;
    const crouch = rabbit.onGround ? Math.max(0, -Math.sin(cycle)) : 0;
    const hop = rabbit.onGround && !rabbit.crouching ? -stride * 13 + crouch * 2 : 0;

    drawRabbitShadow(ctx, rabbit, stride);

    ctx.save();
    ctx.translate(rabbit.x, rabbit.y + hop);
    drawRabbitSprite(ctx, image, rabbit, stride, crouch);
    ctx.restore();
  }

  function drawRabbitShadow(ctx, rabbit, stride) {
    const air = Math.max(0, WORLD.rabbitGroundY - rabbit.y);
    const liftFade = Math.max(0.32, 1 - air / 220);
    ctx.save();
    ctx.globalAlpha = 0.16 * liftFade;
    ctx.fillStyle = "#5f6b35";
    ctx.beginPath();
    ctx.ellipse(rabbit.x, WORLD.rabbitGroundY + 2, 42 - stride * 8, 10 - stride * 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawRabbitSprite(ctx, image, rabbit, stride, crouch) {
    const spriteHeight = rabbit.crouching && rabbit.onGround ? 220 : 250;
    const spriteWidth = spriteHeight * (image.naturalWidth / image.naturalHeight);
    const squashX = rabbit.crouching && rabbit.onGround ? 1.12 : rabbit.onGround ? 1 + crouch * 0.045 - stride * 0.025 : 0.96;
    const squashY = rabbit.crouching && rabbit.onGround ? 0.82 : rabbit.onGround ? 1 - crouch * 0.035 + stride * 0.04 : 1.06;
    const tilt = rabbit.crouching && rabbit.onGround ? 0.13 : rabbit.onGround ? -0.07 + stride * 0.12 - crouch * 0.05 : clamp(rabbit.vy / 5200, -0.18, 0.16);

    ctx.save();
    ctx.rotate(tilt);
    ctx.scale(squashX, squashY);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, -spriteWidth * 0.5, -spriteHeight + 12, spriteWidth, spriteHeight);
    ctx.restore();
  }

  function drawCrashMark(ctx, x, y) {
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

  function pencilLine(ctx, x1, y1, x2, y2, color, width) {
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

  Object.assign(window.RabbitGame, {
    createRenderer,
  });
})();
