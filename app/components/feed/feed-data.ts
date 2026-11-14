export type NavItemId = "feed" | "children" | "notices" | "account";
export type PostCategory = "achievement" | "activity" | "announcement";

export type FeedUser = {
  name: string;
  role: string;
  initial: string;
};

export type NavItem = {
  id: NavItemId;
  label: string;
  active: boolean;
};

export type Post = {
  id: string;
  category: PostCategory;
  authorName: string;
  authorInitial?: string;
  time: string;
  publishedBy: string;
  audience: string;
  content: string;
  photoPlaceholderLabel?: string;
  reactions: number;
  comments: number;
};

export type FeedPageData = {
  orgLabel: string;
  greeting: string;
  meta: string;
  dayLabel: string;
  composerPrompt: string;
  user: FeedUser;
  navItems: NavItem[];
  posts: Post[];
};

export const feedPageData: FeedPageData = {
  orgLabel: "GUARDERÍA · SALA LUNAS",
  greeting: "Buenas, Laura",
  meta: "10 niños · miércoles 14 oct",
  dayLabel: "PUBLICADO HOY",
  composerPrompt: "Compartí un momento…",
  user: {
    name: "Laura Méndez",
    role: "Maestra · Lunas",
    initial: "L",
  },
  navItems: [
    { id: "feed", label: "Feed", active: true },
    { id: "children", label: "Niños", active: false },
    { id: "notices", label: "Avisos", active: false },
    { id: "account", label: "Mi cuenta", active: false },
  ],
  posts: [
    {
      id: "post-achievement-sofia",
      category: "achievement",
      authorName: "Sofía",
      authorInitial: "S",
      time: "10:15",
      publishedBy: "publicado por vos",
      audience: "Para: familia de Sofía",
      content:
        "Armó un rompecabezas de 12 piezas sin ayuda. Se mostró muy concentrada y orgullosa del resultado.",
      reactions: 3,
      comments: 1,
    },
    {
      id: "post-activity-diego",
      category: "activity",
      authorName: "Diego",
      authorInitial: "D",
      time: "09:05",
      publishedBy: "publicado por vos",
      audience: "Para: familia de Diego",
      content:
        "Exploramos texturas con pintura de dedos. Diego probó mezclar amarillo y rojo para crear su propio color.",
      photoPlaceholderLabel: "Foto · pintura con dedos",
      reactions: 4,
      comments: 2,
    },
    {
      id: "post-announcement-general",
      category: "announcement",
      authorName: "Anuncio general",
      time: "07:45",
      publishedBy: "publicado por vos",
      audience: "Para: toda la sala",
      content:
        "Mañana realizaremos una lectura grupal en el patio. Traer una manta pequeña y su cuento favorito.",
      reactions: 6,
      comments: 0,
    },
  ],
};
