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

        const response = await fetch(`${API_BASE_URL}/forum/course/${courseCode}/posts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const allPosts = await response.json();
          
          if (allPosts.length > 0) {
            const recentPool = allPosts.slice(0, 5);
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

  // Navigates to /notice as requested
  const handleMemeBoard = () => {
    router.push(`/cafe/${courseCode}/notice`);
  };

  const handleForum = () => {
    router.push(`/cafe/${courseCode}/forum`);
  };

  // Navigates to specific post discussion
  const handleBubbleClick = (postId) => {
    router.push(`/cafe/${courseCode}/forum/post/${postId}`);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.exitButton} onClick={handleExit}>
          Leave Cafe
        </button>
      </header>

      <main className={styles.main}>
        {/* Left Side: Ambient Chat Bubbles */}
        <div className={styles.previewSection}>
          {randomPosts.length > 0 ? (
            randomPosts.map((post, index) => {
              const isLeft = index % 2 === 0;
              const avatarUrl = getAvatarUrl(post.user?.avatarConfig);

              return (
                <div 
                  key={post.id} 
                  className={`${styles.previewBubbleWrapper} ${isLeft ? styles.left : styles.right}`}
                  onClick={() => handleBubbleClick(post.id)}
                  style={{ cursor: "pointer" }}
                >
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
                      {post.content.length > 80 
                        ? post.content.substring(0, 80) + "..." 
                        : post.content}
                    </p>
                    <span className={styles.previewAuthor}>
                      - {post.user?.username || "Student"}
                    </span>
                  </div>

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
            })
          ) : (
            <div style={{ textAlign: 'center', color: '#a88d70', fontStyle: 'italic' }}>
              (It's quiet in here... be the first to post!)
            </div>
          )}
        </div>

        {/* Right Side: Menu Buttons */}
        <div className={styles.buttonGroup}>
          <button className={styles.cafeButton} onClick={handleForum}>
            Forum
          </button>
          {/* Renamed to Meme Board */}
          <button className={styles.cafeButton} onClick={handleMemeBoard}>
            Meme Board
          </button>
          <button
            className={styles.cafeButton}
            onClick={handleCustomiseAvatar}
          >
            Customise Avatar
          </button>
          <button className={styles.cafeButton} onClick={handleNotifications}>
            Notifications
          </button>
        </div>
      </main>
    </div>
  );
}