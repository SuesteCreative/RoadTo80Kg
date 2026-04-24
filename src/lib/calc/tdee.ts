export type Sex = "M" | "F";
export type Activity = "sedentary" | "light" | "moderate" | "heavy";

export const ACTIVITY_MULT: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  heavy: 1.725,
};

export function mifflinBmr(params: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  ageYears: number;
}): number {
  const { sex, weightKg, heightCm, ageYears } = params;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return Math.round(base + (sex === "M" ? 5 : -161));
}

export function tdee(bmr: number, activity: Activity): number {
  return Math.round(bmr * ACTIVITY_MULT[activity]);
}

export function ageFromBirthdate(birthdate: string, today = new Date()): number {
  const b = new Date(birthdate);
  let age = today.getUTCFullYear() - b.getUTCFullYear();
  const m = today.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && today.getUTCDate() < b.getUTCDate())) age--;
  return age;
}

export type MacroSplit = { proteinG: number; fatG: number; carbsG: number };

export function cutMacros(targetKcal: number, targetWeightKg: number): MacroSplit {
  const proteinG = Math.round(targetWeightKg * 2.0);
  const fatG = Math.round(targetWeightKg * 0.8);
  const kcalFromP = proteinG * 4;
  const kcalFromF = fatG * 9;
  const carbsG = Math.max(0, Math.round((targetKcal - kcalFromP - kcalFromF) / 4));
  return { proteinG, fatG, carbsG };
}

export function computeTargets(input: {
  sex: Sex;
  heightCm: number;
  birthdate: string;
  weightKg: number;
  activity: Activity;
  targetWeightKg: number;
  deficitKcal: number;
}) {
  const age = ageFromBirthdate(input.birthdate);
  const bmr = mifflinBmr({
    sex: input.sex,
    heightCm: input.heightCm,
    weightKg: input.weightKg,
    ageYears: age,
  });
  const tdeeKcal = tdee(bmr, input.activity);
  const targetKcal = tdeeKcal - input.deficitKcal;
  const macros = cutMacros(targetKcal, input.targetWeightKg);
  return { age, bmr, tdee: tdeeKcal, targetKcal, ...macros };
}
