module.exports = {
    "env": {
        "browser": true,
        "es2021": true,
        "node": true
    },
    "extends": [
        "eslint:recommended"
    ],
    "plugins": [
        "html"
    ],
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "script"
    },
    "globals": {
        // jsMind相关全局变量
        "jsMind": "readonly",
        "jm": "writable",
        "mindmaps": "writable",
        "currentMindmap": "writable",
        "nodeDatabase": "writable",
        "projectInfo": "writable",
        
        // 项目特定全局变量
        "lastSavedFilePath": "writable",
        "autoSaveFileTimer": "writable",
        "currentEditingNodeId": "writable",
        "templateManager": "writable",
        
        // 存储相关
        "STORAGE_KEYS": "readonly",
        
        // 浏览器API
        "showSaveFilePicker": "readonly",
        "showOpenFilePicker": "readonly",
        "showDirectoryPicker": "readonly"
    },
    "rules": {
        // 代码质量规则
        "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
        "no-console": "off", // 允许console.log用于调试
        "no-debugger": "warn",
        "no-alert": "warn",
        
        // 代码风格规则
        "indent": ["error", 4], // 4空格缩进
        "quotes": ["error", "single", { "allowTemplateLiterals": true }],
        "semi": ["error", "always"],
        "comma-dangle": ["error", "never"],
        
        // 最佳实践
        "eqeqeq": ["error", "always"],
        "no-eval": "error",
        "no-implied-eval": "error",
        "no-new-func": "error",
        
        // ES6+规则
        "prefer-const": "warn",
        "no-var": "warn",
        "arrow-spacing": "error",
        
        // 函数相关
        "no-unused-expressions": "warn",
        "no-unreachable": "error",
        "consistent-return": "warn"
    },
    "ignorePatterns": [
        "node_modules/",
        "dist/",
        "build/",
        "*.min.js",
        "backups/",
        "src/jsmind/",
        "assets/"
    ]
}; 