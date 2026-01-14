<script setup lang="ts">
import { ref, onMounted, nextTick, watch} from 'vue'
import { Layout, Plus, MessageSquare, Calendar, Clock, Send, Edit3, Eye, Save } from 'lucide-vue-next'
import { renderMarkdown } from './utils/markdown' // 导入渲染工具
import { sendMessageToAI } from './services/ai'   // 导入 AI 服务

const { ipcRenderer } = window.require('electron')

// --- 数据定义 ---
const projects = ref<any[]>([])
const activeProjectContent = ref('') 
const activeProjectMeta = ref<any>({})
const activeFilename = ref('')
const isEditing = ref(false) // 👈 新增：控制编辑模式

// 聊天相关
const chatInput = ref('')
const chatHistory = ref<{role: 'user'|'ai', content: string}[]>([
  { role: 'ai', content: '你好！我是你的项目管家。你可以对我说：“新建一个官网改版项目”。' }
])
const isThinking = ref(false)

// --- 生命周期 ---
onMounted(async () => {
  await loadProjects()
})

// --- 核心业务 ---
const loadProjects = async () => {
  const data = await ipcRenderer.invoke('get-projects')
  projects.value = data
  if (data.length > 0 && !activeFilename.value) {
    selectProject(data[0].filename)
  }
}

const selectProject = async (filename: string) => {
  // 切换项目前，如果正在编辑，建议先保存（这里简单处理：切换就退出编辑模式）
  isEditing.value = false 
  activeFilename.value = filename
  const result = await ipcRenderer.invoke('read-project-content', filename)
  if (result) {
    activeProjectMeta.value = result.data
    activeProjectContent.value = result.content
  }
}

// 👈 新增：保存当前修改到文件
const saveCurrentProject = async () => {
  if (!activeFilename.value) return
  
  // 我们需要把 Frontmatter (meta) 和 Content 重新拼起来
  // 这里简单起见，我们只更新 Content，Meta 暂时保持原样
  // 在真实场景中，应该使用 gray-matter 的 stringify 方法来重新组装
  
  // 简易拼装：
  const fullContent = `---
id: "${activeProjectMeta.value.id || ''}"
title: "${activeProjectMeta.value.title || ''}"
status: "${activeProjectMeta.value.status || 'not_started'}"
startDate: "${activeProjectMeta.value.startDate || ''}"
endDate: "${activeProjectMeta.value.endDate || ''}"
tags: ${JSON.stringify(activeProjectMeta.value.tags || [])}
---

${activeProjectContent.value}`

  // 调用主进程复用 'create-project' 接口（因为它本质就是写文件）
  await ipcRenderer.invoke('create-project', {
    filename: activeFilename.value,
    content: fullContent
  })
  
  // 退出编辑模式
  isEditing.value = false
  // 重新加载以更新列表状态（如果修改了 meta）
  await loadProjects()
}

// --- AI 交互逻辑 (最重要的一步) ---
const handleSend = async () => {
  if (!chatInput.value.trim()) return
  
  const userText = chatInput.value
  chatHistory.value.push({ role: 'user', content: userText })
  chatInput.value = ''
  isThinking.value = true

  // 1. 发送给 AI
  const response = await sendMessageToAI(userText) || ''
  isThinking.value = false
  chatHistory.value.push({ role: 'ai', content: response })

  // 2. 检查 AI 是否想执行指令 (解析 JSON)
  // 正则提取 ```json ... ``` 中的内容
  const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
  if (jsonMatch) {
    try {
      const command = JSON.parse(jsonMatch[1])
      
      // 执行新建操作
      if (command.action === 'create') {
        // 调用 Electron 主进程写入文件 (我们需要去 main.ts 补一个 write 接口)
        // 这里暂时用一个 console 模拟，下一步我们在 main.ts 实现它
        console.log('收到创建指令:', command)
        
        // 临时直接调用 Electron 写入 (稍后完善)
        await ipcRenderer.invoke('create-project', command)
        
        // 刷新列表
        await loadProjects()
        // 自动选中新项目
        selectProject(command.filename)
      }
    } catch (e) {
      console.error('指令解析失败', e)
    }
  }
}

// --- 样式辅助函数 ---
const getStatusStyle = (status) => {
  switch (status) {
    case 'not_started': return 'bg-gray-100 border-l-4 border-gray-400'
    case 'in_progress': return 'bg-yellow-50 border-l-4 border-yellow-400'
    case 'completed': return 'bg-green-50 border-l-4 border-green-500'
    case 'overdue': return 'bg-red-50 border-l-4 border-red-500'
    default: return 'bg-white'
  }
}

const getStatusLabel = (status) => {
  const map = {
    not_started: '未开始',
    in_progress: '进行中',
    completed: '已完成',
    overdue: '已超时'
  }
  return map[status] || status
}
</script>

<template>
  <div class="flex flex-col h-screen w-full bg-slate-50 text-slate-800 overflow-hidden">
    <div class="flex-1 flex overflow-hidden">
      
      <aside class="w-64 flex-shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col h-full">
         <div class="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h1 class="font-bold text-lg text-slate-700 flex items-center gap-2">
            <Layout class="w-5 h-5" /> 
            我的项目
          </h1>
        </div>
        
        <div class="flex-1 overflow-y-auto p-3 space-y-3">
          <div v-for="p in projects" :key="p.filename" @click="selectProject(p.filename)"
            class="p-3 rounded-lg cursor-pointer transition-all shadow-sm hover:shadow-md"
            :class="[getStatusStyle(p.status), activeFilename === p.filename ? 'ring-2 ring-blue-500' : '']">
            <div class="flex justify-between items-start mb-2">
              <span class="font-bold text-sm text-slate-800">{{ p.title }}</span>
              <span class="text-xs px-1.5 py-0.5 rounded bg-white/50 font-medium">{{ getStatusLabel(p.status) }}</span>
            </div>
            <div class="mt-2 text-xs text-slate-500"><Clock class="w-3 h-3 inline mr-1"/>{{ p.endDate }} 截止</div>
          </div>
        </div>
      </aside>

      <main class="flex-1 flex flex-col bg-white h-full" v-if="activeFilename">
        
        <header class="h-14 border-b border-slate-200 flex items-center px-6 justify-between bg-white shrink-0">
          <div class="flex items-center gap-3">
            <h2 class="text-xl font-bold truncate max-w-[300px]">{{ activeProjectMeta.title }}</h2>
            <span class="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
              {{ getStatusLabel(activeProjectMeta.status) }}
            </span>
          </div>
          
          <div class="flex items-center gap-2">
            <button @click="isEditing = !isEditing" class="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <Eye v-if="isEditing" class="w-5 h-5" />
              <Edit3 v-else class="w-5 h-5" />
            </button>
            <button v-if="isEditing" @click="saveCurrentProject" class="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
              <Save class="w-4 h-4" /> 保存
            </button>
          </div>
        </header>

        <div class="flex-1 flex overflow-hidden">
          <div class="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50/50 flex-shrink-0">
            <div class="flex-1 p-4 overflow-y-auto space-y-4">
              <div v-for="(msg, idx) in chatHistory" :key="idx" class="flex gap-3" :class="{'flex-row-reverse': msg.role === 'user'}">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white shrink-0"
                  :class="msg.role === 'ai' ? 'bg-blue-600' : 'bg-slate-400'">
                  {{ msg.role === 'ai' ? 'AI' : 'Me' }}
                </div>
                <div class="p-3 rounded-lg shadow-sm text-sm max-w-[85%] whitespace-pre-wrap"
                  :class="msg.role === 'ai' ? 'bg-white border border-slate-200' : 'bg-blue-600 text-white'">
                  {{ msg.content }}
                </div>
              </div>
            </div>
            <div class="p-4 border-t border-slate-200 bg-white relative shrink-0">
              <input v-model="chatInput" @keyup.enter="handleSend" type="text" placeholder="输入指令..." 
                class="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none">
              <button @click="handleSend" class="absolute right-6 top-6 hover:text-blue-600"><Send class="w-5 h-5 text-slate-400" /></button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto bg-white relative min-w-0">
            <div v-if="isEditing" class="h-full w-full">
              <textarea v-model="activeProjectContent" class="w-full h-full p-8 resize-none outline-none font-mono text-sm leading-relaxed text-slate-700 bg-slate-50/30"></textarea>
            </div>
            <div v-else class="p-8">
              <div class="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-a:text-blue-600 prose-ul:list-disc prose-li:my-1"
                 v-html="renderMarkdown(activeProjectContent)">
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style>
/* 简单的 Checkbox 样式修正 */
.contains-task-list { list-style: none; padding-left: 0; }
.task-list-item-checkbox { margin-right: 8px; }
</style>