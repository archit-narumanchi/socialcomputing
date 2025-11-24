"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "./page.module.css";

const API_BASE_URL = "https://classcafe-backend.onrender.com/api";

export default function NotificationsPage() {
  const router = useRouter();
  const { courseCode } = useParams();

  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [marking, setMarking] = useState({}); // id -> bool

//   const demoNotifications = [
//   {
//     id: 1,
//     title: "New comment on your post",
//     content: "Someone replied to your discussion in CS101 Forum.",
//     createdAt: "2025-02-10T12:15:00Z",
//     isRead: false,
//     link: "/cafe/CS101/forum/123"
//   },
//   {
//     id: 2,
//     title: "You are selected for Meme of the Week!",
//     content: "Congrats! You are this week's top contributor. Please submit your meme.",
//     createdAt: "2025-02-09T08:30:00Z",
//     isRead: false,
//     link: "/cafe/CS101/notice-board"
//   },
//   {
//     id: 3,
//     title: "Post liked",
//     content: "Your post in CS485 gained 10 likes!",
//     createdAt: "2025-02-08T17:45:00Z",
//     isRead: true,
//     link: "/cafe/CS485/forum/555"
//   }
// ];


  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        // Adjust this endpoint to whatever backend exposes
        const res = await fetch(
          `${API_BASE_URL}/notifications?courseCode=${encodeURIComponent(
            courseCode
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          console.error("Failed to fetch notifications");
          setNotifications([]);
          return;
        }

        const data = await res.json();
        setNotifications(data);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [router, courseCode]);

    // useEffect(() => {
    // const token = localStorage.getItem("token");
    // if (!token) {
    //     router.push("/");
    //     return;
    // }

    // async function load() {
    //     try {
    //     const res = await fetch(`${API_BASE_URL}/notifications`, {
    //         headers: { Authorization: `Bearer ${token}` }
    //     });

    //     if (res.ok) {
    //         const data = await res.json();
    //         if (data.length > 0) {
    //         setNotifications(data);
    //         return;
    //         }
    //     }

    //     // Fallback demo data
    //     console.log("Using demo notifications");
    //     setNotifications(demoNotifications);

    //     } catch (err) {
    //     console.error("Failed to load notifications:", err);
    //     setNotifications(demoNotifications); // fallback for errors
    //     } finally {
    //     setIsLoading(false);
    //     }
    // }

    // load();
    // }, []);


  const handleExit = () => {
    router.push(`/cafe/${courseCode}`);
  };

  const handleOpenNotification = (notif) => {
    // Mark as read first (fire-and-forget)
    handleMarkAsRead(notif.id, false);

    // Route depending on type
    if (notif.type === "comment" && notif.postId) {
      // open forum in this course, ideally scroll to post later
      router.push(`/cafe/${courseCode}/forum?postId=${notif.postId}`);
    } else if (notif.type === "meme_invite") {
      router.push(`/cafe/${courseCode}/notice`);
    } else {
      // fallback: just go to course cafe
      router.push(`/cafe/${courseCode}`);
    }
  };

  const handleMarkAsRead = async (id, optimistic = true) => {
    if (optimistic) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    }

    setMarking((prev) => ({ ...prev, [id]: true }));

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Adjust endpoint: suggestion: PATCH /notifications/:id/read
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isRead: true }),
      });
    } catch (err) {
      console.error("Error marking notification read:", err);
      // optional: rollback optimistic change
    } finally {
      setMarking((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length === 0) return;

    // optimistic
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Suggested endpoint: PATCH /notifications/read-all
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error("Error marking all as read:", err);
      // If you care, refetch here.
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button onClick={handleExit} className={styles.exitButton}>
            Exit notifications
          </button>
        </header>
        <main className={styles.main}>Loading notifications…</main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button onClick={handleExit} className={styles.exitButton}>
          Exit notifications
        </button>
        <button
          onClick={handleMarkAllAsRead}
          className={styles.markAllButton}
          disabled={notifications.every((n) => n.isRead)}
        >
          Mark all as read
        </button>
      </header>

      <main className={styles.main}>
        {notifications.length === 0 ? (
          <p>No notifications yet.</p>
        ) : (
          <ul className={styles.list}>
            {notifications.map((notif) => (
              <li
                key={notif.id}
                className={`${styles.item} ${
                  notif.isRead ? styles.read : styles.unread
                }`}
              >
                <button
                  className={styles.itemContent}
                  onClick={() => handleOpenNotification(notif)}
                >
                  <div className={styles.itemTitle}>{notif.title}</div>
                  <div className={styles.itemBody}>{notif.body}</div>
                  <div className={styles.itemMeta}>
                    {notif.courseCode && (
                      <span>[{notif.courseCode}]</span>
                    )}
                    <span>
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>
                </button>

                {!notif.isRead && (
                  <button
                    className={styles.markButton}
                    onClick={() => handleMarkAsRead(notif.id)}
                    disabled={marking[notif.id]}
                  >
                    Mark read
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
