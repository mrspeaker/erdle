// https://vitejs.dev/config/
import { defineConfig } from "vite";
import { resolve } from "path";
export default defineConfig({
    base: "",
    plugins: [],
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
                create: resolve(__dirname, "create.html"),
            },
        },
    },
});
