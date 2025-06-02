# AI代码生成规范

## 强制要求：每个文件必须包含四行注释

**所有AI生成的代码文件，开头必须包含：**

```javascript
/**
 * FILE: 实际文件名
 * REQ: 对应需求文档章节
 * CHECK: 需要验证的关键点
 * HIST: 生成日期-AI生成
 */
```

## 具体示例

### Vue组件
```vue
<template>
  <div class="login-page">
    <!-- 登录界面内容 -->
  </div>
</template>

<script setup lang="ts">
/**
 * FILE: LoginPage.vue
 * REQ: 3.2节
 * CHECK: 表单验证,登录跳转,错误提示
 * HIST: 2024-01-31-AI生成
 */
import { reactive } from 'vue'

const loginForm = reactive({
  username: '',
  password: ''
})
</script>
```

### 配置文件
```typescript
/**
 * FILE: vite.config.ts
 * REQ: 基础构建配置
 * CHECK: Vue3支持,开发服务器,简单配置
 * HIST: 2024-01-31-AI生成
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()]
})
```

### API文件
```typescript
/**
 * FILE: api.ts
 * REQ: 4.1节
 * CHECK: 请求封装,错误处理,响应类型
 * HIST: 2024-01-31-AI生成
 */
import axios from 'axios'

export const api = axios.create({
  baseURL: '/api'
})
```

## AI生成时的要求

1. **自动填写FILE字段** - 使用实际的文件名
2. **明确REQ字段** - 根据功能对应需求文档章节
3. **详细CHECK字段** - 列出该文件的关键验证点
4. **标准HIST格式** - 日期-AI生成

## 验证方式

生成代码后，通过以下命令检查：
```bash
# 检查是否所有文件都有注释
find src/ -name "*.vue" -o -name "*.ts" -o -name "*.js" | xargs grep -L "FILE:"

# 检查特定需求的文件
grep -r "REQ: 3.2节" src/
```

**重要：这不是建议，是强制要求！** 