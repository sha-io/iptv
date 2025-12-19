"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vite_1 = require("vite");
var vite_plugin_dts_1 = require("vite-plugin-dts");
exports.default = (0, vite_1.defineConfig)({
    build: {
        lib: {
            entry: "src/index.ts",
            name: "M3U Parser",
            fileName: "index",
        },
        rollupOptions: {
            external: [],
        },
    },
    plugins: [(0, vite_plugin_dts_1.default)({ insertTypesEntry: true, })],
});
