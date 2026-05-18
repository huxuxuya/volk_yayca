window.RabbitGame = window.RabbitGame || {};

(() => {
  const { DIFFICULTY, RABBIT, STORAGE_KEYS, WORLD } = window.RabbitGame;

  function createGameState() {
    return {
      running: true,
      time: 0,
      lastTime: performance.now(),
      score: 0,
      best: Number(localStorage.getItem(STORAGE_KEYS.bestScore) || 0),
      combo: 0,
      comboTimer: 0,
      backgroundX: 0,
      nextObstacleAt: 1,
      nextCarrotAt: 2.2,
      obstacles: [],
      carrots: [],
      dust: [],
      floaters: [],
      rabbit: createRabbit(),
    };
  }

  function createRabbit() {
    return {
      x: RABBIT.x,
      y: WORLD.rabbitGroundY,
      vy: 0,
      width: RABBIT.width,
      height: RABBIT.height,
      onGround: true,
      jumpHold: 0,
      crouching: false,
    };
  }

  function resetGame(game) {
    game.running = true;
    game.time = 0;
    game.lastTime = performance.now();
    game.score = 0;
    game.combo = 0;
    game.comboTimer = 0;
    game.backgroundX = 0;
    game.nextObstacleAt = 1;
    game.nextCarrotAt = 2.2;
    game.obstacles = [];
    game.carrots = [];
    game.dust = [];
    game.floaters = [];
    game.rabbit = createRabbit();
  }

  function currentSpeed(time) {
    return DIFFICULTY.baseSpeed + Math.min(time * DIFFICULTY.speedGrowth, DIFFICULTY.maxSpeedBonus);
  }

  function saveBestScore(game) {
    game.best = Math.max(game.best, game.score);
    localStorage.setItem(STORAGE_KEYS.bestScore, String(game.best));
  }

  Object.assign(window.RabbitGame, {
    createGameState,
    currentSpeed,
    resetGame,
    saveBestScore,
  });
})();
