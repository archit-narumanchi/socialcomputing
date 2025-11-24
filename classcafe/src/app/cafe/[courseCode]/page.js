"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "./page.module.css";

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
        const response = await fetch(`${API_BASE_URL}/forum/course/${courseCode}/posts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const allPosts = await response.json();
          
          if (allPosts.length > 0) {
            // Shuffle and pick up to 2 posts
            const shuffled = [...allPosts].sort(() => 0.5 - Math.random());
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
    console.log("Notifications for course:", courseCode);
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
            {randomPosts.map((post, index) => (
              <div 
                key={post.id} 
                className={`${styles.previewBubbleWrapper} ${index % 2 === 0 ? styles.left : styles.right}`}
              >
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
              </div>
            ))}
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