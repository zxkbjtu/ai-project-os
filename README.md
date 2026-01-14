

## AI Project OS / AI 项目管理系统

An intelligent project management tool based on Electron + Vue 3, integrated with AI assistant functionality to help users manage and track project progress more efficiently.
基于 Electron + Vue 3 的智能项目管理工具，集成了 AI 助手功能，可以帮助用户更高效地管理和跟踪项目进度。

## Features / 特性

- 🎯 Project Management: Support for creating, editing, and managing multiple projects
- 🤖 AI Assistant: Integrated OpenAI API for intelligent project suggestions
- 📝 Markdown Support: Support for Markdown format project documentation
- 📊 Project Status Tracking: Support for Not Started, In Progress, Completed status management
- 💾 Local Storage: Secure local storage of project data
- 🎨 Modern Interface: Beautiful user interface built with Tailwind CSS
- 🎯 项目管理：支持创建、编辑和管理多个项目
- 🤖 AI 助手：集成 OpenAI API，提供智能项目建议
- 📝 Markdown 支持：支持 Markdown 格式的项目文档编写
- 📊 项目状态跟踪：支持未开始、进行中、已完成等状态管理
- 💾 本地存储：项目数据安全存储在本地
- 🎨 现代化界面：使用 Tailwind CSS 构建美观的用户界面

## Tech Stack / 技术栈

- **Framework**: Electron + Vue 3
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Markdown**: markdown-it
- **AI**: OpenAI API
- **Build**: electron-vite
- **框架**: Electron + Vue 3
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **Markdown**: markdown-it
- **AI**: OpenAI API
- **构建**: electron-vite

## Requirements / 开发环境要求

- Node.js >= 16
- npm or yarn

## Installation / 安装依赖

```bash
npm install
```

## Development / 开发

```bash
npm run dev
```

## Build / 构建

```bash
# Build all platforms / 构建所有平台
npm run build

# Build specific platforms / 构建特定平台
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## Configuration / 配置

Before starting to use, you need to configure the OpenAI API:
在开始使用之前，需要配置 OpenAI API：

1. Modify the following configuration in `src/main/index.ts`:
   在 `src/main/index.ts` 中修改以下配置：

```typescript
const client = new OpenAI({
  apiKey: 'your-api-key',
  baseURL: 'your-api-base-url'
})
```

## Project Structure / 项目结构

```
src/
├── main/           # Main process code / 主进程代码
├── preload/        # Preload scripts / 预加载脚本
└── renderer/       # Renderer process code / 渲染进程代码
    ├── src/
    │   ├── components/  # Vue components / Vue 组件
    │   ├── services/    # Business logic / 业务逻辑
    │   └── utils/       # Utility functions / 工具函数
```

## Usage / 使用说明

1. Create new project: Use AI assistant by typing "Create a new XXX project"
   创建新项目：通过 AI 助手输入"新建一个XXX项目"
2. Edit project: Click edit button to enter edit mode
   编辑项目：点击编辑按钮进入编辑模式
3. Status management: Support for Not Started, In Progress, Completed
   状态管理：支持未开始、进行中、已完成等状态
4. Markdown support: Full Markdown syntax support for project documentation
   Markdown 支持：支持完整的 Markdown 语法编写项目文档

## Contributing / 贡献

Issues and Pull Requests are welcome!
欢迎提交 Issue 和 Pull Request！

## License / 许可证

MIT License
