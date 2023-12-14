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

// START ALGORITHM PART 1

function isNumber(value: string) {
  return !Number.isNaN(Number(value));
}

interface Container {
  value: number;
}

/** A transformer to convert a line (stream of chars) into a tuple container:
 * - the character index in the stream
 * - a container containing the parsed value. This value is contained in an object so we can dismiss the same number being counted multiple times
 */
const numberCoordinatesReducer = Reducer.create<
  string,
  [charIndex: number, container: Container][],
  {
    container?: Container;
    result: [charIndex: number, container: Container][];
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

const indicesSurroundingSymbolsStream = symbolCoordinates.flatMap(
  ([lineIndex, colIndex]) =>
    Stream.range({ start: lineIndex - 1, amount: 3 }).flatMap((line) =>
      Stream.range({ start: colIndex - 1, amount: 3 }).map(
        (col) => [line, col] as const
      )
    )
);

const numberContainersWithSymbolHitStream =
  indicesSurroundingSymbolsStream.collect(([lineIndex, colIndex], _, skip) => {
    const value = tabelWithCoordinatesToNumberContainers.get(
      lineIndex,
      colIndex
    );

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

// START ALGORITHM PART 2

const gearCoordinates = inputLinesStream.flatMap((line, lineIndex) => {
  const gearIndicesStream = Stream.from(line).indicesWhere((ch) => ch === "*");

  return gearIndicesStream.map((colIndex) => [lineIndex, colIndex] as const);
});

const indicesSurroundingGearsStream = gearCoordinates.map(
  ([lineIndex, colIndex]) =>
    Stream.range({ start: lineIndex - 1, amount: 3 }).flatMap((line) =>
      Stream.range({ start: colIndex - 1, amount: 3 }).map(
        (col) => [line, col] as const
      )
    )
);

const numberContainersWithGearsHitStream = indicesSurroundingGearsStream.map(
  (coordinates) => {
    const valueContainersStream = Stream.from(coordinates).collect(
      ([lineIndex, colIndex], _, skip) => {
        const value = tabelWithCoordinatesToNumberContainers.get(
          lineIndex,
          colIndex
        );

        return value === undefined ? skip : value;
      }
    );

    const setOfContainers = SimpleHashSet.from(valueContainersStream);

    if (setOfContainers.size === 2) {
      const [c1, c2] = setOfContainers;
      return c1.value * c2.value;
    }

    return 0;
  }
);

const sumOfGearNumbers = numberContainersWithGearsHitStream.reduce(Reducer.sum);

console.log({ sumOfGearNumbers });
