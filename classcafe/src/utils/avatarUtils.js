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

export const getAvatarUrl = (config) => {
  // Handle if config is the JSON object { id: "..." } or just the id string
  const id = config?.id || config || "none";
  const option = AVATAR_OPTIONS.find((opt) => opt.id === id);
  return option ? option.avatarSrc : AVATAR_OPTIONS[0].avatarSrc;
};