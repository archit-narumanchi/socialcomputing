"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import styles from "./page.module.css";
import { getAvatarUrl, getAvatarSrcById } from "../../../utils/avatarUtils"; 

const API_BASE_URL = "https://classcafe-backend.onrender.com/api";
const DEFAULT_COINS = 2;

export default function CourseCafe() {
  const router = useRouter();
  const { courseCode } = useParams();
  const [randomPosts, setRandomPosts] = useState([]);
  const [currentUserAvatarSrc, setCurrentUserAvatarSrc] = useState(null);
  const [coins, setCoins] = useState(DEFAULT_COINS);

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
    
    // Load current user's avatar from local storage
    const storedAvatarId = localStorage.getItem(`avatar:${courseCode}`);
    if (storedAvatarId) {
        setCurrentUserAvatarSrc(getAvatarSrcById(storedAvatarId)); 
    } else {
        setCurrentUserAvatarSrc(getAvatarSrcById("none"));
    }

    // Load coins
    const userId = localStorage.getItem("userId");
    if (userId) {
      const coinsKey = `coins:${userId}`;
      const storedCoins = localStorage.getItem(coinsKey);
      if (storedCoins !== null) {
        const parsed = Number(storedCoins);
        if (!Number.isNaN(parsed)) setCoins(parsed);
      }
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
    
  const handleClickCompose = () => {
    router.push(`/cafe/${courseCode}/forum/compose`);
  };

  const handleBubbleClick = (postId) => {
    router.push(`/cafe/${courseCode}/forum/post/${postId}`);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.coinsDisplay}>
          <span className={styles.coinIcon}>🪙</span>
          <span>{coins}</span>
        </div>
      </header>

      <main className={styles.main}>
        {/* Door on the left */}
        <button className={styles.doorButton} onClick={handleExit} title="Leave Cafe">
          <Image
            src="/assets/door.png"
            alt="Door - Leave Cafe"
            width={180}
            height={300}
            className={styles.doorImage}
          />
          <div className={styles.doorText}>LEAVE CAFE</div>
        </button>

        {/* Center content area */}
        <div className={styles.centerContent}>
          {/* Top boards section */}
          <div className={styles.boardsSection}>
            <div className={styles.boardWrapper} onClick={handleNoticeBoard}>
              <Image 
                src="/assets/memeboard_new.png" 
                alt="Meme Board"
                width={300}
                height={200}
                className={styles.boardImage}
              />
            </div>
            <div className={styles.boardWrapper} onClick={handleForum}>
              <Image 
                src="/assets/forumboard_new.png" 
                alt="Forum"
                width={300}
                height={200}
                className={styles.boardImage}
              />
            </div>
          </div>

          {/* Chat bubbles section */}
          <div className={styles.chatSection}>
            {randomPosts.length > 0 ? (
              randomPosts.map((post, index) => {
                const isLeft = index % 2 === 0;
                const avatarUrl = getAvatarUrl(post.user?.avatarConfig);

                return (
                  <div 
                    key={post.id} 
                    className={`${styles.chatBubbleWrapper} ${isLeft ? styles.left : styles.right}`}
                    onClick={() => handleBubbleClick(post.id)} 
                    style={{ cursor: "pointer" }} 
                  >
                    {isLeft && (
                      <div className={styles.chatAvatarContainer}>
                        <Image 
                          src={avatarUrl} 
                          alt={`${post.user?.username}'s avatar`}
                          width={60}
                          height={60}
                          className={styles.chatAvatarImg}
                        />
                      </div>
                    )}

                    <div className={styles.chatBubble}>
                      <p className={styles.chatContent}>
                        {post.content.length > 60 
                          ? post.content.substring(0, 60) + "..." 
                          : post.content}
                      </p>
                      <span className={styles.chatAuthor}>
                        - {post.user?.username || "Student"}
                      </span>
                    </div>

                    {!isLeft && (
                      <div className={styles.chatAvatarContainer}>
                        <Image 
                          src={avatarUrl} 
                          alt={`${post.user?.username}'s avatar`}
                          width={60}
                          height={60}
                          className={styles.chatAvatarImg}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className={styles.emptyMessage}>
                (It's quiet in here... be the first to post!)
              </div>
            )}
          </div>
        </div>

        {/* Window on the right */}
        <div className={styles.windowWrapper}>
          <Image
            src="/assets/window.png"
            alt="Window"
            width={180}
            height={300}
            className={styles.windowImage}
          />
        </div>
      </main>

      {/* Notification bell in bottom left */}
      <button 
        className={styles.notificationButton}
        onClick={handleNotifications}
        title="View notifications"
      >
        <span className={styles.bellIcon}>🔔</span>
      </button>
      
      {/* User avatar with compose bubble in bottom right */}
      {currentUserAvatarSrc && (
        <div className={styles.userAvatarSection}>
          <button 
            className={styles.composeBubbleButton} 
            onClick={handleClickCompose}
            title="Compose a new post"
          >
            <div className={styles.composeBubble}>
              <span className={styles.composeText}>What are your thoughts...</span>
            </div>
          </button>
          <button
            className={styles.avatarButton}
            onClick={handleCustomiseAvatar}
            title="Customise your avatar"
          >
            <Image
              src={currentUserAvatarSrc} 
              alt="Your avatar"
              width={120} 
              height={120} 
              className={styles.userAvatarImg}
              priority
            />
            <div className={styles.youLabel}>YOU</div>
          </button>
        </div>
      )}
    </div>
  );
}