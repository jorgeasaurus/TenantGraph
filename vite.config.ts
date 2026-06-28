import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              priority: 40,
              test: /node_modules[\\/](?:@vitejs|react|react-dom|scheduler)[\\/]/,
            },
            {
              name: 'auth-vendor',
              priority: 35,
              test: /node_modules[\\/]@azure[\\/]msal-/,
            },
            {
              name: 'graph-vendor',
              maxSize: 480_000,
              priority: 30,
              test: /node_modules[\\/](?:three|vanta)[\\/]/,
            },
            {
              name: 'ui-vendor',
              priority: 20,
              test: /node_modules[\\/](?:lucide-react|@vercel[\\/]analytics)[\\/]/,
            },
            {
              name: 'vendor',
              maxSize: 480_000,
              priority: 10,
              test: /node_modules[\\/]/,
            },
          ],
        },
      },
    },
  },
  plugins: [react()],
});
