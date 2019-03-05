// Board size variable to reduce magic numbers throughout the code
let boardSize = 9;

// Current turn counter
let turn = 0;

// The board data structure
let board = []; // [{playable: true, player: null, turn: 0}, ... ]

// The big picture board win data structure
let wins = [];

// The difficulty of the AI
// 0 -> Random placement
// 1 -> Tries to win current square
// 2 -> Look ahead
let difficulty = 1;

// The possible victory conditions of a single tic tac toe game
let conditions = [
  [0, 3, 6],
  [0, 1, 2],
  [1, 4, 7],
  [3, 4, 5],
  [2, 5, 8],
  [6, 7, 8],
  [0, 4, 8],
  [2, 4, 6],
];

/**
 * Calculates the flattened index when given a column and a row
 * @param x 0-9
 * @param y 0-9
 * @returns {*}
 */
function getBoardCoord(x, y) {
  return x * boardSize + y;
}

/**
 * Returns the quadrant winner
 * @param x 0-2
 * @param y 0-2
 * @returns {*}
 */
function getBoardWin(x, y) {
  return wins[x * 3 + y];
}

/**
 * Sets a quadrant winner
 * @param x 0-2
 * @param y 0-2
 * @param player {player: int, condition: []}
 */
function setBoardWin(x, y, player) {
  wins[x * 3 + y] = player;
}

/**
 * Returns a place data structure from the board
 * @param x 0-9
 * @param y 0-9
 * @returns {*}
 */
function getPlace(x, y) {
  return board[getBoardCoord(x, y)];
}

/**
 * Sets a place into the board data structure
 * @param x 0-9
 * @param y 0-9
 * @param place
 */
function setPlace(x, y, place) {
  board[getBoardCoord(x, y)] = place;
}

/**
 * Returns a place data structure from the board using the given quadrant and offset coordinates
 * @param quadX 0-2
 * @param quadY 0-2
 * @param xOffset 0-2
 * @param yOffset 0-2
 * @returns {*}
 */
function getQuadPlace(quadX, quadY, xOffset, yOffset) {
  return getPlace(quadX * 3 + xOffset, quadY * 3 + yOffset);
}

/**
 * Returns a place data structure given a quadrant coordinates and flattened coordinate offset
 * @param quadX 0-2
 * @param quadY 0-2
 * @param offset 0-8
 * @returns {*}
 */
function getQuadPlaceByOffset(quadX, quadY, offset) {
  return getPlace(quadX * 3 + Math.floor(offset / 3), quadY * 3 + offset % 3);
}

/**
 * Gets the quad index based on the board coordinate
 * @param index
 */
function getQuadIndexFromBoardCoord(index)
{
  let x = Math.floor(Math.floor(index / 9) / 3);
  let y = Math.floor(Math.floor(index % 9) / 3);

  return parseInt("" + x + y);
}

/**
 * Returns a board coordinate given a quad coordinate and an offset
 * @param quadX 0-2
 * @param quadY 0-2
 * @param offset 0-8
 */
function getBoardCoordFromQuadOffset(quadX, quadY, offset) {
  return (quadX * 3 + Math.floor(offset / 3)) * boardSize + (quadY * 3 + offset % 3);
}

/**
 * Creates a sub board data structure for the given quadrant
 * @param quadX 0-2
 * @param quadY 0-2
 * @returns {Array}
 */
function getSubBoard(quadX, quadY) {
  let subBoard = [];
  let i = 0, j = 0;
  for (i = 0; i < 3; i++) {
    for (j = 0; j < 3; j++) {
      subBoard.push(getQuadPlace(quadX, quadY, i, j));
    }
  }
  return subBoard;
}

/**
 * Draws the board to the DOM
 */
function draw() {
  let i = 0, j = 0;
  for (i = 0; i < boardSize; i++) {
    for (j = 0; j < boardSize; j++) {
      let clazz = $(".s" + i + j);
      let place = getPlace(i, j);
      // case 1: not playable
      // case 2: playable
      // case 3: player1 played
      // case 4: player2 played

      // Removes all of the existing styles from the place
      clazz.removeClass("playable");
      clazz.removeClass("player1");
      clazz.removeClass("player2");
      clazz.removeClass("unplayable");
      clazz.removeClass("won");

      // Adds the correct styles to the place

      // If a spot if playable, and no one has played on it
      if (place.playable && place.player === null) {
        clazz.addClass("playable");

        // If a spot has been occupied by the human
      } else if (!place.playable && place.player === 0) {
        clazz.addClass("player1");
        if (place.won) {
          clazz.addClass("won");
        }

        // If a spot has been occupied by the AI
      } else if (!place.playable && place.player === 1) {
        clazz.addClass("player2");
        if (place.won) {
          clazz.addClass("won");
        }

        // If a spot has not been occupied, but is not playable
      } else {
        clazz.addClass("unplayable");
      }

      // Adds a data field to the place containing the row and col coordinate of this space
      clazz.data("place", "" + i + j);
    }
  }
}

/**
 * Prepares the game board and the win structure
 */
function prepare() {
  let i = 0, j = 0;
  for (i = 0; i < boardSize; i++) {
    for (j = 0; j < boardSize; j++) {
      setPlace(i, j, {playable: true, player: null, turn: null, won: false});
    }
  }

  for (i = 0; i < 3; i++) {
    for (j = 0; j < 3; j++) {
      setBoardWin(i, j, {player: null, condition: null});
    }
  }

  updateStatus("It's your turn");
}

/**
 * After a move is made, this method will determine which places on the board should become playable
 * @param x
 * @param y
 */
function preparePlayables(x, y) {
  let quadX = Math.floor(x % 3);
  let quadY = Math.floor(y % 3);

  // Loop through the board
  let i = 0, j = 0, playables = 0;
  for (i = 0; i < boardSize; i++) {
    for (j = 0; j < boardSize; j++) {
      let place = getPlace(i, j);

      // Set each place to unplayable initially
      place.playable = false;

      // If the place falls within the new active quadrant set it to playable
      if ((i >= (quadX * 3) && i <= (quadX * 3 + 2)) && (j >= (quadY * 3) && j <= (quadY * 3 + 2))) {
        if (place.player === null) {
          place.playable = true;
          playables += 1;
        }
      }
    }
  }

  // If no spaces are playable in the active quadrant, then set any non-played spaces on the board to be playable
  if (playables === 0) {
    for (i = 0; i < boardSize; i++) {
      for (j = 0; j < boardSize; j++) {
        let place = getPlace(i, j);
        if (place.player === null) {
          place.playable = true;
        }
      }
    }
  }
}

/**
 * Checks whether a single tic-tac-toe game meets a victory condition
 * Returns the winning player and the victory condition that was met
 * @param subBoard
 * @returns {*}
 */
function checkTicTacToeWin(subBoard) {
  let i = 0;
  // Loop through each possible victory condition
  for (i = 0; i < conditions.length; i++) {
    let condition = conditions[i];
    // If the victory condition was met
    if (subBoard[condition[0]].player !== null && subBoard[condition[0]].player === subBoard[condition[1]].player && subBoard[condition[0]].player === subBoard[condition[2]].player) {
      return {
        player: subBoard[condition[0]].player,
        condition: condition
      };
    }
  }
  return {
    player: null
  };
}

/**
 * Returns a list of playable spots on the board
 * @returns {Array}
 */
function getPlayables()
{
  let i = 0;
  let playable = [];
  for (i = 0; i < board.length; i++) {
    if (board[i].playable) {
      playable.push(i);
    }
  }
  return playable;
}

/**
 * Evaluates a sub-board for the best play
 * @param quadX
 * @param quadY
 * @param subBoard
 * @returns {*}
 */
function evaluation(quadX, quadY, subBoard)
{
  // If the board has already been won, then it doesnt matter where we play for a 1 block look ahead
  if(getBoardWin(quadX, quadY).player !== null)
  {
    return {
      value: 0
    };
  }

  let bestIndex = null;
  let values = [];

  // Start with messing up the human
  let i = 0;
  for(i = 0; i < subBoard.length; i++)
  {
    if(subBoard[i].player === null)
    {
      subBoard[i].player = 0;
      let win = checkTicTacToeWin(subBoard);
      subBoard[i].player = null;
      if(win.player !== null)
      {
        bestIndex = 1;
        values.push(i)
      }
    }
  }

  // Then see if its actually better to just win the square
  for(i = 0; i < subBoard.length; i++)
  {
    if(subBoard[i].player === null)
    {
      subBoard[i].player = 1;
      let win = checkTicTacToeWin(subBoard);
      subBoard[i].player = null;
      if(win.player !== null)
      {
        if(bestIndex < 2)
        {
          values = [];
        }
        bestIndex = 2;
        values.push(i)
      }
    }
  }

  // If there is no spot to play that is advantageous, then return 0 to indicate that any place is okay
  if(values.length === 0)
  {
    return {
      value: 0,
    }
  }

  // If there are advantageous spots, then return a random one from the list
  let place = values[Math.floor(Math.random() * values.length)];
  place = getBoardCoordFromQuadOffset(quadX, quadY, place);

  return {
    value: bestIndex,
    placeIndex: place
  };
}

/**
 * Easy AI
 * Randomly places in a playable place
 */
function ai0() {
  let playable = getPlayables();

  let choice = Math.floor(Math.random() * playable.length);
  makeMove(Math.floor(playable[choice] / boardSize), Math.floor(playable[choice] % boardSize));
}

/**
 * Medium AI
 * Attempts to win the given tic-tac-toe game
 */
function ai1() {
  // Get all of the playable areas
  let playable = getPlayables();

  // List of analyzed squares
  let analyzedQuads = [];

  // Contains the best placements
  let places = [];
  let bestValue = 0;

  // Loop through the playables
  let i = 0;
  for(i = 0; i < playable.length; i++)
  {
    let quadIndex = getQuadIndexFromBoardCoord(playable[i]);

    // If we havent analyzed the quadrant where the playable place is
    if(!analyzedQuads.includes(quadIndex))
    {
      let quadX = Math.floor(Math.floor(playable[i] / 9) / 3);
      let quadY = Math.floor(Math.floor(playable[i] % 9) / 3);

      // Determine the best placements in that quadrant
      let result = evaluation(quadX, quadY, getSubBoard(quadX, quadY));
      if(result.value > 0 && result.value >= bestValue)
      {
        if(result.value > bestValue)
        {
          places = [];
        }
        bestValue = result.value;
        places.push(result.placeIndex);
      }

      analyzedQuads.push(quadIndex);
    }
  }

  console.log(places);

  // If no good placements were found
  if(places.length === 0)
  {
    ai0();

    // If a good placement was found
  } else {
    let place = places[Math.floor(Math.random() * places.length)];
    makeMove(Math.floor(place / boardSize), Math.floor(place % boardSize));
  }
}

/**
 * Hard AI
 * Incorporates a look ahead to try and make a good move
 */
function ai2() {
  ai0();
}

/**
 * Restarts the game and resets all game state values back to default
 */
function restart() {
  turn = 0;
  prepare();
  draw();
}

/**
 * When a player wins, this method is called.
 * @param winner
 */
function gameOver(winner) {
  alert("GAME OVER");
  updateStatus("GAME OVER, Hit restart to play again");
  restart();
}

/**
 * When no moves are left to be made, this method is called
 */
function tie() {

}

/**
 * Determines whether a quadrants tic-tac-toe game has been won
 * @param quadX 0-2
 * @param quadY 0-2
 * @returns {{player, condition}|{player}}
 */
function checkQuadWin(quadX, quadY) {
  return checkTicTacToeWin(getSubBoard(quadX, quadY));
}

/**
 * Determines whether the game has been won
 * @returns {{player, condition}|{player}}
 */
function checkGameWin() {
  return checkTicTacToeWin(wins);
}

/**
 * Updates the status text on the game UI
 * @param status
 */
function updateStatus(status)
{
  $("#status").html(status);
}

/**
 * Handles the logic for a move being made
 * @param x 0-8
 * @param y 0-8
 */
function makeMove(x, y) {

  let place = getPlace(x, y);

  // If a place is not playable, then abort
  if (!place.playable)
    return;

  // When playerTurn is 0, its the humans turn, when its 1, its the AI's turn
  let playerTurn = turn % 2;

  // Sets the values to the place on the board for the made move
  place.playable = false;
  place.player = playerTurn;
  place.turn = turn;

  turn += 1;

  // Updates which spots are playable on the board
  preparePlayables(x, y);

  // Gets the quadrant that we just played in
  let quadX = Math.floor(x / 3);
  let quadY = Math.floor(y / 3);

  // Checks if a quadrant has already been won
  if (getBoardWin(quadX, quadY).player === null) {

    // If a quadrant has not been won, check whether the player who just moved won the quadrant
    let winner = checkQuadWin(quadX, quadY);

    // If the quadrant was just won
    if (winner.player !== null) {
      // Alert the game state that it was won
      setBoardWin(quadX, quadY, winner);

      // Add a hook to the applicable spaces on the board to show where the victory condition was
      getQuadPlaceByOffset(quadX, quadY, winner.condition[0]).won = true;
      getQuadPlaceByOffset(quadX, quadY, winner.condition[1]).won = true;
      getQuadPlaceByOffset(quadX, quadY, winner.condition[2]).won = true;
    }
  }

  // Draw the board to the DOM
  draw();

  // Check whether a game was just won
  let gameWinner = checkGameWin();
  if (gameWinner.player !== null) {
    // If a game was run, execute game over and stop the move making process
    setTimeout(gameOver(gameWinner), 500);
    return;
  }

  // If we the human just took their turn
  if (playerTurn !== 1) {
    updateStatus("The AI is taking its turn");

    // Lets the AI take their turn with a 2s delay
    if(difficulty === 0)
    {
      setTimeout(function() {
        ai0()
      }, 2000);
    } else if(difficulty === 1)
    {
      setTimeout(function() {
        ai1()
      }, 2000);
    } else if(difficulty === 2)
    {
      setTimeout(function() {
        ai2()
      }, 2000);
    }

  } else {
    updateStatus("It's your turn");
  }
}

/**
 * Called when the application first loads
 */
$(document).ready(function () {
  prepare();
  draw();

  // Adds click handlers for playable spaces
  $(".space").click(function () {
    let playerTurn = turn % 2;
    if (playerTurn !== 0) {
      alert("It is currently the AI's turn");
      return;
    }
    let place = $(this).data("place");
    let x = place.substring(0, 1);
    let y = place.substring(1, 2);
    makeMove(parseInt(x), parseInt(y));
  });

  // Adds a click handler for the restart button
  $("#restart").click(function() {
    let playerTurn = turn % 2;
    if (playerTurn !== 0) {
      alert("Please wait until your turn to restart");
      return;
    }
    restart();
  });
});