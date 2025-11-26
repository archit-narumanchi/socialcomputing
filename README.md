# Project ClassCafe
**Team:** The Rickrollers  
**Members:** Archit Narumanchi, Aow Si Li Sara, Enrique Jose Delgado Garcia, Jinyoung Maeng

Our code is divided into two main sections: the frontend (found in the folder classcafe) and the backend (in the folder backend).

## Frontend (classcafe)
The assets are found in public\assets.  

React components and pages are found in the src folder.
- Note that pages are mainly in src\app, where each separate page in the implementation is in a separate folder within src\app (following Next.js App Router structure).
- Components are found just in the src folder.
- Customization components and handling are found in src\utils.

### Page Organization
- **Home Page (including login)** -> src\app
- **Cafe Page** -> src\app\cafe\\[courseCode]
- **Forum Page** -> src\app\cafe\\[courseCode]\forum
- **Forum Post Details Page** -> src\app\cafe\\[courseCode]\forum\post\\[postId]
- **Forum Post Compose Page** -> src\app\cafe\\[courseCode]\forum\compose
- **Meme Board** -> src\app\cafe\\[courseCode]\notice
- **Customization Screen** -> src\app\cafe\\[courseCode]\avatar
- **Notification Screen** -> src\app\cafe\\[courseCode]\notifications

## Backend
The backend is built with the TETP Stack (TypeScript, Express, TypeScript, Prisma) and hosted on Render. It handles all data persistence, authentication, and business logic.

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** PostgreSQL (hosted on Render)
- **ORM:** Prisma
- **Auth:** JWT & Bcrypt
- **Storage:** Cloudinary (for images)

### File Structure
- **src/index.ts:** The main entry point. Sets up the Express server, middleware (CORS, JSON parsing), and registers all API routes.
- **src/db.ts:** Initializes the Prisma Client singleton to connect to the database.
- **src/routes/:** Contains the logic for each feature.
- **auth.router.ts:** Handles user registration and login.
- **course.router.ts:** Manages searching for and joining ClassCafes.
- **forum.router.ts:** Handles posts, replies, and likes.
- **bulletin.router.ts:** Manages the weekly meme/notice board.
- **avatar.router.ts:** Handles the coin economy and avatar shop.
- **admin.router.ts:** Allows admins to create new courses.
- **cron.router.ts:** Triggers the weekly "Top Contributor" calculation.
- **src/middleware/:** Security guards for routes.
- **auth.ts:** Verifies JWT tokens to protect private routes.
- **enrollment.ts:** Ensures a user is enrolled in a class before posting.
- **admin.ts:** Ensures a user is an Admin before accessing admin tools.
- **src/utils/ranking.ts:** Contains the algorithm to calculate the weekly "Top Contributor" based on user activity.
- **prisma/schema.prisma:** The single source of truth for the database structure (defining Users, Courses, Posts, etc.).
- **prisma/seed.ts:** A script that populates the database with initial courses, shop items, and admin users.
