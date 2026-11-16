export type KidListBadgeTone = "allergy" | "link";

export type KidListItem = {
  id: string;
  name: string;
  ageLabel: string;
  linkedParentsLabel: string;
  initial: string;
  avatarBackground: string;
  avatarColor: string;
  roomName?: string;
  badgeLabel?: string;
  badgeTone?: KidListBadgeTone;
  showChevron?: boolean;
};

export type ParentStatus = "active" | "pending";

export type LinkedParent = {
  id: string;
  name: string;
  relationLabel: string;
  initial: string;
  avatarBackground: string;
  status: ParentStatus;
  statusLabel: string;
};

export type KidProfile = {
  id: string;
  name: string;
  ageLabel: string;
  roomLabel: string;
  initial: string;
  avatarBackground: string;
  avatarColor: string;
  birthDateLabel: string;
  admissionLabel: string;
  allergyTitle?: string;
  allergyNote?: string;
  parents: LinkedParent[];
};

export type KidsPageData = {
  sectionLabel: string;
  title: string;
  searchPlaceholder: string;
  roomGroupLabel: string;
  roomGroupCountLabel: string;
  addChildLabel: string;
  kids: KidListItem[];
};

export type KidProfilePageData = {
  backLabel: string;
  editLabel: string;
  daySummaryLabel: string;
  parentsSectionLabel: string;
  linkAnotherParentLabel: string;
  profile: KidProfile;
};

export const kidsPageData: KidsPageData = {
  sectionLabel: "GESTIÓN",
  title: "Niños",
  searchPlaceholder: "Buscar niño…",
  roomGroupLabel: "SALA SOLES",
  roomGroupCountLabel: "8 niños",
  addChildLabel: "Agregar niño",
  kids: [
    {
      id: "mateo",
      name: "Mateo Fernández",
      ageLabel: "3 años",
      linkedParentsLabel: "2 padres vinculados",
      initial: "M",
      avatarBackground: "#A9D9E8",
      avatarColor: "#1F7A93",
      badgeLabel: "MANÍ",
      badgeTone: "allergy",
    },
    {
      id: "sofia",
      name: "Sofía Méndez",
      ageLabel: "2 años",
      linkedParentsLabel: "1 padre vinculado",
      initial: "S",
      avatarBackground: "#F4B8CC",
      avatarColor: "#C44A7A",
      showChevron: true,
    },
    {
      id: "benjamin",
      name: "Benjamín Ruiz",
      ageLabel: "3 años",
      linkedParentsLabel: "2 padres vinculados",
      initial: "B",
      avatarBackground: "#B9DEC4",
      avatarColor: "#3E8B62",
      showChevron: true,
    },
    {
      id: "valentina",
      name: "Valentina Soto",
      ageLabel: "2 años",
      linkedParentsLabel: "sin padres vinculados",
      initial: "V",
      avatarBackground: "#F4DC8E",
      avatarColor: "#9A7B1E",
      badgeLabel: "VINCULAR",
      badgeTone: "link",
    },
    {
      id: "tomas",
      name: "Tomás Díaz",
      ageLabel: "3 años",
      linkedParentsLabel: "1 padre vinculado",
      initial: "T",
      avatarBackground: "#C9B6E8",
      avatarColor: "#7B5FC0",
      badgeLabel: "LACTOSA",
      badgeTone: "allergy",
    },
    {
      id: "emma",
      name: "Emma Castro",
      ageLabel: "2 años",
      linkedParentsLabel: "1 padre vinculado",
      initial: "E",
      avatarBackground: "#F4B8CC",
      avatarColor: "#C44A7A",
      showChevron: true,
    },
    {
      id: "lucas",
      name: "Lucas Romero",
      ageLabel: "3 años",
      linkedParentsLabel: "1 padre vinculado",
      initial: "L",
      avatarBackground: "#A9D9E8",
      avatarColor: "#1F7A93",
      showChevron: true,
    },
    {
      id: "olivia",
      name: "Olivia Vega",
      ageLabel: "2 años",
      linkedParentsLabel: "1 padre vinculado",
      initial: "O",
      avatarBackground: "#B9DEC4",
      avatarColor: "#3E8B62",
      showChevron: true,
    },
  ],
};

const kidProfilesById: Record<string, KidProfile> = {
  mateo: {
    id: "mateo",
    name: "Mateo Fernández",
    ageLabel: "3 años",
    roomLabel: "Sala Soles",
    initial: "M",
    avatarBackground: "#A9D9E8",
    avatarColor: "#1F7A93",
    birthDateLabel: "12 mar 2022",
    admissionLabel: "feb 2025",
    allergyTitle: "Alergias y notas",
    allergyNote:
      "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
    parents: [
      {
        id: "lucia-fernandez",
        name: "Lucía Fernández",
        relationLabel: "Mamá · activa",
        initial: "L",
        avatarBackground: "#C9B6E8",
        status: "active",
        statusLabel: "ACTIVA",
      },
      {
        id: "diego-fernandez",
        name: "Diego Fernández",
        relationLabel: "Papá · invitación enviada",
        initial: "D",
        avatarBackground: "#A9C7E8",
        status: "pending",
        statusLabel: "PENDIENTE",
      },
    ],
  },
  sofia: {
    id: "sofia",
    name: "Sofía Méndez",
    ageLabel: "2 años",
    roomLabel: "Sala Soles",
    initial: "S",
    avatarBackground: "#F4B8CC",
    avatarColor: "#C44A7A",
    birthDateLabel: "4 jul 2023",
    admissionLabel: "mar 2025",
    parents: [
      {
        id: "carolina-mendez",
        name: "Carolina Méndez",
        relationLabel: "Mamá · activa",
        initial: "C",
        avatarBackground: "#C9B6E8",
        status: "active",
        statusLabel: "ACTIVA",
      },
    ],
  },
  benjamin: {
    id: "benjamin",
    name: "Benjamín Ruiz",
    ageLabel: "3 años",
    roomLabel: "Sala Soles",
    initial: "B",
    avatarBackground: "#B9DEC4",
    avatarColor: "#3E8B62",
    birthDateLabel: "21 ene 2022",
    admissionLabel: "feb 2025",
    parents: [
      {
        id: "paula-ruiz",
        name: "Paula Ruiz",
        relationLabel: "Mamá · activa",
        initial: "P",
        avatarBackground: "#C9B6E8",
        status: "active",
        statusLabel: "ACTIVA",
      },
      {
        id: "martin-ruiz",
        name: "Martín Ruiz",
        relationLabel: "Papá · invitación enviada",
        initial: "M",
        avatarBackground: "#A9C7E8",
        status: "pending",
        statusLabel: "PENDIENTE",
      },
    ],
  },
  valentina: {
    id: "valentina",
    name: "Valentina Soto",
    ageLabel: "2 años",
    roomLabel: "Sala Soles",
    initial: "V",
    avatarBackground: "#F4DC8E",
    avatarColor: "#9A7B1E",
    birthDateLabel: "9 sep 2023",
    admissionLabel: "abr 2025",
    parents: [],
  },
  tomas: {
    id: "tomas",
    name: "Tomás Díaz",
    ageLabel: "3 años",
    roomLabel: "Sala Soles",
    initial: "T",
    avatarBackground: "#C9B6E8",
    avatarColor: "#7B5FC0",
    birthDateLabel: "30 nov 2022",
    admissionLabel: "feb 2025",
    allergyTitle: "Alergias y notas",
    allergyNote: "Intolerancia a la lactosa. Ofrecer alternativas sin lácteos.",
    parents: [
      {
        id: "andrea-diaz",
        name: "Andrea Díaz",
        relationLabel: "Mamá · activa",
        initial: "A",
        avatarBackground: "#C9B6E8",
        status: "active",
        statusLabel: "ACTIVA",
      },
    ],
  },
  emma: {
    id: "emma",
    name: "Emma Castro",
    ageLabel: "2 años",
    roomLabel: "Sala Soles",
    initial: "E",
    avatarBackground: "#F4B8CC",
    avatarColor: "#C44A7A",
    birthDateLabel: "18 may 2023",
    admissionLabel: "mar 2025",
    parents: [
      {
        id: "julia-castro",
        name: "Julia Castro",
        relationLabel: "Mamá · invitación enviada",
        initial: "J",
        avatarBackground: "#A9C7E8",
        status: "pending",
        statusLabel: "PENDIENTE",
      },
    ],
  },
  lucas: {
    id: "lucas",
    name: "Lucas Romero",
    ageLabel: "3 años",
    roomLabel: "Sala Soles",
    initial: "L",
    avatarBackground: "#A9D9E8",
    avatarColor: "#1F7A93",
    birthDateLabel: "2 feb 2022",
    admissionLabel: "feb 2025",
    parents: [
      {
        id: "soledad-romero",
        name: "Soledad Romero",
        relationLabel: "Mamá · activa",
        initial: "S",
        avatarBackground: "#C9B6E8",
        status: "active",
        statusLabel: "ACTIVA",
      },
    ],
  },
  olivia: {
    id: "olivia",
    name: "Olivia Vega",
    ageLabel: "2 años",
    roomLabel: "Sala Soles",
    initial: "O",
    avatarBackground: "#B9DEC4",
    avatarColor: "#3E8B62",
    birthDateLabel: "27 ago 2023",
    admissionLabel: "abr 2025",
    parents: [
      {
        id: "natalia-vega",
        name: "Natalia Vega",
        relationLabel: "Mamá · activa",
        initial: "N",
        avatarBackground: "#C9B6E8",
        status: "active",
        statusLabel: "ACTIVA",
      },
    ],
  },
};

export function getKidProfileById(id: string): KidProfile | undefined {
  return kidProfilesById[id];
}

export const kidProfilePageDataBase = {
  backLabel: "Volver a Niños",
  editLabel: "Editar",
  daySummaryLabel: "Resumen del día",
  parentsSectionLabel: "PADRES VINCULADOS",
  linkAnotherParentLabel: "Vincular otro padre",
};
