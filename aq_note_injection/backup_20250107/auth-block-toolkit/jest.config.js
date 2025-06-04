module.exports = {
    // 测试环境
    testEnvironment: 'jsdom',
    
    // 测试文件匹配模式
    testMatch: [
        '**/tests/**/*.test.js',
        '**/__tests__/**/*.js',
        '**/*.(test|spec).js'
    ],
    
    // 转换配置 - 处理ES6模块
    transform: {
        '^.+\\.js$': 'babel-jest'
    },
    
    // 覆盖率收集
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js',
        '!**/node_modules/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: [
        'text',
        'lcov',
        'html'
    ],
    
    // 降低覆盖率阈值（因为是演示）
    coverageThreshold: {
        global: {
            branches: 60,
            functions: 60,
            lines: 60,
            statements: 60
        }
    },
    
    // 模拟设置
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    
    // 模块名映射
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    
    // 忽略的路径
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/'
    ],
    
    // 清理模拟
    clearMocks: true,
    restoreMocks: true,
    
    // 超时设置
    testTimeout: 10000
}; 