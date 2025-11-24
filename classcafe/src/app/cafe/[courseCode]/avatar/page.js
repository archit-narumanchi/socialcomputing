"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AVATAR_OPTIONS } from "../../../../utils/avatarUtils";
import styles from "./page.module.css";

const API_BASE_URL = "https://classcafe-backend.onrender.com/api";
const DEFAULT_COINS = 100;

export default function AvatarPage() {
  const router = useRouter();
  const { courseCode } = useParams();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [coins, setCoins] = useState(0);
  const [unlockedIds, setUnlockedIds] = useState([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setError("You must be logged in to customise your avatar.");
      setIsReady(true);
      return;
    }

    // 1. Load coins
    const coinsKey = `coins:${userId}`;
    let startingCoins = DEFAULT_COINS;
    const storedCoins = localStorage.getItem(coinsKey);
    if (storedCoins !== null) {
      const parsed = Number(storedCoins);
      if (!Number.isNaN(parsed)) startingCoins = parsed;
    }
    setCoins(startingCoins);

    // 2. Load unlocked accessories
    const unlockedKey = `unlockedAccessories:${userId}`;
    let initialUnlocked = ["none"];
    const rawUnlocked = localStorage.getItem(unlockedKey);
    if (rawUnlocked) {
      try {
        const arr = JSON.parse(rawUnlocked);
        if (Array.isArray(arr)) {
          initialUnlocked = Array.from(new Set([...initialUnlocked, ...arr]));
        }
      } catch {
        // ignore
      }
    }
    setUnlockedIds(initialUnlocked);

    // 3. Load current selection (Optimistic from local storage, ideally sync with backend)
    const courseAvatarKey = `avatar:${courseCode}`;
    const savedId = localStorage.getItem(courseAvatarKey);
    if (savedId) {
      const idx = AVATAR_OPTIONS.findIndex((opt) => opt.id === savedId);
      if (idx !== -1) setSelectedIndex(idx);
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

    if (coins < option.price) {
      setError("Not enough coins to buy this accessory.");
      return;
    }

    const confirmPurchase = window.confirm(
      `Buy "${option.label}" for ${option.price} coins?`
    );
    if (!confirmPurchase) return;

    const newCoins = coins - option.price;
    const newUnlocked = Array.from(new Set([...unlockedIds, option.id]));

    setCoins(newCoins);
    setUnlockedIds(newUnlocked);
    saveUserState(userId, newCoins, newUnlocked);
    setSelectedIndex(index);
    setError("");
  };

  const handleSave = async () => {
    if (!courseCode) return;
    setIsSaving(true);
    
    try {
      const selected = AVATAR_OPTIONS[selectedIndex];
      const token = localStorage.getItem("token");

      // 1. Save to local storage (for immediate local use)
      const key = `avatar:${courseCode}`;
      localStorage.setItem(key, selected.id);

      // 2. Save to Backend (so others can see it)
      // We send { id: "flower1" } as the config
      const response = await fetch(`${API_BASE_URL}/avatar/equip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          config: { id: selected.id }, 
        }),
      });

      if (!response.ok) {
        console.warn("Failed to sync avatar to server");
      }

      router.push(`/cafe/${courseCode}`);
    } catch (err) {
      console.error("Error saving avatar:", err);
      setError("Failed to save avatar. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/cafe/${courseCode}`);
  };

  if (!isReady) {
    return (
      <div className={styles.page}>
        <main className={styles.main}><div>Loading...</div></main>
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
        <section className={styles.previewSection}>
          <div className={styles.previewContainer}>
            <Image
              src={selected.avatarSrc}
              alt={`Avatar: ${selected.label}`}
              width={320}
              height={480}
              className={styles.previewImage}
              priority
            />
          </div>
        </section>

        <section className={styles.optionsSection}>
          <h2 className={styles.title}>Choose your avatar</h2>
          <div className={styles.optionsGrid}>
            {AVATAR_OPTIONS.map((opt, index) => {
              const isUnlocked = unlockedIds.includes(opt.id) || opt.price === 0;
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

          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.saveButton}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save avatar"}
            </button>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}