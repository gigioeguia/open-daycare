const AVATAR_PALETTES = [
  { avatarBackground: "#A9D9E8", avatarColor: "#1F7A93" },
  { avatarBackground: "#F4B8CC", avatarColor: "#C44A7A" },
  { avatarBackground: "#B9DEC4", avatarColor: "#3E8B62" },
  { avatarBackground: "#F4DC8E", avatarColor: "#9A7B1E" },
  { avatarBackground: "#C9B6E8", avatarColor: "#7B5FC0" },
  { avatarBackground: "#A9C7E8", avatarColor: "#3E6C93" },
] as const;

export const KIDS_LINKED_PARENTS_LABEL = "Sin información de padres";

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
