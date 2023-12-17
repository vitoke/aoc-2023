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

const sequences = Stream.from(inputLines)
  .map((line) => Stream.from(line.split(" ")).map(Number).toArray())
  .toArray();

// START ALGORITHM PART 1

function getNext(seq: number[]) {
  if (seq.every((v) => v === 0)) {
    return 0;
  }

  const diffArr = Stream.from(seq)
    .window(2, 1)
    .map(([v1, v2]) => v2 - v1)
    .toArray();

  const result = getNext(diffArr);

  return seq.at(-1)! + result;
}

const nextValuesStream = Stream.from(sequences).map((seq) => getNext(seq));

const sumOfNextValues = nextValuesStream.reduce(Reducer.sum);

console.log({ sumOfNextValues });

// START ALGORITHM PART 2

function getPrev(seq: number[]) {
  if (seq.every((v) => v === 0)) {
    return 0;
  }

  const diffArr = Stream.fromArray(seq, undefined, true)
    .window(2, 1)
    .map(([v1, v2]) => v1 - v2)
    .toArray()
    .reverse();

  const result = getPrev(diffArr);

  return seq[0]! - result;
}

const prevValuesStream = Stream.from(sequences).map((seq) => getPrev(seq));

const sumOfPrevValues = prevValuesStream.reduce(Reducer.sum);

console.log({ sumOfPrevValues });
