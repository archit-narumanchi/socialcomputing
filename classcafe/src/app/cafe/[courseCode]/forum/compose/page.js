"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ThoughtTextarea from "../../../../../ThoughtTextarea";
import styles from "./page.module.css";
import { getAvatarUrl } from "../../../../../utils/avatarUtils";

const API_BASE_URL = "https://classcafe-backend.onrender.com/api";

export default function ComposePostPage() {
  const router = useRouter();
  const { courseCode } = useParams();

  const [message, setMessage] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [myAvatarUrl, setMyAvatarUrl] = useState(getAvatarUrl("none"));

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

    const savedId = localStorage.getItem(`avatar:${courseCode}`);
    setMyAvatarUrl(getAvatarUrl(savedId));

    setIsReady(true);
  }, [courseCode]);

  const handlePost = async () => {
    if (!message.trim()) return;

    setIsPosting(true);
    setPageError("");

    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token) {
        setPageError("You need to be logged in to post.");
        setIsPosting(false);
        return;
      }

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

      const data = await response.json();

      // --- UPDATE COINS HERE ---
      if (data.newCoins !== undefined && userId) {
        localStorage.setItem(`coins:${userId}`, String(data.newCoins));
        alert(`Post created! (+1 Coin)`);
      }
      // -------------------------

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
          <div className={styles.avatarCircle} style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
             <Image 
                src={myAvatarUrl} 
                alt="My Avatar" 
                width={110} 
                height={110} 
                style={{ objectFit: "contain" }}
             />
          </div>
        </div>
      </main>
    </div>
  );
}