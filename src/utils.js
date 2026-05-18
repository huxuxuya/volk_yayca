window.RabbitGame = window.RabbitGame || {};

(() => {
  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rectsOverlap(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }

  Object.assign(window.RabbitGame, {
    clamp,
    rand,
    rectsOverlap,
  });
})();
