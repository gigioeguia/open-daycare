const AVATAR_PALETTES = [
  { avatarBackground: "#A9D9E8", avatarColor: "#1F7A93" },
  { avatarBackground: "#F4B8CC", avatarColor: "#C44A7A" },
  { avatarBackground: "#B9DEC4", avatarColor: "#3E8B62" },
  { avatarBackground: "#F4DC8E", avatarColor: "#9A7B1E" },
  { avatarBackground: "#C9B6E8", avatarColor: "#7B5FC0" },
  { avatarBackground: "#A9C7E8", avatarColor: "#3E6C93" },
] as const;

const SPANISH_MONTH_ABBREVIATIONS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

export const KIDS_LINKED_PARENTS_LABEL = "Sin información de padres";

export type KidRelationship = "father" | "mother" | "guardian";

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

export function getKidInitial(fullName: string): string {
  const trimmedName = fullName.trim();
  const initial = Array.from(trimmedName)[0];

  return (initial ?? "N").toUpperCase();
}

export function getKidAvatarPalette(fullName: string): {
  avatarBackground: string;
  avatarColor: string;
} {
  const paletteIndex = hashString(fullName) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[paletteIndex];
}

export function calculateAgeLabel(
  birthDate: string,
  referenceDate: Date = new Date(),
): string {
  const [yearString, monthString, dayString] = birthDate.split("-");
  const birthYear = Number(yearString);
  const birthMonth = Number(monthString);
  const birthDay = Number(dayString);

  if (
    Number.isNaN(birthYear) ||
    Number.isNaN(birthMonth) ||
    Number.isNaN(birthDay)
  ) {
    return "";
  }

  let years = referenceDate.getFullYear() - birthYear;
  const monthDifference = referenceDate.getMonth() + 1 - birthMonth;
  const dayDifference = referenceDate.getDate() - birthDay;

  if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
    years -= 1;
  }

  const safeYears = Math.max(0, years);
  return safeYears === 1 ? "1 año" : `${safeYears} años`;
}

function parseDateParts(date: string): {
  year: number;
  month: number;
  day: number;
} | null {
  const [yearString, monthString, dayString] = date.split("-");
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  return { year, month, day };
}

function getSpanishMonthAbbreviation(month: number): string {
  return SPANISH_MONTH_ABBREVIATIONS[month - 1] ?? "";
}

export function formatKidBirthDateLabel(birthDate: string): string {
  const parts = parseDateParts(birthDate);

  if (!parts) {
    return birthDate;
  }

  const monthLabel = getSpanishMonthAbbreviation(parts.month);
  return `${parts.day} ${monthLabel} ${parts.year}`.trim();
}

export function formatKidAdmissionLabel(enrolledAt: string): string {
  const parts = parseDateParts(enrolledAt);

  if (!parts) {
    return enrolledAt;
  }

  const monthLabel = getSpanishMonthAbbreviation(parts.month);
  return `${monthLabel} ${parts.year}`.trim();
}

export function getKidRelationshipLabel(relationship: KidRelationship): string {
  switch (relationship) {
    case "father":
      return "Padre";
    case "mother":
      return "Madre";
    case "guardian":
      return "Tutor";
  }
}

export function getKidLinkedParentRelationLabel(
  relationship: KidRelationship,
): string {
  return `${getKidRelationshipLabel(relationship)} · activa`;
}
