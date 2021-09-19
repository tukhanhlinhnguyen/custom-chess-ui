let board = null
let game = new Chess()
let currentColor = "w"
let initiateWhitePawnPosition = ["a2","b2","c2","d2","e2","f2","g2","h2"]
let initiateBlackPawnPosition = ["a7","b7","c7","d7","e7","f7","g7","h7"]
let AIDepth = 3

function start(){
  window.location.reload()
}

/////////////////////////////////////////////////////////////////////
/////GAME MECHANIC
/////////////////////////////////////////////////////////////////////

function move_the_piece_manually(piece){
  let possibleMoves=[];
  let mode = document.querySelector('input[name="Mode"]:checked').value;
  let pawnMode = document.querySelector('input[name="PawnMove"]:checked').value;
  let AIActivated = document.getElementById("toogleAi");
  let pieceMoved = false;

  //switching between mode 
  switch (mode) {
    case "Minmax":
      possibleMoves = getBestMove(game,piece);
      if(!possibleMoves){
        showToast("No legal move for this piece. Maybe try another piece or mode")
        updateStatus();
      }else{
        game.move(getBestMove(game,piece))
        board.position(game.fen())
        updateColor();
        updateStatus();
        pieceMoved=true;
      }
      break;
    case "Aggressive":
      //looking for capturing
      if(possibleMoves.length==0){
        possibleMoves=get_lethal_legal_moves_by_piece(game,piece);
      }

      //if not available, make a normal move
      if(possibleMoves.length==0){
        //check if the piece is a pawn, if range mode is 1 subtract all range 2 initiate move and vice-versa
        if(piece.type == "p" && checkPawnInInitiatePosition()){
          possibleMoves=get_legal_moves_by_piece(game,piece);
          switch (pawnMode) {
            case "1":
              let initiate2rowPawnMove = get_legal_pawn_first_2row_moves(game,piece);
              possibleMoves = possibleMoves.filter(x => !initiate2rowPawnMove.includes(x));
              break;
            case "2":
              let initiate1rowPawnMove = get_legal_pawn_first_1row_moves(game,piece);
              possibleMoves = possibleMoves.filter(x => !initiate1rowPawnMove.includes(x));
              break;
          }
        }else{
          //else we make a defensive move as a last resort
          possibleMoves=get_legal_moves_by_piece(game,piece);
        }
      }
      //no move available, return error msg
      if(possibleMoves.length==0){
        showToast("No legal move for this piece. Maybe try another piece or mode")
        updateStatus();
      }else{
      //Make the move
        let randomIdx = Math.floor(Math.random() * possibleMoves.length)
        game.move(possibleMoves[randomIdx])
        board.position(game.fen())
        updateColor();
        updateStatus();
        pieceMoved=true;
      }
      break;
    case "Defensive":
      //if not available, make a normal move
      if(possibleMoves.length==0){
        //check the pawn move, if range 1 subtract all range 2 initiate move and vice-versa
        if(piece.type == "p" && checkPawnInInitiatePosition()){
          possibleMoves=get_legal_moves_by_piece(game,piece);
          switch (pawnMode) {
            case "1":
              let initiate2rowPawnMove = get_legal_pawn_first_2row_moves(game,piece);
              possibleMoves = possibleMoves.filter(x => !initiate2rowPawnMove.includes(x));
              break;
            case "2":
              let initiate1rowPawnMove = get_legal_pawn_first_1row_moves(game,piece);
              possibleMoves = possibleMoves.filter(x => !initiate1rowPawnMove.includes(x));
              break;
          }
        }else{
          possibleMoves=get_legal_moves_by_piece(game,piece);
        }
      }
      //no move available, return error msg
      if(possibleMoves.length==0){
        showToast("No legal move for this piece. Maybe try another piece or mode")
        updateStatus();
      }else{
      //Make the move
        let randomIdx = Math.floor(Math.random() * possibleMoves.length)
        game.move(possibleMoves[randomIdx])
        board.position(game.fen())
        updateColor();
        updateStatus();
        pieceMoved=true;
      }
      break;  
  }
  //Write the history on the statistics div
  writeHistory()

  //Check if the AI mode is on and a move has been made, we calculate the next move
  if(AIActivated.checked && pieceMoved){
    make_next_move_using_AI()
  }
}

function make_next_move_using_AI() {
  //disable control button while waiting for AI computing
  disable_pieces_buttons()
  let AIMode = document.querySelector('input[name="AIMode"]:checked').value;
  switch (AIMode) {
    case "Random":
      window.setTimeout(makeRandomMove())
      break;
    case "OneMove":
      window.setTimeout(makeBestMoveOne())
      break;
    case "MultiMove":
      window.setTimeout(makeBestMove(AIDepth))
      break;
  }
}


////////////////////////////////////////////////////////////////////
/////LOGIC
////////////////////////////////////////////////////////////////////
const get_legal_moves_by_piece = (game, piece) => {
  return game.moves({ verbose: true })
              .filter((move) => move.piece === piece.type && move.color === piece.color)
              .map((move) => move.san)
}

const get_legal_pawn_first_1row_moves = (game, piece) => {
  return game.moves({ verbose: true })
              .filter((move) => move.piece === piece.type && move.color === piece.color && getMoveRange(move.from,move.to) ==1 && isInfirstRow(move.color, move.from))
              .map((move) => move.san)
}

const get_legal_pawn_first_2row_moves = (game, piece) => {
  return game.moves({ verbose: true })
              .filter((move) => move.piece === piece.type && move.color === piece.color && getMoveRange(move.from,move.to) ==2  && isInfirstRow(move.color, move.from))
              .map((move) => move.san)
}

const get_non_lethal_legal_moves_by_piece = (game, piece) => {
  return game.moves({ verbose: true })
              .filter((move) => move.piece === piece.type && move.color === piece.color && move.flags === "n")
              .map((move) => move.san)
}

const get_lethal_legal_moves_by_piece = (game, piece) => {
  return game.moves({ verbose: true })
              .filter((move) => move.piece === piece.type && move.color === piece.color && move.flags === "c")
              .map((move) => move.san)
}

const get_piece_positions = (game, piece) => {
  return [].concat(...game.board()).map((p, index) => {
    if (p !== null && p.type === piece.type && p.color === piece.color) {
      return index
    }
  }).filter(Number.isInteger).map((piece_index) => {
    const row = 'abcdefgh'[piece_index % 8]
    const column = Math.ceil((64 - piece_index) / 8)
    return row + column
  })
}

function getMoveRange(from,to){
  let fromRow = from.replace( /^\D+/g, '');
  let toRow = to.replace( /^\D+/g, '');
  return Math.abs(toRow - fromRow)
}

function checkPawnInInitiatePosition(){
  let pawn_positions = get_piece_positions(game, { type: 'p', color: currentColor})

  switch(currentColor) {
    case "w":
      return pawn_positions.some(item => initiateWhitePawnPosition.includes(item))
    case "b":
      return pawn_positions.some(item => initiateBlackPawnPosition.includes(item))
  }
}

function isInfirstRow(color,from){
  if(color=="w"){
    return  initiateWhitePawnPosition.includes(from)
  }else{
    return  initiateBlackPawnPosition.includes(from)
  }
}

/////////////////////////////////////////////////////////////////////
/////UI
/////////////////////////////////////////////////////////////////////
function updateColor(){
  currentColor == "w" ? currentColor = "b": currentColor = "w"
  if (currentColor == "w") {
    document.getElementById("player_icon").src="img/chesspieces/wikipedia/wK.png";
  }else{
    document.getElementById("player_icon").src="img/chesspieces/wikipedia/bK.png";
  }
}

function updateStatus(){
  let msg = "";
  if(game.in_check()){
    msg+="The side to move is in check"
    msg+="<br />"
  }
  if(game.in_checkmate()){
    msg+="The side to move has been checkmated"
    msg+="<br />"
  }
  if(game.in_draw()){
    msg+="The game is drawn (50-move rule or insufficient material)"
    msg+="<br />"
  }
  if(game.in_checkmate()){
    msg+="The side to move has been stalemated"
    msg+="<br />"
  }
  if(game.in_threefold_repetition()){
    msg+="The current board position has occurred three or more times"
    msg+="<br />"
  }
  if(game.insufficient_material()){
    msg+="The game is drawn due to insufficient material"
    msg+="<br />"
  }
  document.getElementById("status").innerHTML = msg;
}

function disable_pieces_buttons() {
  let elems = document.getElementsByClassName("pieces");
    for(let i = 0; i < elems.length; i++) {
      elems[i].disabled = true;
    }
}

function enable_pieces_buttons() {
  let elems = document.getElementsByClassName("pieces");
    for(let i = 0; i < elems.length; i++) {
      elems[i].disabled = false;
    }
}

function update_ui_after_AI_move() {
  enable_pieces_buttons()
  updateColor();
  updateStatus();
  writeHistory()
}


/////////////////////////////////////////////////////////////////////
/////Toast
/////////////////////////////////////////////////////////////////////
function showToast(msg){
  let myToast = Toastify({
    text: msg,
    duration: 5000
   })
   myToast.showToast();
}

/////////////////////////////////////////////////////////////////////
/////Minimax with Alpha Beta Pruning
/////////////////////////////////////////////////////////////////////

let getBestMove = function (game,piece) {
  if (game.game_over()) {
      alert('Game over');
  }

  positionCount = 0;
  let depth = 3;

  let bestMove = minimaxRoot(depth, game, true,piece);

  return bestMove;
};

let minimax = function (depth, game, isMaximisingPlayer,piece) {
  let pawnMode = document.querySelector('input[name="PawnMove"]:checked').value;
  let possibleMoves = get_legal_moves_by_piece(game,piece);

  if (depth === 0) {
      return -evaluateBoard(game.board(),currentColor);
  }
  let newGameMoves;
  if(piece.type == "p"){
    switch (pawnMode) {
      case "1":
        let initiate2rowPawnMove = get_legal_pawn_first_2row_moves(game,piece);
        newGameMoves = possibleMoves.filter(x => !initiate2rowPawnMove.includes(x));
        break;
      case "2":
        let initiate1rowPawnMove = get_legal_pawn_first_1row_moves(game,piece);
        newGameMoves = possibleMoves.filter(x => !initiate1rowPawnMove.includes(x));
        break;
    }
  }else{
    newGameMoves=get_legal_moves_by_piece(game,piece);
  }

  if (isMaximisingPlayer) {
      let bestMove = -9999;
      for (let i = 0; i < newGameMoves.length; i++) {
          game.move(newGameMoves[i]);
          bestMove = Math.max(bestMove, minimax(depth - 1, game, !isMaximisingPlayer));
          game.undo();
      }
      return bestMove;
  } else {
      let bestMove = 9999;
      for (let i = 0; i < newGameMoves.length; i++) {
          game.move(newGameMoves[i]);
          bestMove = Math.min(bestMove, minimax(depth - 1, game, !isMaximisingPlayer));
          game.undo();
      }
      return bestMove;
  }
};

let minimaxRoot =function(depth, game, isMaximisingPlayer,piece) {
  let pawnMode = document.querySelector('input[name="PawnMove"]:checked').value;
  let possibleMoves = get_legal_moves_by_piece(game,piece);

  let newGameMoves;
  if(piece.type == "p"){
    switch (pawnMode) {
      case "1":
        let initiate2rowPawnMove = get_legal_pawn_first_2row_moves(game,piece);
        newGameMoves = possibleMoves.filter(x => !initiate2rowPawnMove.includes(x));        break;
      case "2":
        let initiate1rowPawnMove = get_legal_pawn_first_1row_moves(game,piece);
        newGameMoves = possibleMoves.filter(x => !initiate1rowPawnMove.includes(x));
        break;
    }
  }else{
    newGameMoves=get_legal_moves_by_piece(game,piece);
  }
  let bestMove = -9999;
  let bestMoveFound;

  for(let i = 0; i < newGameMoves.length; i++) {
      let newGameMove = newGameMoves[i]
      game.move(newGameMove);
      let value = minimax(depth - 1, game, -10000, 10000, !isMaximisingPlayer,piece);
      game.undo();
      if(value >= bestMove) {
          bestMove = value;
          bestMoveFound = newGameMove;
      }
  }
  return bestMoveFound;
};

/////////////////////////////////////////////////////////////////////
/////Evaluate Board 
/////////////////////////////////////////////////////////////////////
let evaluateBoard = function(board, color) {
  // Sets the value for each piece using standard piece value
  let pieceValue = {
    'p': 100,
    'n': 350,
    'b': 350,
    'r': 525,
    'q': 1000,
    'k': 10000
  };

  // Loop through all pieces on the board and sum up total
  let value = 0;
  board.forEach(function(row) {
    row.forEach(function(piece) {
      if (piece) {
        // Subtract piece value if it is opponent's piece
        value += pieceValue[piece['type']]
                 * (piece['color'] === color ? 1 : -1);
      }
    });
  });

  return value;
};

////////////////////////////////////////////////////////////////////
/////HISTORY
////////////////////////////////////////////////////////////////////
function writeHistory() {
  moveHistory = game.history({ verbose: true });
  let output = "<ul>";
    Object.keys(moveHistory).forEach(function(k) {
        if (typeof moveHistory[k] == "object" && moveHistory[k] !== null){
            output += "<li>";
            moveHistory[k].color == "w" ? output += "White ":output += "Black "

            output += getPieceText(moveHistory[k].piece)
            output += "from "+moveHistory[k].from
            output += " to "+moveHistory[k].to
            switch(moveHistory[k].flags) {
              case "b":
                output += " (push of two squares)"
                break;
              case "e":
                output += " passant capture "
                output += getPieceText(moveHistory[k].captured)
                break;
              case "c":
                output += " capture "
                output += getPieceText(moveHistory[k].captured)
                break;
              case "q":
                output += " queenside castling"
                break;
              case "k":
                output += " kingside castling"
                break;
              case "p":
                output += " promotion"
                break;
            }
            output += "</li>";
        } else {
            output += "<li>" + k + " : " + moveHistory[k] + "</li>"; 
        }
    });
    output += "</ul>";
    document.getElementById("statistics").innerHTML = output;
    document.getElementById("statistics").scrollTop = document.getElementById("statistics").scrollHeight;
}

function getPieceText(piece) {
  switch(piece) {
    case "q":
      return "quuen "
    case "k":
      return "king "
    case "r":
      return "rook "
    case "b":
      return "bishop "
    case "n":
      return "knight "
    case "p":
      return "pawn "
  }
}


/////////////////////////////////////////////////////////////////////
/////AI
/////////////////////////////////////////////////////////////////////
function makeRandomMove () {
  //add some delay for smoother animation
  let promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      let possibleMoves = game.moves()
      // game over
      if (possibleMoves.length === 0) resolve()
      let randomIdx = Math.floor(Math.random() * possibleMoves.length)
      game.move(possibleMoves[randomIdx])
      board.position(game.fen())
      resolve();
    }, 500);
  });

  //reactive control button
  promise.then(() => {
    update_ui_after_AI_move()
  });
}

function makeBestMoveOne() {
  let promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      // List all possible moves
      let possibleMoves = game.moves();
      // Sort moves randomly, so the same move isn't always picked on ties
      possibleMoves.sort(function(a, b){return 0.5 - Math.random()});

      // exit if the game is over
      if (game.game_over() === true || possibleMoves.length === 0) resolve();

      // Search for move with highest value
      let bestMoveSoFar = null;
      let bestMoveValue = Number.NEGATIVE_INFINITY;
      possibleMoves.forEach(function(move) {
        game.move(move);
        let moveValue = evaluateBoard(game.board(), currentColor);
        if (moveValue > bestMoveValue) {
          bestMoveSoFar = move;
          bestMoveValue = moveValue;
        }
        game.undo();
      });
      game.move(bestMoveSoFar)
      board.position(game.fen())
      resolve();
    }, 500);
  });
  //reactive control button
  promise.then(() => {
    update_ui_after_AI_move()
  });
}

function calcBestMove(depth,alpha,beta,isMaximizingPlayer) {
  // Base case: evaluate board
  if (depth === 0) {
    value = evaluateBoard(game.board(), currentColor);
    return [value, null]
  }

  // Recursive case: search possible moves
  let bestMove = null; // best move not set yet
  let possibleMoves = game.moves();
  // Set random order for possible moves
  possibleMoves.sort(function(a, b){return 0.5 - Math.random()});
  // Set a default best move value
  let bestMoveValue = isMaximizingPlayer ? Number.NEGATIVE_INFINITY
                : Number.POSITIVE_INFINITY;
  // Search through all possible moves
  for (let i = 0; i < possibleMoves.length; i++) {
    let move = possibleMoves[i];
    // Make the move, but undo before exiting loop
    game.move(move);
    // Recursively get the value from this move
    value = calcBestMove(depth-1,alpha,beta,!isMaximizingPlayer)[0];
    // Log the value of this move
    //console.log(isMaximizingPlayer ? 'Max: ' : 'Min: ', depth, move, value,
    //bestMove, bestMoveValue);

    if (isMaximizingPlayer) {
      // Look for moves that maximize position
      if (value > bestMoveValue) {
        bestMoveValue = value;
        bestMove = move;
      }
    alpha = Math.max(alpha, value);
    } else {
    // Look for moves that minimize position
    if (value < bestMoveValue) {
      bestMoveValue = value;
      bestMove = move;
    }
    beta = Math.min(beta, value);
    }
    // Undo previous move
    game.undo();
    // Check for alpha beta pruning
    // if (beta <= alpha) {
    //   console.log('Prune', alpha, beta);
    // break;
    // }
  }
  return [bestMoveValue, bestMove || possibleMoves[0]];
}


function makeBestMove(depth) {
  const promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      let result = calcBestMove(depth,Number.NEGATIVE_INFINITY,Number.POSITIVE_INFINITY,true);
      game.move(result[1])
      board.position(game.fen())
      resolve();
    }, 500);
  });
  //reactive control button
  promise.then(() => {
    update_ui_after_AI_move()
  });
}


/////////////////////////////////////////////////////////////////////
/////START GAME
/////////////////////////////////////////////////////////////////////

board = Chessboard('myBoard',{
  pieceTheme: dilena_piece_theme,
  position: 'start'
})


