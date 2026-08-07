// 产品资料结构化迁移脚本 — 运行: npx tsx scripts/migrate-structured.ts
// 把 Product.htmlContent 解析成结构化 JSON 写入 Product.structured。
// 幂等:重复跑覆盖 structured,不碰 htmlContent。解析失败 → structured 留空(渲染回退 htmlContent)。
import { PrismaClient } from '@prisma/client'
import { parse } from 'node-html-parser'

const prisma = new PrismaClient()

// --- 文本清洗 ---
function decode(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
}
// 元素转纯文本:<br> 变空格,去标签,解码,压缩空白
function textOf(el: any): string {
  let s = el.toString().replace(/<br\s*\/?>/gi, ' ')
  s = s.replace(/<[^>]*>/g, '')
  return decode(s).replace(/\s+/g, ' ').trim()
}
function cleanText(s: string): string {
  return decode(s).replace(/\s+/g, ' ').trim()
}

// --- 各 block 提取 ---
function kvFrom(table: any) {
  const rows = table.querySelectorAll('tr')
    .map((tr: any) => ({
      label: cleanText(tr.querySelector('.dose-label')?.text || ''),
      value: textOf(tr.querySelector('.dose-val') || { toString: () => '' }),
    }))
    .filter((r: any) => r.label)
  return { type: 'kv', rows }
}
function tableFrom(table: any) {
  const header = table.querySelectorAll('thead th').map((th: any) => cleanText(th.text))
  const rows = table.querySelectorAll('tbody tr').map((tr: any) =>
    tr.querySelectorAll('td').map((td: any) => textOf(td)))
  return { type: 'table', header, rows }
}
function listFrom(list: any) {
  const items = list.querySelectorAll('li').map((li: any) => textOf(li)).filter(Boolean)
  return { type: 'list', items }
}
function chipsFrom(node: any) {
  const items = node.querySelectorAll('.person-chip').map((c: any) => cleanText(c.text)).filter(Boolean)
  return { type: 'chips', items }
}
function sellFrom(node: any) {
  const items = node.querySelectorAll('.sell-content').map((s: any) => ({
    num: cleanText(s.querySelector('.sell-num')?.text || ''),
    title: cleanText(s.querySelector('.sell-title')?.text || ''),
    desc: cleanText(s.querySelector('.sell-desc')?.text || ''),
  }))
  return { type: 'sell', items }
}

// --- 递归遍历 sec 内容节点,按形态分块 ---
function blocksFromNodes(nodes: any[]): any[] {
  const blocks: any[] = []
  let textBuf: string[] = []
  const flush = () => {
    const t = textBuf.join(' ').trim()
    if (t) blocks.push({ type: 'text', text: t })
    textBuf = []
  }
  for (const node of nodes) {
    if (node.nodeType === 3) { // 文本节点
      const t = cleanText(node.text || '')
      if (t) textBuf.push(t)
      continue
    }
    if (node.nodeType !== 1) continue
    const cls: string = node.getAttribute('class') || ''
    const t = (node.tagName || '').toLowerCase()
    if (cls.includes('sec-hd') || cls.includes('toc')) continue
    if (t === 'br') continue

    if (t === 'table' && cls.includes('dose-table')) { flush(); blocks.push(kvFrom(node)) }
    else if (t === 'table') { flush(); blocks.push(tableFrom(node)) }
    else if (t === 'ul' || t === 'ol') { flush(); blocks.push(listFrom(node)) }
    else if (cls.includes('person-chip') || node.querySelector('.person-chip')) { flush(); blocks.push(chipsFrom(node)) }
    else if (cls.includes('sell-content') || node.querySelector('.sell-content') || node.querySelector('.sell-title')) { flush(); blocks.push(sellFrom(node)) }
    else if (t === 'p') { const x = textOf(node); if (x) textBuf.push(x) }
    else if (['b', 'strong', 'i', 'em', 'span', 'a', 'sub', 'sup', 'small', 'code'].includes(t)) {
      const x = textOf(node); if (x) textBuf.push(x)
    }
    else if (t === 'div') {
      const inner = blocksFromNodes(node.childNodes)
      if (inner.length) { flush(); blocks.push(...inner) }
      else { const x = textOf(node); if (x) textBuf.push(x) }
    }
    else { flush(); blocks.push({ type: 'html', html: node.toString() }) }
  }
  flush()
  return blocks
}

function parseProduct(html: string) {
  const root = parse(html)
  const name = cleanText(root.querySelector('.pg-name')?.text || '')
  const pgBrand = cleanText(root.querySelector('.pg-brand')?.text || '')
  const [brand, ...specParts] = pgBrand.split('·').map(s => s.trim())
  const tags = root.querySelectorAll('.ftag').map((s: any) => cleanText(s.text)).filter(Boolean)

  const sections = root.querySelectorAll('.sec').map((sec: any) => {
    const icon = cleanText(sec.querySelector('.sec-icon')?.text || '')
    const title = cleanText(sec.querySelector('.sec-title')?.text || '')
    let blocks = blocksFromNodes(sec.childNodes)
    if (!blocks.length) {
      // 判空排除标题文字:仅标题+空占位容器的 sec 视为空,跳过
      const hdText = cleanText(sec.querySelector('.sec-hd')?.text || '')
      const bodyText = cleanText(sec.text).replace(hdText, '').trim()
      if (bodyText) blocks = [{ type: 'html', html: sec.toString() }]
    }
    return { icon, title, blocks }
  })

  return { name, brand: brand || '', spec: specParts.join('·'), tags, sections }
}

async function main() {
  const products = await prisma.product.findMany({ where: { NOT: { htmlContent: '' } } })
  console.log(`共 ${products.length} 个产品待迁移`)

  const typeCount: Record<string, number> = {}
  let htmlFallbackSections = 0
  let totalSections = 0
  let failed = 0

  for (const p of products) {
    let structured = ''
    try {
      const data = parseProduct(p.htmlContent)
      structured = JSON.stringify(data)
      for (const sec of data.sections) {
        totalSections++
        for (const b of sec.blocks) {
          typeCount[b.type] = (typeCount[b.type] || 0) + 1
          if (b.type === 'html') htmlFallbackSections++
        }
      }
    } catch (e) {
      failed++
      structured = ''
    }
    await prisma.product.update({ where: { id: p.id }, data: { structured } })
  }

  console.log('--- 迁移报告 ---')
  console.log('block 类型分布:', typeCount)
  console.log(`section 总数: ${totalSections}, 落到 html 兜底的 block: ${htmlFallbackSections} (${totalSections ? ((htmlFallbackSections / totalSections) * 100).toFixed(1) : 0}%)`)
  console.log(`解析失败(structured 留空): ${failed}`)
}

main().finally(() => prisma.$disconnect())
