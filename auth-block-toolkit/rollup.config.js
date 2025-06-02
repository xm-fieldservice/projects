import terser from '@rollup/plugin-terser';
import css from 'rollup-plugin-css-bundle';

const banner = `/**
 * AuthBlock 用户认证工具包 v1.0.0
 * (c) 2024 QA System Team
 * @license MIT
 */`;

export default [
    // UMD构建 - 用于浏览器和AMD
    {
        input: 'src/auth-block.js',
        output: {
            file: 'dist/auth-block.min.js',
            format: 'umd',
            name: 'AuthBlock',
            banner,
            exports: 'default'
        },
        plugins: [
            css({
                output: 'dist/auth-block.css'
            }),
            terser({
                compress: {
                    drop_console: true
                },
                format: {
                    comments: /^!/
                }
            })
        ]
    },
    
    // ESM构建 - 用于现代模块系统
    {
        input: 'src/auth-block.js',
        output: {
            file: 'dist/auth-block.esm.js',
            format: 'es',
            banner
        },
        plugins: [
            css({
                output: 'dist/auth-block.css'
            })
        ]
    },
    
    // CommonJS构建 - 用于Node.js
    {
        input: 'src/auth-block.js',
        output: {
            file: 'dist/auth-block.cjs.js',
            format: 'cjs',
            banner,
            exports: 'default'
        },
        plugins: [
            css({
                output: 'dist/auth-block.css'
            })
        ]
    }
]; 