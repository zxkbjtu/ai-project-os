import MarkdownIt from 'markdown-it'
import taskLists from 'markdown-it-task-lists'

// 初始化解析器
const md = new MarkdownIt({
  html: true,       // 允许 HTML 标签
  linkify: true,    // 自动识别链接
  typographer: true // 优化排版
})

// 启用任务列表插件 (checkbox)
md.use(taskLists, { enabled: true, label: true })

export function renderMarkdown(content: string): string {
  if (!content) return ''
  return md.render(content)
}