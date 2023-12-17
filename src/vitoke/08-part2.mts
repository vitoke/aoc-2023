import { Err, HashMap, Reducer, Stream } from "@rimbu/core";
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

const [route, , ...data] = input.split("\n");

const routeSpecs = Stream.from(data).map((line) => {
  const [self, rest] = line.split(" = ");
  const [left, right] = rest.slice(1, -1).split(", ");
  return { self, left, right };
});

// START ALGORITHM PART 2

const routeStream = Stream.from(route).repeat();

enum Direction {
  LEFT = "L",
  RIGHT = "R",
}

const routeTable = HashMap.from(
  routeSpecs.map(({ self, left, right }) => [self, { left, right }])
);

function findRouteReducer(startNode: string) {
  return Reducer.createOutput<Direction, string>(
    startNode,
    (state, leftOrRight) => {
      const value = routeTable.get(state, Err);

      const nextState = leftOrRight === "L" ? value.left : value.right;

      return nextState;
    }
  );
}

const startNodesStream = routeTable
  .streamKeys()
  .filter((node) => node.endsWith("A"));

const minLengths = startNodesStream
  .map(
    (startNode) =>
      routeStream
        .reduceStream(findRouteReducer(startNode))
        .takeWhile((node) => !node.endsWith("Z"))
        .count() + 1
  )
  .toArray();

const largestLength = Stream.from(minLengths).reduce(Reducer.max(0));

console.log(minLengths, largestLength);

const multiplier = Stream.range({ start: 1 }).find(
  (value) => {
    const mult = value * largestLength;

    return minLengths.every((len) => Number.isInteger(mult / len));
  },
  undefined,
  0
);

const totalNumberOfSteps = multiplier * largestLength;

console.log({ totalNumberOfSteps });
