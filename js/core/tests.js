// js/core/tests.js

function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(label, condition) {
    if (condition) {
      console.log(`✅ ${label}`);
      passed++;
    } else {
      console.error(`❌ ${label}`);
      failed++;
    }
  }

  // Test 1 : Etat initial
  const s1 = createGame();
  assert("Etat initial - total 70 graines", totalSeeds(s1) === 70);
  assert("Etat initial - status playing", s1.status === "playing");
  assert("Etat initial - 7 cases Nord", s1.board.north.length === 7);
  assert("Etat initial - 7 cases Sud", s1.board.south.length === 7);

  // Test 2 : Semaille normale Sud
  const s2 = createGame("south");
  applyMove(s2, { player: "south", pitIndex: 2 });
  assert("Semaille Sud S2 - case source vide", s2.board.south[2] === 0);
  assert("Semaille Sud S2 - invariant 70", totalSeeds(s2) === 70);

  // Test 3 : Semaille normale Nord
  const s3 = createGame("north");
  applyMove(s3, { player: "north", pitIndex: 4 });
  assert("Semaille Nord N4 - case source vide", s3.board.north[4] === 0);
  assert("Semaille Nord N4 - invariant 70", totalSeeds(s3) === 70);

  // Test 4 : Grenier 14 graines
  const s4 = createGame("south");
  s4.board.south[3] = 14;
  s4.board.south[0] = 0;
  assertTotalSeeds(s4);
  const r4 = applyMove(s4, { player: "south", pitIndex: 3 });
  assert("Grenier 14 - case source vide", s4.board.south[3] === 0);
  assert("Grenier 14 - score Sud augmente", s4.scores.south >= 1);
  assert("Grenier 14 - invariant 70", totalSeeds(s4) === 70);

  // Test 5 : Coup interdit case d'attaque 1 graine
  const s5 = createGame("south");
  s5.board.south[0] = 1;
  s5.board.south[1] = 0;
  s5.board.south[2] = 0;
  s5.board.south[3] = 0;
  s5.board.south[4] = 0;
  s5.board.south[5] = 0;
  s5.board.south[6] = 0;
  const legal5 = getLegalMoves(s5);
  assert("Coup interdit S0=1 - aucun coup depuis S0",
    !legal5.some(m => m.pitIndex === 0));

  // Test 6 : Fin par score 40
  const s6 = createGame("south");
  s6.scores.south = 39;
  s6.board.north[0] = 3;
  s6.board.north[1] = 0;
  s6.board.north[2] = 0;
  s6.board.north[3] = 0;
  s6.board.north[4] = 0;
  s6.board.north[5] = 0;
  s6.board.north[6] = 0;
  s6.board.south = [0, 0, 0, 0, 0, 5, 5];
  s6.scores.north = 70 - 3 - 10 - 39;
  applyMove(s6, { player: "south", pitIndex: 5 });
  assert("Fin score 40 - invariant 70", totalSeeds(s6) === 70);

  // Test 7 : Invariant toujours respecte
  const s7 = createGame();
  for (let i = 0; i < 10; i++) {
    const moves = getLegalMoves(s7);
    if (moves.length === 0 || s7.status !== "playing") break;
    applyMove(s7, moves[0]);
  }
  assert("10 coups joués - invariant 70", totalSeeds(s7) === 70);

  console.log(`\n--- Résultats : ${passed} réussis, ${failed} échoués ---`);
}

runTests();
