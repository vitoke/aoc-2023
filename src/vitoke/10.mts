import { Err, HashTableHashColumn, Stream } from "@rimbu/core";
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

let startPos: [number, number] = [-1, -1];

const table = HashTableHashColumn.from(
  Stream.from(inputLines).flatMap((line, rowIndex) =>
    Stream.fromString(line).map((char, colIndex) => {
      if (char === "S") {
        startPos = [rowIndex, colIndex];
      }
      return [rowIndex, colIndex, char as Tile];
    })
  )
);

function getTileAt(row: number, column: number) {
  return table.get(row, column);
}

function nextPos(
  [row, column]: [number, number],
  direction: Direction
): [number, number] {
  switch (direction) {
    case Direction.N:
      return [row - 1, column];
    case Direction.E:
      return [row, column + 1];
    case Direction.S:
      return [row + 1, column];
    default:
      return [row, column - 1];
  }
}

enum Tile {
  VERT = "|",
  HOR = "-",
  NE = "L",
  NW = "J",
  SW = "7",
  SE = "F",
  GROUND = ".",
  START = "S",
}

enum Direction {
  N = "N",
  E = "E",
  S = "S",
  W = "W",
}

const DIRECTIONS = [Direction.N, Direction.E, Direction.S, Direction.W];

function getNextDir(tile: Tile, currentDir: Direction) {
  switch (tile) {
    case Tile.NE:
      return currentDir === Direction.S ? Direction.E : Direction.N;
    case Tile.NW:
      return currentDir === Direction.S ? Direction.W : Direction.N;
    case Tile.SE:
      return currentDir === Direction.N ? Direction.E : Direction.S;
    case Tile.SW:
      return currentDir === Direction.N ? Direction.W : Direction.S;
    default:
      return currentDir;
  }
}

function findLoop(
  position = startPos,
  direction = Direction.N,
  count = 0
): number | undefined {
  const [row, column] = position;

  const tile = table.get(row, column);

  switch (tile) {
    case Tile.START: {
      if (count > 0) {
        return count;
      }

      for (let i = 0; i < DIRECTIONS.length; i++) {
        const dir = DIRECTIONS[i];

        const newPos = nextPos(position, dir);

        const count = findLoop(newPos, dir);

        if (count !== undefined && count > 0) {
          return count;
        }
      }
      Err();
    }
    case undefined:
    case Tile.GROUND:
      return undefined;
    default: {
      const newDir = getNextDir(tile, direction);

      const newPos = nextPos(position, newDir);

      return findLoop(newPos, newDir, count + 1);
    }
  }
}

const amountOfSteps = findLoop() ?? 0;

const stepsToFarthestPoint = Math.ceil(amountOfSteps / 2);

console.log({ stepsToFarthestPoint });
