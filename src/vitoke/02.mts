import { Reducer, Stream } from "@rimbu/core";
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

// START ALGORITHM PART 1

function isPossibleReveal(bag: Reveal, reveal: Reveal) {
  const { red: bagRed = 0, green: bagGreen = 0, blue: bagBlue = 0 } = bag;
  const { red = 0, green = 0, blue = 0 } = reveal;

  const result = red <= bagRed && green <= bagGreen && blue <= bagBlue;

  return result;
}

function possibleGameStream(bag: Reveal, games: Game[]) {
  const possibleGameStream = Stream.from(games).filter((game) => {
    const isPossibleGame = game.reveals.every((reveal) =>
      isPossibleReveal(bag, reveal)
    );

    return isPossibleGame;
  });

  return possibleGameStream;
}

const actualBagContents: Reveal = { red: 12, green: 13, blue: 14 };

const sumOfPossibleGameIds = possibleGameStream(
  actualBagContents,
  parsedInput
).reduce(Reducer.sum.mapInput((game) => game.id));

console.log("part one", { sumOfPossibleGameIds });

// START ALGORITHM PART 2

function getPowerForGame(game: Game) {
  const [maxRed, maxGreen, maxBlue] = Stream.from(game.reveals).reduceAll(
    Reducer.max(0).mapInput<Reveal>((reveal) => reveal.red ?? 0),
    Reducer.max(0).mapInput<Reveal>((reveal) => reveal.green ?? 0),
    Reducer.max(0).mapInput<Reveal>((reveal) => reveal.blue ?? 0)
  );

  return maxRed * maxGreen * maxBlue;
}

function minimumPowerForGamesStream(games: Game[]) {
  return Stream.from(games).map(getPowerForGame);
}

const sumOfMinimumPowerForGames = minimumPowerForGamesStream(
  parsedInput
).reduce(Reducer.sum);

console.log("part two", { sumOfMinimumPowerForGames });
