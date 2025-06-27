import html from 'eslint-plugin-html';

export default [
    {
        files: ['**/*.js', '**/*.html'],
        plugins: {
            html
        },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                // 浏览器环境
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                
                // jsMind相关全局变量
                jsMind: 'readonly',
                jm: 'writable',
                mindmaps: 'writable',
                currentMindmap: 'writable',
                nodeDatabase: 'writable',
                projectInfo: 'writable',
                
                // 项目特定全局变量
                lastSavedFilePath: 'writable',
                autoSaveFileTimer: 'writable',
                currentEditingNodeId: 'writable',
                templateManager: 'writable',
                
                // 存储相关
                STORAGE_KEYS: 'readonly',
                
                // 现代浏览器API
                showSaveFilePicker: 'readonly',
                showOpenFilePicker: 'readonly',
                showDirectoryPicker: 'readonly',
                URLSearchParams: 'readonly',
                URL: 'readonly',
                fetch: 'readonly',
                Promise: 'readonly'
            }
        },
        rules: {
            // 代码质量规则（宽松设置）
            'no-unused-vars': ['warn', { 
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                ignoreRestSiblings: true
            }],
            'no-console': 'off', // 允许console.log用于调试
            'no-debugger': 'warn',
            'no-alert': 'off', // 允许alert用于用户交互
            
            // 代码风格规则（宽松设置）
            'indent': 'off', // 关闭缩进检查，因为HTML中的JS缩进复杂
            'quotes': 'off', // 关闭引号检查，允许混用
            'semi': 'off', // 关闭分号检查
            'comma-dangle': 'off', // 关闭尾随逗号检查
            
            // 最佳实践（保留重要的）
            'eqeqeq': 'warn', // 降级为警告
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            
            // ES6+规则（宽松设置）
            'prefer-const': 'off', // 关闭const偏好
            'no-var': 'off', // 允许使用var
            'arrow-spacing': 'off',
            
            // 函数相关（宽松设置）
            'no-unused-expressions': 'off',
            'no-unreachable': 'error', // 保留重要的错误检查
            'consistent-return': 'off'
        }
    },
    {
        ignores: [
            'node_modules/',
            'dist/',
            'build/',
            '*.min.js',
            'backups/',
            'src/jsmind/',
            'assets/',
            '.git/',
            '.vscode/',
            '.cursor/'
        ]
    }
]; 