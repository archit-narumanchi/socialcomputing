"use client";

import { useState } from "react";
import styles from "./PostBubble.module.css";

const API_BASE_URL = "https://classcafe-backend.onrender.com/api";

/**
 * Quick utility to display relative-ish timestamps without extra deps.
 */
const formatTimestamp = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

/**
 * A compact, chat-inspired view of a forum `Post`.
 * Mirrors the Prisma Post schema (id, user, course, content, likes, replies, etc.)
 */
export default function PostBubble({ post, currentUserId = null }) {
  if (!post) {
    return null;
  }

  const { id, content, createdAt, user, likes = [], replies = [] } = post;

  const initialLikeCount =
    Array.isArray(likes) ? likes.length : Number(likes) || 0;
  
  const [likesCount, setLikesCount] = useState(initialLikeCount);
  // Note: Initial 'liked' state is false because the current fetch API 
  // doesn't return user-specific like status. It will sync on interaction.
  const [liked, setLiked] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const replyCount = Array.isArray(replies)
    ? replies.length
    : Number(replies) || 0;

  const numericCurrentUserId =
    currentUserId !== null ? Number(currentUserId) : null;
  const postAuthorId =
    user?.id !== undefined && user?.id !== null ? Number(user.id) : null;
  const isOwnPost =
    numericCurrentUserId !== null &&
    postAuthorId !== null &&
    numericCurrentUserId === postAuthorId;

  const displayName = isOwnPost
    ? "You"
    : user?.username || user?.email || "Anonymous";

  const postClassName = `${styles.post} ${isOwnPost ? styles.postOwn : ""}`;

  const handleToggleLike = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You need to be logged in to like posts.");
      return;
    }

    if (isUpdating) return;
    setIsUpdating(true);

    // 1. Optimistic Update: Update UI immediately
    const previousLiked = liked;
    const previousCount = likesCount;
    
    const nextLiked = !liked;
    // Prevent count from going below 0
    const nextCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);

    setLiked(nextLiked);
    setLikesCount(nextCount);

    try {
      // 2. API Call
      const response = await fetch(`${API_BASE_URL}/forum/posts/${id}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to update like");
      }

      // 3. Sync Check: Ensure UI matches server reality
      // The backend toggles based on existing DB state and returns a message.
      const data = await response.json();
      const serverSaysLiked = data.message === "Post liked";
      const serverSaysUnliked = data.message === "Post unliked";

      // If our optimistic guess was wrong (e.g., user refreshed and button showed "unliked" 
      // but they had actually already liked it previously), correct it now.
      if (serverSaysLiked && !nextLiked) {
         setLiked(true);
         setLikesCount(previousCount + 1);
      } else if (serverSaysUnliked && nextLiked) {
         setLiked(false);
         setLikesCount(Math.max(0, previousCount - 1));
      }

    } catch (error) {
      console.error("Like error:", error);
      // Revert optimistic update on error
      setLiked(previousLiked);
      setLikesCount(previousCount);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <article className={postClassName} data-post-id={id}>
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
            className={`${styles.action} ${styles.likeButton} ${
              liked ? styles.liked : ""
            }`}
            onClick={handleToggleLike}
            aria-pressed={liked}
            aria-label={liked ? "Unlike post" : "Like post"}
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