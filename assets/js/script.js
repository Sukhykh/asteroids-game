// game
const app = new PIXI.Application({ width: 1280, height: 720 });
const game = document.getElementById('game')
game.appendChild(app.view);

// background
const background = createBackground()
app.stage.addChildAt(background);

// start button
const startButton = createStartButton()
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

// constants
const TOTAL_TIME = 60
const TOTAL_ASTEROIDS = 5
const TOTAL_BULLETS = 10
const TOTAL_BOSS_HP = 4
let level = 1;
let bossHitPoints = 4;

// timers
let timerInterval;
let bossShootingInterval;

// objects arrays
const asteroids = [];
const bossBullets = [];
const bullets = []

// strt game function
function startGame () {

  // remove start button
  app.stage.removeChild(startButton);

  // asteroids
  generateAsteroids();

  // player
  const player = createPlayer()
  app.stage.addChild(player);

  // timer
  let timeLeft = TOTAL_TIME;
  createTimer(timeLeft) 

  // bullets
  let bulletsLeft = TOTAL_BULLETS;
  const bulletsText = createBulletsText(bulletsLeft)
  app.stage.addChild(bulletsText);

  // boss
  const boss = createBoss()
  const bossHPBar = createBossHpBar(boss);

  // Keyboard inputs
  const left = keyboard(37); 
  const right = keyboard(39);
  const space = keyboard(32);

  // keyboards actions
  space.press = () => {
    if (level ===3) return
    if (bulletsLeft > 0) { 
      const bullet = createBullets(player)
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

    // move bullets and check collisions
    bullets.forEach((bullet, index) => {
      bullet.y -= 5;
      if (bullet.y < 0) {
        bullets.splice(index, 1);
        app.stage.removeChild(bullet);
      } else {
        if (level === 2 && hitTestBoss(boss, bullet)) {
          bullets.splice(index, 1);
          app.stage.removeChild(bullet);
          hitBoss(bossHPBar, boss);
        } else {
          asteroids.forEach((asteroid, asteroidIndex) => {
            if (hitTestRectangle(asteroid, bullet)) {
              bullets.splice(index, 1);
              app.stage.removeChild(bullet);
              app.stage.removeChild(asteroid);
              asteroids.splice(asteroidIndex, 1);
              if (asteroids.length === 0 && level === 1) {
                level = 2;
                clearInterval(timerInterval);
                spawnBoss(player, boss, bossHPBar);
                bulletsLeft = TOTAL_BULLETS
            }
          }
        });
      }}
    });

    // move boss bullets and check collision
    bossBullets.forEach((bullet, index) => {
      bullet.y += 5;
      if (hitTestRectangle(player, bullet)) {
        clearInterval(timerInterval);
        clearInterval(bossShootingInterval);
        level = 3
        app.stage.removeChild(player)
        gameOver("YOU LOSE");
      }
      if (bullet.y > app.screen.height) {
        app.stage.removeChild(bullet);
        bossBullets.splice(index, 1);
      }
    });
  });
}

// create key handlers and listeners
function keyboard(keyCode) {
  const key = {};
  key.code = keyCode;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;
  // the down handler
  key.downHandler = (event) => {
    if (event.keyCode === key.code) {
      if (key.isUp && key.press) key.press();
      key.isDown = true;
      key.isUp = false;
      event.preventDefault();
    }
  };
  // the up handler
  key.upHandler = (event) => {
    if (event.keyCode === key.code) {
      if (key.isDown && key.release) key.release();
      key.isDown = false;
      key.isUp = true;
      event.preventDefault();
    }
  };
  // event listeners
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

// create game message
function gameOver(message) {
  const gameOverText = new PIXI.Text(message, { fontSize: 48, fill: 0xff0000 });
  gameOverText.anchor.set(0.5);
  gameOverText.x = app.screen.width / 2;
  gameOverText.y = app.screen.height / 2;
  app.stage.addChild(gameOverText);
}

// create background
function createBackground() {
  const background = PIXI.Sprite.from('../assets/img/space.png');
  background.width = app.screen.width;
  background.height = app.screen.height;
  return background
}

// create start button
function createStartButton() {
  const startButton = new PIXI.Text('Press Enter to Start', { fontSize: 50, fill: 0xffffff });
  startButton.interactive = true;
  startButton.buttonMode = true;
  startButton.anchor.set(0.5);
  startButton.x = app.screen.width / 2;
  startButton.y = app.screen.height / 2;
  return startButton
}

// create player
function createPlayer() {
  const player = PIXI.Sprite.from('assets/img/spacecraft.png');
  player.width = 50;
  player.height = 50;
  player.anchor.set(0.5);
  player.x = app.screen.width / 2;
  player.y = app.screen.height - 100;
  player.vx = 0;
  return player
}

// create asteroids
function generateAsteroids() {
  const numAsteroids = TOTAL_ASTEROIDS;
  for (let i = 0; i < numAsteroids; i++) {
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
}

// create timer
function createTimer(timeLeft) {
  const timerText = new PIXI.Text(`Time Left: ${timeLeft}`, { fontSize: 24, fill: 0xffffff });
  timerText.x = 1000;
  timerText.y = 0;
  app.stage.addChild(timerText);
  timerInterval = setInterval(() => {
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
}

// create bullets text
function createBulletsText(bulletsLeft) {
  const bulletsText = new PIXI.Text(`Bullets Left: ${bulletsLeft}`, { fontSize: 24, fill: 0xffffff });
  bulletsText.x = 1000;
  bulletsText.y = 30;
  return bulletsText
}

// create bullets 
function createBullets(player) {
  const bullet = new PIXI.Graphics();
  bullet.beginFill(0xffffff);
  bullet.drawRect(0, 0, 5, 10);
  bullet.endFill();
  bullet.x = player.x;
  bullet.y = player.y - 25;
  return bullet
}

// create boss
function createBoss() {
  const boss = PIXI.Sprite.from('assets/img/boss.png');
  boss.anchor.set(0.5);
  boss.x = app.screen.width / 2;
  boss.y = 100;
  return boss
}

// create boss HP Bar
function createBossHpBar(boss) {
  const bossHPBar = new PIXI.Graphics();
  bossHPBar.beginFill(0xFF0000);
  bossHPBar.drawRect(0, 0, 100, 10);
  bossHPBar.endFill();
  bossHPBar.x = boss.x - boss.width / 2;
  bossHPBar.y = boss.y + boss.height / 2;
  return bossHPBar
}

// create boss bullets 
function createBossBullets(boss) {
  const bossBullet = new PIXI.Graphics();
  bossBullet.beginFill(0xFF0000);
  bossBullet.drawRect(0, 0, 5, 10);
  bossBullet.endFill();
  bossBullet.x = boss.x;
  bossBullet.y = boss.y + boss.height / 2;
  return bossBullet
}

function spawnBoss(player, boss, bossHPBar) {
  // Create boss
  app.stage.addChild(boss);
  app.stage.addChild(bossHPBar);
  // Boss Movement
  let bossDirection = 1;
  const bossSpeed = 2;
  app.ticker.add(() => {
    boss.x += bossSpeed * bossDirection;
    if (boss.x < boss.width / 2 || boss.x > app.screen.width - boss.width / 2) {
      bossDirection *= -1;
    }
  });
  // Boss Shooting
  bossShootingInterval = setInterval(() => {
    if (bossHitPoints > 0) {
      const bossBullet = createBossBullets(boss)
      app.stage.addChild(bossBullet);
      bossBullets.push(bossBullet);
    }
  }, 1000);
};

function hitTestBoss(boss, bullet) {
  return (
    bullet.x > boss.x - boss.width / 2 &&
    bullet.x < boss.x + boss.width / 2 &&
    bullet.y > boss.y - boss.height / 2 &&
    bullet.y < boss.y + boss.height / 2
  );
}

function hitBoss(bossHPBar, boss) {
  bossHitPoints--;
  bossHPBar.width -= 25;
  if (bossHitPoints === 0) {
    app.stage.removeChild(boss)
    clearInterval(bossShootingInterval);
    clearInterval(timerInterval);
    level = 3
    gameOver("YOU WIN");
  }
}