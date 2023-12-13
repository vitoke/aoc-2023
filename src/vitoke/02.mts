import fs from "node:fs";
import { exit } from "process";

// READ INPUT FILE

const inputFileLocation = process.argv[2];

if (!inputFileLocation) {
  console.log("you should provide an input file as argument");
  exit(1);
}

const input = fs.readFileSync(inputFileLocation).toString();

// PARSE INPUT

interface Game {
  id: number;
  reveals: Reveal[];
}

interface Reveal {
  red?: number;
  green?: number;
  blue?: number;
}

const parsedInput: Game[] = input.split("\n").map((line) => {
  const [gameString, revealsString] = line.split(": ");
  const [, gameId] = gameString.split(" ");
  const reveals = revealsString.split("; ").map((reveal) => {
    const items = reveal
      .split(", ")
      .map((item) => item.split(" "))
      .reduce((result, [amount, color]) => {
        result[color as keyof Reveal] = Number(amount);
        return result;
      }, {} as Reveal);

    return items;
  });

  return { id: Number(gameId), reveals };
});

// START ALGORITHM

function isPossibleReveal(bag: Reveal, reveal: Reveal) {
  const { red: bagRed = 0, green: bagGreen = 0, blue: bagBlue = 0 } = bag;
  const { red = 0, green = 0, blue = 0 } = reveal;

  const result = red <= bagRed && green <= bagGreen && blue <= bagBlue;

  return result;
}

function findPossibleGames(bag: Reveal, games: Game[]) {
  return games.reduce((total, game) => {
    const allRevealsArePossible = game.reveals.every((reveal) =>
      isPossibleReveal(bag, reveal)
    );

    if (allRevealsArePossible) {
      return total + game.id;
    }

    return total;
  }, 0);
}

const result = findPossibleGames({ red: 12, green: 13, blue: 14 }, parsedInput);

console.log("sum of ids", result);
