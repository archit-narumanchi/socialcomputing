// fileName: src/app/cafe/[courseCode]/avatar/page.js

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
// --- UPDATED IMPORTS ---
import { AVATAR_OPTIONS } from "../../../../utils/avatarUtils";
import { CAFE_OPTIONS, DEFAULT_CAFE_ID, getCafeSrcById } from "../../../../utils/cafeUtils"; // NEW: Only importing CafeUtils
import styles from "./page.module.css";

const API_BASE_URL = "https://classcafe-backend.onrender.com/api";
const DEFAULT_COINS = 2;


// --- UTILITY FUNCTIONS FOR PREVIEW ---
const getAccessoryOnlySrc = (id) => {
    // This helper should be imported from avatarUtils if needed, 
    // but for self-containment, it can remain here.
    const option = AVATAR_OPTIONS.find(opt => opt.id === id);
    // Assuming accessory images use a specific naming convention
    // Since accessorySrc is available in AVATAR_OPTIONS:
    return option ? option.accessorySrc : "/assets/accessory_none.png";
}
// ---------------------------------------


export default function AvatarPage() {
  const router = useRouter();
  const { courseCode } = useParams();

  // Customization State
  const [selectedIndex, setSelectedIndex] = useState(0); // Avatar Index
  const [selectedCafeId, setSelectedCafeId] = useState(DEFAULT_CAFE_ID); // CAFE ID
  
  // UI State
  const [activeTab, setActiveTab] = useState("avatar"); // "avatar" or "cafe"
  
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

    // 2. Load unlocked accessories/items (Ensure defaults are unlocked)
    const unlockedKey = `unlockedAccessories:${userId}`;
    // Ensure avatar default ("none") and cafe default are in the list
    let initialUnlocked = ["none", DEFAULT_CAFE_ID]; 
    const rawUnlocked = localStorage.getItem(unlockedKey);
    if (rawUnlocked) {
      try {
        const arr = JSON.parse(rawUnlocked);
        if (Array.isArray(arr)) {
          initialUnlocked = Array.from(new Set([...initialUnlocked, ...arr]));
        }
      } catch { /* ignore */ }
    }
    setUnlockedIds(initialUnlocked);

    // 3. Load current avatar selection
    const courseAvatarKey = `avatar:${courseCode}`;
    const savedId = localStorage.getItem(courseAvatarKey);
    if (savedId) {
      const idx = AVATAR_OPTIONS.findIndex((opt) => opt.id === savedId);
      if (idx !== -1) setSelectedIndex(idx);
    }
    
    // 4. Load current cafe selection
    const courseCafeKey = `cafe:${courseCode}`;
    const savedCafeId = localStorage.getItem(courseCafeKey);
    if (savedCafeId && CAFE_OPTIONS.find(opt => opt.id === savedCafeId)) {
        setSelectedCafeId(savedCafeId);
    }


    setIsReady(true);
  }, [courseCode]);

  const saveUserState = (userId, newCoins, newUnlockedIds) => {
    const coinsKey = `coins:${userId}`;
    const unlockedKey = `unlockedAccessories:${userId}`;
    localStorage.setItem(coinsKey, String(newCoins));
    localStorage.setItem(unlockedKey, JSON.stringify(newUnlockedIds));
  };

  const handleSelectOrBuy = (option, index = null) => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    const isUnlocked = unlockedIds.includes(option.id) || option.price === 0;

    if (isUnlocked) {
      // Select the item
      if (activeTab === "avatar") {
          setSelectedIndex(index);
      } else if (activeTab === "cafe") { 
          // 💡 CRITICAL: Update the selected ID immediately to see the change in the preview
          setSelectedCafeId(option.id); 
      }
      return;
    }

    if (coins < option.price) {
      setError("Not enough coins to buy this item.");
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
    
    // Select the new item after purchase
    if (activeTab === "avatar") {
        setSelectedIndex(index);
    } else if (activeTab === "cafe") { 
        // 💡 CRITICAL: Update the selected ID immediately to see the change in the preview
        setSelectedCafeId(option.id);
    }
    setError("");
  };

  const handleSave = async () => {
    if (!courseCode) return;
    setIsSaving(true);
    
    try {
      const selectedAvatar = AVATAR_OPTIONS[selectedIndex];
      // Find the currently selected cafe object for saving
      const selectedCafe = CAFE_OPTIONS.find(opt => opt.id === selectedCafeId) || CAFE_OPTIONS[0]; 
      const token = localStorage.getItem("token");

      // 1. Save to local storage
      localStorage.setItem(`avatar:${courseCode}`, selectedAvatar.id);
      localStorage.setItem(`cafe:${courseCode}`, selectedCafe.id); // Save the cafe ID

      // 2. Save to Backend (send all configurations)
      const response = await fetch(`${API_BASE_URL}/avatar/equip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          config: { 
              avatarId: selectedAvatar.id, 
              cafeId: selectedCafe.id // Send the cafe ID
          }, 
        }),
      });

      if (!response.ok) {
        console.warn("Failed to sync configuration to server");
      }

      router.push(`/cafe/${courseCode}`);
    } catch (err) {
      console.error("Error saving configuration:", err);
      setError("Failed to save configuration. Please try again.");
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

  const selectedAvatar = AVATAR_OPTIONS[selectedIndex];
  // 💡 CRITICAL: Use the helper to get the asset path for the selected cafe ID
  const selectedCafeSrc = getCafeSrcById(selectedCafeId); 
  
  let optionsToShow;
  if (activeTab === "avatar") {
    optionsToShow = AVATAR_OPTIONS;
  } else { // activeTab === "cafe"
    optionsToShow = CAFE_OPTIONS; 
  }
  
  // Logic to determine which image to display in the grid squares
  const getGridImageSrc = (opt) => {
      if (activeTab === "avatar") {
          return getAccessoryOnlySrc(opt.id);
      }
      // Cafe options use their main assetSrc for the grid image
      return opt.assetSrc;
  };
  
  // Logic for the main preview image
  const getPreviewImageSrc = () => {
      if (activeTab === "avatar") {
          return selectedAvatar.avatarSrc;
      }
      // If activeTab is "cafe", show the full background
      return selectedCafeSrc;
  }
  
  const getPreviewAltText = () => {
      if (activeTab === "avatar") {
          return `Avatar: ${selectedAvatar.label}`;
      }
      return `Cafe Background: ${selectedCafeId}`;
  }


  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href={`/cafe/${courseCode}`} className={styles.backButton}>
          Exit customisation
        </Link>
        <div className={styles.coinsDisplay}>
          <span className={styles.coinIcon}>🪙</span>
          <span>{coins}</span>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.previewSection}>
          <div className={styles.previewContainer}>
            {/* Consolidated PREVIEW LOGIC: Show Avatar or Cafe Background */}
            <Image
                src={getPreviewImageSrc()} // 💡 CRITICAL: Call the function to get the current state
                alt={getPreviewAltText()}
                width={320}
                height={480}
                className={styles.previewImage} 
                priority
            />
          </div>
        </section>

        <section className={styles.optionsSection}>
          {/* TAB SELECTOR (Now 2 tabs: Avatar and Cafe) */}
          <div className={styles.tabSelector}>
              <button
                  className={`${styles.tabButton} ${activeTab === "avatar" ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab("avatar")}
              >
                  Avatar 🎭
              </button>
              <button
                  className={`${styles.tabButton} ${activeTab === "cafe" ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab("cafe")}
              >
                  Cafe ☕
              </button>
          </div>
          
          <h2 className={styles.title}>Choose your {activeTab}</h2>
          <div className={styles.optionsGrid}>
            {optionsToShow.map((opt, index) => {
              const isUnlocked = unlockedIds.includes(opt.id) || opt.price === 0;
             
              // Determine if this item is currently selected
              const isSelected = activeTab === "avatar" 
                  ? index === selectedIndex 
                  : opt.id === selectedCafeId; 

              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`${styles.optionSquare} ${
                    isSelected ? styles.optionSelected : ""
                  } ${!isUnlocked ? styles.optionLocked : ""}`}
                  onClick={() => handleSelectOrBuy(opt, index)} 
                >
                  <Image
                    src={getGridImageSrc(opt)} 
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
              {isSaving ? "Saving..." : "Save Configuration"}
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