import { PrismaClient, UserRole } from '@prisma/client';

// Initialize Prisma Client
const prisma = new PrismaClient();

// --- ADD ALL ADMIN EMAILS HERE ---
// Add your email and your teammates' emails to this array
const ADMIN_EMAILS = [
  "architnarumanchi2004@gmail.com",
  "sonerplayer8@gmail.com",
  "siliaow123@gmail.com"
];

// Mock data for KAIST courses
const coursesToSeed = [
  {
    courseCode: 'CS101',
    title: 'Introduction to Programming',
    //semester: 'Fall 2025',
  },
  {
    courseCode: 'CS311',
    title: 'Computer Organization',
    //semester: 'Fall 2025',
  },
  {
    courseCode: 'BTM238',
    title: 'Organizational Behavior',
    //semester: 'Fall 2025',
  },
  {
    courseCode: 'CS473',
    title: 'Introduction to Social Computing',
    //semester: 'Fall 2025',
  },
  {
    courseCode: 'CS485',
    title: 'Machine Learning for Computer Vision',
    //semester: 'Fall 2025',
  },
  {
    courseCode: 'BTM204',
    title: 'Technology Management',
    //semester: 'Fall 2025',
  },
];

// --- NEW: Shop Items ---
const shopItems = [
  { name: 'Red Cap', category: 'hat', price: 50, imageUrl: 'https://placehold.co/100x100/red/white?text=Cap' },
  { name: 'Blue Beanie', category: 'hat', price: 75, imageUrl: 'https://placehold.co/100x100/blue/white?text=Beanie' },
  { name: 'Cool Sunglasses', category: 'accessory', price: 100, imageUrl: 'https://placehold.co/100x100/black/white?text=Glasses' },
  { name: 'Golden Crown', category: 'hat', price: 500, imageUrl: 'https://placehold.co/100x100/gold/white?text=Crown' },
];

async function main() {
  console.log('Start seeding...');

  // Seed courses
  for (const courseData of coursesToSeed) {
    const course = await prisma.course.upsert({
      where: { courseCode: courseData.courseCode },
      update: {},
      create: courseData,
    });
    console.log(`Created or found course: ${course.title}`);
  }
    // --- NEW: Seed Shop Items ---
  console.log('Seeding shop items...');
  for (const item of shopItems) {
    await prisma.avatarItem.upsert({
      where: { id: -1 }, // Hack: We don't have a unique key besides ID, so we'll just createMany if empty or check by name manually.
      // Actually, upsert is tricky without a unique name. Let's use findFirst + create.
      update: {},
      create: item,
    });
    // Better logic for seeding items without unique constraints:
    const existingItem = await prisma.avatarItem.findFirst({ where: { name: item.name } });
    if (!existingItem) {
      await prisma.avatarItem.create({ data: item });
      console.log(`Created item: ${item.name}`);
    }
  }

  // --- Make all users in the array Admins ---
  console.log('Updating admin users...');
  for (const email of ADMIN_EMAILS) {
    if (email && email !== "your-email@example.com") { // Safety check
      try {
        const adminUser = await prisma.user.update({
          where: {
            email: email,
          },
          data: {
            role: UserRole.ADMIN, // Use the enum
          },
        });
        console.log(`Successfully made ${adminUser.username} an admin.`);
      } catch (e) {
        console.warn(`Could not find user ${email} to make admin. Skipping.`);
      }
    } else {
      console.warn('Skipping default placeholder email. Please update ADMIN_EMAILS array.');
    }
  }
  // --- END OF NEW BLOCK ---

  console.log('Seeding finished.');
}

// Execute the main function
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Close the database connection
    await prisma.$disconnect();
  });