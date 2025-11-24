"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import styles from "./page.module.css";
import { getAvatarUrl } from "../../../utils/avatarUtils";

const API_BASE_URL = "https://classcafe-backend.onrender.com/api";

export default function CourseCafe() {
  const router = useRouter();
  const { courseCode } = useParams();
  const [randomPosts, setRandomPosts] = useState([]);

  useEffect(() => {
    const fetchRandomPosts = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        // Fetch all posts for the course
        // The backend returns them sorted by newest first.
        const response = await fetch(`${API_BASE_URL}/forum/course/${courseCode}/posts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const allPosts = await response.json();
          
          if (allPosts.length > 0) {
            // 1. Take only the top 5 most recent posts
            const recentPool = allPosts.slice(0, 5);
            
            // 2. Shuffle this smaller pool to pick 2 random ones
            const shuffled = [...recentPool].sort(() => 0.5 - Math.random());
            setRandomPosts(shuffled.slice(0, 2));
          }
        }
      } catch (error) {
        console.error("Error fetching preview posts:", error);
      }
    };

    fetchRandomPosts();
  }, [courseCode]);

  const handleExit = () => {
    router.push("/"); 
  };

  const handleCustomiseAvatar = () => {
    router.push(`/cafe/${courseCode}/avatar`);
  };

  const handleNotifications = () => {
    router.push(`/cafe/${courseCode}/notifications`);
  };

  const handleNoticeBoard = () => {
    router.push(`/cafe/${courseCode}/notice`);
  };

  const handleForum = () => {
    router.push(`/cafe/${courseCode}/forum`);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.exitButton} onClick={handleExit}>
          Leave Cafe
        </button>
      </header>

      <main className={styles.main}>
        {/* Ambient Chat Bubbles */}
        {randomPosts.length > 0 && (
          <div className={styles.previewSection}>
            {randomPosts.map((post, index) => {
              const isLeft = index % 2 === 0;
              const avatarUrl = getAvatarUrl(post.user?.avatarConfig);

              return (
                <div 
                  key={post.id} 
                  className={`${styles.previewBubbleWrapper} ${isLeft ? styles.left : styles.right}`}
                >
                  {/* Render Avatar FIRST if on the left */}
                  {isLeft && (
                    <div className={styles.previewAvatarContainer}>
                      <Image 
                        src={avatarUrl} 
                        alt={`${post.user?.username}'s avatar`}
                        width={60}
                        height={60}
                        className={styles.previewAvatarImg}
                      />
                    </div>
                  )}

                  <div className={styles.previewBubble}>
                    <p className={styles.previewContent}>
                      {post.content.length > 60 
                        ? post.content.substring(0, 60) + "..." 
                        : post.content}
                    </p>
                    <span className={styles.previewAuthor}>
                      - {post.user?.username || "Student"}
                    </span>
                  </div>

                  {/* Render Avatar LAST if on the right */}
                  {!isLeft && (
                    <div className={styles.previewAvatarContainer}>
                      <Image 
                        src={avatarUrl} 
                        alt={`${post.user?.username}'s avatar`}
                        width={60}
                        height={60}
                        className={styles.previewAvatarImg}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.buttonGroup}>
          <button
            className={styles.cafeButton}
            onClick={handleCustomiseAvatar}
          >
            Customise Avatar
          </button>
          <button className={styles.cafeButton} onClick={handleNotifications}>
            Notifications
          </button>
          <button className={styles.cafeButton} onClick={handleNoticeBoard}>
            Notice Board
          </button>
          <button className={styles.cafeButton} onClick={handleForum}>
            Forum
          </button>
        </div>
      </main>
    </div>
  );
}