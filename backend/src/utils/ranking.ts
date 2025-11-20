import { prisma } from '../db';

export const updateTopContributors = async () => {
  console.log('Starting Top Contributor calculation...');

  try {
    // 1. Reset ONLY the current weekly winner flag (keep history)
    await prisma.enrollment.updateMany({
      data: { isTopContributor: false },
    });

    // 2. Get all courses
    const courses = await prisma.course.findMany();

    // 3. For each course, calculate the new winner
    for (const course of courses) {
      // Fetch all enrollments with their activity
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId: course.id },
        include: {
          user: {
            include: {
              posts: { where: { courseId: course.id } },
              replies: { where: { post: { courseId: course.id } } },
            }
          }
        }
      });

      // Filter: Only consider active students (at least 1 post or reply)
      const activeEnrollments = enrollments.filter(e => 
        e.user.posts.length > 0 || e.user.replies.length > 0
      );

      if (activeEnrollments.length === 0) {
        console.log(`Course ${course.courseCode}: No active students.`);
        continue;
      }

      // Helper to calculate score
      const calculateScore = (e: typeof enrollments[0]) => 
        (e.user.posts.length * 5) + (e.user.replies.length * 3);

      // Sort all active students by score (highest first)
      activeEnrollments.sort((a, b) => calculateScore(b) - calculateScore(a));

      // Try to find a winner who hasn't won before
      let winner = activeEnrollments.find(e => !e.hasWonBefore);

      // If EVERYONE active has won before, we need to reset the history!
      if (!winner) {
        console.log(`Course ${course.courseCode}: All active users have won before. Resetting history.`);
        
        // Reset history for this course
        await prisma.enrollment.updateMany({
          where: { courseId: course.id },
          data: { hasWonBefore: false }
        });

        // Pick the top scorer again (since everyone is now eligible)
        winner = activeEnrollments[0];
      }

      // Crown the winner
      if (winner) {
        const score = calculateScore(winner);
        await prisma.enrollment.update({
          where: { id: winner.id },
          data: { 
            isTopContributor: true,  // Set as this week's winner
            hasWonBefore: true       // Mark as having won (for future weeks)
          },
        });
        console.log(`Course ${course.courseCode}: Winner is ${winner.user.username} (Score: ${score})`);
      }
    }

    console.log('Top Contributor calculation finished.');
  } catch (error) {
    console.error('Error calculating top contributors:', error);
  }
};