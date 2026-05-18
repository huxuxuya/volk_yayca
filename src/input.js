window.RabbitGame = window.RabbitGame || {};

(() => {
  function createInput({ jumpButton, crouchButton }, actions) {
    const input = {
      jumpHeld: false,
      crouchHeld: false,
    };

    bindHold(jumpButton, {
      press: () => {
        if (!input.jumpHeld) actions.jump(input);
        input.jumpHeld = true;
      },
      release: () => {
        input.jumpHeld = false;
      },
    });

    bindHold(crouchButton, {
      press: () => {
        input.crouchHeld = true;
        actions.crouch(true);
      },
      release: () => {
        input.crouchHeld = false;
        actions.crouch(false);
      },
    });

    window.addEventListener("keydown", (event) => {
      if (event.code === "ArrowUp" || event.code === "KeyW") {
        event.preventDefault();
        if (!input.jumpHeld) actions.jump(input);
        input.jumpHeld = true;
        jumpButton.classList.add("is-pressed");
      }

      if (event.code === "Space" || event.code === "ArrowDown" || event.code === "KeyS") {
        event.preventDefault();
        input.crouchHeld = true;
        crouchButton.classList.add("is-pressed");
        actions.crouch(true);
      }
    });

    window.addEventListener("keyup", (event) => {
      if (event.code === "ArrowUp" || event.code === "KeyW") {
        event.preventDefault();
        input.jumpHeld = false;
        jumpButton.classList.remove("is-pressed");
      }

      if (event.code === "Space" || event.code === "ArrowDown" || event.code === "KeyS") {
        event.preventDefault();
        input.crouchHeld = false;
        crouchButton.classList.remove("is-pressed");
        actions.crouch(false);
      }
    });

    return input;
  }

  function bindHold(button, handlers) {
    const press = (event) => {
      event.preventDefault();
      button.classList.add("is-pressed");
      handlers.press();
    };
    const release = (event) => {
      event.preventDefault();
      button.classList.remove("is-pressed");
      handlers.release();
    };

    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
  }

  Object.assign(window.RabbitGame, {
    createInput,
  });
})();
