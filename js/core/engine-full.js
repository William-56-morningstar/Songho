// js/core/engine-full.js
// Moteur complet du jeu Songho — tout dans le bon ordre

const RULES = {
  players: ["north", "south"],
  pitsPerPlayer: 7,
  initialSeedsPerPit: 5,
  totalSeeds: 70,
  victoryScore: 40,
  lowBoardLimit: 10,
  captureValues: [2, 3, 4],
  maxNormalSowSeeds: 13
};

const ENDING_POLICY = "strict_40_or_draw";

function other(player) {
  return player === "north" ? "south" : "north";
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

const CYCLE = [
  { player: "north", pitIndex: 0 },
  { player: "north", pitIndex: 1 },
  { player: "north", pitIndex: 2 },
  { player: "north", pitIndex: 3 },
  { player: "north", pitIndex: 4 },
  { player: "north", pitIndex: 5 },
  { player: "north", pitIndex: 6 },
  { player: "south", pitIndex: 6 },
  { player: "south", pitIndex: 5 },
  { player: "south", pitIndex: 4 },
  { player: "south", pitIndex: 3 },
  { player: "south", pitIndex: 2 },
  { player: "south", pitIndex: 1 },
  { player: "south", pitIndex: 0 }
];

function samePosition(a, b) {
  return a.player === b.player && a.pitIndex === b.pitIndex;
}

function cycleIndexOf(position) {
  return CYCLE.findIndex((item) => samePosition(item, position));
}

function nextPositionsAfter(source) {
  const start = cycleIndexOf(source);
  const positions = [];
  for (let step = 1; step <= 13; step++) {
    const index = (start + step) % CYCLE.length;
    positions.push(CYCLE[index]);
  }
  return positions;
}

function attackPit(player) {
  return player === "north"
    ? { player: "north", pitIndex: 6 }
    : { player: "south", pitIndex: 0 };
}

function opponentFirstPit(player) {
  return player === "north"
    ? { player: "south", pitIndex: 6 }
    : { player: "north", pitIndex: 0 };
}

function opponentPath(player) {
  return player === "north"
    ? [
        { player: "south", pitIndex: 6 },
        { player: "south", pitIndex: 5 },
        { player: "south", pitIndex: 4 },
        { player: "south", pitIndex: 3 },
        { player: "south", pitIndex: 2 },
        { player: "south", pitIndex: 1 },
        { player: "south", pitIndex: 0 }
      ]
    : [
        { player: "north", pitIndex: 0 },
        { player: "north", pitIndex: 1 },
        { player: "north", pitIndex: 2 },
        { player: "north", pitIndex: 3 },
        { player: "north", pitIndex: 4 },
        { player: "north", pitIndex: 5 },
        { player: "north", pitIndex: 6 }
      ];
}

function isOpponentPit(player, position) {
  return position.player === other(player);
         }
function createGame(startingPlayer = "south") {
  return {
    board: {
      north: [5, 5, 5, 5, 5, 5, 5],
      south: [5, 5, 5, 5, 5, 5, 5]
    },
    scores: { north: 0, south: 0 },
    currentPlayer: startingPlayer,
    status: "playing",
    winner: null,
    reason: null,
    moveNumber: 0,
    history: []
  };
}

function cloneState(state) {
  return {
    board: {
      north: [...state.board.north],
      south: [...state.board.south]
    },
    scores: { ...state.scores },
    currentPlayer: state.currentPlayer,
    status: state.status,
    winner: state.winner,
    reason: state.reason,
    moveNumber: state.moveNumber,
    history: [...state.history]
  };
}

function boardSeeds(state) {
  return sum(state.board.north) + sum(state.board.south);
}

function totalSeeds(state) {
  return state.scores.north + state.scores.south + boardSeeds(state);
}

function assertTotalSeeds(state) {
  const total = totalSeeds(state);
  if (total !== 70) {
    throw new Error(`Invariant cassé : ${total} graines au lieu de 70.`);
  }
}

function sowNormal(state, player, pitIndex) {
  const seeds = state.board[player][pitIndex];
  const source = { player, pitIndex };
  const visited = [];
  state.board[player][pitIndex] = 0;
  const path = nextPositionsAfter(source);
  for (let i = 0; i < seeds; i++) {
    const position = path[i];
    state.board[position.player][position.pitIndex] += 1;
    visited.push(position);
  }
  return { visited, lastPosition: visited[visited.length - 1], specialCapture: 0 };
}

function sowGranary(state, player, pitIndex) {
  const seeds = state.board[player][pitIndex];
  const source = { player, pitIndex };
  const visited = [];
  let remaining = seeds;
  let specialCapture = 0;
  state.board[player][pitIndex] = 0;
  for (const position of nextPositionsAfter(source)) {
    state.board[position.player][position.pitIndex] += 1;
    visited.push(position);
    remaining -= 1;
  }
  const path = opponentPath(player);
  for (let i = 0; i < remaining; i++) {
    const position = path[i % path.length];
    const isLastSeed = i === remaining - 1;
    const isProtectedFirstPit = samePosition(position, opponentFirstPit(player));
    if (isLastSeed && isProtectedFirstPit) {
      specialCapture += 1;
      visited.push(position);
      continue;
    }
    state.board[position.player][position.pitIndex] += 1;
    visited.push(position);
  }
  return { visited, lastPosition: visited[visited.length - 1], specialCapture };
}

function sow(state, player, pitIndex) {
  const seeds = state.board[player][pitIndex];
  if (seeds <= 0) throw new Error("La case choisie est vide.");
  if (seeds <= 13) return sowNormal(state, player, pitIndex);
  return sowGranary(state, player, pitIndex);
}

function isCaptureValue(seedCount) {
  return seedCount === 2 || seedCount === 3 || seedCount === 4;
}

function canStartCapture(state, player, lastPosition) {
  if (!isOpponentPit(player, lastPosition)) return false;
  if (samePosition(lastPosition, opponentFirstPit(player))) return false;
  const count = state.board[lastPosition.player][lastPosition.pitIndex];
  return isCaptureValue(count);
}

function captureChainPositions(state, player, lastPosition) {
  const path = opponentPath(player);
  const lastIndex = path.findIndex((p) => samePosition(p, lastPosition));
  if (lastIndex <= 0) return [];
  const captured = [];
  for (let index = lastIndex; index >= 0; index--) {
    const position = path[index];
    const count = state.board[position.player][position.pitIndex];
    if (!isCaptureValue(count)) break;
    captured.push({ player: position.player, pitIndex: position.pitIndex, seeds: count });
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
    return { captured: sowingResult.specialCapture, type: "special-granary" };
  }
  const last = sowingResult.lastPosition;
  if (!canStartCapture(state, player, last)) return { captured: 0, type: "none" };
  const captureList = captureChainPositions(state, player, last);
  const captured = applyCaptureIfAllowed(state, player, captureList);
  return {
    captured,
    type: captured > 0 && captureList.length > 1 ? "chain" : "normal",
    cancelledBecauseStarvation: captured === 0 && captureList.length > 0
  };
}

function isAttackPitMove(player, pitIndex) {
  const attack = attackPit(player);
  return attack.player === player && attack.pitIndex === pitIndex;
}

function wouldMoveCapture(state, player, pitIndex) {
  const simulated = cloneState(state);
  const sowing = sow(simulated, player, pitIndex);
  if (sowing.specialCapture > 0) return true;
  return canStartCapture(simulated, player, sowing.lastPosition);
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
    if (state.board[player][pitIndex] > 0) moves.push({ player, pitIndex });
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
  const ordinary = candidates.filter((move) => !isForbiddenAttackMove(state, player, move.pitIndex));
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
  const forcedDonation = candidates.filter((move) =>
    isAttackPitMove(player, move.pitIndex) &&
    [1, 2].includes(state.board[player][move.pitIndex])
  );
  return forcedDonation.map((move) => ({ ...move, forcedDonation: true }));
}

function getLegalMoves(state) {
  const player = state.currentPlayer;
  if (state.status !== "playing") return [];
  if (opponentCampIsEmpty(state, player)) return getSolidarityMoves(state, player);
  return ownNonEmptyMoves(state, player).filter((move) =>
    !isForbiddenAttackMove(state, player, move.pitIndex)
  );
}

function collectRemainingSeeds(state) {
  state.scores.north += sum(state.board.north);
  state.scores.south += sum(state.board.south);
  state.board.north = [0, 0, 0, 0, 0, 0, 0];
  state.board.south = [0, 0, 0, 0, 0, 0, 0];
}

function computeWinnerStrict40OrDraw(state) {
  if (state.scores.north >= 40) return "north";
  if (state.scores.south >= 40) return "south";
  return "draw";
}

function computeWinner(state) {
  if (state.scores.north >= 40) return "north";
  if (state.scores.south >= 40) return "south";
  if (state.scores.north > state.scores.south) return "north";
  if (state.scores.south > state.scores.north) return "south";
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

function applyForcedDonation(state, player, pitIndex) {
  const seeds = state.board[player][pitIndex];
  state.board[player][pitIndex] = 0;
  state.scores[other(player)] += seeds;
  return { type: "forced-donation", donated: seeds };
}

function validateMove(state, move) {
  if (state.status !== "playing") return { ok: false, reason: "La partie est terminée." };
  if (move.player !== state.currentPlayer) return { ok: false, reason: "Ce n'est pas le tour de ce joueur." };
  if (move.pitIndex < 0 || move.pitIndex > 6) return { ok: false, reason: "Case inconnue." };
  if (state.board[move.player][move.pitIndex] <= 0) return { ok: false, reason: "La case est vide." };
  const legalMoves = getLegalMoves(state);
  const legal = legalMoves.some((m) => m.player === move.player && m.pitIndex === move.pitIndex);
  if (!legal) return { ok: false, reason: "Coup interdit par les règles." };
  return { ok: true };
}

function applyMove(state, move) {
  const validation = validateMove(state, move);
  if (!validation.ok) return { state, ok: false, error: validation.reason };
  const legalMove = getLegalMoves(state).find((m) =>
    m.player === move.player && m.pitIndex === move.pitIndex
  );
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
