"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ThoughtTextarea from "../../../ThoughtTextarea";
import styles from "./page.module.css";

export default function ComposePostPage() {
  const [message, setMessage] = useState("");
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

  const handlePost = () => {
    if (!message.trim()) {
      return;
    }
    alert("Posting soon! This is a placeholder while the backend is built.");
  };

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
      <Link href="/forum" className={styles.backButton}>
        Go Back
      </Link>
      <main className={styles.main}>
        <section className={styles.composer}>
          <ThoughtTextarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="What's on your mind?"
            rows={8}
          />
          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.post}`}
              onClick={handlePost}
              disabled={!message.trim()}
            >
              Post
            </button>
            <Link
              href="/forum"
              className={`${styles.actionBtn} ${styles.cancel}`}
            >
              Cancel
            </Link>
          </div>
        </section>

        <div className={styles.characterArea}>
          <span className={`${styles.dot} ${styles.dotLarge}`} />
          <span className={`${styles.dot} ${styles.dotMedium}`} />
          <span className={`${styles.dot} ${styles.dotSmall}`} />
          <div className={styles.avatarCircle} />
        </div>
      </main>
    </div>
  );
}

