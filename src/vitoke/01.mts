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

const inputLines = Stream.from(input).splitOn("\n");

// START ALGORITHM

function isNumber(value: string) {
  return !Number.isNaN(Number(value));
}

const calculateSumOfFirstAndLastDigit = Reducer.combineObj({
  first: Reducer.firstWhere(isNumber, 0).mapOutput(Number),
  last: Reducer.lastWhere(isNumber, 0).mapOutput(Number),
}).mapOutput(({ first, last }) => first + last);

const sumOfFirstAndLastDigits = inputLines
  .map((line) => Stream.from(line).reduce(calculateSumOfFirstAndLastDigit))
  .reduce(Reducer.sum);

console.log({ sumOfFirstAndLastDigits });
