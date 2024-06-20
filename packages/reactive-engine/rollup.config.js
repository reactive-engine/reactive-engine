import commonJS from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import terser from '@rollup/plugin-terser';
import dts from "rollup-plugin-dts";
var name = 'reactive';
var dist = function (p) { return './dist/index.' + p; }

export default [
    {
        input: "src/index.ts",
        output: [
            {
                name: name,
                file: dist("js"),
                format: "iife",
                sourceMap: 'inline',
                plugins: []
            },
            {
                name: name,
                file: dist("min.js"),
                format: "iife",
                sourceMap: 'inline',
                plugins: [terser()]
            },
            {
                name: name,
                file: dist("umd.js"),
                format: "umd",
                plugins: []
            },
            {
                name: name,
                file: dist("umd.min.js"),
                format: "umd",
                plugins: [terser()]
            },
            {
                name: name,
                file: dist("cjs.js"),
                format: "cjs",
                plugins: []
            },
            {
                name: name,
                file: dist("cjs.min.js"),
                format: "cjs",
                plugins: [terser()]
            },
            {
                name: name,
                file: dist("esm.js"),
                format: "esm",
                plugins: []
            },
            {
                name: name,
                file: dist("esm.min.js"),
                format: "esm",
                plugins: [terser()]
            }
        ],
        experimentalCodeSplitting: true,
        plugins: [
            commonJS(),
            typescript({
                declaration: true,
                esModuleInterop: true,
                moduleResolution: "Node",
                target: "ES6",
                module: "ESNext",
                type: "module",
                lib: ["DOM", "ES2021"],
                noEmitHelpers: true,
                importHelpers: false
            },
            ) 
        ],
        onwarn: function (warning) {
            if (warning.code === 'THIS_IS_UNDEFINED') {
                return;
            }
        },
    }
];
