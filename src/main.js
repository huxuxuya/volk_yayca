(() => {
  const {
    CANVAS,
    createGameState,
    createInput,
    createRenderer,
    createUi,
    loadAssets,
    resetGame,
    setCrouching,
    startJump,
    updateGame,
  } = window.RabbitGame;

  const canvas = document.querySelector("#game");
  canvas.width = CANVAS.width;
  canvas.height = CANVAS.height;

  const game = createGameState();
  const assets = loadAssets();
  const renderer = createRenderer(canvas, assets);
  const ui = createUi(
    {
      shell: document.querySelector(".game-shell"),
      score: document.querySelector("#score"),
      best: document.querySelector("#best"),
      finalScore: document.querySelector("#finalScore"),
      gameOver: document.querySelector("#gameOver"),
      toneToggle: document.querySelector("#toneToggle"),
    },
    game,
  );

  const input = createInput(
    {
      jumpButton: document.querySelector("#jumpButton"),
      crouchButton: document.querySelector("#crouchButton"),
    },
    {
      jump: () => startJump(game, input),
      crouch: (enabled) => setCrouching(game, enabled),
    },
  );

  document.querySelector("#restartButton").addEventListener("click", () => {
    resetGame(game);
    ui.updateScore();
    ui.hideGameOver();
  });

  function loop(now) {
    const dt = Math.min((now - game.lastTime) / 1000, 0.033);
    game.lastTime = now;
    updateGame(game, input, dt, () => ui.updateScore(), () => ui.showGameOver());
    renderer.draw(game);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
