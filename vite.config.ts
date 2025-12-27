import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true, // Allow access from network (important for NAS)
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      // Ensure other process.env usage doesn't crash app
      'process.env': process.env
    }
  };
});