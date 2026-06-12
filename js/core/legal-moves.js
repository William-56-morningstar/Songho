// js/core/legal-moves.js

function isAttackPitMove(player, pitIndex) {
  const attack = attackPit(player);
  return attack.player === player && attack.pitIndex === pitIndex;
}

function wouldMoveCapture(state, player, pitIndex) {
  const simulated = cloneState(state);
  const sowing = sow(simulated, player, pitIndex);
  if (sowing.specialCapture > 0) return true;
  const last = sowing.lastPosition;
  return canStartCapture(simulated, player, last);
}

function isForbiddenAttackMove(state, player, pitIndex) {
  if (!isAttackPitMove(player, pitIndex)) return false;
  const seeds = state.board[player][pitIndex];
  if (seeds === 1) return true;
  if (seeds === 2) return !wouldMoveCapture(state, player, pitIndex);
  return false;
}

function ownNonEmptyMoves(state, player) {
  const moves = [];
  for (let pitIndex = 0; pitIndex < 7; pitIndex++) {
    if (state.board[player][pitIndex] > 0) {
      moves.push({ player, pitIndex });
    }
  }
  return moves;
}

function opponentCampIsEmpty(state, player) {
  return sum(state.board[other(player)]) === 0;
}

function countDeliveredToOpponent(state, player, pitIndex) {
  const simulated = cloneState(state);
  const before = sum(simulated.board[other(player)]);
  sow(simulated, player, pitIndex);
  const after = sum(simulated.board[other(player)]);
  return after - before;
}

function getSolidarityMoves(state, player) {
  const candidates = ownNonEmptyMoves(state, player);
  const ordinary = candidates.filter((move) => {
    return !isForbiddenAttackMove(state, player, move.pitIndex);
  });

  const enriched = ordinary.map((move) => ({
    ...move,
    delivered: countDeliveredToOpponent(state, player, move.pitIndex)
  }));

  const atLeastSeven = enriched.filter((move) => move.delivered >= 7);
  if (atLeastSeven.length > 0) return atLeastSeven;

  const positive = enriched.filter((move) => move.delivered > 0);
  if (positive.length > 0) {
    const maxDelivered = Math.max(...positive.map((move) => move.delivered));
    return positive.filter((move) => move.delivered === maxDelivered);
  }

  const forcedDonation = candidates.filter((move) => {
    return (
      isAttackPitMove(player, move.pitIndex) &&
      [1, 2].includes(state.board[player][move.pitIndex])
    );
  });

  return forcedDonation.map((move) => ({ ...move, forcedDonation: true }));
}

function getLegalMoves(state) {
  const player = state.currentPlayer;
  if (state.status !== "playing") return [];

  if (opponentCampIsEmpty(state, player)) {
    return getSolidarityMoves(state, player);
  }

  return ownNonEmptyMoves(state, player).filter((move) => {
    return !isForbiddenAttackMove(state, player, move.pitIndex);
  });
}
