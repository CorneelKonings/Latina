import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    // Set base to './' to ensure assets load correctly on GitHub Pages (subdirectories)
    base: './',
    plugins: [react()],
    define: {
      // Prioritize process.env.API_KEY (System Env for Vercel/Netlify) -> env.API_KEY (.env file) -> empty string
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY || '')
    }
  };
});