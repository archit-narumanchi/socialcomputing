import Link from "next/link";
import styles from "./page.module.css";
import PostBubble from "../PostBubble";
import MOCK_POSTS from "../mockPosts";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Link href="/forum" className={styles.forumButton}>
          Forum
        </Link>
      </main>
    </div>
  );
}
