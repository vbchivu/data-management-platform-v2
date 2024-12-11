import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup/testSetup.ts'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', { diagnostics: true }]
    },
    moduleNameMapper: {
        '@src/(.*)': '<rootDir>/src/$1',
        '@models/(.*)': '<rootDir>/src/app/models/$1',
        '@controllers/(.*)': '<rootDir>/src/app/controllers/$1',
        '@services/(.*)': '<rootDir>/src/app/services/$1',
        '@utils/(.*)': '<rootDir>/src/app/utils/$1',
    },
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
    ],
    coverageDirectory: 'coverage',
};

export default config;
