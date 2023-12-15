import { HashMultiSet, HashSet, Reducer, Stream } from "@rimbu/core";
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

const inputLines = input.split("\n");

const cardData = inputLines.map((line) => {
  const [cardStr, numbers] = line.split(":");
  const [, cardNrStr] = cardStr.split(" ");
  const [winningNumbersStr, ownNumbersStr] = numbers.split("|");
  const winningNumbers = winningNumbersStr.trim().split(/\s+/g).map(Number);
  const ownNumbers = ownNumbersStr.trim().split(/\s+/g).map(Number);

  return {
    cardNr: Number(cardNrStr),
    winningNumbers,
    ownNumbers,
  };
});

// START ALGORITHM PART 1

const numberSetsStream = Stream.from(cardData).map((card) => {
  const ownSet = HashSet.from(card.ownNumbers);

  return {
    cardNr: card.cardNr,
    matchesSet: ownSet.intersect(card.winningNumbers),
  };
});

const scoresStream = numberSetsStream.map((sets) =>
  sets.matchesSet.size <= 0 ? 0 : Math.pow(2, sets.matchesSet.size - 1)
);

const sumOfScores = scoresStream.reduce(Reducer.sum);

console.log({ sumOfScores });

// START ALGORITHM PART 2

const resultingAmountOfCards = Stream.from(cardData).reduce(
  Reducer.create(
    { totalCardAmount: 0, extraCardAmounts: HashMultiSet.builder<number>() },
    (state, card) => {
      const cardScore = HashSet.from(card.winningNumbers).intersect(
        card.ownNumbers
      ).size;

      const addCards = 1 + state.extraCardAmounts.count(card.cardNr);

      state.totalCardAmount += addCards;

      for (const cardNr of Stream.range({
        start: card.cardNr + 1,
        amount: cardScore,
      })) {
        state.extraCardAmounts.add(cardNr, addCards);
      }

      return state;
    },
    (state) => {
      return state.totalCardAmount;
    }
  )
);

console.log("result for larger input probably incorrect, needs fixing", {
  resultingAmountOfCards,
});
