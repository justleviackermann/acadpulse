# AcadPulse: Cognitive Load Intelligence

AcadPulse is a predictive academic management system that uses Gemini AI to quantify student stress and help educators simulate the impact of assignments before deployment.

## 🚀 Quick Start

1. **Environment Setup**:
   Ensure you have a valid Gemini API Key from [Google AI Studio](https://aistudio.google.com/).

2. **Installation**:
   This project uses ESM modules and runs directly in modern browsers. No build step is strictly required if served via a local web server, but for the best experience:
   ```bash
   # Install a simple static server if you don't have one
   npm install -g serve
   
   # Run the app
   serve .
   ```

3. **API Configuration**:
   The app expects `process.env.API_KEY` to be available. In this sandbox environment, it is injected automatically. For local development, you would typically use a tool like `Vite` or `Webpack` to define this variable.

4. **Firebase Setup**:
   The current `firebase.ts` uses demo credentials. To use real data:
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/).
   - Enable **Email/Password Authentication**.
   - Create a **Firestore Database** in test mode.
   - Replace the config in `firebase.ts` with your project's web configuration.

## 🧠 AI Features
- **Stress Analysis**: Uses `gemini-3-flash-preview` to score task complexity.
- **Prioritization**: Uses `gemini-3-pro-preview` with Thinking Config for strategic planning.
- **Voice Coaching**: Uses `gemini-2.5-flash-native-audio-preview` for real-time wellness sync.
- **Brainstorming**: Uses `gemini-2.5-flash-image` for visual concept generation.

## 🛠 Tech Stack
- **Frontend**: React 19, Tailwind CSS.
- **Charts**: Recharts.
- **Database**: Firebase Firestore.
- **Intelligence**: Google Gemini API.
