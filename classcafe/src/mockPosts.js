const MOCK_POSTS = [
  {
    id: 1,
    content:
      "Does anyone have tips for pacing the final project? I’m getting lost in the dataset and could use a sanity check.",
    createdAt: new Date().toISOString(),
    user: { username: "sohee", email: "sohee@example.com" },
    likes: [{ id: 1 }, { id: 2 }, { id: 3 }],
    replies: [
      {
        id: 11,
        createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        user: { username: "jaden" },
      },
      {
        id: 12,
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        user: { username: "amira" },
      },
    ],
  },
  {
    id: 2,
    content:
      "Lecture 9 summary: activity traces, design probes, participatory spec. Sharing notes for anyone who missed.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    user: { username: "kevin" },
    likes: [{ id: 4 }],
    replies: [],
  },
  {
    id: 3,
    content:
      "Looking for a teammate for the meme post challenge. Prefer someone who knows a bit of Figma.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    user: { username: "aimee" },
    likes: [],
    replies: [
      {
        id: 31,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        user: { username: "kai" },
      },
    ],
  },
];

export default MOCK_POSTS;

