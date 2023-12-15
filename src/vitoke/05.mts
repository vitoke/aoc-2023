import { HashMap, Reducer, SortedMap, Stream } from "@rimbu/core";
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

const inputSections = input.split("\n\n");

const [seedsInput, ...conversionsInput] = inputSections;

const [, seedsStr] = seedsInput.split(": ");

const seedsArr = seedsStr.split(" ");

const seedsToPlant = Stream.from(seedsArr).map(Number);

const conversions = Stream.from(conversionsInput).map((conversionStr) => {
  const [headerStr, ...data] = conversionStr.split("\n");

  const [source, , target] = headerStr.split(" ")[0].split("-");

  const mappingsStream = Stream.from(data)
    .map((d) => Stream.from(d.split(" ")).map(Number))
    .map((spec) => {
      const [dest, src, range] = spec;
      return { dest, src, range };
    });

  return { source, target, mappingsStream };
});

// START ALGORITHM

const mappingsStream = conversions.map((conversion) => {
  const mappingTuples = conversion.mappingsStream.map(
    ({ src, dest, range }) => [src, { dest, range }] as const
  );

  const mappingMap = SortedMap.from(mappingTuples);

  return [
    conversion.source,
    { target: conversion.target, mappings: mappingMap },
  ] as const;
});

const mappingsTable = HashMap.from(mappingsStream);

const locationsStream = seedsToPlant.map((seed) => {
  let input = "seed";
  let value = seed;

  while (input !== "location") {
    const entry = mappingsTable.get(input);

    if (!entry) {
      throw Error("no mapping found");
    }

    input = entry.target;

    const prevEntry = entry.mappings
      .streamRange({ end: value }, true)
      .stream()
      .first();

    if (prevEntry !== undefined) {
      const diff = value - prevEntry[0];
      if (diff >= 0 && diff <= prevEntry[1].range) {
        value = prevEntry[1].dest + diff;
      }
    }
  }

  return value;
});

const lowestLocation = locationsStream.reduce(Reducer.min());

console.log({ lowestLocation });
