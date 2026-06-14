## GitHub 上传清单

建议上传以下源码和配置文件：

### 目录
- `app/`
- `bin/`
- `components/`
- `docs/`
- `docs/images/`
- `hooks/`
- `lib/`
- `public/`

### 根文件
- `.gitignore`
- `AGENTS.md`
- `eslint.config.mjs`
- `LICENSE`
- `next-env.d.ts`
- `next.config.ts`
- `package.json`
- `package-lock.json`
- `postcss.config.mjs`
- `README.md`
- `README.zh-CN.md`
- `tailwind.config.ts`
- `tsconfig.json`

### 不要上传
- `.next/`
- `node_modules/`
- `.codegraph/`
- `dev-30142*.log`
- `start-30142.log`
- `tsconfig.tsbuildinfo`

### 最稳的上传方式

1. 先把这份源码复制到一个干净文件夹。
2. 删除所有构建产物和本地缓存。
3. 把干净文件夹内容上传到你的 GitHub 仓库。
4. 在新机器或服务器上执行：

```bash
npm install
npm run build
npm start
```
