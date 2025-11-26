"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./PostBubble.module.css"; 
import { getAvatarUrl } from "./utils/avatarUtils";

const API_BASE_URL = "https://classcafe-backend.onrender.com/api";

const formatTimestamp = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

export default function ReplyBubble({ reply, currentUserId = null }) {
  if (!reply) return null;

  const { id, content, createdAt, user, _count, isLiked = false } = reply;
  
  const initialLikeCount = _count?.likes || 0;
  
  const [likesCount, setLikesCount] = useState(initialLikeCount);
  const [liked, setLiked] = useState(isLiked);
  const [isUpdating, setIsUpdating] = useState(false);

  const numericCurrentUserId = currentUserId !== null ? Number(currentUserId) : null;
  const replyAuthorId = user?.id ? Number(user.id) : null;
  const isOwnReply = numericCurrentUserId !== null && replyAuthorId !== null && numericCurrentUserId === replyAuthorId;

  const displayName = isOwnReply ? "You" : user?.username || "Anonymous";

  const bubbleClassName = `${styles.post} ${isOwnReply ? styles.postOwn : ""}`;
  
  const avatarUrl = getAvatarUrl(user?.avatarConfig);

  const handleToggleLike = async () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId"); 
    if (!token) {
      alert("You need to be logged in to like replies.");
      return;
    }

    if (isUpdating) return;
    setIsUpdating(true);

    const previousLiked = liked;
    const previousCount = likesCount;
    const nextLiked = !liked;
    const nextCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);

    setLiked(nextLiked);
    setLikesCount(nextCount);

    try {
      const response = await fetch(`${API_BASE_URL}/forum/replies/${id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to update like");

      const data = await response.json();

      // --- SILENT COIN SYNC ---
      if (data.newCoins !== undefined && userId) {
        localStorage.setItem(`coins:${userId}`, String(data.newCoins));
      }
      // ------------------------

      const serverSaysLiked = data.message === "Reply liked";
      const serverSaysUnliked = data.message === "Reply unliked";

      if (serverSaysLiked && !nextLiked) {
         setLiked(true);
         setLikesCount(previousCount + 1);
      } else if (serverSaysUnliked && nextLiked) {
         setLiked(false);
         setLikesCount(Math.max(0, previousCount - 1));
      }
    } catch (error) {
      console.error("Like error:", error);
      setLiked(previousLiked);
      setLikesCount(previousCount);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <article className={bubbleClassName}>
      <div className={styles.avatarColumn}>
        <div className={styles.avatarCircle} style={{ width: '50px', height: '50px' }}>
           <Image 
            src={avatarUrl} 
            alt={`${displayName}'s avatar`}
            width={50} 
            height={50} 
            style={{ objectFit: "contain", width: "100%", height: "100%" }}
          />
        </div>
        <span className={styles.avatarLabel} style={{ fontSize: '0.75rem' }}>{displayName}</span>
      </div>

      <div className={styles.messageColumn}>
        <span className={styles.thoughtDot} aria-hidden="true" />
        <header className={styles.header}>
          <time className={styles.timestamp} dateTime={createdAt}>
            {formatTimestamp(createdAt)}
          </time>
        </header>
        <div className={styles.bubble} style={{ borderRadius: '1rem', padding: '0.75rem 1rem' }}>
          <p className={styles.content}>{content}</p>
        </div>
        <footer className={styles.footer}>
          <button
            type="button"
            className={`${styles.action} ${styles.likeButton} ${liked ? styles.liked : ""}`}
            onClick={handleToggleLike}
            disabled={isUpdating}
          >
            <span aria-hidden="true">♡</span> {likesCount}
          </button>
        </footer>
      </div>
    </article>
  );
}