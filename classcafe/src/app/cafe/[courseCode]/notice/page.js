"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import styles from "./page.module.css";

const API_BASE_URL = "https://classcafe-backend.onrender.com/api";
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dmhvmwtmm/image/upload";
const UPLOAD_PRESET = "classcafe_uploads";

export default function NoticeBoardPage() {
  const router = useRouter();
  const { courseCode } = useParams();

  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchMemes();
  }, [courseCode]);

  const fetchMemes = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/bulletin/course/${courseCode}/meme`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.message) {
            setMemes([]);
        } else {
            setMemes(data);
        }
      }
    } catch (error) {
      console.error("Error fetching notices:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "Cloudinary upload failed");
    }
    const data = await response.json();
    return data.secure_url;
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Upload to Cloudinary
      const imageUrl = await uploadToCloudinary(file);

      // 2. Send URL to Backend
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/bulletin/course/${courseCode}/meme`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        // Read the actual error message from the backend
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.statusText}`);
      }

      // 3. Refresh list
      await fetchMemes();
      alert("Image posted successfully!");

    } catch (error) {
      console.error("Upload error:", error);
      alert(`Failed to upload: ${error.message}`);
    } finally {
      setIsUploading(false);
      e.target.value = null; // Reset input
    }
  };

  const handleExit = () => {
    router.push(`/cafe/${courseCode}`);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button onClick={handleExit} className={styles.backButton}>
          Exit notice board
        </button>
      </header>

      <main className={styles.main}>
        <div className={styles.boardContainer}>
          {/* <Image
            src="/assets/notice_board.png" 
            alt="Notice board"
            fill
            priority
            className={styles.boardImage}
          /> */}

          <div className={styles.memesWrapper}>
            {loading ? (
              <div className={styles.loadingText}>Loading notices...</div>
            ) : memes.length === 0 ? (
              <div className={styles.emptyText}>No notices yet. Post one!</div>
            ) : (
              memes.map((meme) => (
                <div key={meme.id} className={styles.memeCard}>
                  <div className={styles.memeImageWrapper}>
                    <Image
                      src={meme.imageUrl}
                      alt={`Notice by ${meme.user?.username}`}
                      fill
                      className={styles.memeImage}
                      sizes="(max-width: 768px) 100vw, 300px"
                    />
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.postedBy}>
                      Posted by <strong>{meme.user?.username || "Unknown"}</strong>
                    </span>
                    <span className={styles.date}>
                        {new Date(meme.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <label className={`${styles.uploadFab} ${isUploading ? styles.disabled : ""}`}>
        <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileSelect} 
            disabled={isUploading}
            hidden 
        />
        {isUploading ? "..." : "Upload"}
      </label>
    </div>
  );
}