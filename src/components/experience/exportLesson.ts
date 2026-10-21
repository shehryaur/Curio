// Adult Learn: download the lesson as a Markdown file.
import type { AgeMode, ObjectLesson } from '@/lib/types'

export function lessonMarkdown(lesson: ObjectLesson, mode: AgeMode): string {
  const lines: string[] = [`# ${lesson.emoji} ${lesson.title[mode]}`, '', lesson.intro[mode], '']
  if (lesson.causeAndEffect) lines.push(`**Cause and effect:** ${lesson.causeAndEffect}`, '')
  lines.push('## Parts', '')
  lesson.parts.forEach((p, i) => {
    lines.push(`### ${i + 1}. ${p.name[mode]}`, '', `*${p.short[mode]}*`, '', p.learn[mode], '')
    if (p.safetyTip?.[mode]) lines.push(`> ⚠️ **Safety tip:** ${p.safetyTip[mode]}`, '')
  })
  if (lesson.quiz.length) {
    lines.push('## Check yourself', '')
    lesson.quiz.forEach((q, i) => {
      const ans = lesson.parts.find((p) => p.id === q.answerPartId)?.name[mode] ?? q.answerPartId
      lines.push(`${i + 1}. ${q.prompt[mode]}  `, `   Answer: **${ans}**. ${q.praise[mode]}`, '')
    })
  }
  if (lesson.sources?.length) {
    lines.push('## Learn more', '')
    lesson.sources.forEach((src) => lines.push(`- [${src.title}](${src.url})`))
    lines.push('')
  }
  lines.push('---', `Exported from Curio on ${new Date().toISOString().slice(0, 10)}.`, '')
  return lines.join('\n')
}

export function downloadLesson(lesson: ObjectLesson, mode: AgeMode) {
  const md = lessonMarkdown(lesson, mode)
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const slug = lesson.title.adult.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'lesson'
  a.href = url
  a.download = `curio-${slug}.md`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
