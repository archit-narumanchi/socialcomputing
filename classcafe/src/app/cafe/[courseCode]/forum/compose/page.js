"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ThoughtTextarea from "../../../../../ThoughtTextarea";
import styles from "./page.module.css";

const API_BASE_URL = "https://classcafe-backend.onrender.com/api";

export default function ComposePostPage() {
  const router = useRouter();
  const { courseCode } = useParams();

  const [message, setMessage] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setPageError("You need to be logged in to post.");
      setIsReady(true);
      return;
    }

    if (!courseCode) {
      setPageError("Invalid course. Please go back to your course cafe.");
      setIsReady(true);
      return;
    }

    setIsReady(true);
  }, [courseCode]);

  const handlePost = async () => {
    if (!message.trim()) return;

    setIsPosting(true);
    setPageError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setPageError("You need to be logged in to post.");
        setIsPosting(false);
        return;
      }

      // ⚠️ This still uses courseCode in the API – backend will 500 until we swap to numeric ID
      const response = await fetch(
        `${API_BASE_URL}/forum/course/${courseCode}/posts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: message.trim(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to post: ${response.statusText}`
        );
      }

      // back to forum for this course
      router.push(`/cafe/${courseCode}/forum`);
    } catch (err) {
      setPageError(err.message || "Failed to post. Please try again.");
      setIsPosting(false);
    }
  };

  if (!isReady) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div>Loading...</div>
        </main>
      </div>
    );
  }

  if (pageError && !localStorage.getItem("token")) {
    // not logged in – show message + link home
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <p>{pageError}</p>
          <Link href="/">Back to courses</Link>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link
        href={`/cafe/${courseCode}/forum`}
        className={styles.backButton}
      >
        Go Back
      </Link>

      <main className={styles.main}>
        <section className={styles.composer}>
          <ThoughtTextarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="What's on your mind?"
            rows={8}
            disabled={isPosting}
          />

          {pageError && (
            <div style={{ color: "red", marginTop: "1rem" }}>{pageError}</div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.post}`}
              onClick={handlePost}
              disabled={!message.trim() || isPosting}
            >
              {isPosting ? "Posting..." : "Post"}
            </button>
            <Link
              href={`/cafe/${courseCode}/forum`}
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
