window.RabbitGame = window.RabbitGame || {};

(() => {
  const { CANVAS, DIFFICULTY, OBSTACLE_TYPES, WORLD, rand } = window.RabbitGame;

  function scheduleNextObstacle(game) {
    const progress = Math.min(1, game.time / 42);
    const minDelay = DIFFICULTY.minSpawnDelay;
    const maxDelay = DIFFICULTY.maxSpawnDelay - progress * DIFFICULTY.delayReduction;
    game.nextObstacleAt = rand(minDelay, Math.max(minDelay + 0.16, maxDelay));
  }

  function spawnObstacle(game) {
    const type = chooseObstacleType(game.time);
    const config = OBSTACLE_TYPES[type];
    const width = rand(config.width[0], config.width[1]);
    const height = rand(config.height[0], config.height[1]);
    const y = config.lane === "air" ? config.y + rand(-10, 12) : WORLD.obstacleGroundY;

    game.obstacles.push({
      type,
      sprite: config.sprite,
      lane: config.lane,
      x: CANVAS.width + width,
      y,
      width,
      height,
      hitbox: config.hitbox,
      passed: false,
    });
  }

  function scheduleNextCarrot(game) {
    game.nextCarrotAt = rand(2.1, 3.6);
  }

  function spawnCarrot(game) {
    const rare = game.time > 12 && Math.random() < 0.18;
    game.carrots.push({
      x: CANVAS.width + 42,
      y: WORLD.rabbitGroundY - rand(96, 168),
      width: 34,
      height: 54,
      bob: rand(0, Math.PI * 2),
      kind: rare ? (Math.random() < 0.55 ? "gold" : "shield") : "normal",
      collected: false,
    });
  }

  function chooseObstacleType(time) {
    if (time > DIFFICULTY.airObstacleStart) {
      const progress = Math.min(1, (time - DIFFICULTY.airObstacleStart) / 40);
      if (Math.random() < progress * DIFFICULTY.maxAirChance) return "leaf";
    }

    return Math.random() > 0.52 ? "anthill" : "hill";
  }

  Object.assign(window.RabbitGame, {
    scheduleNextCarrot,
    spawnCarrot,
    scheduleNextObstacle,
    spawnObstacle,
  });
})();
