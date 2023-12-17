import { Reducer, Stream } from "@rimbu/core";
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

const [timesStr, distancesStr] = input.split("\n");

const timeData = timesStr.split(":")[1].trim().split(/\s+/g).map(Number);
const distanceData = distancesStr
  .split(":")[1]
  .trim()
  .split(/\s+/g)
  .map(Number);

// START ALGORITHM PART 1

/*
 * raceTime = time in ms of the race
 * recordDistance = record distance in mm
 * holdTime = time in ms the button is pressed
 * actualDistance = the actual distance in mm traveled
 *
 * actualDistance = (raceTime - holdTime) * holdTime
 *
 * actualDistance = -holdTime^2 + raceTime * holdTime
 *
 * holdTime^2 - raceTime * holdTime + actualDistance = 0
 *
 * => quadratic formula (ax^2 + bx + c = 0) => x = (-b +- sqrt(b^2-4ac)) / 2a
 *
 * a = 1
 * b = -raceTime
 * c = actualDistance
 *
 * holdTime = (-raceTime +/- sqrt(-raceTime^2 - 4*actualDistance)) / 2
 *
 * holdTime^2 - raceTime * holdTime + recordDistance > 0
 *
 * holdTime = (-raceTime +/- sqrt(-raceTime^2 - 4*recordDistance)) / 2
 */

function quadratic(a: number, b: number, c: number) {
  const z1 = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);
  const z2 = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
  return [z1, z2];
}

function getMinimumHoldTime(raceTime: number, distanceToBeat: number) {
  return quadratic(1, -raceTime, distanceToBeat);
}

function getAmountWaysToBeat(raceTime: number, distanceToBeat: number) {
  const [minTime, maxTime] = getMinimumHoldTime(
    raceTime,
    distanceToBeat + Number.EPSILON // ensure result is larger than distance to beat
  );

  const amountWaystoBeat = Math.floor(maxTime) - Math.ceil(minTime) + 1;

  return amountWaystoBeat;
}

const numberWaysToBeatPerRace = Stream.zip(timeData, distanceData).map(
  ([time, distance]) => getAmountWaysToBeat(time, distance)
);

const productOfWaystoBeat = numberWaysToBeatPerRace.reduce(Reducer.product);

console.log({ productOfWaystoBeat });

// START ALGORITHM PART 2

const part2Time = Number(timesStr.split(":")[1].replace(/ /g, ""));
const part2Distance = Number(distancesStr.split(":")[1].replace(/ /g, ""));

const part2NumberWaysToBeatRace = getAmountWaysToBeat(part2Time, part2Distance);

console.log({ part2NumberWaysToBeatRace });
