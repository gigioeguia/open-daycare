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

export const kidProfilePageDataBase = {
  backLabel: "Volver a Niños",
  editLabel: "Editar",
  daySummaryLabel: "Resumen del día",
  parentsSectionLabel: "PADRES VINCULADOS",
  linkAnotherParentLabel: "Vincular otro padre",
};
