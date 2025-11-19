"use client";

import { useState } from "react";
import Link from "next/link";
import ThoughtTextarea from "../../../ThoughtTextarea";
import styles from "./page.module.css";

export default function ComposePostPage() {
  const [message, setMessage] = useState("");

  const handlePost = () => {
    if (!message.trim()) {
      return;
    }
    alert("Posting soon! This is a placeholder while the backend is built.");
  };

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

