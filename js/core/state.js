// js/core/state.js

function other(player) {
  return player === "north" ? "south" : "north";
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

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
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
