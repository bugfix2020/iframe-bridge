import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'happy-dom',
        include: ['src/__test__/**/*.{test,spec,__test__}.ts'],
        clearMocks: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            reportsDirectory: 'coverage',
            include: ['src/**/*.ts'],
            exclude: ['src/__test__/**', 'src/types.ts']
        }
    }
});
