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
    scheduleNextObstacle,
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
    updateDust(game, speed, dt);

    game.nextObstacleAt -= dt;
    if (game.nextObstacleAt <= 0) {
      spawnObstacle(game);
      scheduleNextObstacle(game);
    }

    if (game.obstacles.some((obstacle) => hitsObstacle(game.rabbit, obstacle))) {
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
        game.score += 1;
        onScore();
      }
    }

    game.obstacles = game.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -120);
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

  function hitsObstacle(rabbit, obstacle) {
    return rectsOverlap(rabbitHitbox(rabbit), obstacleHitbox(obstacle));
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
