import { defineConfig } from 'tsup';

export default defineConfig([
    {
        entry: ['./src/index.ts', './src/react/index.ts'],
        format: ['cjs'],
        outDir: 'dist/cjs',
        minify: true,
        sourcemap: true,
        clean: ['dist/cjs/*']
    },
    {
        entry: ['./src/index.ts', './src/react/index.ts'],
        format: ['esm'],
        outDir: 'dist/esm',
        minify: true,
        sourcemap: true,
        clean: ['dist/esm/*']
    },
    {
        entry: ['./src/index.ts', './src/react/index.ts'],
        dts: {
            only: true
        },
        format: ['esm'],
        outDir: 'dist/types',
        clean: ['dist/types/*']
    }
]);
