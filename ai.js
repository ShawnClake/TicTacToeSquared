let state = 0; // 0: menu, 1: playing, 2: game over
let firstMove = true;
let boardSize = 9;
let turn = 0;
let board = []; // {playable: true, player: null, turn: 0}

function getBoardCoord(x, y) {
  return x * boardSize + y;
}

function getPlace(x, y) {
  return board[getBoardCoord(x,y)];
}

function setPlace(x, y, place) {
  board[getBoardCoord(x,y)] = place;
}

function draw() {
  let i = 0, j = 0;
  for (i = 0; i < boardSize; i++) {
    for (j = 0; j < boardSize; j++) {
      let clazz = $(".s" + i + j);
      let place = getPlace(i,j);
      // case 1: not playable
      // case 2: playable
      // case 3: player1 played
      // case 4: player2 played

      clazz.removeClass("playable");
      clazz.removeClass("player1");
      clazz.removeClass("player2");
      clazz.removeClass("unplayable");
      
      if(place.playable && place.player === null)
      {
        clazz.addClass("playable");
      } else if(!place.playable && place.player === 0) {
        clazz.addClass("player1");
      } else if(!place.playable && place.player === 1) {
        clazz.addClass("player2");
      } else if (!place.playable && place.player === -1) {
        clazz.addClass("dead");
      } else {
        clazz.addClass("unplayable");
      }

      clazz.data("place", "" + i + j);
    }
  }
}

function prepare() {
  firstMove = true;

  let i = 0, j = 0;
  for (i = 0; i < boardSize; i++) {
    for (j = 0; j < boardSize; j++) {
      setPlace(i, j, {playable: true, player: null, turn: null});
    }
  }

  // getPlace(0,0).playable = false;
  // getPlace(0,4).playable = false;
  // getPlace(0,8).playable = false;
  //
  // getPlace(4,0).playable = false;
  // getPlace(4,4).playable = false;
  // getPlace(4,8).playable = false;
  //
  // getPlace(8,0).playable = false;
  // getPlace(8,4).playable = false;
  // getPlace(8,8).playable = false;
}

function preparePlayables(x, y) {

  console.log("bullshit");

  let quadX = Math.floor(x % 3);
  let quadY = Math.floor(y % 3);

  if(firstMove)
  {
    while(true) {
      let deadX = Math.floor(Math.random() * 3);
      let deadY = Math.floor(Math.random() * 3);

      if(deadX === quadX && deadY === quadY)
        continue;

      let place = getPlace(deadX * 3 + quadX, deadY * 3 + quadY);
      place.playable = false;
      place.player = -1;

      break;
    }

    firstMove = false;
  }

  let i = 0, j = 0;
  for (i = 0; i < boardSize; i++) {
    for (j = 0; j < boardSize; j++) {
      let place = getPlace(i,j);
      place.playable = false;

      if((i >= (quadX * 3) && i <= (quadX * 3 + 2)) && (j >= (quadY * 3) && j <= (quadY * 3 + 2)))
      {
        console.log(quadX);
        console.log(quadY);
        if(place.player === null)
        {
          place.playable = true;
        }
      }
    }
  }
}

function makeMove(x,y) {
  let place = getPlace(x,y);

  if(!place.playable)
    return;

  let playerTurn = turn % 2;

  place.playable = false;
  place.player = playerTurn;
  place.turn = turn;

  turn += 1;

  preparePlayables(x,y);

  draw();
}

$(document).ready(function () {
  prepare();
  draw();

  $(".space").click(function () {
    let place = $(this).data("place");
    let x = place.substring(0,1);
    let y = place.substring(1,2);
    makeMove(parseInt(x), parseInt(y));
  });
});