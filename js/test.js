/////////////////////////////////////////////////////////////////////
/////RANDOM MOVE FOR TESTING
/////////////////////////////////////////////////////////////////////
function testRandomMove () {
    let possibleMoves = game.moves()
  
    // exit if the game is over
    if (game.game_over()) return
    make_next_move_using_AI();
  
    window.setTimeout(testRandomMove, 500)
  }
window.setTimeout(testRandomMove, 10)