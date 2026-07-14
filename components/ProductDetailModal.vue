<template>
  <Teleport to="body">
    <div :class="['modal-overlay', { open: !!product }]" @click.self="$emit('close')">
      <div v-if="product" class="modal" style="max-width:680px">
        <div class="modal-hd">
          <h2>{{ product.name }}</h2>
          <button class="modal-close" @click="$emit('close')">&times;</button>
        </div>
        <div class="modal-bd">
          <div class="m-brand">{{ product.brand }}</div>
          <div class="m-spec">{{ product.spec }}</div>
          <div class="m-tags">
            <span v-for="t in tags" :key="t" class="tag">{{ t }}</span>
          </div>

          <!-- 有 htmlContent 时直接渲染 -->
          <div v-if="product.htmlContent" class="m-content" v-html="product.htmlContent"></div>

          <!-- 无内容时显示基础信息卡片 -->
          <div v-else class="m-placeholder">
            <div class="m-info-grid">
              <div class="m-info-item">
                <label>品牌</label>{{ product.brand }}
              </div>
              <div class="m-info-item">
                <label>规格</label>{{ product.spec || '—' }}
              </div>
              <div class="m-info-item">
                <label>品类</label>{{ product.category || '—' }}
              </div>
              <div class="m-info-item" v-if="tags.length">
                <label>标签</label>
                <div class="m-tag-list">
                  <span v-for="t in tags" :key="t" class="tag">{{ t }}</span>
                </div>
              </div>
            </div>
            <div class="m-empty-note">暂无产品详细资料（产品导入后将在此展示完整内容）</div>
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
const emit = defineEmits(['close'])

const tags = computed(() => {
  if (!props.product) return []
  try { return JSON.parse(props.product.tags) } catch { return [] }
})

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
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200;
  display: none; align-items: center; justify-content: center; padding: 20px;
}
.modal-overlay.open { display: flex; }
.modal {
  background: var(--card); border-radius: 14px; width: 100%; max-width: 680px;
  max-height: 85vh; overflow: hidden; display: flex; flex-direction: column;
}
.modal-hd {
  padding: 20px 24px; border-bottom: 1px solid var(--bdr);
  display: flex; align-items: center; justify-content: space-between;
}
.modal-hd h2 { font-size: 18px; }
.modal-close {
  font-size: 22px; cursor: pointer; color: var(--txt2);
  background: none; border: none; padding: 4px 8px;
}
.modal-bd { padding: 16px 24px 24px; overflow-y: auto; flex: 1; }

.m-brand { font-size: 14px; color: var(--txt2); margin-bottom: 4px; }
.m-spec { font-size: 13px; color: var(--txt2); margin-bottom: 12px; }
.m-tags { display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap; }

.m-content {
  font-size: 14px; line-height: 1.8;
}
.m-content :deep(table) { width: 100%; border-collapse: collapse; font-size: 13px; margin: 8px 0; }
.m-content :deep(th), .m-content :deep(td) { padding: 6px 8px; border: 1px solid var(--bdr); text-align: left; }
.m-content :deep(th) { background: var(--bg); }

.m-placeholder { margin-top: 8px; }
.m-info-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;
}
.m-info-item {
  background: var(--bg); padding: 12px; border-radius: 8px; font-size: 14px;
}
.m-info-item label {
  display: block; font-size: 11px; color: var(--txt2); margin-bottom: 4px;
}
.m-tag-list { display: flex; flex-wrap: wrap; gap: 4px; }
.m-empty-note {
  text-align: center; padding: 24px; color: var(--txt2);
  font-size: 13px; border: 1px dashed var(--bdr); border-radius: 8px;
}
</style>
