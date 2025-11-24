"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import PostBubble from "../../../../PostBubble";
import styles from "./page.module.css";

const API_BASE_URL = "https://classcafe-backend.onrender.com/api";

const decodeTokenPayload = (token) => {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    return JSON.parse(atob(payload));
  } catch (error) {
    console.warn("Failed to decode token payload", error);
    return null;
  }
};

export default function ForumPage() {
  const router = useRouter();
  const { courseCode } = useParams();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !courseCode) {
      router.push("/");
      return;
    }

    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setCurrentUserId(Number(storedUserId));
    } else {
      const payload = decodeTokenPayload(token);
      if (payload?.userId) {
        setCurrentUserId(payload.userId);
        localStorage.setItem("userId", String(payload.userId));
      }
    }

    setIsAuthenticated(true);
    setIsLoading(true);
    fetchCourseInfo(token);
    fetchPosts(token);
  }, [router, courseCode]);

  const fetchCourseInfo = async (tokenFromEffect) => {
    try {
      const token = tokenFromEffect || localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/courses/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const courses = await response.json();

        // Match either by id or courseCode, depending on backend shape
        const foundCourse = courses.find(
          (c) => c.id === courseCode || c.courseCode === courseCode
        );

        if (foundCourse) {
          setCourse(foundCourse);
        } else {
          router.push("/");
        }
      }
    } catch (error) {
      console.error("Error fetching course info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPosts = async (tokenFromEffect) => {
    setIsLoadingPosts(true);
    try {
      const token = tokenFromEffect || localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/forum/course/${courseCode}/posts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const postsData = await response.json();
        const transformedPosts = postsData.map((post) => ({
          id: post.id,
          content: post.content,
          createdAt: post.createdAt,
          user: post.user,
          likes: post._count?.likes || 0,
          replies: post._count?.replies || 0,
        }));
        setPosts(transformedPosts);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div>Loading...</div>
        </main>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className={styles.page}>
      <Link href={`/cafe/${courseCode}`} className={styles.backButton}>
        Go Back
      </Link>
      <main className={styles.main}>
        <div className={styles.courseHeader}>
          <h1 className={styles.courseTitle}>{course.title}</h1>
          <p className={styles.courseCode}>{course.courseCode}</p>
        </div>
        <div className={styles.feed}>
          {isLoadingPosts ? (
            <div>Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className={styles.noPosts}>
              No posts yet. Be the first to post!
            </div>
          ) : (
            posts.map((post) => (
              <PostBubble
                key={post.id}
                post={post}
                courseCode={courseCode}
                currentUserId={currentUserId}
              />
            ))
          )}
        </div>
      </main>
      <Link
        href={`/cafe/${courseCode}/forum/compose`}
        className={styles.composeButton}
      >
        +
      </Link>
    </div>
  );
}
