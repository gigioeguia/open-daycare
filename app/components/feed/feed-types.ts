export type FeedNavItemId = "feed" | "children" | "notices" | "account";

export type FeedPostTypeId =
  | "meal"
  | "nap"
  | "activity"
  | "achievement"
  | "mood"
  | "photo"
  | "announcement";

export type FeedNavItem = {
  id: FeedNavItemId;
  label: string;
  active: boolean;
};

export type FeedArea = "staff" | "family";

export type FeedShellUser = {
  name: string;
  role: string;
  initial: string;
  avatarBackgroundColor?: string;
  avatarColor?: string;
};

export type FeedPostImage = {
  id: string;
  storagePath: string;
  signedUrl: string | null;
  position: number;
};

export type FeedPost = {
  id: string;
  type: FeedPostTypeId;
  authorId: string;
  authorName: string;
  authorInitial?: string;
  timeLabel: string;
  publishedByLabel: string;
  audienceLabel: string;
  audienceMode: "children" | "room";
  childIds: string[];
  body: string;
  images: FeedPostImage[];
  reactions: number;
  comments: number;
  canManage: boolean;
};

export type FeedPageViewData = {
  orgLabel: string;
  greeting: string;
  meta: string;
  dayLabel: string;
  composerPrompt: string;
  user: FeedShellUser;
  navItems: FeedNavItem[];
  posts: FeedPost[];
  currentRoomId: string | null;
  currentRoomName: string | null;
  canCreatePost: boolean;
  area?: FeedArea;
};

export type AudienceChildOption = {
  id: string;
  label: string;
  initial: string;
  roomName: string;
  avatarBackgroundColor: string;
  avatarColor: string;
};
