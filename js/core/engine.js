// js/core/engine.js

function applyForcedDonation(state, player, pitIndex) {
  const seeds = state.board[player][pitIndex];
  state.board[player][pitIndex] = 0;
  state.scores[other(player)] += seeds;
  return {
    type: "forced-donation",
    donated: seeds
  };
}

function validateMove(state, move) {
  if (state.status !== "playing") {
    return { ok: false, reason: "La partie est terminée." };
  }
  if (move.player !== state.currentPlayer) {
    return { ok: false, reason: "Ce n'est pas le tour de ce joueur." };
  }
  if (move.pitIndex < 0 || move.pitIndex > 6) {
    return { ok: false, reason: "Case inconnue." };
  }
  if (state.board[move.player][move.pitIndex] <= 0) {
    return { ok: false, reason: "La case est vide." };
  }

  const legalMoves = getLegalMoves(state);
  const legal = legalMoves.some((legalMove) => {
    return legalMove.player === move.player && legalMove.pitIndex === move.pitIndex;
  });

  if (!legal) {
    return { ok: false, reason: "Coup interdit par les règles." };
  }

  return { ok: true };
}

function applyMove(state, move) {
  const validation = validateMove(state, move);
  if (!validation.ok) {
    return { state, ok: false, error: validation.reason };
  }

  const legalMove = getLegalMoves(state).find((item) => {
    return item.player === move.player && item.pitIndex === move.pitIndex;
  });

  let actionResult;

  if (legalMove && legalMove.forcedDonation) {
    actionResult = applyForcedDonation(state, move.player, move.pitIndex);
  } else {
    const sowing = sow(state, move.player, move.pitIndex);
    const capture = resolveCaptures(state, move.player, sowing);
    actionResult = { type: "sow", sowing, capture };
  }

  state.moveNumber += 1;
  state.history.push({
    moveNumber: state.moveNumber,
    player: move.player,
    pitIndex: move.pitIndex,
    result: actionResult
  });

  resolveEndGameAfterMove(state);

  if (state.status === "playing") {
    state.currentPlayer = other(state.currentPlayer);
    resolveEndGameBeforeTurn(state);
  }

  assertTotalSeeds(state);

  return { state, ok: true, action: actionResult };
}
