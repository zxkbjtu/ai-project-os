// 不再需要在前端 import OpenAI 了
const { ipcRenderer } = window.require('electron')

// 定义 System Prompt：教 AI 如何做项目管理
const SYSTEM_PROMPT = `
你是一个 AI 项目管理助手。当前日期是 ${new Date().toLocaleDateString()}。
用户的指令主要分为两类：
1. **新建项目**：请返回 JSON 格式，包含 { "action": "create", "filename": "...", "content": "..." }。
2. **普通对话**：请直接返回文本建议。

示例：用户输入"新建光伏项目"，你回复：
\`\`\`json
{
  "action": "create",
  "filename": "solar-project.md",
  "content": "---\\ntitle: 光伏项目\\nstatus: not_started\\nstartDate: 2026-02-01\\nendDate: 2026-05-01\\n---\\n# 项目描述\\n待补充"
}
\`\`\`
`

export async function sendMessageToAI(userMessage: string) {
  // 组装消息历史 (简单起见，这里只发当前一条，你可以优化为发整个 history)
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMessage }
  ]

  try {
    // 调用主进程
    const result = await ipcRenderer.invoke('chat-with-ai', { messages })
    
    if (result.success) {
      return result.content
    } else {
      console.error('AI Error from Main:', result.error)
      return `连接错误: ${result.error}`
    }
  } catch (error) {
    console.error('IPC Error:', error)
    return '系统内部通信错误'
  }
}