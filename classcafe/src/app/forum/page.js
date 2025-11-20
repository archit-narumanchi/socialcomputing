"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PostBubble from "../../PostBubble";
import styles from "./page.module.css";

const API_BASE_URL = "https://classcafe-backend.onrender.com/api";

export default function ForumPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    if (!courseId) {
      router.push("/");
      return;
    }

    setIsAuthenticated(true);
    fetchCourseInfo();
    fetchPosts();
  }, [router, courseId]);

  const fetchCourseInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/courses/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const courses = await response.json();
        const foundCourse = courses.find(
          (c) => c.id === parseInt(courseId)
        );
        if (foundCourse) {
          setCourse(foundCourse);
        } else {
          // Course not found in enrolled courses, redirect
          router.push("/");
        }
      }
    } catch (error) {
      console.error("Error fetching course info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/forum/course/${courseId}/posts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const postsData = await response.json();
        // Transform posts to match PostBubble format
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
      <Link href="/" className={styles.backButton}>
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
            <div className={styles.noPosts}>No posts yet. Be the first to post!</div>
          ) : (
            posts.map((post) => <PostBubble key={post.id} post={post} />)
          )}
        </div>
      </main>
      <Link
        href={`/forum/compose?courseId=${courseId}`}
        className={styles.composeButton}
      >
        +
      </Link>
    </div>
  );
}

