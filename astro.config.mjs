import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: 'server', // Esto asegura que las rutas API funcionen en un entorno de servidor
});
