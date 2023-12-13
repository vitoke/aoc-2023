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

const inputLinesStream = Stream.from(input).splitOn("\n");

// START ALGORITHM PART 1

function isNumber(value: string) {
  return !Number.isNaN(Number(value));
}

const calculateCombinedFirstAndLastDigits = Reducer.combineObj({
  first: Reducer.firstWhere(isNumber, "0"),
  last: Reducer.lastWhere(isNumber, ""),
}).mapOutput(({ first, last }) => Number(`${first}${last}`));

const combinedDigitsStream = inputLinesStream.map((line) =>
  Stream.from(line).reduce(calculateCombinedFirstAndLastDigits)
);

const sumOfCombinedDigits = combinedDigitsStream.reduce(Reducer.sum);

console.log("part one", { sumOfCombinedDigits });

// START ALGORITHM PART 2
