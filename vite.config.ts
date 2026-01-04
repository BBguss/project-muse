import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true, // Allow access from network (important for NAS)
      allowedHosts: ['muse.kolab.top'],
      proxy: {
        // Proxy API requests to backend
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
        // Proxy uploaded images to backend
        '/uploads': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      // Ensure other process.env usage doesn't crash app
      'process.env': {}
    }
  };
});