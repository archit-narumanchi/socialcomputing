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
...