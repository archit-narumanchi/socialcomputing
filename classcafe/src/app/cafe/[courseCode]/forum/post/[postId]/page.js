"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import PostBubble from "../../../../../../PostBubble";
import ReplyBubble from "../../../../../../ReplyBubble";
import styles from "../../page.module.css";

const API_BASE_URL = "https://classcafe-backend.onrender.com/api";

export default function PostDetailPage() {
  const router = useRouter();
  const { courseCode, postId } = useParams();

  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUserId = localStorage.getItem("userId");
    
    if (!token) {
      router.push("/");
      return;
    }
    
    if (storedUserId) setCurrentUserId(Number(storedUserId));

    const fetchData = async () => {
      try {
        // 1. Fetch posts to find specific one
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

        // 2. Fetch replies
        const repliesResponse = await fetch(`${API_BASE_URL}/forum/posts/${postId}/replies`, {
           headers: { Authorization: `Bearer ${token}` },
        });

        if (repliesResponse.ok) {
          const repliesData = await repliesResponse.json();
          
          // Helper to recursively add isLiked to replies and their children
          const transformReply = (reply) => ({
            ...reply,
            // Check if likes array has entries (means current user liked it)
            isLiked: reply.likes && reply.likes.length > 0,
            // Recursively transform children if they exist
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

    fetchData();
  }, [courseCode, postId, router]);

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

  // Recursive function to render replies and their children
  const renderReplies = (replyList) => {
    return replyList.map((reply) => (
      <div key={reply.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <ReplyBubble reply={reply} currentUserId={currentUserId} />
        {/* Render nested replies if any exist */}
        {reply.children && reply.children.length > 0 && (
          <div style={{ width: '100%', paddingLeft: '2rem', boxSizing: 'border-box' }}>
            {renderReplies(reply.children)}
          </div>
        )}
      </div>
    ));
  };

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
    </div>
  );
}