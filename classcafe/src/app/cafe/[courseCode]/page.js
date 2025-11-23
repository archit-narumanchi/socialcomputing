"use client";

import { useRouter, useParams } from "next/navigation";
import styles from "./page.module.css";

export default function CourseCafe() {
  const router = useRouter();
  const { courseCode } = useParams();

  const handleExit = () => {
    router.push("/"); 
  };

  const handleCustomiseAvatar = () => {
    router.push(`/cafe/${courseCode}/avatar`);
  };

  const handleNotifications = () => {
    console.log("Notifications for course:", courseCode);
  };

  const handleNoticeBoard = () => {
    router.push(`/cafe/${courseCode}/notice`);
  };

  const handleForum = () => {
    router.push(`/cafe/${courseCode}/forum`);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.exitButton} onClick={handleExit}>
          Leave Cafe
        </button>
      </header>

      <main className={styles.main}>
        <div className={styles.buttonGroup}>
          <button
            className={styles.cafeButton}
            onClick={handleCustomiseAvatar}
          >
            Customise Avatar
          </button>
          <button className={styles.cafeButton} onClick={handleNotifications}>
            Notifications
          </button>
          <button className={styles.cafeButton} onClick={handleNoticeBoard}>
            Notice Board
          </button>
          <button className={styles.cafeButton} onClick={handleForum}>
            Forum
          </button>
        </div>
      </main>
    </div>
  );
}
