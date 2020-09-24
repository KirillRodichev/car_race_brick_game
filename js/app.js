// numbers
const BRICKS_NUMBER = 200;
const BRICKS_IN_ROW = 10;
const BRICKS_IN_COLUMN = 20;
const BRICKS_IN_CAR = 7;
const GOALS = 50;
const START_SPEED = 500;
const SPEED_FRACTION = 50;
const PLAYER_CAR_START_X_COORD = 6;
const CAR_WIDTH = 3;
const ENEMY_CAR_START_X_COODR = -3;

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

const barrier = [0, 10, 20, 40, 50, 60, 80, 90, 100, 120, 130, 140, 160, 170, 180, 9, 19, 29, 49, 59, 69, 89, 99, 109, 129, 139, 149, 169, 179, 189];

let bricksArray = [];

document.addEventListener('DOMContentLoaded', () => {
  for (let seqNumber = 0; seqNumber < BRICKS_NUMBER; seqNumber++) {
    const brick = document.createElement('div');
    brick.classList.add('brick');
    if (barrier.includes(seqNumber)) {
      brick.classList.add('brick_active');
    }
    bricksArray.push(new Brick(brick, seqNumber));
    gameField.appendChild(brick);
  }

  let game = new Game();

  document.addEventListener('keydown', ({ code }) => {
    switch (code) {
      case 'KeyA':
        game.player.shiftLeft();
        break;
      case 'KeyD':
        game.player.shiftRight();
        break;
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

const calcCoord = (direction, backCoord1) => { // { x: 6, y: 20 }
  let res = [];
  let backCoord2 = {
    x: direction === DIRECT_DOWN ? backCoord1.x - 2 : backCoord1.x + 2,
    y: backCoord1.y,
  };
  let frontCoord1 = {
    x: backCoord1.x,
    y: direction === DIRECT_DOWN ? backCoord1.y - 3 : backCoord1.y + 3,
  };
  let frontCoord2 = {
    x: direction === DIRECT_DOWN ? backCoord1.x - 2 : backCoord1.x + 2,
    y: direction === DIRECT_DOWN ? backCoord1.y - 3 : backCoord1.y + 3,
  };
  res.push(backCoord1, backCoord2, frontCoord1, frontCoord2);
  return res;
};

const getCoordsBySeqNumber = seqNumber => {
  const backCoord1 = {
    x: seqNumber % BRICKS_IN_ROW,
    y: Math.floor(seqNumber / BRICKS_IN_ROW),
  };
  return calcCoord(DIRECT_DOWN, backCoord1);
};

class Rectangle {
  constructor(backCoord1, backCoord2, frontCoord1, frontCoord2) {
    this.backCoord1 = backCoord1;
    this.backCoord2 = backCoord2;
    this.frontCoord1 = frontCoord1;
    this.frontCoord2 = frontCoord2;
  }
}

class Brick extends Rectangle {
  constructor(element, seqNumber) {
    super(...getCoordsBySeqNumber(seqNumber));
    this.element = element;
    this.seqNumber = seqNumber;
  }

  static getSeqNumberByBackCoord(backCoord1) {
    const { x, y } = backCoord1;
    let seqNumber = 0;
    for (let yCoord = 0; yCoord < Math.abs(y); yCoord++) {
      seqNumber = y >= 0 ? seqNumber + BRICKS_IN_ROW : seqNumber - BRICKS_IN_ROW;
    }
    seqNumber += x;
    return seqNumber;
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

class Car extends Rectangle {
  constructor(backCoord1, backCoord2, frontCoord1, frontCoord2, direction) {
    super(backCoord1, backCoord2, frontCoord1, frontCoord2);
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
    let backLeftBrickSeqNumber;
    const fillArray = seqNumber => {
      res.push(seqNumber);
      if (this.direction === DIRECT_UP) {
        res.push(seqNumber + 2);
        res.push(seqNumber + BRICKS_IN_ROW + 1);
        res.push(seqNumber + BRICKS_IN_ROW * 2);
        res.push(seqNumber + BRICKS_IN_ROW * 2 + 1);
        res.push(seqNumber + BRICKS_IN_ROW * 2 + 2);
        res.push(seqNumber + BRICKS_IN_ROW * 3 + 1);
      } else {
        res.push(seqNumber - 2);
        res.push(seqNumber - BRICKS_IN_ROW - 1);
        res.push(seqNumber - BRICKS_IN_ROW * 2);
        res.push(seqNumber - BRICKS_IN_ROW * 2 - 1);
        res.push(seqNumber - BRICKS_IN_ROW * 2 - 2);
        res.push(seqNumber - BRICKS_IN_ROW * 3 - 1);
      }
    };
    const brickBackCoord1 = this.direction === DIRECT_UP
      ? this.backCoord1
      : {
        x: this.backCoord1.x - 1,
        y: this.backCoord1.y + 1,
      };
    backLeftBrickSeqNumber = Brick.getSeqNumberByBackCoord(brickBackCoord1);
    fillArray(backLeftBrickSeqNumber);
    return res;
  }
}

class PlayerCar extends Car {
  constructor(backXCoord) {
    super(...calcCoord(DIRECT_DOWN, { x: backXCoord, y: BRICKS_IN_COLUMN - 2 }), DIRECT_DOWN);
    super.drawCar();
  }

  shiftLeft() {
    if (this.backCoord2.x > 2 && Game.phase !== PAUSE_PHASE && Game.phase !== INIT_PHASE) {
      if (!this.isCarCrashed(Game.enemiesCars[0], this.getNoseSeqNumber() - 1)) {
        this.eraseCar();
        this.frontCoord1.x -= 1;
        this.frontCoord2.x -= 1;
        this.backCoord1.x -= 1;
        this.backCoord2.x -= 1;
        this.drawCar();
      }
    }
  }

  shiftRight() {
    if (this.backCoord1.x < 9 && Game.phase !== PAUSE_PHASE && Game.phase !== INIT_PHASE) {
      if (!this.isCarCrashed(Game.enemiesCars[0], this.getNoseSeqNumber() + 1)) {
        this.eraseCar();
        this.frontCoord1.x++;
        this.frontCoord2.x++;
        this.backCoord1.x++;
        this.backCoord2.x++;
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
    for (let horizPos = 0; horizPos < 8; horizPos++) {
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

class EnemyCar extends Car { // player
  constructor(backCoord1) {
    super(...calcCoord(DIRECT_UP, backCoord1), DIRECT_UP);
    super.drawCar();
    Game.enemiesCars.push(this);
  }

  shiftUp() {
    this.eraseCar();
    if (this.backCoord1.y > 19) {
      Game.enemiesCars.shift();
    } else {
      this.frontCoord1.y += 1;
      this.frontCoord2.y += 1;
      this.backCoord1.y += 1;
      this.backCoord2.y += 1;
      this.drawCar();
    }
  }

  xDist(backCoord1X) {
    return this.backCoord1.x - backCoord1X;
  }

  canBeAdded(backCoord1X) {
    if (Math.abs(this.xDist(backCoord1X)) >= CAR_WIDTH) return true;
  }

  isCarPassed() {
    const enemyCarNoseSeqNumber = this.activeBricksSeqNumbers[BRICKS_IN_CAR - 1];
    return Math.floor(enemyCarNoseSeqNumber / 10) > 22;
  }

  static getRandXBackCoord() {
    return Math.floor(Math.random() * Math.floor(6)) + 1;
  }
}

class Game {
  static enemiesCars = [];
  static phase = INIT_PHASE;
  static counter = 0;
  static speedInterval;

  constructor() {
    this.player = new PlayerCar(PLAYER_CAR_START_X_COORD);
    this.level = {
      speed: START_SPEED,
      goals: 0,
      value: 0,
    };
    this.score = {
      playerScore: 0,
      highScore: 0
    };
  }

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
    if (this.player.isCarCrashed(Game.enemiesCars[0], this.player.getNoseSeqNumber() - 10)) {
      return;
    }
    for (let carInd = 0; carInd < Game.enemiesCars.length; carInd++) {
      Game.enemiesCars[carInd].shiftUp();
      console.log('shifted');
    }
    if (Game.enemiesCars[0].isCarPassed()) {
      console.log('PASSED');
      this.incrGoals();
    }
    Game.counter++;
    console.log(Game.counter);
    if (Game.counter % 10 === 0) {
      this.addEnemy();
    }
  }

  addEnemy() {
    if (Game.enemiesCars.length <= 2) {
      let enemy;
      if (Game.enemiesCars.length === 0) {
        enemy = new EnemyCar({ x: 3, y: ENEMY_CAR_START_X_COODR });
      } else {
        const lastEnemy = Game.enemiesCars[Game.enemiesCars.length - 1];
        let backCoord1X = 0;
        do {
          backCoord1X = EnemyCar.getRandXBackCoord();
        } while (lastEnemy.canBeAdded(backCoord1X));
        enemy = new EnemyCar({ x: backCoord1X, y: ENEMY_CAR_START_X_COODR });
      }
    }
  }

  incrGoals() {
    if (this.level.goals < GOALS) {
      this.level.goals++;
      this.incrScore();
    } else {
      this.level.goals = 0;
      this.incrSpeed();
      this.level.value++;
    }
  }

  incrSpeed() {
    this.level.speed -= SPEED_FRACTION;
    Game.speedInterval = setInterval(this.moveEnemies.bind(this), this.level.speed);
  }

  incrScore() {
    this.score.playerScore++;
    if (this.score.playerScore > this.score.highScore) {
      this.score.highScore++;
    }
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
    this.player.eraseCar();
    this.player = new PlayerCar(PLAYER_CAR_START_X_COORD);
  }

  restart() {
    this.refreshLevel();
    this.refreshScore();
    this.clearEnemies();
    this.setPlayerToStart();
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