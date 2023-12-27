import { BiMultiMap, Err, HashBiMultiMap, Reducer, Stream } from "@rimbu/core";
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

// START ALGORITHM

const sameLinesReducer = Reducer.create(
  () => ({
    lastValue: undefined as string | undefined,
    line: 0,
    result: [] as number[],
  }),
  (state, nextValue: string) => {
    if (nextValue === state.lastValue) {
      state.result.push(state.line - 1);
    }

    state.lastValue = nextValue;
    state.line++;

    return state;
  },
  (s) => s.result
);

interface PatternInfo {
  lines: string[];
  entryLines: number[];
  map: BiMultiMap<string, number>;
  size: number;
}

interface Pattern {
  hor: PatternInfo;
  vert: PatternInfo;
}
const patterns = Stream.from(inputLines)
  .splitOn("")
  .map((horLines) => {
    const vertLinesStream = Stream.range({ amount: horLines[0].length }).map(
      (col) =>
        Stream.range({ amount: horLines.length })
          .map((row) => horLines[row][col])
          .join()
    );

    const [horEntryLines, horMap] = Stream.from(horLines).reduceAll(
      sameLinesReducer,
      HashBiMultiMap.reducer<string, number>().mapInput(
        (line: string, index) => [line, index]
      )
    );

    const [vertEntryLines, vertMap, vertLines] = vertLinesStream.reduceAll(
      sameLinesReducer,
      HashBiMultiMap.reducer<string, number>().mapInput(
        (line: string, index) => [line, index]
      ),
      Reducer.toArray<string>()
    );

    return {
      hor: {
        lines: horLines,
        entryLines: horEntryLines,
        map: horMap,
        size: horLines.length,
      },
      vert: {
        lines: vertLines,
        entryLines: vertEntryLines,
        map: vertMap,
        size: vertLines.length,
      },
    };
  });

function hasSymmetryAt(
  map: BiMultiMap<string, number>,
  lineIndex1: number,
  lineIndex2: number,
  size: number
) {
  if (lineIndex1 < 0 || lineIndex2 >= size) {
    return true;
  }

  const line = map.getKeys(lineIndex1).stream().first(Err);

  if (!map.getValues(line).has(lineIndex2)) {
    return false;
  }

  return hasSymmetryAt(map, lineIndex1 - 1, lineIndex2 + 1, size);
}

function getSymmetryValue(pattern: PatternInfo) {
  const foundLine = Stream.from(pattern.entryLines).find((line) =>
    hasSymmetryAt(pattern.map, line - 1, line + 2, pattern.size)
  );

  if (foundLine === undefined) {
    return undefined;
  }

  return foundLine + 1;
}

function getPatternValue(patternInfo: Pattern) {
  const horSym = getSymmetryValue(patternInfo.hor);

  if (horSym !== undefined) {
    return horSym * 100;
  }

  const vertSym = getSymmetryValue(patternInfo.vert);

  if (vertSym === undefined) {
    throw Error("no sym");
  }

  return vertSym;
}

const values = patterns.map((pattern) => getPatternValue(pattern));

const totalValue = values.reduce(Reducer.sum);

console.log({ totalValue });
