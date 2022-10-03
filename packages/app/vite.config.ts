import { defineConfig } from "vite";

const ViteConfigForAppVallina = defineConfig({
  server: {
    proxy: {
      '/camera': {
        target: 'ws://127.0.0.1:8000/camera',
        ws: true
      }
    }
  }
});

// `defineConfig` can mention you with the type system
export default async ({ command, config }) => {
  return ViteConfigForAppVallina;
};
