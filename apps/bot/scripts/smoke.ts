import { sunSignFromBirthdate, buildAstrologyContext } from "../src/divination/astrology";
import { drawThreeCards } from "../src/divination/tarot";
import { buildNumerologyContext } from "../src/divination/numerology";

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
