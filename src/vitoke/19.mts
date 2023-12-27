import { Err, HashMap, Reducer, Stream } from "@rimbu/core";
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

const workflowsStream = Stream.from(inputLines).takeWhile(
  (line) => line !== ""
);

const ratingsLinesStream = Stream.from(inputLines)
  .dropWhile((line) => line !== "")
  .drop(1);

const workflows = workflowsStream.map((workflowString) => {
  const [workflowName, itemsString] = workflowString
    .substring(0, workflowString.length - 1)
    .split("{");
  const itemPartsStrings = itemsString.split(",");
  const fallbackWorkflow = itemPartsStrings.at(-1);

  const itemPartsStream = Stream.fromArray(itemPartsStrings, {
    end: itemPartsStrings.length - 2,
  }).map((part) => {
    const [conditionString, thenWorkflow] = part.split(":");

    const [ratingName, compareValueStr] = conditionString.split(/[<>]/);
    const operator = conditionString.at(ratingName.length);

    return {
      ratingName,
      operator,
      compareValue: Number(compareValueStr),
      thenWorkflow,
    };
  });

  return { workflowName, itemPartsStream, fallbackWorkflow };
});

// START ALGORITHM

const workflowMap = HashMap.from(
  workflows.map((workflow) => [
    workflow.workflowName,
    {
      items: workflow.itemPartsStream.toArray(),
      fallback: workflow.fallbackWorkflow,
    },
  ])
);

const ratingsStream = ratingsLinesStream.map((line) => {
  const contents = line.substring(1, line.length - 1);
  const parts = contents.split(",");
  const obj = Stream.from(parts)
    .map((part) => {
      const [name, value] = part.split("=");

      return [name, Number(value)] as const;
    })
    .reduce(Reducer.toJSObject());

  return obj;
});

type WorkflowMap = typeof workflowMap;

function checkRating(
  rating: Record<string, number>,
  workflowMap: WorkflowMap,
  workflowName = "in"
): "A" | "R" {
  if (workflowName === "A" || workflowName === "R") {
    return workflowName;
  }

  const workflow = workflowMap.get(workflowName, Err);

  const match = Stream.from(workflow.items).find((item) => {
    const ratingValue = rating[item.ratingName];

    return item.operator === ">"
      ? ratingValue > item.compareValue
      : ratingValue < item.compareValue;
  });

  return checkRating(
    rating,
    workflowMap,
    match?.thenWorkflow ?? workflow.fallback
  );
}

const acceptedRatingsStream = ratingsStream.filter(
  (rating) => checkRating(rating, workflowMap) === "A"
);

const sumOfParts = acceptedRatingsStream
  .flatMap(Stream.fromObjectValues)
  .reduce(Reducer.sum);

console.log({ sumOfParts });
