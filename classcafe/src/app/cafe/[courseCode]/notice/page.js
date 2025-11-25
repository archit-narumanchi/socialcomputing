"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

const API_BASE_URL = "https://classcafe-backend.onrender.com/api";

export default function MemeBoardPage() {
  const router = useRouter();
  const { courseCode } = useParams();

  const [memes, setMemes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMemes = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/bulletin/course/${courseCode}/meme`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data && !data.message && data.id) {
            setMemes([{
              id: data.id,
              imageSrc: data.imageUrl,
              postedBy: data.user?.username || "Anonymous",
              likes: 0,
              liked: false,
              reported: false,
            }]);
          } else {
            setMemes([]);
          }
        } else {
          setMemes([]);
        }
      } catch (error) {
        console.error("Error fetching memes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemes();
  }, [courseCode]);

  const handleExit = () => {
    router.push(`/cafe/${courseCode}`);
  };

  const handleToggleLike = (id) => {
    setMemes((prev) =>
      prev.map((m) => {
        if (m.id !== id || m.reported) return m;
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
    const confirmed = window.confirm("Are you sure you want to report this image?");
    if (!confirmed) return;

    setMemes((prev) =>
      prev.map((m) => (m.id === id ? { ...m, reported: true, liked: false } : m))
    );
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button onClick={handleExit} className={styles.exitButton}>
            Exit meme board
          </button>
        </header>
        <main className={styles.main} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div>Loading memes...</div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button onClick={handleExit} className={styles.exitButton}>
          Exit meme board
        </button>
      </header>

      <main className={styles.main}>
        <div className={styles.boardContainer}>
          {/* <Image
            src="/assets/notice_board.png" 
            alt="Notice board"
            fill
            priority
            className={styles.boardImage}
          /> */}

          <div className={styles.memesWrapper}>
            {memes.length === 0 ? (
              <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', color: '#5a4636', padding: '2rem' }}>
                <h3>No memes this week!</h3>
                <p>Be the top contributor to feature here.</p>
              </div>
            ) : (
              memes.map((meme) => (
                <div
                  key={meme.id}
                  className={`${styles.memeCard} ${meme.reported ? styles.memeReported : ""}`}
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
                      className={`${styles.likeButton} ${meme.liked ? styles.likeButtonActive : ""}`}
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
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}