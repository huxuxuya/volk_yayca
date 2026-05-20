window.RabbitGame = window.RabbitGame || {};

(() => {
  const {
    BACKGROUND,
    RABBIT,
    WORLD,
    currentSpeed,
    rand,
    rectsOverlap,
    saveBestScore,
    scheduleNextCarrot,
    scheduleNextObstacle,
    spawnCarrot,
    spawnObstacle,
  } = window.RabbitGame;

  function startJump(game, input) {
    const rabbit = game.rabbit;
    if (!game.running || !rabbit.onGround) return;

    rabbit.vy = RABBIT.jumpVelocity;
    rabbit.onGround = false;
    rabbit.jumpHold = 0;
    input.jumpHeld = true;
  }

  function setCrouching(game, enabled) {
    game.rabbit.crouching = enabled;
  }

  function updateGame(game, input, dt, onScore, onGameOver) {
    if (!game.running) return;

    game.time += dt;
    const speed = currentSpeed(game.time);
    game.backgroundX = (game.backgroundX + speed * BACKGROUND.scrollFactor * dt) % 10000;

    updateRabbit(game.rabbit, input, dt);
    updateObstacles(game, speed, dt, onScore);
    updateCarrots(game, speed, dt, onScore);
    updateDust(game, speed, dt);
    updateFloaters(game, dt);
    updateCombo(game, dt);
    if (game.shieldFlash > 0) game.shieldFlash -= dt;

    game.nextObstacleAt -= dt;
    if (game.nextObstacleAt <= 0) {
      spawnObstacle(game);
      scheduleNextObstacle(game);
    }

    game.nextCarrotAt -= dt;
    if (game.nextCarrotAt <= 0) {
      spawnCarrot(game);
      scheduleNextCarrot(game);
    }

    const hitObstacle = game.obstacles.find((obstacle) => hitsObstacle(game.rabbit, obstacle));
    if (hitObstacle) {
      if (game.shield) {
        game.shield = false;
        game.shieldFlash = 0.55;
        hitObstacle.passed = true;
        hitObstacle.x = -hitObstacle.width - 140;
        game.floaters.push({ x: game.rabbit.x + 12, y: game.rabbit.y - 150, text: "Щит!", life: 0.85, color: "#5e9ed6" });
        return;
      }

      game.running = false;
      saveBestScore(game);
      onGameOver();
    }
  }

  function updateRabbit(rabbit, input, dt) {
    rabbit.crouching = input.crouchHeld;

    if (!rabbit.onGround && input.jumpHeld && rabbit.jumpHold < RABBIT.jumpHoldLimit && rabbit.vy < -170) {
      rabbit.vy += RABBIT.jumpHoldForce * dt;
      rabbit.jumpHold += dt;
    }

    const fastFall = input.crouchHeld && !rabbit.onGround ? RABBIT.fastFallGravity : 0;
    rabbit.vy += (WORLD.gravity + fastFall) * dt;
    rabbit.y += rabbit.vy * dt;

    if (rabbit.y >= WORLD.rabbitGroundY) {
      rabbit.y = WORLD.rabbitGroundY;
      rabbit.vy = 0;
      rabbit.onGround = true;
      rabbit.jumpHold = 0;
    } else {
      rabbit.onGround = false;
    }
  }

  function updateObstacles(game, speed, dt, onScore) {
    for (const obstacle of game.obstacles) {
      obstacle.x -= speed * dt;
      if (!obstacle.passed && obstacle.x + obstacle.width < game.rabbit.x - game.rabbit.width * 0.4) {
        obstacle.passed = true;
        addScore(game, 1, "combo");
        onScore();
      }
    }

    game.obstacles = game.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -120);
  }

  function updateCarrots(game, speed, dt, onScore) {
    for (const carrot of game.carrots) {
      carrot.x -= speed * 0.94 * dt;
      carrot.bob += dt * 4.2;
      if (!carrot.collected && rectsOverlap(rabbitHitbox(game.rabbit), carrotHitbox(carrot))) {
        carrot.collected = true;
        if (carrot.kind === "shield") {
          game.shield = true;
          game.floaters.push({ x: carrot.x, y: carrot.y - 18, text: "Щит", life: 0.85, color: "#5e9ed6" });
        } else {
          const value = carrot.kind === "gold" ? 8 : 3;
          addScore(game, value, "carrot");
          game.floaters.push({ x: carrot.x, y: carrot.y - 18, text: `+${value}`, life: 0.75, color: carrot.kind === "gold" ? "#d6a91d" : "#e88945" });
        }
        onScore();
      }
    }

    game.carrots = game.carrots.filter((carrot) => !carrot.collected && carrot.x + carrot.width > -60);
  }

  function updateDust(game, speed, dt) {
    if (game.rabbit.onGround && !game.rabbit.crouching && Math.random() < WORLD.dustChance) {
      game.dust.push({
        x: game.rabbit.x - 42,
        y: WORLD.rabbitGroundY + rand(8, 20),
        r: rand(2, 5),
        life: rand(0.35, 0.65),
      });
    }

    for (const puff of game.dust) {
      puff.x -= speed * 0.45 * dt;
      puff.life -= dt;
    }
    game.dust = game.dust.filter((puff) => puff.life > 0);
  }

  function updateFloaters(game, dt) {
    for (const floater of game.floaters) {
      floater.y -= 34 * dt;
      floater.life -= dt;
    }
    game.floaters = game.floaters.filter((floater) => floater.life > 0);
  }

  function updateCombo(game, dt) {
    if (game.comboTimer <= 0) return;
    game.comboTimer -= dt;
    if (game.comboTimer <= 0) game.combo = 0;
  }

  function addScore(game, base, source) {
    if (source === "combo") {
      game.combo += 1;
      game.comboTimer = 3.6;
      const bonus = Math.max(0, Math.min(3, game.combo - 1));
      game.score += base + bonus;
      if (bonus > 0) {
        game.floaters.push({ x: game.rabbit.x + 44, y: game.rabbit.y - 130, text: `x${game.combo}`, life: 0.7, color: "#3e7c4e" });
      }
      return;
    }

    game.score += base;
  }

  function hitsObstacle(rabbit, obstacle) {
    return rectsOverlap(rabbitHitbox(rabbit), obstacleHitbox(obstacle));
  }

  function carrotHitbox(carrot) {
    return {
      left: carrot.x - carrot.width * 0.45,
      right: carrot.x + carrot.width * 0.45,
      top: carrot.y - carrot.height * 0.55,
      bottom: carrot.y + carrot.height * 0.45,
    };
  }

  function rabbitHitbox(rabbit) {
    const crouchHeight = rabbit.crouching && rabbit.onGround ? rabbit.height * 0.54 : rabbit.height;
    return {
      left: rabbit.x - rabbit.width * 0.3,
      right: rabbit.x + rabbit.width * 0.28,
      top: rabbit.y - crouchHeight * 0.92,
      bottom: rabbit.y - 10,
    };
  }

  function obstacleHitbox(obstacle) {
    const h = obstacle.hitbox;
    return {
      left: obstacle.x + obstacle.width * h.left,
      right: obstacle.x + obstacle.width * h.right,
      top: obstacle.y - obstacle.height + obstacle.height * h.top,
      bottom: obstacle.y - obstacle.height + obstacle.height * h.bottom,
    };
  }

  Object.assign(window.RabbitGame, {
    setCrouching,
    startJump,
    updateGame,
  });
})();
