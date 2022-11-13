import { defineConfig } from "vite";

const ViteConfigForAppVallina = defineConfig({
  server: {
    open: true
  }
});

// `defineConfig` can mention you with the type system
export default async ({ command, config }) => {
  return ViteConfigForAppVallina;
};
