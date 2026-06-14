## Pi Web 改造说明

这份源码基于原版 `@agegr/pi-web` 做了面向日常使用的增强，重点是把界面工作流改成“中间编辑文件，右侧聊天协作”，并把语音功能直接内置到 WebUI。

### 相比原版新增/调整的功能

#### 1. 布局调整
- 左侧栏保持项目、会话、文件树的结构不变。
- 中间主区域改成文件查看/编辑区。
- 右侧区域改成聊天交互区。

#### 2. 文件编辑能力
- 文本文件默认直接进入编辑状态，不再只是只读查看。
- 支持手动 `保存 / 放弃修改`。
- 支持快捷键 `Ctrl+S / Cmd+S` 保存。
- 支持自动保存，停止输入一段时间后自动落盘。
- 已在文件 API 中补上 `PUT` 写回能力。

#### 3. 支持直接编辑的文件类型
- 绝大多数纯文本文件都可以直接编辑，例如：
  - `md`
  - `txt`
  - `json`
  - `.env`
  - `yaml / yml`
  - `toml`
  - `xml`
  - `html / css / js / ts / tsx / jsx`
  - 其他常见代码/配置文本文件
- 二进制文件仍以预览或非文本方式处理，不按普通文本编辑。

#### 4. 内置中文语音功能
- 语音功能已从浏览器插件方案改成 WebUI 内置方案。
- 聊天区顶部新增中文语音控制组：
  - `语音`
  - `录音`
  - `播报`
  - `设置`
- 语音识别结果可直接写入聊天输入框。
- 支持 AI 回复自动语音播报。
- 默认语速已调整为 `1.8`。
- 播报文本会做清洗，避免把大量 Markdown 噪音、代码块、路径、链接完整机械朗读。

#### 5. 语音快捷交互
- 当前方案为按住 `Ctrl` 进行语音输入。
- 按住时会显示顶部半透明气泡。
- 气泡会显示：
  - `正在倾听`
  - 实时识别内容
  - 待发送倒计时状态
- 松开后进入待发送阶段。
- 倒计时期间按空格可取消自动发送，并把识别内容保留到输入框供手动修改。

### 本次主要改动文件

- `components/AppShell.tsx`
- `components/ChatInput.tsx`
- `components/ChatWindow.tsx`
- `components/FileViewer.tsx`
- `components/VoiceControls.tsx`（新增）
- `hooks/useVoiceChat.ts`（新增）
- `app/api/files/[...path]/route.ts`
- `app/page.tsx`
- `package.json`

### 依赖说明

#### npm 依赖
这次改造没有额外引入新的第三方 npm 包，仍然使用原项目已有依赖。

核心依赖包括：
- `next`
- `react`
- `react-dom`
- `react-markdown`
- `mammoth`
- `mermaid`

#### 浏览器原生能力
语音功能依赖浏览器原生 API，不额外安装 npm 语音库：
- `SpeechRecognition / webkitSpeechRecognition`
- `speechSynthesis`

因此：
- 推荐使用 Chrome / Edge
- 首次使用需要允许麦克风权限

### 运行方式

#### 安装依赖
```bash
npm install
```

#### 开发模式
```bash
npm run dev
```

#### 构建
```bash
npm run build
```

#### 启动生产模式
```bash
npm start
```

### 上传到 GitHub 时不建议提交的目录/文件

不要上传这些生成物或本地缓存：
- `.next/`
- `node_modules/`
- `.codegraph/`
- `*.log`
- `tsconfig.tsbuildinfo`

### 说明

如果你要把这份改造版发到自己的 GitHub 仓库，建议上传“源码目录本身”，不要上传已经构建好的 `.next` 产物。这样后续维护、二次修改、重新构建都会更稳。
