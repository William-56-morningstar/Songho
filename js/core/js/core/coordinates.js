// js//core/coordinates.js

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

function other(player) {
  return player === "north" ? "south" : "north";
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
