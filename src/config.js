window.RabbitGame = window.RabbitGame || {};

(() => {
  const CANVAS = {
    width: 720,
    height: 1280,
  };

  const STORAGE_KEYS = {
    bestScore: "rabbit-hills-best",
    grayscale: "rabbit-hills-grayscale",
  };

  const WORLD = {
    groundY: CANVAS.height * 0.78,
    rabbitGroundOffset: 30,
    obstacleGroundOffset: 38,
    gravity: 2050,
    dustChance: 0.32,
  };

  WORLD.rabbitGroundY = WORLD.groundY + WORLD.rabbitGroundOffset;
  WORLD.obstacleGroundY = WORLD.groundY + WORLD.obstacleGroundOffset;

  const RABBIT = {
    x: CANVAS.width * 0.27,
    width: 94,
    height: 138,
    jumpVelocity: -820,
    jumpHoldForce: -920,
    jumpHoldLimit: 0.18,
    fastFallGravity: 1300,
  };

  const BACKGROUND = {
    height: 680,
    bottomOffset: 88,
    scrollFactor: 0.22,
  };

  const GRASS = {
    speed: 1.18,
    alpha: 0.96,
    yOffset: 0,
  };

  const DIFFICULTY = {
    baseSpeed: 350,
    maxSpeedBonus: 210,
    speedGrowth: 9,
    minSpawnDelay: 1.02,
    maxSpawnDelay: 1.55,
    delayReduction: 0.34,
    airObstacleStart: 9,
    maxAirChance: 0.38,
  };

  const OBSTACLE_TYPES = {
    hill: {
      sprite: "hill",
      lane: "ground",
      width: [148, 184],
      height: [66, 84],
      hitbox: { left: 0.22, top: 0.24, right: 0.78, bottom: 0.95 },
    },
    anthill: {
      sprite: "anthill",
      lane: "ground",
      width: [104, 124],
      height: [116, 138],
      hitbox: { left: 0.14, top: 0.08, right: 0.84, bottom: 0.96 },
    },
    leaf: {
      sprite: "leaf",
      lane: "air",
      width: [132, 168],
      height: [86, 112],
      y: WORLD.rabbitGroundY - 58,
      hitbox: { left: 0.16, top: 0.2, right: 0.86, bottom: 0.72 },
    },
  };

  Object.assign(window.RabbitGame, {
    BACKGROUND,
    CANVAS,
    DIFFICULTY,
    GRASS,
    OBSTACLE_TYPES,
    RABBIT,
    STORAGE_KEYS,
    WORLD,
  });
})();
