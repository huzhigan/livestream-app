<template>
  <Teleport to="body">
    <div v-if="product" class="fs-overlay" @click.self="emit('close')">
      <div class="fs-panel">
        <div class="fs-hd">
          <div class="fs-hd-left">
            <h2>{{ product.name }}</h2>
            <div class="fs-hd-sub">{{ product.brand }} · {{ product.spec }}</div>
          </div>
          <div class="fs-hd-actions">
            <button class="btn btn-outline" @click="onEdit">编辑</button>
            <button class="btn btn-outline btn-danger" @click="emit('delete', product)">删除</button>
            <button class="fs-close" @click="emit('close')">&times;</button>
          </div>
        </div>
        <div class="fs-bd">
          <div class="fs-tags">
            <span v-for="t in tags" :key="t" class="tag">{{ t }}</span>
          </div>

          <div v-if="loading" class="fs-loading">加载中...</div>

          <!-- 优先结构化渲染,回退 htmlContent -->
          <StructuredDetail v-else-if="structuredData" :data="structuredData" />
          <div v-else-if="htmlContent" class="fs-content" v-html="htmlContent"></div>

          <!-- 无内容时显示基础信息卡片 -->
          <div v-else class="fs-placeholder">
            <div class="fs-info-grid">
              <div class="fs-info-item">
                <label>品牌</label>{{ product.brand }}
              </div>
              <div class="fs-info-item">
                <label>规格</label>{{ product.spec || '—' }}
              </div>
              <div class="fs-info-item">
                <label>品类</label>{{ product.category || '—' }}
              </div>
              <div class="fs-info-item" v-if="tags.length">
                <label>标签</label>
                <div class="fs-tag-list">
                  <span v-for="t in tags" :key="t" class="tag">{{ t }}</span>
                </div>
              </div>
            </div>
            <div class="fs-empty-note">暂无产品详细资料（产品导入后将在此展示完整内容）</div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  product: { type: Object, default: null },
})
const emit = defineEmits(['close', 'edit', 'delete'])

const full = ref(null)
const loading = ref(false)

// 打开时懒加载完整详情(列表项只有摘要)
watch(() => props.product, async (p) => {
  if (!p) { full.value = null; return }
  loading.value = true
  try {
    full.value = await $fetch(`/api/products/${p.id}`)
  } catch {
    full.value = null
  } finally {
    loading.value = false
  }
}, { immediate: true })

const tags = computed(() => {
  if (!props.product) return []
  try { return JSON.parse(props.product.tags) } catch { return [] }
})

const structuredData = computed(() => {
  const raw = full.value?.structured
  if (!raw) return null
  try {
    const obj = JSON.parse(raw)
    return obj && Array.isArray(obj.sections) ? obj : null
  } catch { return null }
})

const htmlContent = computed(() => full.value?.htmlContent || '')

function onEdit() {
  emit('edit', full.value || props.product)
}

// ESC 关闭弹窗
function onKey(e) {
  if (e.key === 'Escape' && props.product) emit('close')
}
watch(() => props.product, (val) => {
  if (val) document.addEventListener('keydown', onKey)
  else document.removeEventListener('keydown', onKey)
})
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<style scoped>
.fs-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
}
.fs-panel {
  background: var(--card); width: 94vw; height: 92vh;
  border-radius: 16px; display: flex; flex-direction: column;
  overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.fs-hd {
  padding: 20px 28px; border-bottom: 1px solid var(--bdr);
  display: flex; align-items: center; justify-content: space-between;
  flex-shrink: 0;
}
.fs-hd-left { flex: 1; min-width: 0; }
.fs-hd h2 { font-size: 22px; margin-bottom: 4px; }
.fs-hd-sub { font-size: 14px; color: var(--txt2); }
.fs-hd-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.btn-danger { color: var(--red) !important; border-color: var(--red) !important; }
.btn-danger:hover { background: #FEF2F2 !important; }
.fs-close {
  font-size: 28px; cursor: pointer; color: var(--txt2);
  background: none; border: none; padding: 4px 10px; line-height: 1;
}
.fs-close:hover { color: var(--txt); }
.fs-bd { padding: 20px 28px 28px; overflow-y: auto; flex: 1; }

.fs-tags { display: flex; gap: 6px; margin-bottom: 20px; flex-wrap: wrap; }
.fs-loading { text-align: center; padding: 40px; color: var(--txt2); font-size: 14px; }

.fs-content {
  font-size: 15px; line-height: 1.8;
  max-width: 960px;
}
.fs-content :deep(table) { width: 100%; border-collapse: collapse; font-size: 14px; margin: 12px 0; }
.fs-content :deep(th), .fs-content :deep(td) { padding: 8px 10px; border: 1px solid var(--bdr); text-align: left; }
.fs-content :deep(th) { background: var(--bg); }
.fs-content :deep(img) { max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; }
.fs-content :deep([style*="display:none"]) { display: block !important; }

.fs-placeholder { margin-top: 8px; }
.fs-info-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px; margin-bottom: 20px;
}
.fs-info-item {
  background: var(--bg); padding: 16px; border-radius: 10px; font-size: 15px;
}
.fs-info-item label {
  display: block; font-size: 12px; color: var(--txt2); margin-bottom: 6px;
}
.fs-tag-list { display: flex; flex-wrap: wrap; gap: 4px; }
.fs-empty-note {
  text-align: center; padding: 32px; color: var(--txt2);
  font-size: 14px; border: 1px dashed var(--bdr); border-radius: 10px;
}
</style>
