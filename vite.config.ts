import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file from current directory
  // Fix: Cast process to any to access cwd() when property definitions are missing from the global Process type in some environments.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true
    },
    define: {
      // Map all environment variables to process.env so they work in the SDK
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ''),
      'process.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY || ''),
      'process.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN || ''),
      'process.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID || ''),
      'process.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET || ''),
      'process.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID || ''),
      'process.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID || '')
    }
  };
});
