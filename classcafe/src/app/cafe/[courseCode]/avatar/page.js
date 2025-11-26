"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AVATAR_OPTIONS } from "../../../../utils/avatarUtils";
import { CAFE_OPTIONS, DEFAULT_CAFE_ID, getCafeSrcById } from "../../../../utils/cafeUtils";
import styles from "./page.module.css";

const API_BASE_URL = "https://classcafe-backend.onrender.com/api";
const DEFAULT_COINS = 2;

// --- UTILITY FUNCTIONS FOR PREVIEW ---
const getAccessoryOnlySrc = (id) => {
    const option = AVATAR_OPTIONS.find(opt => opt.id === id);
    return option ? option.accessorySrc : "/assets/accessory_none.png";
}

export default function AvatarPage() {
  const router = useRouter();
  const { courseCode } = useParams();

  // Customization State
  const [selectedIndex, setSelectedIndex] = useState(0); 
  const [selectedCafeId, setSelectedCafeId] = useState(DEFAULT_CAFE_ID); 
  
  const [activeTab, setActiveTab] = useState("avatar"); 
  
  const [isReady, setIsReady] = useState(false);
  const [coins, setCoins] = useState(0);
  const [unlockedIds, setUnlockedIds] = useState([]); 
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (!userId || !token) {
      setError("You must be logged in to customise your avatar.");
      setIsReady(true);
      return;
    }

    // --- NEW: Fetch latest profile (coins/items) from server ---
    const fetchUserProfile = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/avatar/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const userData = await res.json();
                
                // Update coins state
                setCoins(userData.coins);
                // Sync local storage just in case
                localStorage.setItem(`coins:${userId}`, String(userData.coins));

                // You can also sync items here if you return them from /me
                // For now, we'll stick to loading unlocked items from localstorage/logic below
            }
        } catch (err) {
            console.error("Failed to fetch user profile", err);
        }
    };
    
    fetchUserProfile(); // Call the fetch
    // -----------------------------------------------------------

    // 2. Load unlocked accessories/items (Ensure defaults are unlocked)
    const unlockedKey = `unlockedAccessories:${userId}`;
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
      if (activeTab === "avatar") {
          setSelectedIndex(index);
      } else if (activeTab === "cafe") { 
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
    
    // Sync new coin balance to server via the existing buy logic or relying on next fetch
    // Ideally we call the /buy endpoint here, but for this MVP snippet 
    // we are relying on local logic + sync.
    // NOTE: To make this fully robust, this function should call the backend /buy endpoint too.
    
    if (activeTab === "avatar") {
        setSelectedIndex(index);
    } else if (activeTab === "cafe") { 
        setSelectedCafeId(option.id);
    }
    setError("");
  };

  const handleSave = async () => {
    if (!courseCode) return;
    setIsSaving(true);
    
    try {
      const selectedAvatar = AVATAR_OPTIONS[selectedIndex];
      const selectedCafe = CAFE_OPTIONS.find(opt => opt.id === selectedCafeId) || CAFE_OPTIONS[0]; 
      const token = localStorage.getItem("token");

      localStorage.setItem(`avatar:${courseCode}`, selectedAvatar.id);
      localStorage.setItem(`cafe:${courseCode}`, selectedCafe.id); 

      const response = await fetch(`${API_BASE_URL}/avatar/equip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          config: { 
              avatarId: selectedAvatar.id, 
              cafeId: selectedCafe.id 
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
  const selectedCafeSrc = getCafeSrcById(selectedCafeId); 
  
  let optionsToShow;
  if (activeTab === "avatar") {
    optionsToShow = AVATAR_OPTIONS;
  } else { 
    optionsToShow = CAFE_OPTIONS; 
  }
  
  const getGridImageSrc = (opt) => {
      if (activeTab === "avatar") {
          return getAccessoryOnlySrc(opt.id);
      }
      return opt.assetSrc;
  };
  
  const getPreviewImageSrc = () => {
      if (activeTab === "avatar") {
          return selectedAvatar.avatarSrc;
      }
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
            <Image
                src={getPreviewImageSrc()} 
                alt={getPreviewAltText()}
                width={320}
                height={480}
                className={styles.previewImage} 
                priority
            />
          </div>
        </section>

        <section className={styles.optionsSection}>
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