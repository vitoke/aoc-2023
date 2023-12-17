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

// START ALGORITHM PART 1

const routeStream = Stream.from(route).repeat();

const routeTable = HashMap.from(
  routeSpecs.map(({ self, left, right }) => [self, { left, right }])
);

function findRouteReducer(startNode: string) {
  return Reducer.createOutput<string, string>(
    startNode,
    (state, leftOrRight) => {
      const value = routeTable.get(state, Err);

      const nextState = leftOrRight === "L" ? value.left : value.right;

      return nextState;
    }
  );
}

const amountOfSteps =
  routeStream
    .reduceStream(findRouteReducer("AAA"))
    .takeWhile((node) => node !== "ZZZ")
    .count() + 1;

console.log({ amountOfSteps });
