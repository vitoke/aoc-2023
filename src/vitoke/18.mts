import { HashTableHashColumn, RMap, Reducer, Stream } from "@rimbu/core";
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

type Dir = "U" | "D" | "L" | "R";

const TRY_DIRS: Record<Dir, Dir[]> = {
  U: ["U", "L", "R"],
  R: ["R", "U", "D"],
  D: ["D", "R", "L"],
  L: ["L", "D", "U"],
};

interface Instruction {
  dir: Dir;
  amount: number;
  color: string;
}

const inputData: Stream<Instruction> = Stream.from(inputLines).map((line) => {
  const [dir, amountStr, colorStr] = line.split(" ");
  const color = colorStr.slice(1, -1);

  return { dir: dir as Dir, amount: Number(amountStr), color };
});

// START ALGORITHM PART 1

const gridBuilder = HashTableHashColumn.builder<number, number, string>();

type GridBuilder = typeof gridBuilder;
type Position = [y: number, x: number];

function dig(
  builder: GridBuilder,
  position: Position,
  instruction: Instruction
) {
  if (instruction.amount <= 0) {
    return position;
  }

  let [y, x] = position;
  const { dir, amount, color } = instruction;

  Stream.range({ amount }).forEach(() => {
    builder.set(y, x, color);

    switch (dir) {
      case "U":
        y--;
        break;
      case "D":
        y++;
        break;
      case "L":
        x--;
        break;
      case "R":
        x++;
        break;
    }
  });

  return [y, x] as Position;
}

inputData.fold([0, 0] as Position, (curPos, instruction) => {
  return dig(gridBuilder, curPos, instruction);
});

function fill(builder: GridBuilder, position: Position, direction: Dir) {
  const [y, x] = position;

  const valueIsNew = builder.modifyAt(y, x, { ifNew: "#" });

  if (!valueIsNew) {
    return;
  }

  for (const dir of TRY_DIRS[direction]) {
    const nextPos: Position =
      dir === "U"
        ? [y - 1, x]
        : dir === "D"
        ? [y + 1, x]
        : dir === "L"
        ? [y, x - 1]
        : [y, x + 1];

    fill(builder, nextPos, dir);
  }
}

fill(gridBuilder, [1, 1], "R");

const grid = gridBuilder.build();
type Grid = typeof grid;

function showGrid(
  builder: GridBuilder,
  topLeft: Position,
  bottomRight: Position
) {
  let res = "";

  for (let y = topLeft[1]; y < bottomRight[1]; y++) {
    for (let x = topLeft[0]; x < bottomRight[0]; x++) {
      res += builder.hasValueAt(y, x) ? "#" : " ";
    }
    res += "\n";
  }

  console.log(res);
}

showGrid(gridBuilder, [-50, -50], [60, 40]);

function getRowSurface(rowMap: RMap<number, string>) {
  const rowSurface = rowMap.size;

  return rowSurface;
}

function countSurface(grid: Grid) {
  const rowValues = grid.rowMap.streamValues().map((rowMap) => {
    const surface = getRowSurface(rowMap);
    return surface;
  });

  return rowValues.reduce(Reducer.sum);
}

const totalSurface = countSurface(grid);

console.log({ totalSurface });
