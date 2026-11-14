import { FeedShell } from "./components/feed/FeedShell";
import { feedPageData } from "./components/feed/feed-data";

export default function Home() {
  return <FeedShell data={feedPageData} />;
}

