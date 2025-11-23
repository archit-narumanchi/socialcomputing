"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import AuthModal from "../AuthModal";
import Image from "next/image";

const API_BASE_URL = "https://classcafe-backend.onrender.com/api";

export default function Home() {
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState({});
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    if (token) {
      fetchEnrolledCourses();
    }
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/courses/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const courses = await response.json();
        setEnrolledCourses(courses);
      }
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
    }
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    fetchEnrolledCourses();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    setIsLoggedIn(false);
    setEnrolledCourses([]);
    setSearchResults([]);
    setSearchQuery("");
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    setHasSearched(true);

    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/courses/search?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const courses = await response.json();
        setSearchResults(courses);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching courses:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleEnroll = async (courseId) => {
    setIsEnrolling((prev) => ({ ...prev, [courseId]: true }));
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchEnrolledCourses();
        setSearchResults((prev) =>
          prev.filter((course) => course.id !== courseId)
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "Failed to enroll in course");
      }
    } catch (error) {
      console.error("Error enrolling in course:", error);
      alert("Failed to enroll in course");
    } finally {
      setIsEnrolling((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  const handleCourseClick = (course) => {
    // courseId == courseCode (string)
    router.push(`/cafe/${course.courseCode}`);
  };

  const handleStartClick = () => {
    // landing page → just open auth
    setIsAuthModalOpen(true);
  };

  if (!isLoggedIn) {
    return (
      <div className={styles.page}>
        <div className={styles.startContainer}>
          <Image
            src="/assets/logo_new.png"
            alt="ClassCafe logo"
            width={640}
            height={360}
            className={styles.imageSizing}
          />
          <button
            type="button"
            className={styles.startButton}
            onClick={handleStartClick}
          >
            Start using ClassCafe
          </button>
        </div>
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  const isEnrolled = (courseId) =>
    enrolledCourses.some((course) => course.id === courseId);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </div>

        <form onSubmit={handleSearch} className={styles.searchContainer}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for courses..."
            className={styles.searchInput}
          />
          <button
            type="submit"
            className={styles.searchButton}
            disabled={isSearching}
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className={styles.searchResults}>
            <h2 className={styles.sectionTitle}>Search Results</h2>
            <div className={styles.courseList}>
              {searchResults.map((course) => (
                <div key={course.id} className={styles.courseItem}>
                  <div className={styles.courseInfo}>
                    <h3 className={styles.courseTitle}>{course.title}</h3>
                    <p className={styles.courseCode}>{course.courseCode}</p>
                  </div>
                  {isEnrolled(course.id) ? (
                    <span className={styles.enrolledBadge}>Enrolled</span>
                  ) : (
                    <button
                      onClick={() => handleEnroll(course.id)}
                      className={styles.enrollButton}
                      disabled={isEnrolling[course.id]}
                    >
                      {isEnrolling[course.id] ? "Enrolling..." : "Enroll"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {hasSearched && !isSearching && searchResults.length === 0 && (
          <p className={styles.noResults}>
            Course not found :( <br /> Maybe try another?
          </p>
        )}

        <div className={styles.enrolledCourses}>
          <h2 className={styles.sectionTitle}>My Courses</h2>
          {enrolledCourses.length === 0 ? (
            <p className={styles.noCourses}>
              You haven't enrolled in any courses yet. Search above to find
              courses!
            </p>
          ) : (
            <div className={styles.courseGrid}>
              {enrolledCourses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => handleCourseClick(course)}
                  className={styles.courseButton}
                >
                  <div className={styles.courseButtonContent}>
                    <Image
                      src="/assets/cafe_default.png"
                      alt="Course cafe"
                      width={160}
                      height={90}
                      className={styles.courseImage}
                    />
                    <h3 className={styles.courseButtonTitle}>
                      {course.title}
                    </h3>
                    <p className={styles.courseButtonCode}>
                      {course.courseCode}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
