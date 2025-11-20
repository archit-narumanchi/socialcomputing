"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PostBubble from "../../PostBubble";
import MOCK_POSTS from "../../mockPosts";
import styles from "./page.module.css";

export default function ForumPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
    } else {
      setIsAuthenticated(true);
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div>Loading...</div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

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
      <Link href="/forum/compose" className={styles.composeButton}>
        +
      </Link>
    </div>
  );
}

