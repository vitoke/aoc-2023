import {
  Err,
  HashSet,
  Range,
  Reducer,
  SortedTableSortedColumn,
  Stream,
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

let inputLines = input.split("\n");

// START ALGORITHM PART 1

const coordStream = Stream.from(inputLines).flatMap((line, y) =>
  Stream.from(line).map((char, x) => [y, x, char] as const)
);

const grid = SortedTableSortedColumn.from(coordStream);

type Grid = SortedTableSortedColumn<number, number, string>;
function streamRow(
  table: Grid,
  yIndex: number,
  xRange: Range<number>,
  reversed = false
) {
  return table
    .getRow(yIndex)
    .streamRange(xRange, reversed)
    .map(([, char]) => char);
}

function streamColumn(
  table: Grid,
  xIndex: number,
  yRange: Range<number>,
  reversed = false
) {
  return table.rowMap
    .streamRange(yRange, reversed)
    .map(([yIndex, rowChars]) => {
      return rowChars.get(xIndex, Err);
    });
}

type Direction = "N" | "E" | "S" | "W";

type Position = [y: number, x: number];

interface Beam {
  position: Position;
  direction: Direction;
}

function getAtGrid(position: Position, grid: Grid) {
  const [y, x] = position;
  return grid.getRow(y).getAtIndex(x, Err)[1];
}

type GridBuilder = SortedTableSortedColumn.Builder<
  number,
  number,
  HashSet.Builder<Direction>
>;

interface Context {
  grid: Grid;
  builder: GridBuilder;
}

function drawBeam(beam: Beam, context: Context) {
  const { grid, builder } = context;
  const { position, direction } = beam;

  const [y, x] = position;

  if (y < 0 || y >= grid.amountRows) {
    return;
  }
  if (x < 0 || x >= grid.getRow(0).size) {
    return;
  }

  const char = getAtGrid(position, grid);

  let directionAlreadyCovered = false;

  builder.modifyAt(y, x, {
    ifNew: () => HashSet.of(direction).toBuilder(),
    ifExists: (cur) => {
      directionAlreadyCovered = !cur.add(direction);
      return cur;
    },
  });

  if (directionAlreadyCovered) {
    return;
  }

  switch (char) {
    case ".":
      switch (direction) {
        case "N":
          return drawBeam({ position: [y - 1, x], direction }, context);
        case "E":
          return drawBeam({ position: [y, x + 1], direction }, context);
        case "S":
          return drawBeam({ position: [y + 1, x], direction }, context);
        case "W":
          return drawBeam({ position: [y, x - 1], direction }, context);
      }
    case "|":
      switch (direction) {
        case "E":
        case "W":
          drawBeam({ position: [y - 1, x], direction: "N" }, context);
          drawBeam({ position: [y + 1, x], direction: "S" }, context);
          return;
        default:
          if (direction === "N") {
            return drawBeam({ position: [y - 1, x], direction }, context);
          }
          return drawBeam({ position: [y + 1, x], direction }, context);
      }
    case "-":
      switch (direction) {
        case "N":
        case "S":
          drawBeam({ position: [y, x - 1], direction: "W" }, context);
          drawBeam({ position: [y, x + 1], direction: "E" }, context);
          return;
        default:
          if (direction === "E") {
            return drawBeam({ position: [y, x + 1], direction }, context);
          }
          return drawBeam({ position: [y, x - 1], direction }, context);
      }
    case "/":
      switch (direction) {
        case "N":
          return drawBeam({ position: [y, x + 1], direction: "E" }, context);
        case "E":
          return drawBeam({ position: [y - 1, x], direction: "N" }, context);
        case "S":
          return drawBeam({ position: [y, x - 1], direction: "W" }, context);
        case "W":
          return drawBeam({ position: [y + 1, x], direction: "S" }, context);
      }
    case "\\":
      switch (direction) {
        case "N":
          return drawBeam({ position: [y, x - 1], direction: "W" }, context);
        case "E":
          return drawBeam({ position: [y + 1, x], direction: "S" }, context);
        case "S":
          return drawBeam({ position: [y, x + 1], direction: "E" }, context);
        case "W":
          return drawBeam({ position: [y - 1, x], direction: "N" }, context);
      }
  }
}

function countEnergized(builder: GridBuilder) {
  return builder.size;
}

const gridBuilder: GridBuilder = SortedTableSortedColumn.builder();

drawBeam({ position: [0, 0], direction: "E" }, { grid, builder: gridBuilder });

const amountEnergized = countEnergized(gridBuilder);

console.log({ amountEnergized });

// START ALGORITHM PART 2

const gridSizeY = grid.amountRows;
const gridSizeX = grid.getRow(0).size;

const startPositions = Stream.range({ amount: gridSizeY })
  .flatMap(
    (y) =>
      [
        [y, 0, "E"],
        [y, gridSizeX - 1, "W"],
      ] as [number, number, Direction][]
  )
  .concat(
    Stream.range({ amount: gridSizeX }).flatMap(
      (x) =>
        [
          [0, x, "S"],
          [gridSizeY - 1, x, "N"],
        ] as [number, number, Direction][]
    )
  );

const energizedStream = startPositions.map((pos) => {
  const [y, x, dir] = pos;

  const gridBuilder: GridBuilder = SortedTableSortedColumn.builder();

  drawBeam(
    { position: [y, x], direction: dir },
    { grid, builder: gridBuilder }
  );

  return countEnergized(gridBuilder);
});

const maxEnergized = energizedStream.reduce(Reducer.max());

console.log({ maxEnergized });
