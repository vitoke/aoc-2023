import { Reducer, SortedTableSortedColumn, Stream, Table } from "@rimbu/core";
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

let inputLines = input.split("\n");

// START ALGORITHM

const platformStream = Stream.from(inputLines).flatMap((line, y) =>
  Stream.from(line).map((obj, x) => [y, x, obj] as const)
);

const platformTable = SortedTableSortedColumn.from(platformStream);

type Platform = Table<number, number, string>;
type PlatformBuilder = Table.Builder<number, number, string>;

function calculateWeight(platform: Platform) {
  const sizeY = platform.amountRows;

  const weightRoundRocksStream = platform.rowMap.stream().map(([y, rowMap]) => {
    const weightFactor = sizeY - y;
    const numRoundRocks = rowMap.streamValues().countElement("O");
    return weightFactor * numRoundRocks;
  });

  const totalWeight = weightRoundRocksStream.reduce(Reducer.sum);

  return totalWeight;
}

function updateColumn(
  platformBuilder: PlatformBuilder,
  x: number,
  north = true
) {
  const sizeY = platformBuilder.amountRows;

  let emptyYAmount = 0;

  const yStream = north
    ? Stream.range({ amount: sizeY })
    : Stream.range({ start: sizeY - 1, end: 0 }, -1);

  for (const y of yStream) {
    const item = platformBuilder.get(y, x);

    switch (item) {
      case "O":
        if (emptyYAmount > 0) {
          const newY = north ? y - emptyYAmount : y + emptyYAmount;
          platformBuilder.set(newY, x, item);
          platformBuilder.set(y, x, ".");
        }
        break;
      case "#":
        emptyYAmount = 0;
        break;
      default:
        emptyYAmount++;
    }
  }
}

function updatePlatformColumns(builder: PlatformBuilder, north = true) {
  const sizeX = builder.getRow(0).size;

  for (const x of Stream.range({ amount: sizeX })) {
    updateColumn(builder, x, north);
  }
}

const northPlatformBuilder = platformTable.toBuilder();

updatePlatformColumns(northPlatformBuilder);

const northPlatform = northPlatformBuilder.build();

function showPlatform(platform: Platform) {
  console.log(
    platform
      .stream()
      .map(([y, x, char]) => (x === 0 && y > 0 ? `\n${char}` : char))
      .join()
  );
}

const finalWeight = calculateWeight(northPlatform);

console.log({ finalWeight });

// START ALGORITHM PART 2

function updateRow(platformBuilder: PlatformBuilder, y: number, west = true) {
  const sizeX = platformBuilder.getRow(0).size;

  let emptyXAmount = 0;

  const xStream = west
    ? Stream.range({ amount: sizeX })
    : Stream.range({ start: sizeX - 1, end: 0 }, -1);

  for (const x of xStream) {
    const item = platformBuilder.get(y, x);

    switch (item) {
      case "O":
        if (emptyXAmount > 0) {
          const newX = west ? x - emptyXAmount : x + emptyXAmount;
          platformBuilder.set(y, newX, item);
          platformBuilder.set(y, x, ".");
        }
        break;
      case "#":
        emptyXAmount = 0;
        break;
      default:
        emptyXAmount++;
    }
  }
}

function updatePlatformRows(builder: PlatformBuilder, west = true) {
  const sizeY = builder.amountRows;

  for (const y of Stream.range({ amount: sizeY })) {
    updateRow(builder, y, west);
  }
}

const DIRECTIONS = ["N", "W", "S", "E"] as const;
type Direction = (typeof DIRECTIONS)[number];

function updateBoardDir(builder: PlatformBuilder, direction: Direction) {
  switch (direction) {
    case "N":
      updatePlatformColumns(builder, true);
      return;
    case "E":
      updatePlatformRows(builder, false);
      return;
    case "S":
      updatePlatformColumns(builder, false);
      return;
    case "W":
      updatePlatformRows(builder, true);
      return;
  }
}

function compareBoards(b1: Platform, b2: Platform) {
  return b1.streamValues().equals(b2.streamValues());
}

function spinPlatform(builder: PlatformBuilder) {
  for (const dir of DIRECTIONS) {
    updateBoardDir(builder, dir);
  }
}

const spinPlatformBuilder = platformTable.toBuilder();

let MAX_SPINS = 1000000000;

let nrSpins = 0;

const prev = [] as Platform[];

let matchedIndex = -1;
let matchedNrSpins = -1;

for (nrSpins = 0; nrSpins < MAX_SPINS; nrSpins++) {
  spinPlatform(spinPlatformBuilder);
  const newPlatform = spinPlatformBuilder.build();

  Stream.from(prev).forEach((p, i, halt) => {
    if (compareBoards(p, newPlatform)) {
      matchedIndex = i;
      matchedNrSpins = nrSpins;
      halt();
    }
  });

  if (matchedIndex > 0) {
    break;
  }
  prev.push(newPlatform);
}

const boardIndex =
  ((MAX_SPINS - matchedIndex) % (matchedNrSpins - matchedIndex)) - 1;

const board = prev[boardIndex + matchedIndex];

// showPlatform(board);

const spinWeight = calculateWeight(board);

console.log({ spinWeight });
