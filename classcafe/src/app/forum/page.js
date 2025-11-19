import Link from "next/link";
import PostBubble from "../../PostBubble";
import MOCK_POSTS from "../../mockPosts";
import styles from "./page.module.css";

export default function ForumPage() {
  return (
    <div className={styles.page}>
      <Link href="/" className={styles.backButton}>
        Go Back
      </Link>
      <main className={styles.main}>
        <div className={styles.feed}>
          {MOCK_POSTS.map((post) => (
            <PostBubble key={post.id} post={post} />
          ))}
        </div>
      </main>
    </div>
  );
}

