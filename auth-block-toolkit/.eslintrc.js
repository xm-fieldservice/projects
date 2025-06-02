module.exports = {
    env: {
        browser: true,
        es6: true,
        node: true,
        jest: true,
        amd: true
    },
    extends: [
        'eslint:recommended'
    ],
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
    },
    rules: {
        // 错误级别规则
        'no-unused-vars': ['error', { 
            'argsIgnorePattern': '^_',
            'varsIgnorePattern': '^_'
        }],
        'no-console': 'off', // 允许console，因为这是工具包
        'no-debugger': 'error',
        'no-unreachable': 'error',
        
        // 代码风格
        'indent': ['error', 4],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'comma-dangle': ['error', 'never'],
        
        // 最佳实践
        'eqeqeq': ['error', 'always'],
        'curly': ['error', 'all'],
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-new-func': 'error',
        
        // ES6+
        'prefer-const': 'error',
        'no-var': 'error',
        'arrow-spacing': 'error',
        
        // 兼容性
        'no-trailing-spaces': 'error',
        'eol-last': ['error', 'always']
    },
    globals: {
        'window': 'readonly',
        'document': 'readonly',
        'localStorage': 'readonly',
        'sessionStorage': 'readonly',
        'fetch': 'readonly',
        'AbortSignal': 'readonly',
        'CustomEvent': 'readonly',
        'define': 'readonly'
    }
}; 