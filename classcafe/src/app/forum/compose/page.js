"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ThoughtTextarea from "../../../ThoughtTextarea";
import styles from "./page.module.css";

const API_BASE_URL = "https://classcafe-backend.onrender.com/api";

export default function ComposePostPage() {
  const [message, setMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    if (!courseId) {
      router.push("/");
      return;
    }

    setIsAuthenticated(true);
    setIsLoading(false);
  }, [router, courseId]);

  const handlePost = async () => {
    if (!message.trim()) {
      return;
    }

    setIsPosting(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/forum/course/${courseId}/posts`,
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
        const errorData = await response.json().catch(() => ({
          error: "Unknown error",
        }));
        throw new Error(
          errorData.error || `Failed to post: ${response.statusText}`
        );
      }

      // Success! Redirect back to forum page
      router.push(`/forum?courseId=${courseId}`);
    } catch (err) {
      setError(err.message || "Failed to post. Please try again.");
      setIsPosting(false);
    }
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
      <Link
        href={`/forum?courseId=${courseId}`}
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
          {error && (
            <div style={{ color: "red", marginTop: "1rem", padding: "0.5rem" }}>
              {error}
            </div>
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
              href={`/forum?courseId=${courseId}`}
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

