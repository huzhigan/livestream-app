<template>
  <Teleport to="body">
    <div :class="['modal-overlay', { open: show }]" @click.self="close">
      <div class="modal" style="max-width:600px">
        <div class="modal-hd">
          <h2>批量导入产品</h2>
          <button class="modal-close" @click="close">&times;</button>
        </div>
        <div class="modal-bd">
          <!-- 上传区域 -->
          <div v-if="!importing && !results" class="upload-zone" @click="triggerFile" @dragover.prevent @drop.prevent="onDrop">
            <div class="upload-icon">📂</div>
            <div class="upload-text">点击选择或拖拽 .js 产品文件到这里</div>
            <div class="upload-hint">支持同时选择多个文件</div>
            <input ref="fileInput" type="file" accept=".js" multiple style="display:none" @change="onFileSelect">
          </div>

          <!-- 导入中 -->
          <div v-if="importing" class="import-progress">
            <div class="progress-bar"><div class="progress-fill" :style="{ width: progressPct + '%' }"></div></div>
            <div class="progress-text">{{ processed }} / {{ total }} 文件</div>
          </div>

          <!-- 导入结果 -->
          <div v-if="results" class="import-results">
            <div class="result-summary">
              <span class="result-ok">✅ 成功 {{ results.success }} 个</span>
              <span v-if="results.fail" class="result-fail">❌ 失败 {{ results.fail }} 个</span>
            </div>
            <div v-for="r in results.details" :key="r.file" :class="['result-item', r.ok ? 'ok' : 'fail']">
              <div class="result-file">{{ r.file }}</div>
              <div class="result-msg">{{ r.ok ? `→ ${r.name}（${r.brand}）` : r.error }}</div>
            </div>
          </div>
        </div>
        <div class="modal-ft">
          <button class="btn btn-outline" @click="close">{{ results ? '关闭' : '取消' }}</button>
          <button v-if="!importing && !results" class="btn btn-pri" :disabled="!files.length" @click="startImport">
            开始导入 {{ files.length ? `(${files.length} 个文件)` : '' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const emit = defineEmits(['close', 'imported'])

const show = ref(false)
const fileInput = ref(null)
const files = ref([])
const importing = ref(false)
const processed = ref(0)
const total = ref(0)
const results = ref(null)

const progressPct = computed(() => total.value ? Math.round(processed.value / total.value * 100) : 0)

function open() {
  files.value = []
  importing.value = false
  results.value = null
  processed.value = 0
  total.value = 0
  show.value = true
}

function close() {
  show.value = false
  emit('close')
}

function triggerFile() { fileInput.value?.click() }

function onFileSelect(e) {
  files.value = Array.from(e.target.files || [])
  e.target.value = ''
}

function onDrop(e) {
  files.value = Array.from(e.dataTransfer?.files || []).filter(f => f.name.endsWith('.js'))
}

function extractHtmlFromJs(text) {
  // 找到 DETAIL_BLOCKS[id] = " 的位置
  const assignMatch = text.match(/DETAIL_BLOCKS\[\d+\]\s*=\s*"/)
  if (!assignMatch) return null

  const startIdx = assignMatch.index + assignMatch[0].length
  // 逐字符解析 JS 双引号字符串，处理转义
  let i = startIdx
  let result = ''
  while (i < text.length) {
    if (text[i] === '\\' && i + 1 < text.length) {
      const next = text[i + 1]
      if (next === 'n') result += '\n'
      else if (next === 't') result += '\t'
      else if (next === '"') result += '"'
      else if (next === '\\') result += '\\'
      else result += next
      i += 2
    } else if (text[i] === '"') {
      break // 字符串结束
    } else {
      result += text[i]
      i++
    }
  }
  return result || null
}

function parseProductHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const name = doc.querySelector('.pg-name')?.textContent?.trim() || ''
  const brandText = doc.querySelector('.pg-brand')?.textContent?.trim() || ''
  // 品牌文本可能是 "御仕葆 Yusiba · 60粒/瓶" 或含 &nbsp;
  const parts = brandText.split(/[·\u00B7]/).map(s => s.replace(/[\s\u00A0]+/g, ' ').trim())
  const brand = parts[0] || ''
  const spec = parts[1] || ''
  const tags = Array.from(doc.querySelectorAll('.tag-row .ftag')).map(el => el.textContent.trim())
  return { name, brand, spec, tags }
}

async function startImport() {
  if (!files.value.length) return
  importing.value = true
  total.value = files.value.length
  processed.value = 0

  const details = []
  let successCount = 0

  for (const file of files.value) {
    try {
      const text = await file.text()
      const html = extractHtmlFromJs(text)
      if (!html) throw new Error('无法提取 HTML 内容')

      const parsed = parseProductHtml(html)
      if (!parsed.name) throw new Error('未找到产品名称（.pg-name）')

      await $fetch('/api/products', {
        method: 'POST',
        body: {
          name: parsed.name,
          brand: parsed.brand,
          spec: parsed.spec,
          tags: JSON.stringify(parsed.tags),
          htmlContent: html,
        }
      })

      details.push({ file: file.name, ok: true, name: parsed.name, brand: parsed.brand })
      successCount++
    } catch (e) {
      details.push({ file: file.name, ok: false, error: e.message || '未知错误' })
    }
    processed.value++
  }

  importing.value = false
  results.value = { success: successCount, fail: details.length - successCount, details }
  if (successCount > 0) emit('imported')
}

defineExpose({ open })
</script>

<style scoped>
.upload-zone {
  border: 2px dashed var(--bdr); border-radius: 12px; padding: 48px 24px;
  text-align: center; cursor: pointer; transition: all 0.2s;
}
.upload-zone:hover { border-color: var(--pri); background: var(--pri-l); }
.upload-icon { font-size: 40px; margin-bottom: 8px; }
.upload-text { font-size: 14px; font-weight: 500; margin-bottom: 4px; }
.upload-hint { font-size: 12px; color: var(--txt2); }

.import-progress { text-align: center; padding: 24px; }
.progress-bar { height: 8px; background: var(--bdr); border-radius: 4px; overflow: hidden; margin-bottom: 8px; }
.progress-fill { height: 100%; background: var(--pri); transition: width 0.3s; border-radius: 4px; }
.progress-text { font-size: 13px; color: var(--txt2); }

.result-summary { display: flex; gap: 16px; margin-bottom: 16px; font-size: 15px; font-weight: 600; }
.result-ok { color: var(--ok); }
.result-fail { color: var(--red); }
.result-item { padding: 8px 12px; border-radius: 6px; margin-bottom: 6px; }
.result-item.ok { background: #F0FDF4; }
.result-item.fail { background: #FEF2F2; }
.result-file { font-size: 12px; color: var(--txt2); margin-bottom: 2px; }
.result-msg { font-size: 13px; }
</style>
