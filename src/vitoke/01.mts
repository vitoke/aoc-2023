import { Reducer, Stream } from "@rimbu/core";
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

// START ALGORITHM PART 1

function isNumber(value: string) {
  return !Number.isNaN(Number(value));
}

const combinedDigitsStream = Stream.from(inputLines).map((line) => {
  const first = Stream.fromString(line).reduce(
    Reducer.firstWhere(isNumber, "0")
  );
  const last = Stream.fromString(line, undefined, true).reduce(
    Reducer.firstWhere(isNumber, "")
  );

  return Number(`${first}${last}`);
});

const sumOfCombinedDigits = Stream.from(combinedDigitsStream).reduce(
  Reducer.sum
);

console.log("part one", { sumOfCombinedDigits });

// START ALGORITHM PART 2

const replacements = {
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
};

function createReplaceReducer(reversed: boolean) {
  return Reducer.createMono("", (state, nextChar, _, halt) => {
    const nextState = reversed ? `${nextChar}${state}` : `${state}${nextChar}`;

    for (const key in replacements) {
      if (reversed ? nextState.startsWith(key) : nextState.endsWith(key)) {
        halt();
        return replacements[key];
      }
    }

    return nextState;
  });
}

const combinedDigitsStreamPartTwo = Stream.from(inputLines).map((line) => {
  const first = Stream.fromString(line)
    .transform(createReplaceReducer(false))
    .reduce(Reducer.firstWhere(isNumber, "0"));

  const last = Stream.fromString(line, undefined, true)
    .transform(createReplaceReducer(true))
    .reduce(Reducer.firstWhere(isNumber, ""));

  return Number(`${first}${last}`);
});

const sumOfCombinedDigitsPartTwo = combinedDigitsStreamPartTwo.reduce(
  Reducer.sum
);

console.log("part two", { sumOfCombinedDigitsPartTwo });
