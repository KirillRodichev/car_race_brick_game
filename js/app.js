// numbers
const BRICKS_NUMBER = 200;
const BRICKS_IN_ROW = 10;
const BRICKS_IN_CAR = 7;
const GOALS = 10;
const START_SPEED = 600;
const SPEED_FRACTION = 100;
const PLAYER_CAR_START_BACK_SQE_NUM = 195;
const ENEMY_CAR_START_BACK_SEQ_NUM = -40;
const CAR_WIDTH = 3;
const CAR_LENGTH = 4;
const ENEMIES_ON_FIELD = 3;
const OFFSET_ENEMY_BACK_Y_COORD = 19;
const OFFSET_ENEMY_NOSE = 22;

// car constants
const DIRECT_DOWN = 'down';
const DIRECT_UP = 'up';
const DRAW = 'draw';
const ERASE = 'erase';

// action button text
const PAUSE = 'PAUSE';
const TRY_AGAIN = 'TRY_AGAIN';
const CONTINUE = 'CONTINUE';

// game phases
const INIT_PHASE = 'init';
const PLAYING_PHASE = 'playing';
const PAUSE_PHASE = 'paused';
const DEFEATED_PHASE = 'defeated';

// styling classes
const GAME_OVER_COVER_CLASS = 'game-field--covered';

// dom elements
const gameField = document.querySelector('.game-field');
const actionButton = document.querySelector('.action-btn');
const volumeIcon = document.querySelector('.fas');
const gameStatisticsElements = {
  score: document.querySelector('#score'),
  hiScore: document.querySelector('#hi-score'),
  speed: document.querySelector('#speed'),
  goals: document.querySelector('#goals')
};
const levelScore = document.querySelector('#level-goals');

// more
const HI_SCORE = 'hiScore';

const barrier = [0, 10, 20, 40, 50, 60, 80, 90, 100, 120, 130, 140, 160, 170, 180, 9, 19, 29, 49, 59, 69, 89, 99, 109, 129, 139, 149, 169, 179, 189];

let bricksArray = [];

document.addEventListener('DOMContentLoaded', () => {
  for (let seqNumber = 0; seqNumber < BRICKS_NUMBER; seqNumber++) {
    const brick = document.createElement('div');
    brick.classList.add('brick');
    if (barrier.includes(seqNumber)) {
      brick.classList.add('brick_active');
    }
    bricksArray.push(new Brick(brick));
    gameField.appendChild(brick);
  }

  let game = new Game();
  levelScore.innerText = GOALS;

  document.addEventListener('keydown', ({ code }) => {
    if (code === 'ArrowLeft' || code === 'KeyA') {
      game.playerCar.shiftLeft();
    } else if (code === 'ArrowRight' || code === 'KeyD') {
      game.playerCar.shiftRight();
    }
  });

  actionButton.addEventListener('click', () => {
    switch (Game.phase) {
      case PLAYING_PHASE:
        game.pause();
        break;
      case PAUSE_PHASE:
        game.resume();
        break;
      case INIT_PHASE:
        game.start();
        break;
      case DEFEATED_PHASE:
        game.restart();
        break;
    }
  });

  volumeIcon.addEventListener('click', () => {
    if (game.audio.paused) {
      game.audio.play();
      volumeIcon.classList.remove('fa-volume-off');
      volumeIcon.classList.add('fa-volume-up');
    } else {
      game.audio.pause();
      volumeIcon.classList.remove('fa-volume-up');
      volumeIcon.classList.add('fa-volume-off');
    }
  })
});

/*

brick,enemy     player       DIRECT_DOWN

   back          front            1
1 - - - 2      1 - - - 2        1   1
-       -      -       -       1     1
-       -      -       -         1 1
1 - - - 2      1 - - - 2         1 1
  front           back           1 1
                                 1 1
*/

const initAudio = () => {
  let audio = new Audio('sound/teriyaki_boyz_tokyo_drift.mp3');
  audio.loop = true;
  return audio;
};

class Brick {
  constructor(element) {
    this.element = element;
  }

  setActive() {
    if (!this.element.classList.contains('brick_active')) {
      this.element.classList.add('brick_active');
    }
  }

  setDefault() {
    if (this.element.classList.contains('brick_active')) {
      this.element.classList.remove('brick_active');
    }
  }

}

class Car {
  constructor(backBrickSeqNumber, direction) {
    this.backBrickSeqNumber = backBrickSeqNumber;
    this.direction = direction;
    this.activeBricksSeqNumbers = this.getActiveBricksSeqNumber();
  }

  loopBricksAndCall(actionType) {
    for (let seqNumber = 0; seqNumber < this.activeBricksSeqNumbers.length; seqNumber++) {
      if (this.activeBricksSeqNumbers[seqNumber] >= 0 && this.activeBricksSeqNumbers[seqNumber] < BRICKS_NUMBER) {
        actionType === DRAW
          ? bricksArray[this.activeBricksSeqNumbers[seqNumber]].setActive()
          : bricksArray[this.activeBricksSeqNumbers[seqNumber]].setDefault();
      }
    }
  }

  drawCar() {
    this.activeBricksSeqNumbers = this.getActiveBricksSeqNumber();
    this.loopBricksAndCall(DRAW);
  }

  eraseCar() {
    this.loopBricksAndCall(ERASE);
    this.activeBricksSeqNumbers = 0;
  }

  getActiveBricksSeqNumber() {
    let res = [];
    res.push(this.backBrickSeqNumber);
    if (this.direction === DIRECT_UP) {
      res.push(this.backBrickSeqNumber + 2);
      res.push(this.backBrickSeqNumber + BRICKS_IN_ROW + 1);
      res.push(this.backBrickSeqNumber + BRICKS_IN_ROW * 2);
      res.push(this.backBrickSeqNumber + BRICKS_IN_ROW * 2 + 1);
      res.push(this.backBrickSeqNumber + BRICKS_IN_ROW * 2 + 2);
      res.push(this.backBrickSeqNumber + BRICKS_IN_ROW * 3 + 1);
    } else {
      res.push(this.backBrickSeqNumber - 2);
      res.push(this.backBrickSeqNumber - BRICKS_IN_ROW - 1);
      res.push(this.backBrickSeqNumber - BRICKS_IN_ROW * 2);
      res.push(this.backBrickSeqNumber - BRICKS_IN_ROW * 2 - 1);
      res.push(this.backBrickSeqNumber - BRICKS_IN_ROW * 2 - 2);
      res.push(this.backBrickSeqNumber - BRICKS_IN_ROW * 3 - 1);
    }
    return res;
  }
}

class PlayerCar extends Car {
  constructor(backBrickSeqNumber) {
    super(backBrickSeqNumber, DIRECT_DOWN);
    super.drawCar();
  }

  shiftLeft() {
    if ((this.backBrickSeqNumber % BRICKS_IN_ROW) > 3
      && Game.phase !== PAUSE_PHASE
      && Game.phase !== INIT_PHASE) {
      if (!this.isCarCrashed(Game.enemiesCars[0], this.getNoseSeqNumber() - 1)) {
        this.eraseCar();
        this.backBrickSeqNumber--;
        this.drawCar();
      }
    }
  }

  shiftRight() {
    if ((this.backBrickSeqNumber % BRICKS_IN_ROW) < BRICKS_IN_ROW - 2
      && Game.phase !== PAUSE_PHASE
      && Game.phase !== INIT_PHASE) {
      if (!this.isCarCrashed(Game.enemiesCars[0], this.getNoseSeqNumber() + 1)) {
        this.eraseCar();
        this.backBrickSeqNumber++;
        this.drawCar();
      }
    }
  }

  getNoseSeqNumber() {
    return this.activeBricksSeqNumbers[BRICKS_IN_CAR - 1];
  }

  isCarCrashed(enemyCar, noseSeqNumber) {
    const enemyCarNoseSeqNumber = enemyCar.activeBricksSeqNumbers[BRICKS_IN_CAR - 1];
    const playerCarNoseSeqNumber = noseSeqNumber;
    for (let horizPos = 0; horizPos < CAR_LENGTH * 2; horizPos++) {
      switch (horizPos) {
        case 0:
          if (enemyCarNoseSeqNumber === playerCarNoseSeqNumber) {
            Game.over();
            return true;
          }
          break;
        case 1:
          if (enemyCarNoseSeqNumber === playerCarNoseSeqNumber + BRICKS_IN_ROW - 1
            || enemyCarNoseSeqNumber === playerCarNoseSeqNumber + BRICKS_IN_ROW + 1) {
            Game.over();
            return true;
          }
          break;
        default:
          if (enemyCarNoseSeqNumber === playerCarNoseSeqNumber + horizPos * BRICKS_IN_ROW - 2
            || enemyCarNoseSeqNumber === playerCarNoseSeqNumber + horizPos * BRICKS_IN_ROW + 2) {
            Game.over();
            return true;
          }
          break;
      }
    }
    return false;
  }
}

class EnemyCar extends Car {
  constructor(backBrickSeqNumber) {
    super(backBrickSeqNumber, DIRECT_UP);
    super.drawCar();
  }

  shiftUp() {
    this.eraseCar();
    if (Math.floor(this.backBrickSeqNumber / BRICKS_IN_ROW) <= OFFSET_ENEMY_BACK_Y_COORD) {
      this.backBrickSeqNumber += BRICKS_IN_ROW;
      this.drawCar();
    }
  }

  xDist(backBrickSeqNumber) {
    return this.backBrickSeqNumber % BRICKS_IN_ROW - backBrickSeqNumber % BRICKS_IN_ROW;
  }

  canBeAdded(backBrickSeqNumber) {
    if (Math.abs(this.xDist(backBrickSeqNumber)) >= CAR_WIDTH) return true;
  }

  isCarPassed() {
    const enemyCarNoseSeqNumber = this.activeBricksSeqNumbers[BRICKS_IN_CAR - 1];
    return Math.floor(enemyCarNoseSeqNumber / BRICKS_IN_ROW) > OFFSET_ENEMY_NOSE;
  }

  static getRandXBackCoord() {
    return Math.floor(Math.random() * Math.floor(BRICKS_IN_ROW - CAR_WIDTH - 1)) + 1;
  }
}

class Game {
  static enemiesCars = [];
  static phase = INIT_PHASE;
  static counter = 0;
  static speedInterval;

  constructor() {
    this.playerCar = new PlayerCar(PLAYER_CAR_START_BACK_SQE_NUM);
    this.level = {
      speed: START_SPEED,
      goals: 0,
      value: 0,
    };
    this.score = {
      playerScore: 0,
      highScore: this.initScore()
    };
    this.initStatistics();
    this.audio = initAudio();
  }

  initStatistics = () => {
    let { score, hiScore, goals, speed } = gameStatisticsElements;
    [score.innerText, hiScore.innerText, goals.innerText, speed.innerText] = ['0', this.score.highScore, '0', '0'];
  };

  initScore = () => {
    if (localStorage.getItem(HI_SCORE)) {
      return localStorage.getItem(HI_SCORE);
    } else {
      localStorage.setItem(HI_SCORE, '0');
      return 0;
    }
  };

  start() {
    this.addEnemy();
    this.resume();
  }

  resume() {
    Game.speedInterval = setInterval(this.moveEnemies.bind(this), this.level.speed);
    Game.phase = PLAYING_PHASE;
    actionButton.innerText = PAUSE;
  }

  pause() {
    clearInterval(Game.speedInterval);
    Game.phase = PAUSE_PHASE;
    actionButton.innerText = CONTINUE;
  }

  moveEnemies() {
    if (this.playerCar.isCarCrashed(Game.enemiesCars[0], this.playerCar.getNoseSeqNumber() - BRICKS_IN_ROW)) {
      return;
    }
    for (let carInd = 0; carInd < Game.enemiesCars.length; carInd++) {
      Game.enemiesCars[carInd].shiftUp();
    }
    if (Game.enemiesCars[0].isCarPassed()) {
      Game.enemiesCars.shift();
      this.incrGoals();
    }
    Game.counter++;
    if (Game.counter % BRICKS_IN_ROW === 0) {
      this.addEnemy();
    }
  }

  addEnemy() {
    if (Game.enemiesCars.length <= ENEMIES_ON_FIELD - 1) {
      let enemy;
      if (Game.enemiesCars.length === 0) {
        enemy = new EnemyCar(ENEMY_CAR_START_BACK_SEQ_NUM + EnemyCar.getRandXBackCoord());
      } else {
        const lastEnemy = Game.enemiesCars[Game.enemiesCars.length - 1];
        let backBrickSeqNumber = 0;
        do {
          backBrickSeqNumber = EnemyCar.getRandXBackCoord();
        } while (lastEnemy.canBeAdded(backBrickSeqNumber));
        enemy = new EnemyCar(backBrickSeqNumber - 30);
      }
      Game.enemiesCars.push(enemy);
    }
  }

  incrGoals() {
    if (this.level.goals < GOALS) {
      this.level.goals++;
      this.incrScore();
    } else {
      this.level.goals = 0;
      this.incrSpeed();
    }
    gameStatisticsElements.goals.innerText = this.level.goals;
    localStorage.setItem(HI_SCORE, this.score.highScore);
  }

  incrSpeed() {
    this.level.speed -= SPEED_FRACTION;
    clearInterval(Game.speedInterval);
    Game.speedInterval = setInterval(this.moveEnemies.bind(this), this.level.speed);
    this.level.value++;
    gameStatisticsElements.speed.innerText = this.level.value;
  }

  incrScore() {
    this.score.playerScore++;
    if (this.score.playerScore > this.score.highScore) {
      this.score.highScore++;
      gameStatisticsElements.hiScore.innerText = this.score.highScore;
    }
    gameStatisticsElements.score.innerText = this.score.playerScore;
  }

  refreshLevel() {
    this.level.speed = START_SPEED;
    this.level.goals = 0;
    this.level.value = 0;
  }

  refreshScore() {
    this.score.playerScore = 0;
  }

  clearEnemies() {
    for (let carInd = 0; carInd < Game.enemiesCars.length; carInd++) {
      Game.enemiesCars[carInd].eraseCar();
    }
    Game.enemiesCars.length = 0;
  }

  setPlayerToStart() {
    this.playerCar.eraseCar();
    this.playerCar = new PlayerCar(PLAYER_CAR_START_BACK_SQE_NUM);
  }

  restart() {
    this.refreshLevel();
    this.refreshScore();
    this.clearEnemies();
    this.setPlayerToStart();
    this.initStatistics();
    Game.phase = PLAYING_PHASE;
    actionButton.innerText = PAUSE;
    gameField.classList.remove(GAME_OVER_COVER_CLASS);
    this.addEnemy();
    Game.speedInterval = setInterval(this.moveEnemies.bind(this), this.level.speed);
  }

  static over() {
    clearInterval(Game.speedInterval);
    gameField.classList.add(GAME_OVER_COVER_CLASS);
    actionButton.innerText = TRY_AGAIN;
    Game.phase = DEFEATED_PHASE;
    Game.counter = 0;
  }
}