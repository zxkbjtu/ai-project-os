import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import OpenAI from 'openai' // 确保在主进程也引入了 openai

// --- 新增引入 ---
import fs from 'fs'
import os from 'os'
import matter from 'gray-matter' // 用于解析 Frontmatter

// 定义数据存储目录：用户文档目录下的 AiProjectOS
const DATA_DIR = join(app.getPath('documents'), 'AiProjectOS')

// 确保目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// --- 核心业务逻辑：IPC 接口 ---

// 1. 获取所有项目列表
ipcMain.handle('get-projects', () => {
  try {
    const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.md'))
    
    const projects = files.map(filename => {
      const filePath = join(DATA_DIR, filename)
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      // 使用 gray-matter 解析头部 yaml 信息
      const { data } = matter(fileContent)
      
      return {
        filename, // 之后读写文件需要用到文件名
        ...data // 把 title, status, startDate 等展开
      }
    })
    
    return projects
  } catch (error) {
    console.error('读取项目列表失败:', error)
    return []
  }
})

// 2. 读取单个文件的完整内容 (用于右侧详情页)
ipcMain.handle('read-project-content', (_, filename) => {
  try {
    const filePath = join(DATA_DIR, filename)
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    // 返回解析后的对象: { data: {...}, content: "Markdown正文..." }
    return matter(fileContent) 
  } catch (error) {
    console.error('读取文件内容失败:', error)
    return null
  }
})

// 3. 创建新项目 (写入文件)
ipcMain.handle('create-project', (_, { filename, content }) => {
  try {
    const filePath = join(DATA_DIR, filename)
    // 如果文件已存在，避免覆盖？或者直接覆盖？这里演示直接写入
    fs.writeFileSync(filePath, content, 'utf-8')
    return { success: true }
  } catch (error) {
    console.error('创建项目失败:', error)
    return { success: false, error }
  }
})

// --- 新增：AI 对话接口 ---
ipcMain.handle('chat-with-ai', async (_, { messages }) => {
  // ⚠️ 在这里填入你的配置，主进程里跑非常稳定
  const client = new OpenAI({
    apiKey: 'sk-xxx', // 你的 Key
    baseURL: 'https://xxx.xxx/v1',      // 你的 URL (记得带 /v1)
    // 在主进程不需要 dangerouslyAllowBrowser: true
  })

  try {
    const completion = await client.chat.completions.create({
      messages: messages,
      model: 'gpt-4o-mini', // 或者你的中转商支持的模型
    })
    return { 
      success: true, 
      content: completion.choices[0].message.content 
    }
  } catch (error: any) {
    console.error('OpenAI API Error:', error)
    return { 
      success: false, 
      error: error.message || 'Connection failed' 
    }
  }
})

// --- App 生命周期 ---
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
