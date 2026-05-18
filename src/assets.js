window.RabbitGame = window.RabbitGame || {};

(() => {
  const SOURCES = {
    rabbit: "assets/sprites/rabbit_character.png",
    forest: "assets/sprites/forest_background_no_grass.png",
    grass: "assets/sprites/grass_layer.png",
    hill: "assets/sprites/obstacle_hill.png",
    anthill: "assets/sprites/obstacle_anthill.png",
    leaf: "assets/sprites/leaf_obstacle.png",
  };

  function loadAssets() {
    return Object.fromEntries(
      Object.entries(SOURCES).map(([name, src]) => {
        const image = new Image();
        image.src = src;
        return [name, image];
      }),
    );
  }

  function isReady(image) {
    return image.complete && image.naturalWidth > 0;
  }

  Object.assign(window.RabbitGame, {
    isReady,
    loadAssets,
  });
})();
