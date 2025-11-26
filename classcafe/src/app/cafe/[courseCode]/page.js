"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import styles from "./page.module.css";
// 🛑 CRITICAL IMPORT: Need getAvatarSrcById for current user's avatar
import { getAvatarUrl, getAvatarSrcById } from "../../../utils/avatarUtils"; 

const API_BASE_URL = "https://classcafe-backend.onrender.com/api";

export default function CourseCafe() {
  const router = useRouter();
  const { courseCode } = useParams();
  const [randomPosts, setRandomPosts] = useState([]);
  // ⬅️ NEW STATE: Store the source for the current user's avatar
  const [currentUserAvatarSrc, setCurrentUserAvatarSrc] = useState(null); 

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
    
    // ⬅️ NEW LOGIC: Load current user's avatar from local storage
    const storedAvatarId = localStorage.getItem(`avatar:${courseCode}`);
    if (storedAvatarId) {
        setCurrentUserAvatarSrc(getAvatarSrcById(storedAvatarId)); 
    } else {
        // Fallback to a default avatar
        setCurrentUserAvatarSrc(getAvatarSrcById("none"));
    }

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
    
  const handleClickCompose = () => { // ⬅️ NEW HANDLER: For the bottom-right button
    router.push(`/cafe/${courseCode}/forum/compose`);
  };

  // --- Handler to navigate to the post discussion (existing) ---
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
        {/* Left Side: Ambient Chat Bubbles (Existing Logic) */}
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

        {/* Right Side: Menu Buttons (Existing Logic) */}
        <div className={styles.buttonGroup}>
          <button className={styles.cafeButton} onClick={handleForum}>
            Forum
          </button>
          <button className={styles.cafeButton} onClick={handleNoticeBoard}>
            Notice Board
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
      
      {/* 🛑 NEW JSX: Fixed Avatar Compose Button in the bottom right */}
      {currentUserAvatarSrc && (
          <button 
              className={styles.composeAvatarButton} 
              onClick={handleClickCompose}
              title="Compose a new post"
          >
              <div className={styles.composeBubble}>
                  <span className={styles.composeText}>What are your thoughts...</span>
              </div>
              <Image
                  src={currentUserAvatarSrc} 
                  alt="Your avatar, click to compose a post"
                  width={80} 
                  height={80} 
                  className={styles.composeAvatarImg}
                  priority
              />
          </button>
      )}
    </div>
  );
}