export const AVATAR_OPTIONS = [
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
    price: 2,
  },
  {
    id: "flower2",
    label: "Flower 2",
    accessorySrc: "/assets/accessory_flower2.png",
    avatarSrc: "/assets/nupjukif_flower2.png",
    price: 2,
  },
  {
    id: "party1",
    label: "Party 1",
    accessorySrc: "/assets/accessory_party1.png",
    avatarSrc: "/assets/nupjukif_party1.png",
    price: 3,
  },
  {
    id: "party2",
    label: "Party 2",
    accessorySrc: "/assets/accessory_party2.png",
    avatarSrc: "/assets/nupjukif_party2.png",
    price: 3,
  },
  {
    id: "ribbon",
    label: "Ribbon",
    accessorySrc: "/assets/accessory_ribbon.png",
    avatarSrc: "/assets/nupjukif_ribbon.png",
    price: 4,
  },
];

/**
 * Dynamically creates the correct avatar source path based on accessory ID and base character type.
 * @param {string} id - The accessory ID (e.g., "flower1", "none").
 * @param {'f' | 'h'} baseType - The base character type ('f' for nupjukif, 'h' for nupjukih).
 * @returns {string} The full image path.
 */
const getAvatarSrcPath = (id, baseType = 'f') => {
    const baseName = `nupjuki${baseType}`;
    const accessoryId = id || "none"; 

    // 1. If it's the base avatar (id="none"), return the path without any accessory suffix.
    if (accessoryId === "none") {
        return `/assets/${baseName}.png`;
    }

    // 2. Check if the accessory ID is one we know.
    const option = AVATAR_OPTIONS.find((opt) => opt.id === accessoryId);
    
    // 3. If we know the ID, construct the path with the underscore and accessory ID.
    if (option) {
        return `/assets/${baseName}_${accessoryId}.png`;
    }
    
    // 4. If the ID is unknown or invalid, fallback to the base image.
    return `/assets/${baseName}.png`;
};


export const getAvatarUrl = (config, baseType = 'f') => {
  // Handle if config is the JSON object { id: "..." } or just the id string
  const id = config?.id || config || "none";
  
  // Use the new helper function to get the correct URL based on the requested base type
  return getAvatarSrcPath(id, baseType);
};

export function getAvatarSrcById(id) {
  // This function is generally used for the default base ('f')
  return getAvatarSrcPath(id, 'f');
}