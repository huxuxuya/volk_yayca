window.RabbitGame = window.RabbitGame || {};

(() => {
  const { BACKGROUND, CANVAS, GRASS, WORLD, clamp, isReady } = window.RabbitGame;

  function createRenderer(canvas, assets) {
    const ctx = canvas.getContext("2d");
    return {
      draw(game) {
        ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);
        drawPaper(ctx);
        drawChildlikeSky(ctx, game);
        drawForest(ctx, assets.forest, game);
        drawGrassExtension(ctx, assets.grass, game);
        drawDust(ctx, game.dust);
        for (const carrot of game.carrots) drawCarrot(ctx, carrot, game.time);
        for (const obstacle of game.obstacles) drawObstacle(ctx, assets, obstacle);
        drawRabbit(ctx, assets.rabbit, game.rabbit, game.time);
        drawGrassForeground(ctx, assets.grass, game);
        drawFloaters(ctx, game.floaters);
        drawCombo(ctx, game);
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

  function drawChildlikeSky(ctx, game) {
    const skyBottom = WORLD.groundY - 120;
    const gradient = ctx.createLinearGradient(0, 0, 0, skyBottom);
    const phase = (game.time % 90) / 90;
    const sunset = Math.max(0, Math.sin(phase * Math.PI * 2 - Math.PI * 0.2));
    gradient.addColorStop(0, `rgba(${148 + sunset * 54}, ${206 - sunset * 34}, ${220 - sunset * 78}, 0.5)`);
    gradient.addColorStop(0.58, `rgba(${177 + sunset * 38}, ${219 - sunset * 24}, ${224 - sunset * 62}, 0.32)`);
    gradient.addColorStop(1, "rgba(244, 237, 220, 0)");

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS.width, skyBottom);

    ctx.globalAlpha = 0.22;
    for (let y = 46; y < skyBottom; y += 34) {
      const drift = (game.backgroundX * 0.018 + y * 0.37) % 36;
      pencilLine(ctx, -20 - drift, y, CANVAS.width + 28, y + Math.sin(y * 0.08) * 7, "#73aeca", 3.1);
    }

    ctx.globalAlpha = 0.56;
    drawCloud(ctx, 134 - (game.backgroundX * 0.05) % 850, 165, 164, 58, -0.04);
    drawCloud(ctx, 568 - (game.backgroundX * 0.035) % 920, 292, 132, 45, 0.05);
    drawSun(ctx, 92, 82);
    ctx.restore();
  }

  function drawCloud(ctx, x, y, width, height, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillStyle = "rgba(255, 250, 229, 0.56)";
    ctx.strokeStyle = "rgba(112, 102, 85, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(-width * 0.28, height * 0.05, width * 0.32, height * 0.42, 0.08, 0, Math.PI * 2);
    ctx.ellipse(0, -height * 0.08, width * 0.38, height * 0.56, -0.04, 0, Math.PI * 2);
    ctx.ellipse(width * 0.3, height * 0.08, width * 0.3, height * 0.4, 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    pencilLine(ctx, -width * 0.46, height * 0.16, width * 0.46, height * 0.12, "rgba(112, 102, 85, 0.35)", 1.4);
    ctx.restore();
  }

  function drawSun(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(250, 211, 71, 0.46)";
    ctx.strokeStyle = "rgba(141, 114, 38, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 38, 34, -0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < 9; i += 1) {
      const angle = (Math.PI * 2 * i) / 9;
      pencilLine(ctx, Math.cos(angle) * 48, Math.sin(angle) * 42, Math.cos(angle) * 66, Math.sin(angle) * 58, "rgba(141, 114, 38, 0.35)", 2);
    }
    ctx.restore();
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

  function drawCarrot(ctx, carrot, time) {
    const y = carrot.y + Math.sin(carrot.bob + time * 3) * 5;

    ctx.save();
    ctx.translate(carrot.x, y);
    ctx.rotate(-0.12 + Math.sin(carrot.bob) * 0.08);
    ctx.fillStyle = "#e88945";
    ctx.strokeStyle = "#7c5c34";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-16, -20);
    ctx.lineTo(18, -17);
    ctx.lineTo(2, 28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    pencilLine(ctx, -6, -24, -18, -42, "#3e7c4e", 3);
    pencilLine(ctx, 2, -24, 0, -45, "#3e7c4e", 3);
    pencilLine(ctx, 8, -23, 22, -40, "#3e7c4e", 3);
    ctx.restore();
  }

  function drawFloaters(ctx, floaters) {
    ctx.save();
    ctx.font = '700 28px "Comic Sans MS", "Marker Felt", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const floater of floaters) {
      ctx.globalAlpha = Math.max(0, floater.life / 0.75);
      ctx.fillStyle = floater.color;
      ctx.strokeStyle = "rgba(63, 58, 50, 0.45)";
      ctx.lineWidth = 3;
      ctx.strokeText(floater.text, floater.x, floater.y);
      ctx.fillText(floater.text, floater.x, floater.y);
    }
    ctx.restore();
  }

  function drawCombo(ctx, game) {
    if (game.combo < 2 || game.comboTimer <= 0) return;

    ctx.save();
    ctx.globalAlpha = Math.min(1, game.comboTimer);
    ctx.translate(CANVAS.width * 0.5, 86);
    ctx.rotate(-0.025);
    ctx.fillStyle = "rgba(249, 241, 215, 0.82)";
    ctx.strokeStyle = "rgba(63, 58, 50, 0.42)";
    ctx.lineWidth = 2;
    roundedRect(ctx, -74, -24, 148, 48, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#3f3a32";
    ctx.font = '700 24px "Comic Sans MS", "Marker Felt", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Комбо x${game.combo}`, 0, 0);
    ctx.restore();
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
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
