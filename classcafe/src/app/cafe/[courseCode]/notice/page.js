"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

// TEMP: two placeholder memes for now
const INITIAL_MEMES = [
  {
    id: 1,
    imageSrc: "/assets/meme1.png",    // replace with your real asset
    postedBy: "topContributor01",
    initialLikes: 12,
  },
  {
    id: 2,
    imageSrc: "/assets/meme2.png",    // replace with your real asset
    postedBy: "bestMemeLord",
    initialLikes: 8,
  },
];

export default function NoticeBoardPage() {
  const router = useRouter();
  const { courseCode } = useParams();

  const [memes, setMemes] = useState(
    INITIAL_MEMES.map((m) => ({
      ...m,
      likes: m.initialLikes,
      liked: false,
      reported: false,
    }))
  );

  const handleExit = () => {
    router.push(`/cafe/${courseCode}`);
  };

  const handleToggleLike = (id) => {
    setMemes((prev) =>
      prev.map((m) => {
        if (m.id !== id || m.reported) return m; // can't like reported memes
        const liked = !m.liked;
        return {
          ...m,
          liked,
          likes: m.likes + (liked ? 1 : -1),
        };
      })
    );
  };

  const handleReport = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to report this image?"
    );
    if (!confirmed) return;

    setMemes((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, reported: true, liked: false } : m
      )
    );
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button onClick={handleExit} className={styles.backButton}>
          Exit notice board
        </button>
      </header>

      <main className={styles.main}>
        <div className={styles.boardContainer}>
          {/* Notice board background */}
          <Image
            src="/assets/notice_board.png" // your board asset
            alt="Notice board"
            fill
            priority
            className={styles.boardImage}
          />

          {/* Memes overlay */}
          <div className={styles.memesWrapper}>
            {memes.map((meme) => (
              <div
                key={meme.id}
                className={`${styles.memeCard} ${
                  meme.reported ? styles.memeReported : ""
                }`}
              >
                <div className={styles.memeImageWrapper}>
                  <Image
                    src={meme.imageSrc}
                    alt={`Meme of the Week ${meme.id}`}
                    fill
                    className={styles.memeImage}
                  />
                </div>

                <div className={styles.metaRow}>
                  <span className={styles.postedBy}>
                    Posted by <strong>{meme.postedBy}</strong>
                  </span>
                </div>

                <div className={styles.actionsRow}>
                  <button
                    type="button"
                    onClick={() => handleToggleLike(meme.id)}
                    className={`${styles.likeButton} ${
                      meme.liked ? styles.likeButtonActive : ""
                    }`}
                    disabled={meme.reported}
                  >
                    👍 {meme.likes}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReport(meme.id)}
                    className={styles.reportButton}
                    disabled={meme.reported}
                  >
                    {meme.reported ? "Reported" : "Report"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
