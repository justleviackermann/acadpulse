# AcadPulse: Cognitive Load Intelligence

AcadPulse is a predictive academic management system that leverages **Google Gemini AI** to quantify student stress, optimize study schedules, and help educators simulate the impact of assignments before deployment. It bridges the gap between academic workload and mental well-being.

## 🚀 First Time Setup

Follow these steps to set up the project locally.

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- A **Google Gemini API Key** (Get one at [Google AI Studio](https://aistudio.google.com/))
- A **Firebase Project** (for authentication and database)

### 2. Installation
Clone the repository and install dependencies:

```bash
# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory. You can copy the structure from the example below:

```env
# .env
VITE_API_KEY=your_gemini_api_key_here
```

> **Note**: The app uses `firebase.ts` for database connection. Update `firebase.ts` with your own Firebase configuration keys if you want to use a private database instance.

### 4. Running the App
Start the development server:

```bash
npm run dev
```

Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`).

---

## ✨ Features

### 🎓 For Students
*   **Cognitive Dashboard**: Real-time visualization of your stress levels (`0-100%`) with a "Weekly Load Pattern" heatmap.
*   **Strategic Planner (AI)**:
    *   **Smart Prioritization**: Gemini AI reorders your tasks based on a strictly weighted formula of **Urgency + Stress**. Imminent deadlines always come first.
    *   **Daily Strategy**: Receive a tailored "Tactical Advisory" for the day.
    *   **Readiness Score**: A dynamic score indicating how balanced your schedule is against your deadlines.
*   **Private Mode**: Toggle a private layer to add personal tasks (e.g., "Part-time job", "Gym") that contribute to your stress score but remain invisible to teachers.
*   **Calendar View**: Drag-and-drop style calendar interaction to view deadlines relative to exams.

### 👨‍🏫 For Teachers
*   **Cohort Stress Outlook**: View the aggregate stress levels of your classes to prevent burnout before assigning new deadlines.
*   **Global Academic Calendar**: See a holistic view of your students' workload, including assignments from **other teachers** and different subjects.
*   **Assignment Simulation**: Deploy "Vectors" (Assignments) with estimated stress scores. The system warns you if a new assignment will push the class into the "Critical Risk" zone.
*   **Multi-Teacher Support**: Join existing classes via code to co-manage cohorts.

## 🛠 Tech Stack
*   **Frontend**: React 19, Tailwind CSS, Vite
*   **AI**: Google Gemini 3 Flash & Pro (via Google GenAI SDK)
*   **Database & Auth**: Firebase Firestore & Auth
*   **Visualization**: Recharts
