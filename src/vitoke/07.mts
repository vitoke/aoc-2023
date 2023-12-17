import {
  HashMap,
  HashMultiSet,
  Reducer,
  SortedMap,
  SortedMultiSet,
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

const inputLines = input.split("\n");

const gameData = inputLines.map((line) => {
  const [hand, bidStr] = line.split(" ");

  return { hand, bid: Number(bidStr) };
});

// START ALGORITHM PART 1

const CARDS = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "T",
  "J",
  "Q",
  "K",
  "A",
] as const;

const CARDS_MAP = HashMap.from(
  Stream.from(CARDS).map((card, index) => [card, index])
);

const HAND_TYPES = ["HC", "1P", "2P", "3K", "FH", "4K", "5K"] as const;
type HandType = (typeof HAND_TYPES)[number];

const HAND_MAP = HashMap.from(
  Stream.from(HAND_TYPES).map((card, index) => [card, index])
);

function getHandValue(handType: HandType) {
  return HAND_MAP.get(handType, 0);
}

function getCardValue(card: string) {
  return CARDS_MAP.get(card, 0);
}

const handTypeReducer = Reducer.createOutput<number, HandType>(
  "HC",
  (state, amount, _, halt) => {
    if (amount === 5) {
      halt();
      return "5K";
    }
    if (amount === 4) {
      halt();
      return "4K";
    }
    if (amount === 3) {
      if (state === "1P") {
        halt();
        return "FH";
      }

      return "3K";
    }
    if (amount === 2) {
      if (state === "3K") {
        halt();
        return "FH";
      }

      if (state === "1P") {
        halt();
        return "2P";
      }

      return "1P";
    }

    return state;
  }
);

function getHandType(cards: string) {
  const multiSet = HashMultiSet.from(cards);

  const hand = multiSet.countMap.streamValues().reduce(handTypeReducer);

  return hand;
}

function compareHands(hand1: string, hand2: string): number {
  const handType1 = getHandType(hand1);
  const handType2 = getHandType(hand2);

  const handScore1 = getHandValue(handType1);
  const handScore2 = getHandValue(handType2);

  if (handScore1 !== handScore2) {
    return handScore1 - handScore2;
  }

  return Stream.zip(hand1, hand2)
    .collect(([card1, card2], _, skip, halt) => {
      if (card1 === card2) {
        return skip;
      }

      halt();

      return getCardValue(card1) - getCardValue(card2);
    })
    .first(0);
}

const HandSortedMap = SortedMap.createContext({
  comp: { isComparable: (v: any): v is string => true, compare: compareHands },
});

const sortedHands = HandSortedMap.from(
  Stream.from(gameData).map(({ hand, bid }) => [hand, bid])
);

const valuedBidScores = sortedHands
  .streamValues()
  .map((bid, index) => bid * (index + 1));

const totalBidScore = valuedBidScores.reduce(Reducer.sum);

console.log({ totalBidScore });

// START ALGORITHM PART 2

const JOKER_CARDS = [
  "J",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "T",
  "Q",
  "K",
  "A",
] as const;

const JOKER_CARDS_MAP = HashMap.from(
  Stream.from(JOKER_CARDS).map((card, index) => [card, index])
);

function getJokerCardValue(card: string) {
  return JOKER_CARDS_MAP.get(card, 0);
}

const CardSortedMultiSet = SortedMultiSet.createContext({
  countMapContext: SortedMap.createContext({
    comp: {
      isComparable: (v: any): v is string => true,
      compare: (card1, card2) =>
        getJokerCardValue(card2) - getJokerCardValue(card1),
    },
  }),
});

function getJokerHandType(cards: string): HandType {
  const multiSet = CardSortedMultiSet.from(cards);

  const amountJokers = multiSet.count("J");

  if (amountJokers >= 4) {
    return "5K";
  }

  const handType = multiSet.countMap
    .stream()
    .filter(([card]) => card !== "J")
    .map(([, amount]) => amount)
    .reduce(handTypeReducer);

  if (amountJokers <= 0) {
    return handType;
  }

  switch (handType) {
    case "4K":
      return "5K"; // joker adds one
    case "3K":
      switch (amountJokers) {
        case 2:
          return "5K"; // 2 jokers creates 5K
        default:
          return "4K"; // 1 joker create 4K
      }
    case "2P":
      return "FH"; // 2P + 1 joker = FH
    case "1P":
      switch (amountJokers) {
        case 3:
          return "5K"; // 1P + 3 jokers = 5K
        case 2:
          return "4K"; // 1P + 2 jokers = 4K
        default:
          return "3K"; // 1P + 1 joker = 3K
      }
    case "HC":
      switch (amountJokers) {
        case 4:
          return "5K"; // HC + 4 jokers = 5K
        case 3:
          return "4K"; // HC + 3 jokers = 4K
        case 2:
          return "3K"; // HC + 2 jokers = 3K
        default:
          return "1P";
      }
  }

  return handType;
}

function jokerCompareHands(hand1: string, hand2: string): number {
  const handType1 = getJokerHandType(hand1);
  const handType2 = getJokerHandType(hand2);

  const handScore1 = getHandValue(handType1);
  const handScore2 = getHandValue(handType2);

  if (handScore1 !== handScore2) {
    return handScore1 - handScore2;
  }

  return Stream.zip(hand1, hand2)
    .collect(([card1, card2], _, skip, halt) => {
      if (card1 === card2) {
        return skip;
      }

      halt();

      return getJokerCardValue(card1) - getJokerCardValue(card2);
    })
    .first(0);
}

const JokerHandSortedMap = SortedMap.createContext({
  comp: {
    isComparable: (v: any): v is string => true,
    compare: jokerCompareHands,
  },
});

const jokerSortedHands = JokerHandSortedMap.from(
  Stream.from(gameData).map(({ hand, bid }) => [hand, bid])
);

const jokerValuedBidScores = jokerSortedHands
  .streamValues()
  .map((bid, index) => bid * (index + 1));

const jokerTotalBidScore = jokerValuedBidScores.reduce(Reducer.sum);

console.log({ jokerTotalBidScore });
