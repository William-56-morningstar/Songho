// js/core/capture.js

function isCaptureValue(seedCount) {
  return seedCount === 2 || seedCount === 3 || seedCount === 4;
}

function isOpponentPit(player, position) {
  return position.player === other(player);
}

function canStartCapture(state, player, lastPosition) {
  if (!isOpponentPit(player, lastPosition)) return false;
  if (samePosition(lastPosition, opponentFirstPit(player))) return false;
  const count = state.board[lastPosition.player][lastPosition.pitIndex];
  return isCaptureValue(count);
}

function captureChainPositions(state, player, lastPosition) {
  const path = opponentPath(player);
  const lastIndex = path.findIndex((position) =>
    samePosition(position, lastPosition)
  );

  if (lastIndex <= 0) return [];

  const captured = [];
  for (let index = lastIndex; index >= 0; index--) {
    const position = path[index];
    const count = state.board[position.player][position.pitIndex];
    if (!isCaptureValue(count)) break;
    captured.push({
      player: position.player,
      pitIndex: position.pitIndex,
      seeds: count
    });
  }

  return captured;
}

function wouldEmptyOpponent(state, player, captureList) {
  const opponent = other(player);
  const remaining = [...state.board[opponent]];
  for (const capture of captureList) {
    remaining[capture.pitIndex] -= capture.seeds;
  }
  return sum(remaining) === 0;
}

function applyCaptureIfAllowed(state, player, captureList) {
  if (captureList.length === 0) return 0;
  if (wouldEmptyOpponent(state, player, captureList)) return 0;

  let total = 0;
  for (const capture of captureList) {
    state.board[capture.player][capture.pitIndex] -= capture.seeds;
    total += capture.seeds;
  }
  state.scores[player] += total;
  return total;
}

function resolveCaptures(state, player, sowingResult) {
  if (sowingResult.specialCapture > 0) {
    state.scores[player] += sowingResult.specialCapture;
    return {
      captured: sowingResult.specialCapture,
      type: "special-granary"
    };
  }

  const last = sowingResult.lastPosition;
  if (!canStartCapture(state, player, last)) {
    return { captured: 0, type: "none" };
  }

  const captureList = captureChainPositions(state, player, last);
  const captured = applyCaptureIfAllowed(state, player, captureList);

  return {
    captured,
    type: captured > 0 && captureList.length > 1 ? "chain" : "normal",
    cancelledBecauseStarvation: captured === 0 && captureList.length > 0
  };
}
