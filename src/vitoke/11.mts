import { HashSet, Reducer, SortedSet, Stream } from "@rimbu/core";
import { readFileSync } from "node:fs";
import { exit } from "process";

// READ INPUT FILE

const inputFileLocation = process.argv[2];

if (!inputFileLocation) {
  console.log("you should provide an input file as argument");
  exit(1);
}

const input = readFileSync(inputFileLocation).toString();

// PARSE INPUT

const inputLines = input.split("\n");

const initGalaxyPosStream = Stream.from(inputLines).flatMap((line, row) =>
  Stream.from(line).collect((char, col, skip) =>
    char === "#" ? ([row, col] as const) : skip
  )
);

const [rows, cols] = initGalaxyPosStream.reduceAll(
  HashSet.reducer().mapInput<[number, number]>(([row]) => row),
  HashSet.reducer().mapInput<[number, number]>(([row, col]) => col)
);

const emptyCols = SortedSet.from(
  Stream.range({ amount: inputLines[0].length })
).difference(cols);

const emptyRows = SortedSet.from(
  Stream.range({ amount: inputLines.length })
).difference(rows);

const emptyRow = Stream.from(".").repeat(inputLines[0].length).join();

for (const row of emptyRows.stream(true)) {
  inputLines.splice(row, 0, emptyRow);
}
for (const col of emptyCols.stream(true)) {
  for (let rowNr = 0; rowNr < inputLines.length; rowNr++) {
    inputLines[rowNr] = inputLines[rowNr]
      .slice(0, col)
      .concat(".", inputLines[rowNr].slice(col));
  }
}

console.log(inputLines.join("\n"));

const newGalaxyStream = Stream.from(inputLines)
  .flatMap((line, row) =>
    Stream.from(line).collect((char, col, skip) =>
      char === "#" ? ([row, col] as const) : skip
    )
  )
  .indexed();

const galaxyPairs = newGalaxyStream.flatMap((g1) =>
  newGalaxyStream.flatMap((g2) => (g1[0] < g2[0] ? [[g1, g2]] : []))
);

const minLengthsStream = galaxyPairs.map(([g1, g2]) => {
  const [id1, [r1, c1]] = g1;
  const [id2, [r2, c2]] = g2;

  const dr = Math.abs(r2 - r1);
  const dc = Math.abs(c2 - c1);

  let minLength = 0;

  if (r1 === r2) {
    minLength = dc;
  } else if (c1 === c2) {
    minLength = dr;
  } else {
    minLength = dc + dr;
  }

  return { pair: `${id1 + 1}-${id2 + 1}`, g1, g2, minLength };
});

const sumOfLengths = minLengthsStream.reduce(
  Reducer.sum.mapInput(({ minLength }) => minLength)
);

console.log({ sumOfLengths });
