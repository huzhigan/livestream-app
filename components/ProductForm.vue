<template>
  <Teleport to="body">
    <div :class="['modal-overlay', { open: show }]" @click.self="close">
      <div class="modal" style="max-width:640px">
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
          <div class="form-group">
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
const form = reactive({
  name: '', brand: '', spec: '', category: '', htmlContent: ''
})

const isEdit = computed(() => !!props.product?.id)

function open(product) {
  previewing.value = false
  if (product) {
    form.name = product.name
    form.brand = product.brand
    form.spec = product.spec || ''
    form.category = product.category || ''
    form.htmlContent = product.htmlContent || ''
    try { tagsInput.value = JSON.parse(product.tags).join(', ') } catch { tagsInput.value = '' }
  } else {
    form.name = ''; form.brand = ''; form.spec = ''; form.category = ''
    form.htmlContent = ''; tagsInput.value = ''
  }
  show.value = true
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
  try {
    if (isEdit.value) {
      await $fetch(`/api/products/${props.product.id}`, {
        method: 'PUT',
        body: { ...form, tags }
      })
    } else {
      await $fetch('/api/products', {
        method: 'POST',
        body: { ...form, tags }
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
