/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/assets/scripts/$1',
        '^cc$': '<rootDir>/tests/mocks/cocos-mock.ts'
    },
    collectCoverageFrom: [
        'assets/scripts/**/*.ts',
        '!assets/scripts/**/*.d.ts'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'html', 'lcov'],
    testMatch: ['**/tests/**/*.test.ts'],
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            tsconfig: {
                allowJs: true,
                esModuleInterop: true,
                experimentalDecorators: true,
                emitDecoratorMetadata: true,
                strict: false,
                noImplicitAny: false,
                skipLibCheck: true
            },
            isolatedModules: true
        }]
    },
    moduleFileExtensions: ['ts', 'js', 'json'],
    setupFilesAfterEnv: [],
    verbose: true,
    maxWorkers: 1,
    workerIdleMemoryLimit: '512MB'
};
