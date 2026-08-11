<template>
  <Teleport to="body">
    <div :class="['modal-overlay', { open: show }]" @click.self="close">
      <div class="modal" :style="{ maxWidth: structuredModel ? '820px' : '640px' }">
        <div class="modal-hd">
          <h2>{{ isEdit ? '编辑产品' : '新增产品' }}</h2>
          <button class="modal-close" @click="close">&times;</button>
        </div>
        <div class="modal-bd">
          <div class="form-row">
            <div class="form-group" style="flex:1">
              <label>产品名称 *</label>
              <input v-model="form.name" class="input" placeholder="例：A醇晚霜 2.0">
            </div>
            <div class="form-group" style="flex:1">
              <label>品牌 *</label>
              <input v-model="form.brand" class="input" placeholder="例：HBN">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="flex:1">
              <label>规格</label>
              <input v-model="form.spec" class="input" placeholder="例：50g">
            </div>
            <div class="form-group" style="flex:1">
              <label>品类</label>
              <input v-model="form.category" class="input" list="cat-list" placeholder="例：护肤品">
              <datalist id="cat-list">
                <option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</option>
              </datalist>
            </div>
          </div>
          <div class="form-group">
            <label>标签（逗号分隔）</label>
            <input v-model="tagsInput" class="input" placeholder="例：抗老, 淡纹, 夜间修护">
          </div>
          <div v-if="structuredModel" class="form-group">
            <div class="html-label"><span>直播提词（每行一条 · 直播时优先展示，留空则用自动卖点）</span></div>
            <textarea
              class="input"
              rows="4"
              :value="(structuredModel.teleprompt || []).join('\n')"
              @input="structuredModel.teleprompt = $event.target.value.split('\n')"
              placeholder="例：&#10;专利超分子氨基酸，能直接卸防晒&#10;20% 甘油，洗完不紧绷&#10;近效期特价，折合 49.5/支"></textarea>
          </div>
          <div v-if="structuredModel" class="form-group">
            <div class="html-label"><span>产品详细资料（分块编辑）</span></div>
            <StructuredEditor :data="structuredModel" />
          </div>
          <div v-else class="form-group">
            <div class="html-label">
              <span>产品详细资料（HTML）</span>
              <button class="btn btn-sm btn-outline" @click="previewing = !previewing">
                {{ previewing ? '编辑' : '预览' }}
              </button>
            </div>
            <textarea v-if="!previewing" v-model="form.htmlContent" class="input html-area" rows="8" placeholder="粘贴产品的完整 HTML 内容..."></textarea>
            <div v-else class="html-preview" v-html="form.htmlContent"></div>
          </div>
        </div>
        <div class="modal-ft">
          <button class="btn btn-outline" @click="close">取消</button>
          <button class="btn btn-pri" @click="save" :disabled="saving || !form.name || !form.brand">
            {{ saving ? '保存中...' : (isEdit ? '保存修改' : '创建产品') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const emit = defineEmits(['close', 'saved'])
const props = defineProps({
  product: { type: Object, default: null },
  categoryOptions: { type: Array, default: () => [] },
})

const show = ref(false)
const saving = ref(false)
const previewing = ref(false)
const tagsInput = ref('')
const structuredModel = ref(null)
const form = reactive({
  name: '', brand: '', spec: '', category: '', htmlContent: ''
})

const isEdit = computed(() => !!props.product?.id)

async function open(product) {
  previewing.value = false
  structuredModel.value = null
  if (product) {
    // 列表项只有摘要,编辑时拉完整详情(含 structured/htmlContent)
    let data = product
    if (product.id && !product.structured) {
      try { data = await $fetch(`/api/products/${product.id}`) } catch { data = product }
    }
    form.name = data.name
    form.brand = data.brand
    form.spec = data.spec || ''
    form.category = data.category || ''
    form.htmlContent = data.htmlContent || ''
    try { tagsInput.value = JSON.parse(data.tags).join(', ') } catch { tagsInput.value = '' }
    try {
      const st = JSON.parse(data.structured || '')
      if (st && Array.isArray(st.sections)) structuredModel.value = reactive(st)
    } catch { structuredModel.value = null }
  } else {
    form.name = ''; form.brand = ''; form.spec = ''; form.category = ''
    form.htmlContent = ''; tagsInput.value = ''
  }
  show.value = true
}

// 清洗结构化数据:去空行/空块/空板块,保证渲染干净
function sanitizeStructured(data) {
  const clean = (b) => {
    if (b.type === 'chips' || b.type === 'list') {
      const items = (b.items || []).map(s => s.trim()).filter(Boolean)
      return items.length ? { ...b, items } : null
    }
    if (b.type === 'text') return b.text?.trim() ? { ...b, text: b.text.trim() } : null
    if (b.type === 'kv') {
      const rows = (b.rows || []).filter(r => r.label?.trim() || r.value?.trim())
      return rows.length ? { ...b, rows } : null
    }
    if (b.type === 'sell') {
      const items = (b.items || []).filter(s => s.title?.trim() || s.desc?.trim())
      return items.length ? { ...b, items } : null
    }
    if (b.type === 'qa') {
      const items = (b.items || []).filter(it => it.q?.trim() || it.a?.trim())
      return items.length ? { ...b, items } : null
    }
    if (b.type === 'table') return (b.rows || []).length ? b : null
    return b // html 兜底保留
  }
  const teleprompt = (data.teleprompt || []).map(s => String(s).trim()).filter(Boolean)
  return {
    ...data,
    teleprompt,
    sections: (data.sections || [])
      .map(s => ({ ...s, blocks: (s.blocks || []).map(clean).filter(Boolean) }))
      .filter(s => s.blocks.length || s.title?.trim()),
  }
}

function close() {
  show.value = false
  emit('close')
}

async function save() {
  if (!form.name || !form.brand) return
  saving.value = true
  const tags = JSON.stringify(
    tagsInput.value.split(/[,，]/).map(t => t.trim()).filter(Boolean)
  )
  const body = { ...form, tags }
  if (structuredModel.value) {
    body.structured = JSON.stringify(sanitizeStructured(structuredModel.value))
    // 结构化编辑不涉及 htmlContent,不传以保留原始备份(列表 API 已不返回 htmlContent)
    delete body.htmlContent
  }
  try {
    if (isEdit.value) {
      await $fetch(`/api/products/${props.product.id}`, {
        method: 'PUT',
        body,
      })
    } else {
      await $fetch('/api/products', {
        method: 'POST',
        body,
      })
    }
    close()
    emit('saved')
  } catch (e) {
    alert('保存失败: ' + (e.data?.message || e.message))
  } finally {
    saving.value = false
  }
}

defineExpose({ open })
</script>

<style scoped>
.form-row { display: flex; gap: 12px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; color: var(--txt2); }
.html-label { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.html-label span { font-size: 13px; font-weight: 500; color: var(--txt2); }
.html-area { font-family: 'SF Mono', Monaco, monospace; font-size: 12px; resize: vertical; }
.html-preview {
  border: 1px solid var(--bdr); border-radius: 8px; padding: 14px;
  min-height: 120px; max-height: 300px; overflow-y: auto; font-size: 14px; line-height: 1.8;
}
.html-preview :deep(table) { width: 100%; border-collapse: collapse; margin: 8px 0; }
.html-preview :deep(th), .html-preview :deep(td) { padding: 6px 8px; border: 1px solid var(--bdr); font-size: 13px; }
.html-preview :deep(th) { background: var(--bg); }
</style>
