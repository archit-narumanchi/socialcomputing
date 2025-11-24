"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./PostBubble.module.css";

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

// Update: Accept courseCode as a prop
export default function PostBubble({ post, courseCode, currentUserId = null, isClickable = true }) {
  const router = useRouter();

  if (!post) return null;

  const { id, content, createdAt, user, likes = [], replies = [] } = post;

  const initialLikeCount = Array.isArray(likes) ? likes.length : Number(likes) || 0;
  const [likesCount, setLikesCount] = useState(initialLikeCount);
  const [liked, setLiked] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const replyCount = Array.isArray(replies) ? replies.length : Number(replies) || 0;

  const numericCurrentUserId = currentUserId !== null ? Number(currentUserId) : null;
  const postAuthorId = user?.id !== undefined && user?.id !== null ? Number(user.id) : null;
  const isOwnPost = numericCurrentUserId !== null && postAuthorId !== null && numericCurrentUserId === postAuthorId;
  const displayName = isOwnPost ? "You" : user?.username || user?.email || "Anonymous";

  const postClassName = `${styles.post} ${isOwnPost ? styles.postOwn : ""}`;

  const handlePostClick = () => {
    // Only navigate if clickable and we have the courseCode
    if (isClickable && courseCode) {
      router.push(`/cafe/${courseCode}/forum/post/${id}`);
    } else if (isClickable && !courseCode) {
      console.warn("Cannot navigate: courseCode is missing");
    }
  };

  const handleToggleLike = async (e) => {
    e.stopPropagation(); // Prevents triggering navigation
    
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You need to be logged in to like posts.");
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
      const response = await fetch(`${API_BASE_URL}/forum/posts/${id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to update like");

      const data = await response.json();
      const serverSaysLiked = data.message === "Post liked";
      const serverSaysUnliked = data.message === "Post unliked";

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
    <article 
      className={postClassName} 
      data-post-id={id} 
      onClick={handlePostClick}
      style={{ cursor: isClickable ? 'pointer' : 'default' }}
    >
      <div className={styles.avatarColumn}>
        <div className={styles.avatarCircle} aria-hidden="true" />
        <span className={styles.avatarLabel}>{displayName}</span>
      </div>

      <div className={styles.messageColumn}>
        <span className={styles.thoughtDot} aria-hidden="true" />
        <header className={styles.header}>
            <time className={styles.timestamp} dateTime={createdAt}>
              {formatTimestamp(createdAt)}
            </time>
          </header>
        <div className={styles.bubble}>
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
          <span className={styles.action}>
            <span aria-hidden="true">💬</span> {replyCount}
          </span>
        </footer>
      </div>
    </article>
  );
}