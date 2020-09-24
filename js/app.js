const BRICKS_NUMBER = 200;
const BRICKS_IN_ROW = 10;
const BRICKS_IN_COLUMN = 20;
const BRICKS_IN_CAR = 7;
const DIRECT_DOWN = 'down';
const DIRECT_UP = 'up';
const DRAW = 'draw';
const ERASE = 'erase';
const GOALS = 50;
const START_SPEED = 1000;
const SPEED_FRACTION = 50;
const PLAYER_CAR_START_X_COORD = 3;

const gameField = document.querySelector('.game-field');

let bricksArray = [];

document.addEventListener('DOMContentLoaded', () => {
  for (let seqNumber = 0; seqNumber < BRICKS_NUMBER; seqNumber++) {
    const brick = document.createElement('div');
    brick.classList.add('brick');
    brick.innerHTML = `${ seqNumber }`;
    bricksArray.push(new Brick(brick, seqNumber));
    gameField.appendChild(brick);
  }

  let game = new Game();

  let modal = new Modal();

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

  game.addEnemy();
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
    for (let yCoord = 0; yCoord < y; yCoord++) {
      seqNumber += BRICKS_IN_ROW;
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
    if (this.backCoord2.x > 1) {
      this.eraseCar();
      this.frontCoord1.x -= 1;
      this.frontCoord2.x -= 1;
      this.backCoord1.x -= 1;
      this.backCoord2.x -= 1;
      this.drawCar();
    }
  }

  shiftRight() {
    if (this.backCoord1.x < 10) {
      this.eraseCar();
      this.frontCoord1.x++;
      this.frontCoord2.x++;
      this.backCoord1.x++;
      this.backCoord2.x++;
      this.drawCar();
    }
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
}

class Game {
  static enemiesCars = [];

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
    this.intervalId = setInterval(this.moveEnemies, this.level.speed);
  }

  moveEnemies() {
    for (let carInd = 0; carInd < Game.enemiesCars.length; carInd++) {
      Game.enemiesCars[carInd].shiftUp();
      if (this.isCrashed(Game.enemiesCars[carInd])) {
        this.over();
      }
      if (this.isPassed(Game.enemiesCars[carInd])) {
        this.incrGoals();
        Game.enemiesCars.pop();
        this.addEnemy();
      }
    }
  }

  isPassed(enemyCar) {
    const enemyCarNoseSeqNumber = enemyCar.activeBricksSeqNumbers[BRICKS_IN_CAR - 1];
    const playerCarNoseSeqNumber = this.player.activeBricksSeqNumbers[BRICKS_IN_CAR - 1];
    return enemyCarNoseSeqNumber / BRICKS_IN_ROW - playerCarNoseSeqNumber / BRICKS_IN_ROW >= 4;
  }

  isCrashed(enemyCar) {
    const enemyCarNoseSeqNumber = enemyCar.activeBricksSeqNumbers[BRICKS_IN_CAR - 1];
    const playerCarNoseSeqNumber = this.player.activeBricksSeqNumbers[BRICKS_IN_CAR - 1];
    for (let horizPos = 0; horizPos < 8; horizPos++) {
      switch (horizPos) {
        case 0:
          if (enemyCarNoseSeqNumber === playerCarNoseSeqNumber) return true;
          break;
        case 1:
          if (enemyCarNoseSeqNumber === playerCarNoseSeqNumber + BRICKS_IN_ROW - 1
            || enemyCarNoseSeqNumber === playerCarNoseSeqNumber + BRICKS_IN_ROW + 1) return true;
          break;
        default:
          if (enemyCarNoseSeqNumber === playerCarNoseSeqNumber + horizPos * BRICKS_IN_ROW - 2
            || enemyCarNoseSeqNumber === playerCarNoseSeqNumber + horizPos * BRICKS_IN_ROW + 2) return true;
          break;
      }
    }
    return false;
  }

  addEnemy() {
    const enemy = new EnemyCar({ x: 3, y: 0 });
    Game.enemiesCars.push(enemy);
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
    this.intervalId = setInterval(this.moveEnemies, this.level.speed);
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
  }

  over() {
    let modal = Modal.getModel();
    modal.setHeaderText('Game over');
    modal.setBodyText('Wy dont we play again?');
    modal.display();
  }
}

/* MODAL */

class Modal {
  constructor() {
    this.modal = document.querySelector('.modal');
    this.closeModalBtn = document.querySelector('.close');
    this.modalHeader = document.querySelector('.modal__header');
    this.modalText = document.querySelector('.modal-body__p');

    this.closeModalBtn.onclick = () => {
      this.hide();
    };

    window.onclick = event => {
      if (event.target === this.modal) {
        this.hide();
      }
    }
  }

  set setHeaderText (text) {
    this.modalHeader.innerHTML = text;
  }

  set setBodyText (text) {
    this.modalText.innerHTML = text;
  }

  static get getModel() {
    return this;
  }

  display() {
    this.modal.style.display = 'block';
  }

  hide() {
    this.modal.display = 'none';
  }
}