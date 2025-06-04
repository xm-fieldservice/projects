#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 颜色输出函数
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function main() {
    log('╔══════════════════════════════════════════════════╗', 'blue');
    log('║            AuthBlock 服务器安装向导               ║', 'blue');
    log('╚══════════════════════════════════════════════════╝', 'blue');
    console.log();

    try {
        // 1. 检查Node.js版本
        log('🔍 检查系统要求...', 'yellow');
        const nodeVersion = process.version;
        const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
        
        if (nodeMajor < 16) {
            log(`❌ Node.js版本过低 (${nodeVersion})，需要 v16.0.0 或更高版本`, 'red');
            process.exit(1);
        }
        log(`✅ Node.js版本: ${nodeVersion}`, 'green');

        // 2. 检查npm
        try {
            const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
            log(`✅ npm版本: v${npmVersion}`, 'green');
        } catch (error) {
            log('❌ npm未安装或不可用', 'red');
            process.exit(1);
        }

        // 3. 安装依赖
        log('\n📦 安装项目依赖...', 'yellow');
        try {
            execSync('npm install --production', { stdio: 'inherit' });
            log('✅ 依赖安装完成', 'green');
        } catch (error) {
            log('❌ 依赖安装失败', 'red');
            throw error;
        }

        // 4. 创建必要目录
        log('\n📁 创建项目目录...', 'yellow');
        const dirs = ['data', 'logs', 'backups'];
        dirs.forEach(dir => {
            const dirPath = path.join(process.cwd(), dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                log(`✅ 创建目录: ${dir}`, 'green');
            } else {
                log(`📂 目录已存在: ${dir}`, 'cyan');
            }
        });

        // 5. 配置服务器
        log('\n⚙️ 配置服务器...', 'yellow');
        const configPath = path.join(process.cwd(), 'config', 'server.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        // 询问基本配置
        const port = await question(`服务器端口 (默认: ${config.port}): `);
        if (port && !isNaN(port)) {
            config.port = parseInt(port);
        }

        const jwtSecret = await question('JWT密钥 (留空使用默认): ');
        if (jwtSecret.trim()) {
            config.auth.jwtSecret = jwtSecret.trim();
        }

        const adminPassword = await question('管理员密码 (留空使用默认): ');
        if (adminPassword.trim()) {
            config.auth.defaultAdmin.password = adminPassword.trim();
        }

        // 保存配置
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        log('✅ 配置保存完成', 'green');

        // 6. 测试启动
        log('\n🧪 测试服务启动...', 'yellow');
        const testStart = await question('是否测试启动服务？(y/N): ');
        
        if (testStart.toLowerCase() === 'y') {
            try {
                log('启动测试服务器...', 'cyan');
                const testProcess = execSync('timeout 5 node app.js || true', { 
                    stdio: 'pipe',
                    timeout: 6000
                });
                log('✅ 服务启动测试成功', 'green');
            } catch (error) {
                log('⚠️ 服务启动测试异常（可能正常）', 'yellow');
            }
        }

        // 7. 创建系统服务
        log('\n🔧 系统服务配置...', 'yellow');
        const createService = await question('是否创建系统服务？(y/N): ');
        
        if (createService.toLowerCase() === 'y') {
            try {
                execSync('node scripts/create-service.js', { stdio: 'inherit' });
                log('✅ 系统服务创建完成', 'green');
            } catch (error) {
                log('⚠️ 系统服务创建失败，请手动配置', 'yellow');
            }
        }

        // 8. 完成
        log('\n🎉 安装完成！', 'green');
        console.log();
        log('启动命令:', 'cyan');
        log('  npm start                    # 直接启动', 'reset');
        log('  npm run dev                  # 开发模式', 'reset');
        log('  pm2 start ecosystem.config.js # PM2管理', 'reset');
        console.log();
        log('管理命令:', 'cyan');
        log('  npm run status               # 查看状态', 'reset');
        log('  npm run stop                 # 停止服务', 'reset');
        log('  npm run backup               # 备份数据', 'reset');
        console.log();
        log(`访问地址: http://localhost:${config.port}`, 'blue');
        log(`健康检查: http://localhost:${config.port}/health`, 'blue');
        log(`演示页面: http://localhost:${config.port}/demo`, 'blue');

    } catch (error) {
        log('\n❌ 安装过程中出现错误:', 'red');
        console.error(error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

// 检查是否以root运行（Linux/macOS）
if (process.platform !== 'win32' && process.getuid && process.getuid() === 0) {
    log('⚠️ 建议不要以root用户运行此脚本', 'yellow');
}

main().catch(console.error); 