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
    semester: 'Fall 2025',
  },
  {
    courseCode: 'CS311',
    title: 'Computer Organization',
    semester: 'Fall 2025',
  },
  {
    courseCode: 'BTM238',
    title: 'Organizational Behavior',
    semester: 'Fall 2025',
  },
  {
    courseCode: 'CS473',
    title: 'Introduction to Social Computing',
    semester: 'Fall 2025',
  },
  {
    courseCode: 'CS485',
    title: 'Machine Learning for Computer Vision',
    semester: 'Fall 2025',
  },
  {
    courseCode: 'BTM204',
    title: 'Technology Management',
    semester: 'Fall 2025',
  },
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