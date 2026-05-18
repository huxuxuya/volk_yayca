window.RabbitGame = window.RabbitGame || {};

(() => {
  const { STORAGE_KEYS } = window.RabbitGame;

  function createUi(elements, game) {
    const ui = {
      updateScore() {
        elements.score.textContent = String(game.score);
      },
      updateBest() {
        elements.best.textContent = String(game.best);
      },
      showGameOver() {
        elements.finalScore.textContent = String(game.score);
        ui.updateBest();
        elements.gameOver.classList.remove("hidden");
      },
      hideGameOver() {
        elements.gameOver.classList.add("hidden");
      },
      setGrayscale(enabled) {
        elements.shell.classList.toggle("grayscale", enabled);
        elements.toneToggle.setAttribute("aria-pressed", String(enabled));
        localStorage.setItem(STORAGE_KEYS.grayscale, String(enabled));
      },
    };

    ui.updateScore();
    ui.updateBest();
    ui.setGrayscale(localStorage.getItem(STORAGE_KEYS.grayscale) === "true");

    elements.toneToggle.addEventListener("click", () => {
      ui.setGrayscale(elements.toneToggle.getAttribute("aria-pressed") !== "true");
    });

    return ui;
  }

  Object.assign(window.RabbitGame, {
    createUi,
  });
})();
