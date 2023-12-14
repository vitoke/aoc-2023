import { Eq, HashSet, HashTableHashColumn, Reducer, Stream } from "@rimbu/core";
import fs from "node:fs";
import { exit } from "process";

// READ INPUT FILE

const inputFileLocation = process.argv[2];

if (!inputFileLocation) {
  console.log("you should provide an input file as argument");
  exit(1);
}

const input = fs.readFileSync(inputFileLocation).toString();

// PARSE INPUT

const inputLinesStream = Stream.from(input).splitOn("\n");

// START ALGORITHM

function isNumber(value: string) {
  return !Number.isNaN(Number(value));
}

/** A transformer to convert a line (stream of chars) into a tuple container:
 * - the character index in the stream
 * - a container containing the parsed value. This value is contained in an object so we can dismiss the same number being counted multiple times
 */
const numberCoordinatesReducer = Reducer.create<
  string,
  [number, { value: number }][],
  {
    container: { value: number } | undefined;
    result: [number, { value: number }][];
  }
>(
  { container: undefined, result: [] },
  (state, nextChar, charIndex) => {
    if (isNumber(nextChar)) {
      const digitValue = Number(nextChar);

      if (state.container === undefined) {
        state.container = { value: digitValue };
      } else {
        state.container.value *= 10;
        state.container.value += digitValue;
      }
      state.result = [[charIndex, state.container]];
    } else {
      if (state.container !== undefined) {
        state.container = undefined;
      }

      state.result = [];
    }

    return state;
  },
  (s) => s.result
);

const numberContainersWithCoordinatesStream = inputLinesStream.flatMap(
  (line, lineNr) =>
    Stream.from(line)
      .transform(numberCoordinatesReducer)
      .map((item) => [lineNr, ...item] as const)
);

const tabelWithCoordinatesToNumberContainers = HashTableHashColumn.from(
  numberContainersWithCoordinatesStream
);

const symbolCoordinates = inputLinesStream.flatMap((line, lineIndex) => {
  const symbolIndicesStream = Stream.from(line).indicesWhere(
    (ch) => !isNumber(ch) && ch !== "."
  );

  return symbolIndicesStream.map((colIndex) => [lineIndex, colIndex] as const);
});

const indicesSurroundingIndicesStream = symbolCoordinates.flatMap(
  ([lineIndex, colIndex]) =>
    Stream.range({ start: lineIndex - 1, amount: 3 }).flatMap((line) =>
      Stream.range({ start: colIndex - 1, amount: 3 }).map(
        (col) => [line, col] as const
      )
    )
);

const numberContainersWithSymbolHitStream =
  indicesSurroundingIndicesStream.collect(([line, col], _, skip) => {
    const value = tabelWithCoordinatesToNumberContainers.get(line, col);

    return value === undefined ? skip : value;
  });

const SimpleHashSet = HashSet.createContext({ eq: Eq.objectIs });
const uniqueNumberContainersSet = SimpleHashSet.from(
  numberContainersWithSymbolHitStream
);

const sumOfValues = uniqueNumberContainersSet
  .stream()
  .reduce(Reducer.sum.mapInput((container) => container.value));

console.log({ sumOfValues });
