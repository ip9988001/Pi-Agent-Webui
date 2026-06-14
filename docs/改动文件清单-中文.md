## 改动文件清单

### 新增文件
- `components/VoiceControls.tsx`
- `hooks/useVoiceChat.ts`

### 重点修改文件
- `components/AppShell.tsx`
  - 调整整体布局
  - 中间文件区 / 右侧聊天区
  - 接入顶部语音控制和语音状态气泡

- `components/ChatInput.tsx`
  - 增强输入框控制能力
  - 增加插入并发送等 handle

- `components/ChatWindow.tsx`
  - 接入语音播报与消息流联动

- `components/FileViewer.tsx`
  - 从只读查看改成默认可编辑
  - 增加保存、放弃修改、自动保存

- `app/api/files/[...path]/route.ts`
  - 增加 `PUT` 文件写回能力

- `app/page.tsx`
  - 为当前页面入口和构建兼容性做过调整

- `package.json`
  - 构建脚本从旧方式调整为当前可用方式

### 建议重点查看
如果你后续还要继续二次开发，最值得优先看的文件是：

1. `components/AppShell.tsx`
2. `components/FileViewer.tsx`
3. `components/ChatInput.tsx`
4. `components/VoiceControls.tsx`
5. `hooks/useVoiceChat.ts`
