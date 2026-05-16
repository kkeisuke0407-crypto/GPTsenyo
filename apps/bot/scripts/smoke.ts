import { sunSignFromBirthdate, buildAstrologyContext } from "../src/divination/astrology";
import { drawThreeCards } from "../src/divination/tarot";
import { buildNumerologyContext } from "../src/divination/numerology";
import { computeSizhu, buildSizhuContext } from "../src/divination/sizhu";
import { castIChing, buildIChingContext } from "../src/divination/iching";

console.log("--- Astrology ---");
console.log("1992-04-15 →", sunSignFromBirthdate(new Date("1992-04-15")).name);
console.log("1990-12-25 →", sunSignFromBirthdate(new Date("1990-12-25")).name);
console.log("2000-01-19 →", sunSignFromBirthdate(new Date("2000-01-19")).name);
console.log("2000-01-20 →", sunSignFromBirthdate(new Date("2000-01-20")).name);
console.log("2000-07-23 →", sunSignFromBirthdate(new Date("2000-07-23")).name);
console.log("ctx:", JSON.stringify(buildAstrologyContext(new Date("1992-04-15"), "仕事は?").facts, null, 2));

console.log("\n--- Tarot ---");
console.log(JSON.stringify(drawThreeCards(), null, 2));

console.log("\n--- Numerology ---");
console.log("1992-04-15:", buildNumerologyContext(new Date("1992-04-15"), "x").facts);
console.log("1989-11-29:", buildNumerologyContext(new Date("1989-11-29"), "x").facts);
console.log("2003-12-25:", buildNumerologyContext(new Date("2003-12-25"), "x").facts);

console.log("\n--- Sizhu (四柱推命) ---");
const s2024 = computeSizhu(new Date("2024-06-15"));
console.log("2024-06-15:", JSON.stringify(s2024, null, 2));
console.log("1984-01-15 (Lichun前): year_pillar should be 1983 (癸亥) →",
  computeSizhu(new Date("1984-01-15")).year);
console.log("1984-02-15 (Lichun後): year_pillar should be 甲子 →",
  computeSizhu(new Date("1984-02-15")).year);
console.log("ctx:", JSON.stringify(buildSizhuContext(new Date("1992-04-15"), "仕事").facts, null, 2));

console.log("\n--- I-Ching (易) ---");
const c = castIChing();
console.log("Primary:", c.primaryHexagram);
console.log("Changing lines:", c.changingLines);
console.log("Resulting:", c.resultingHexagram);
console.log("Lines:", c.lines);
console.log("ctx:", JSON.stringify(buildIChingContext("人間関係について").facts, null, 2));
