"use client";

import { useState } from "react";
import styles from "./PostBubble.module.css";

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
export default function PostBubble({ post }) {
  if (!post) {
    return null;
  }

  const { id, content, createdAt, user, likes = [], replies = [] } = post;

  const initialLikeCount =
    Array.isArray(likes) ? likes.length : Number(likes) || 0;
  const [likesCount, setLikesCount] = useState(initialLikeCount);
  const [liked, setLiked] = useState(false);

  const displayName = user?.username || user?.email || "Anonymous";

  return (
    <article className={styles.post} data-post-id={id}>
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
            onClick={() => {
              const nextLiked = !liked;
              setLiked(nextLiked);
              setLikesCount((count) =>
                Math.max(0, count + (nextLiked ? 1 : -1))
              );
            }}
            aria-pressed={liked}
            aria-label={liked ? "Unlike post" : "Like post"}
          >
            <span aria-hidden="true">♡</span> {likesCount}
          </button>
          <span className={styles.action}>
            <span aria-hidden="true">💬</span> {replies.length}
          </span>
        </footer>
      </div>
    </article>
  );
}

