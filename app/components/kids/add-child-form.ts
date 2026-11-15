export type RoomOption = {
  value: string;
  label: string;
};

export type AddChildFormValues = {
  fullName: string;
  birthDate: string;
  room: string;
  allergies: string;
  medicalNotes: string;
};

export type AddChildFormErrors = {
  fullName?: string;
  birthDate?: string;
  room?: string;
};

export const roomOptions: RoomOption[] = [
  { value: "sala-soles", label: "Sala Soles" },
  { value: "sala-lunas", label: "Sala Lunas" },
  { value: "sala-estrellas", label: "Sala Estrellas" },
];

export const addChildFormLabels = {
  title: "Agregar niño",
  cancel: "Cancelar",
  save: "Guardar",
  fullName: "NOMBRE COMPLETO",
  birthDate: "FECHA DE NACIMIENTO",
  room: "SALA",
  allergies: "ALERGIAS (ETIQUETAS)",
  medicalNotes: "NOTAS MÉDICAS",
};

export const addChildFormPlaceholders = {
  fullName: "Ej. Martina López",
  birthDate: "dd/mm/aaaa",
  room: "Seleccionar sala",
  allergies: "Ej. Maní, Lactosa",
  medicalNotes: "Indicaciones, medicación, contactos…",
};

export const birthDateFormatHint = "Formato: dd/mm/aaaa";

export const addChildFormErrorMessages = {
  fullNameRequired: "Ingresá el nombre completo.",
  birthDateRequired: "Ingresá la fecha de nacimiento.",
  birthDateInvalid: "Ingresá una fecha válida en formato dd/mm/aaaa.",
  roomRequired: "Seleccioná una sala.",
};

export const initialAddChildFormValues: AddChildFormValues = {
  fullName: "",
  birthDate: "",
  room: "",
  allergies: "",
  medicalNotes: "",
};

const BIRTH_DATE_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/;

export function isValidBirthDate(value: string): boolean {
  if (!BIRTH_DATE_PATTERN.test(value)) {
    return false;
  }

  const [dayText, monthText, yearText] = value.split("/");
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);

  if (month < 1 || month > 12 || year < 1900 || year > 2100) {
    return false;
  }

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function validateAddChildForm(
  values: AddChildFormValues,
): AddChildFormErrors {
  const errors: AddChildFormErrors = {};
  const fullName = values.fullName.trim();
  const birthDate = values.birthDate.trim();

  if (!fullName) {
    errors.fullName = addChildFormErrorMessages.fullNameRequired;
  }

  if (!birthDate) {
    errors.birthDate = addChildFormErrorMessages.birthDateRequired;
  } else if (!isValidBirthDate(birthDate)) {
    errors.birthDate = addChildFormErrorMessages.birthDateInvalid;
  }

  if (!values.room) {
    errors.room = addChildFormErrorMessages.roomRequired;
  }

  return errors;
}

export function hasAddChildFormErrors(errors: AddChildFormErrors): boolean {
  return Boolean(errors.fullName || errors.birthDate || errors.room);
}
