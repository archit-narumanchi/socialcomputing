export const CAFE_OPTIONS = [
  { id: "cafe_default", label: "Default Cafe", assetSrc: "/assets/cafe_default.png", price: 0 },
  { id: "cafe1", label: "Cafe Theme 1", assetSrc: "/assets/cafe1.png", price: 8 },
  { id: "cafe2", label: "Cafe Theme 2", assetSrc: "/assets/cafe2.png", price: 8 },
  { id: "cafe3", label: "Cafe Theme 3", assetSrc: "/assets/cafe3.png", price: 8 },
  { id: "cafe4", label: "Cafe Theme 4", assetSrc: "/assets/cafe4.png", price: 8 },
  { id: "cafe5", label: "Cafe Theme 5", assetSrc: "/assets/cafe5.png", price: 8 },
];

export const DEFAULT_CAFE_ID = CAFE_OPTIONS[0].id;

/**
 * Retrieves the asset source path for a given Cafe ID.
 * @param {string | undefined} id The ID of the cafe option.
 * @returns {string} The asset source URL.
 */
export const getCafeSrcById = (id) => {
    const cafeId = id || DEFAULT_CAFE_ID;
    const option = CAFE_OPTIONS.find((opt) => opt.id === cafeId);
    return option ? option.assetSrc : CAFE_OPTIONS[0].assetSrc;
};