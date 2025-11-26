"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import PostBubble from "../../../../../../PostBubble";
import ReplyBubble from "../../../../../../ReplyBubble";
import ThoughtTextarea from "../../../../../../ThoughtTextarea";
import styles from "./page.module.css";

const API_BASE_URL = "https://classcafe-backend.onrender.com/api";

export default function PostDetailPage() {
  const router = useRouter();
  const { courseCode, postId } = useParams();

  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isPostingReply, setIsPostingReply] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUserId = localStorage.getItem("userId");
    
    if (!token) {
      router.push("/");
      return;
    }
    
    if (storedUserId) setCurrentUserId(Number(storedUserId));

    fetchData();
  }, [courseCode, postId, router]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const postsResponse = await fetch(`${API_BASE_URL}/forum/course/${courseCode}/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (postsResponse.ok) {
        const allPosts = await postsResponse.json();
        const foundPost = allPosts.find(p => p.id === Number(postId));
        
        if (foundPost) {
          setPost({
            ...foundPost,
            isLiked: foundPost.likes && foundPost.likes.length > 0,
            likes: foundPost._count?.likes || 0,
            replies: foundPost._count?.replies || 0,
          });
        }
      }

      const repliesResponse = await fetch(`${API_BASE_URL}/forum/posts/${postId}/replies`, {
         headers: { Authorization: `Bearer ${token}` },
      });

      if (repliesResponse.ok) {
        const repliesData = await repliesResponse.json();
        
        const transformReply = (reply) => ({
          ...reply,
          isLiked: reply.likes && reply.likes.length > 0,
          children: reply.children ? reply.children.map(transformReply) : []
        });

        setReplies(repliesData.map(transformReply));
      }

    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostReply = async () => {
    if (!replyContent.trim()) return;

    setIsPostingReply(true);
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      const response = await fetch(`${API_BASE_URL}/forum/posts/${postId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: replyContent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to post reply");
      }

      const data = await response.json();

      // --- UPDATE COINS SILENTLY ---
      if (data.newCoins !== undefined && data.newCoins !== null && userId) {
        localStorage.setItem(`coins:${userId}`, String(data.newCoins));
        // Alert removed as requested
      }
      // -----------------------------

      setReplyContent("");
      setIsReplying(false);
      
      await fetchData();

    } catch (error) {
      console.error("Error posting reply:", error);
      alert("Failed to post reply. Please try again.");
    } finally {
      setIsPostingReply(false);
    }
  };

  const renderReplies = (replyList) => {
    return replyList.map((reply) => (
      <div key={reply.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <ReplyBubble reply={reply} currentUserId={currentUserId} />
        {reply.children && reply.children.length > 0 && (
          <div style={{ width: '100%', paddingLeft: '2rem', boxSizing: 'border-box' }}>
            {renderReplies(reply.children)}
          </div>
        )}
      </div>
    ));
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>Loading discussion...</main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className={styles.page}>
         <main className={styles.main}>Post not found.</main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link href={`/cafe/${courseCode}/forum`} className={styles.backButton}>
        Back to Forum
      </Link>
      
      <main className={styles.main}>
        <div className={styles.feed}>
          <div style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '2rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <PostBubble 
              post={post} 
              courseCode={courseCode}
              currentUserId={currentUserId} 
              isClickable={false} 
            />
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
            {replies.length === 0 ? (
              <div className={styles.noPosts} style={{ padding: '20px' }}>No replies yet.</div>
            ) : (
              renderReplies(replies)
            )}
          </div>
        </div>
      </main>

      {!isReplying && (
        <button 
          className={styles.replyFab}
          onClick={() => setIsReplying(true)}
        >
          Reply
        </button>
      )}

      {isReplying && (
        <div className={styles.overlay} onClick={() => setIsReplying(false)}>
          <div className={styles.composerCard} onClick={e => e.stopPropagation()}>
            <h3>Reply to Post</h3>
            <ThoughtTextarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              rows={5}
              disabled={isPostingReply}
              autoFocus
            />
            <div className={styles.actions}>
              <button 
                className={`${styles.actionBtn} ${styles.cancelBtn}`}
                onClick={() => setIsReplying(false)}
                disabled={isPostingReply}
              >
                Cancel
              </button>
              <button 
                className={`${styles.actionBtn} ${styles.postBtn}`}
                onClick={handlePostReply}
                disabled={!replyContent.trim() || isPostingReply}
              >
                {isPostingReply ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}