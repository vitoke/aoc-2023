import {
  HashMap,
  OrderedHashMap,
  Reducer,
  Stream,
  type Hasher,
} from "@rimbu/core";
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

const inputElements = input.split(",");

// START ALGORITHM PART 1
const hasher: Hasher<string> = {
  isValid: (value): value is string => typeof value === "string",
  hash: (value) => {
    let len = value.length;
    let index = -1;
    let curValue = 0;

    while (++index < len) {
      curValue += value.charCodeAt(index);
      curValue *= 17;
      curValue %= 256;
    }

    return curValue;
  },
};

const inputHashesStream = Stream.from(inputElements).mapPure(hasher.hash);

const sumOfHashes = inputHashesStream.reduce(Reducer.sum);

console.log({ sumOfHashes });

// START ALGORITHM PART 2

const boxBuilder = HashMap.builder<
  number,
  OrderedHashMap.Builder<string, number>
>();

function getOrCreateBox(nr: number) {
  let box = boxBuilder.get(nr);
  if (box === undefined) {
    box = OrderedHashMap.builder();
    boxBuilder.set(nr, box);
  }

  return box;
}
for (const element of inputElements) {
  if (element.includes("=")) {
    const [lens, amountStr] = element.split("=");
    const boxNr = hasher.hash(lens);
    const amount = Number(amountStr);

    const box = getOrCreateBox(boxNr);
    box.set(lens, amount);
  } else {
    const [lens] = element.split("-");
    const boxNr = hasher.hash(lens);
    const box = getOrCreateBox(boxNr);
    box.removeKey(lens);
  }
}

const boxes = boxBuilder.build();

const valuesStream = Stream.from(boxes).map(([boxNr, boxMap]) => {
  const boxValue = boxMap
    .build()
    .streamValues()
    .map((value, index) => (index + 1) * value)
    .reduce(Reducer.sum);

  return (boxNr + 1) * boxValue;
});

const focusPowers = valuesStream.reduce(Reducer.sum);

console.log({ focusPowers });
