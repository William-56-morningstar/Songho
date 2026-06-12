// js/core/end-game.js

function collectRemainingSeeds(state) {
  state.scores.north += sum(state.board.north);
  state.scores.south += sum(state.board.south);
  state.board.north = [0, 0, 0, 0, 0, 0, 0];
  state.board.south = [0, 0, 0, 0, 0, 0, 0];
}

function computeWinner(state) {
  if (state.scores.north >= 40) return "north";
  if (state.scores.south >= 40) return "south";
  if (state.scores.north > state.scores.south) return "north";
  if (state.scores.south > state.scores.north) return "south";
  return "draw";
}

function computeWinnerStrict40OrDraw(state) {
  if (state.scores.north >= 40) return "north";
  if (state.scores.south >= 40) return "south";
  return "draw";
}

function resolveEndGameAfterMove(state) {
  if (state.scores.north >= 40 || state.scores.south >= 40) {
    state.status = "ended";
    state.reason = "score_40";
    state.winner = computeWinner(state);
    return;
  }

  if (boardSeeds(state) < 10) {
    collectRemainingSeeds(state);
    state.status = "ended";
    state.reason = "low_board";
    state.winner = computeWinnerStrict40OrDraw(state);
    return;
  }
}

function resolveEndGameBeforeTurn(state) {
  const legalMoves = getLegalMoves(state);
  if (legalMoves.length > 0) return;

  collectRemainingSeeds(state);
  state.status = "ended";
  state.reason = "solidarity_impossible";
  state.winner = computeWinnerStrict40OrDraw(state);
}
