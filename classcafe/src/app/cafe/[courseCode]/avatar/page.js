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
    price: 0,
  },
  {
    id: "flower1",
    label: "Flower 1",
    accessorySrc: "/assets/accessory_flower1.png",
    avatarSrc: "/assets/nupjukif_flower1.png",
    price: 20,
  },
  {
    id: "flower2",
    label: "Flower 2",
    accessorySrc: "/assets/accessory_flower2.png",
    avatarSrc: "/assets/nupjukif_flower2.png",
    price: 20,
  },
  {
    id: "party1",
    label: "Party 1",
    accessorySrc: "/assets/accessory_party1.png",
    avatarSrc: "/assets/nupjukif_party1.png",
    price: 30,
  },
  {
    id: "party2",
    label: "Party 2",
    accessorySrc: "/assets/accessory_party2.png",
    avatarSrc: "/assets/nupjukif_party2.png",
    price: 30,
  },
  {
    id: "ribbon",
    label: "Ribbon",
    accessorySrc: "/assets/accessory_ribbon.png",
    avatarSrc: "/assets/nupjukif_ribbon.png",
    price: 25,
  },
];

const DEFAULT_COINS = 100;

export default function AvatarPage() {
  const router = useRouter();
  const { courseCode } = useParams(); // /cafe/[courseCode]/avatar

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const [coins, setCoins] = useState(0);
  const [unlockedIds, setUnlockedIds] = useState([]); // global per user
  const [error, setError] = useState("");

  // Load user-based currency + unlocked accessories and course-based avatar
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setError("You must be logged in to customise your avatar.");
      setIsReady(true);
      return;
    }

    // 1) global currency for this user
    const coinsKey = `coins:${userId}`;
    const unlockedKey = `unlockedAccessories:${userId}`;

    let startingCoins = DEFAULT_COINS;
    const storedCoins = localStorage.getItem(coinsKey);
    if (storedCoins !== null) {
      const parsed = Number(storedCoins);
      if (!Number.isNaN(parsed)) startingCoins = parsed;
    }
    localStorage.setItem(coinsKey, String(startingCoins));
    setCoins(startingCoins);

    // 2) global unlocked accessories for this user
    let initialUnlocked = ["none"]; // base avatar is always unlocked
    const rawUnlocked = localStorage.getItem(unlockedKey);
    if (rawUnlocked) {
      try {
        const arr = JSON.parse(rawUnlocked);
        if (Array.isArray(arr)) {
          initialUnlocked = Array.from(new Set([...initialUnlocked, ...arr]));
        }
      } catch {
        // ignore parse errors; keep default
      }
    }
    setUnlockedIds(initialUnlocked);

    // 3) per-course selected avatar
    if (courseCode) {
      const courseAvatarKey = `avatar:${courseCode}`;
      const savedId = localStorage.getItem(courseAvatarKey);
      if (savedId) {
        const idx = AVATAR_OPTIONS.findIndex((opt) => opt.id === savedId);
        if (idx !== -1) {
          setSelectedIndex(idx);
        }
      }
    }

    setIsReady(true);
  }, [courseCode]);

  const saveUserState = (userId, newCoins, newUnlockedIds) => {
    const coinsKey = `coins:${userId}`;
    const unlockedKey = `unlockedAccessories:${userId}`;
    localStorage.setItem(coinsKey, String(newCoins));
    localStorage.setItem(unlockedKey, JSON.stringify(newUnlockedIds));
  };

  const handleSelectOrBuy = (index) => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    const option = AVATAR_OPTIONS[index];
    const isUnlocked = unlockedIds.includes(option.id) || option.price === 0;

    if (isUnlocked) {
      setSelectedIndex(index);
      return;
    }

    // locked: try to buy
    if (coins < option.price) {
      setError("Not enough coins to buy this accessory.");
      return;
    }

    const confirmPurchase = window.confirm(
      `Buy "${option.label}" for ${option.price} coins?`
    );
    if (!confirmPurchase) return;

    const newCoins = coins - option.price;
    const newUnlocked = Array.from(
      new Set([...unlockedIds, option.id])
    );

    setCoins(newCoins);
    setUnlockedIds(newUnlocked);
    saveUserState(userId, newCoins, newUnlocked);
    setSelectedIndex(index);
    setError("");
  };

  const handleSave = () => {
    if (!courseCode) return;
    const selected = AVATAR_OPTIONS[selectedIndex];
    const key = `avatar:${courseCode}`;
    localStorage.setItem(key, selected.id);
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
        <div className={styles.coinsDisplay}>
          <span className={styles.coinIcon}>🪙</span>
          <span>{coins}</span>
        </div>
      </header>

      <main className={styles.main}>
        {/* Big avatar preview */}
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

        {/* 3x2 accessory grid */}
        <section className={styles.optionsSection}>
          <h2 className={styles.title}>Choose your avatar</h2>
          <div className={styles.optionsGrid}>
            {AVATAR_OPTIONS.map((opt, index) => {
              const isUnlocked =
                unlockedIds.includes(opt.id) || opt.price === 0;

              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`${styles.optionSquare} ${
                    index === selectedIndex ? styles.optionSelected : ""
                  } ${!isUnlocked ? styles.optionLocked : ""}`}
                  onClick={() => handleSelectOrBuy(index)}
                >
                  <Image
                    src={opt.accessorySrc}
                    alt={opt.label}
                    width={96}
                    height={96}
                    className={styles.optionImage}
                  />
                  {!isUnlocked && (
                    <div className={styles.optionPrice}>
                      <span className={styles.coinIconSmall}>🪙</span>
                      <span>{opt.price}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {error && (
            <div className={styles.errorMessage}>{error}</div>
          )}

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
