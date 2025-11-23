"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

const AVATAR_OPTIONS = [
  {
    id: "none",
    label: "No accessory",
    accessorySrc: "/assets/accessory_none.png",
    avatarSrc: "/assets/nupjukif.png",
  },
  {
    id: "flower1",
    label: "Flower 1",
    accessorySrc: "/assets/accessory_flower1.png",
    avatarSrc: "/assets/nupjukif_flower1.png",
  },
  {
    id: "flower2",
    label: "Flower 2",
    accessorySrc: "/assets/accessory_flower2.png",
    avatarSrc: "/assets/nupjukif_flower2.png",
  },
  {
    id: "party1",
    label: "Party 1",
    accessorySrc: "/assets/accessory_party1.png",
    avatarSrc: "/assets/nupjukif_party1.png",
  },
  {
    id: "party2",
    label: "Party 2",
    accessorySrc: "/assets/accessory_party2.png",
    avatarSrc: "/assets/nupjukif_party2.png",
  },
  {
    id: "ribbon",
    label: "Ribbon",
    accessorySrc: "/assets/accessory_ribbon.png",
    avatarSrc: "/assets/nupjukif_ribbon.png",
  },
];

export default function AvatarPage() {
  const router = useRouter();
  const { courseCode } = useParams(); // /cafe/[courseCode]/avatar

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Load saved avatar for this course from localStorage
  useEffect(() => {
    if (!courseCode) return;

    const key = `avatar:${courseCode}`;
    const savedId = localStorage.getItem(key);

    if (savedId) {
      const idx = AVATAR_OPTIONS.findIndex((opt) => opt.id === savedId);
      if (idx !== -1) {
        setSelectedIndex(idx);
      }
    }

    setIsReady(true);
  }, [courseCode]);

  const handleSave = () => {
    if (!courseCode) return;

    const key = `avatar:${courseCode}`;
    const selected = AVATAR_OPTIONS[selectedIndex];
    localStorage.setItem(key, selected.id);

    // back to cafe page
    router.push(`/cafe/${courseCode}`);
  };

  const handleCancel = () => {
    router.push(`/cafe/${courseCode}`);
  };

  if (!isReady) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div>Loading avatar settings...</div>
        </main>
      </div>
    );
  }

  const selected = AVATAR_OPTIONS[selectedIndex];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href={`/cafe/${courseCode}`} className={styles.backButton}>
          Exit avatar customisation
        </Link>
      </header>

      <main className={styles.main}>
        {/* Big avatar on the left-ish */}
        <section className={styles.previewSection}>
          <div className={styles.previewContainer}>
            <Image
              src={selected.avatarSrc}
              alt={`Avatar: ${selected.label}`}
              width={320}
              height={480}
              className={styles.previewImage}
            />
          </div>
        </section>

        {/* 3x2 grid on the right */}
        <section className={styles.optionsSection}>
          <h2 className={styles.title}>Choose your avatar</h2>
          <div className={styles.optionsGrid}>
            {AVATAR_OPTIONS.map((opt, index) => (
              <button
                key={opt.id}
                type="button"
                className={`${styles.optionSquare} ${
                  index === selectedIndex ? styles.optionSelected : ""
                }`}
                onClick={() => setSelectedIndex(index)}
              >
                <Image
                  src={opt.accessorySrc}
                  alt={opt.label}
                  width={96}
                  height={96}
                  className={styles.optionImage}
                />
              </button>
            ))}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.saveButton}
              onClick={handleSave}
            >
              Save avatar
            </button>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
