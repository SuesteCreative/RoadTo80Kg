import { describe, it, expect } from "vitest";
import { mifflinBmr, tdee, cutMacros, ageFromBirthdate } from "./tdee";

describe("tdee", () => {
  it("computes Pedro's BMR+TDEE+target (105kg, 184cm, 31M, sedentary)", () => {
    const bmr = mifflinBmr({ sex: "M", weightKg: 105, heightCm: 184, ageYears: 31 });
    expect(bmr).toBe(2050);
    expect(tdee(bmr, "sedentary")).toBe(2460);
  });

  it("cutMacros hits protein 2g/kg target, fat 0.8g/kg, carbs fill", () => {
    const m = cutMacros(2160, 80);
    expect(m.proteinG).toBe(160);
    expect(m.fatG).toBe(64);
    expect(m.carbsG).toBe((2160 - 160 * 4 - 64 * 9) / 4);
  });

  it("ageFromBirthdate: birthday not passed yet this year → age-1", () => {
    const today = new Date("2026-04-24T00:00:00Z");
    expect(ageFromBirthdate("1995-06-15", today)).toBe(30);
    expect(ageFromBirthdate("1995-04-25", today)).toBe(30);
    expect(ageFromBirthdate("1995-04-24", today)).toBe(31);
    expect(ageFromBirthdate("1995-01-01", today)).toBe(31);
  });
});
