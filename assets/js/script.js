// game
const app = new PIXI.Application({ width: 1280, height: 720 });
const game = document.getElementById('game')
game.appendChild(app.view);

// background
const background = PIXI.Sprite.from('assets/img/space-picture.png');
background.width = app.screen.width;
background.height = app.screen.height;
app.stage.addChildAt(background);

// start button
const startButton = new PIXI.Text('Press Enter to Start', { fontSize: 50, fill: 0xffffff });
startButton.interactive = true;
startButton.buttonMode = true;
startButton.anchor.set(0.5);
startButton.x = app.screen.width / 2;
startButton.y = app.screen.height / 2;
app.stage.addChild(startButton);
startButton.on('pointerdown', startGame);

// event Listeners
document.addEventListener('keydown', enterKeyHandler)
function enterKeyHandler(event) {
    if (event.key === 'Enter') {
        startGame();
        document.removeEventListener('keydown', enterKeyHandler);
    }
}

function startGame () {
  // remove start button
  app.stage.removeChild(startButton);

  // player
  const player = PIXI.Sprite.from('assets/img/spacecraft.png');
  player.width = 50;
  player.height = 50;
  player.anchor.set(0.5);
  player.x = app.screen.width / 2;
  player.y = app.screen.height - 100;
  player.vx = 0;
  app.stage.addChild(player);

  // timer
  let timeLeft = 60;
  const timerText = new PIXI.Text(`Time Left: ${timeLeft}`, { fontSize: 24, fill: 0xffffff });
  timerText.x = 1000;
  timerText.y = 0;
  app.stage.addChild(timerText);
  const timerInterval = setInterval(() => {
    timeLeft--;
    timerText.text = `Time Left: ${timeLeft}`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      if (asteroids.length > 0) {
        gameOver("YOU LOSE");
      } else {
        gameOver("YOU WIN");
      }
    }
  }, 1000);

  // asteroids
  const asteroids = [];
  for (let i = 0; i < 5; i++) {
    const asteroid = PIXI.Sprite.from('assets/img/asteroid.png');
    let asteroidX, asteroidY;
    let overlapping = false;
    // asteroid render conditions
    do {
      asteroidX = Math.max(50, Math.min(app.screen.width - 50, Math.random() * app.screen.width));
      asteroidY = Math.max(150, Math.min(400, Math.random() * 350));
      overlapping = asteroids.some(existingAsteroid => {
        return Math.abs(existingAsteroid.x - asteroidX) < 100 && Math.abs(existingAsteroid.y - asteroidY) < 200;
      });
    } while (overlapping);
    asteroid.anchor.set(0.5);
    asteroid.x = asteroidX;
    asteroid.y = asteroidY;
    asteroid.width = 50;
    asteroid.height = 100;
    app.stage.addChild(asteroid);
    asteroids.push(asteroid);
  }

  // bullets
  let bullets = [];
  let bulletsLeft = 10;
  const bulletsText = new PIXI.Text(`Bullets Left: ${bulletsLeft}`, { fontSize: 24, fill: 0xffffff });
  bulletsText.x = 1000;
  bulletsText.y = 30;
  app.stage.addChild(bulletsText);
  const space = keyboard(32);
  space.press = () => {
    if (bulletsLeft > 0) { 
      const bullet = new PIXI.Graphics();
      bullet.beginFill(0xffffff);
      bullet.drawRect(0, 0, 5, 10);
      bullet.endFill();
      bullet.x = player.x;
      bullet.y = player.y - 25;
      app.stage.addChild(bullet);
      bullets.push(bullet);
      bulletsLeft--;
      bulletsText.text = `Bullets Left: ${bulletsLeft}`;
    }
        if (bulletsLeft === 0 && bullets.length === 0) {
        clearInterval(timerInterval);
        gameOver("YOU LOSE");
    }
  };

  // Keyboard inputs
  const left = keyboard(37); 
  const right = keyboard(39);

  left.press = () => {
    player.vx = -5;
  };
  left.release = () => {
    if (!right.isDown) {
      player.vx = 0;
    }
  };
  right.press = () => {
    player.vx = 5;
  };
  right.release = () => {
    if (!left.isDown) {
      player.vx = 0;
    }
  };

  // Game loop
  app.ticker.add(() => {
    player.x += player.vx;
    player.x = Math.max(player.width / 2, Math.min(app.screen.width - player.width / 2, player.x));

    // Move bullets and check collisions
    bullets.forEach((bullet, index) => {
      bullet.y -= 5;
      if (bullet.y < 0) {
        bullets.splice(index, 1);
        app.stage.removeChild(bullet);
      } else {
        asteroids.forEach((asteroid, asteroidIndex) => {
          if (hitTestRectangle(asteroid, bullet)) {
            bullets.splice(index, 1);
            app.stage.removeChild(bullet);
            app.stage.removeChild(asteroid);
            asteroids.splice(asteroidIndex, 1);
            if (asteroids.length === 0) {
              clearInterval(timerInterval);
              gameOver("YOU WIN");
            }
          }
        });
      }
    });
  });
}

// define keyHandlers and add listeners
function keyboard(keyCode) {
  const key = {};
  key.code = keyCode;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;
  // The `downHandler`
  key.downHandler = (event) => {
    if (event.keyCode === key.code) {
      if (key.isUp && key.press) key.press();
      key.isDown = true;
      key.isUp = false;
      event.preventDefault();
    }
  };
  // The `upHandler`
  key.upHandler = (event) => {
    if (event.keyCode === key.code) {
      if (key.isDown && key.release) key.release();
      key.isDown = false;
      key.isUp = true;
      event.preventDefault();
    }
  };
  // Attach event listeners
  window.addEventListener(
    'keydown', key.downHandler.bind(key), false
  );
  window.addEventListener(
    'keyup', key.upHandler.bind(key), false
  );
  return key;
}

// define hits
function hitTestRectangle(r1, r2) {
  return (
    r1.x + r1.width > r2.x &&
    r1.x < r2.x + r2.width &&
    r1.y + r1.height > r2.y && 
    r1.y < r2.y + r2.height
  );
}

// define game message
function gameOver(message) {
  const gameOverText = new PIXI.Text(message, { fontSize: 48, fill: 0xff0000 });
  gameOverText.anchor.set(0.5);
  gameOverText.x = app.screen.width / 2;
  gameOverText.y = app.screen.height / 2;
  app.stage.addChild(gameOverText);
}