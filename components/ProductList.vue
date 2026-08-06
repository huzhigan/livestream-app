<template>
  <div ref="listEl" class="p-list">
    <div v-for="(sp, idx) in products" :key="sp.id" :data-id="sp.product.id" class="p-item card">
      <div class="p-order drag-handle" title="拖拽排序">
        <input
          class="order-input"
          type="number"
          :value="idx + 1"
          min="1"
          :max="products.length"
          @mousedown.stop
          @blur="onOrderChange(sp, $event)"
          @keydown.enter="e => e.target.blur()"
        >
      </div>
      <div class="p-main" @click="$emit('show-detail', sp)">
        <div class="p-name">{{ sp.product.name }}</div>
        <div class="p-brand">{{ sp.product.brand }} · {{ sp.product.spec }}</div>
      </div>
      <!-- 提报表信息展示 -->
      <div class="live-info">
        <template v-if="getSubmission(sp)">
          <template v-if="isGrouped(getSubmission(sp))">
            <div class="live-order">顺序 #{{ getSubmission(sp).liveOrder }}</div>
            <div class="live-variant-count">{{ getVariants(getSubmission(sp)).length }} 个规格</div>
            <div class="live-price-range">{{ getPriceRange(getVariants(getSubmission(sp))) }}</div>
          </template>
          <template v-else>
            <div class="live-price">{{ getSubmission(sp).livePrice || '—' }}</div>
            <div v-if="getSubmission(sp).gifts" class="live-gifts">🎁 {{ getSubmission(sp).gifts }}</div>
            <div class="live-sub">
              <span v-if="getSubmission(sp).shipFrom">{{ getSubmission(sp).shipFrom }}</span>
              <span v-if="getSubmission(sp).shipTime">· {{ getSubmission(sp).shipTime }}</span>
            </div>
          </template>
        </template>
        <div v-else class="live-info-empty">暂无提报表信息</div>
        <button class="btn btn-sm btn-outline edit-sub-btn" @click.stop="$emit('edit-submission', sp)">编辑</button>
      </div>
      <button class="p-remove" @click.stop="$emit('remove', sp)" title="移除">&times;</button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  products: { type: Array, required: true },
})
const emit = defineEmits(['reorder', 'show-detail', 'edit-submission', 'remove'])

const { isGrouped, getVariants, getPriceRange } = useSubmission()

function getSubmission(sp) {
  try {
    const obj = JSON.parse(sp.submissionData || '{}')
    if (Array.isArray(obj.variants) && obj.variants.length > 0) return obj
    if (obj.productFullName) return obj
    return null
  } catch { return null }
}

// --- 编辑序号排序 ---
async function onOrderChange(sp, evt) {
  const newVal = parseInt(evt.target.value)
  const products = props.products
  const oldIdx = products.findIndex(p => p.id === sp.id)
  if (oldIdx < 0 || isNaN(newVal)) { evt.target.value = oldIdx + 1; return }

  const newIdx = Math.max(0, Math.min(newVal - 1, products.length - 1))
  if (newIdx === oldIdx) { evt.target.value = oldIdx + 1; return }

  // 移动产品到新位置（直接 mutate 同一 reactive 数组，与原实现一致）
  const moved = products.splice(oldIdx, 1)[0]
  products.splice(newIdx, 0, moved)
  const order = products.map((p, i) => ({ productId: p.productId, sortOrder: i + 1 }))
  emit('reorder', order)
}

// --- 拖拽排序 ---
const listEl = ref(null)
let sortableInstance = null

async function initSortable() {
  if (!import.meta.client || !listEl.value) return
  if (sortableInstance) sortableInstance.destroy()
  const Sortable = (await import('sortablejs')).default
  sortableInstance = Sortable.create(listEl.value, {
    handle: '.drag-handle',
    animation: 150,
    ghostClass: 'drag-ghost',
    onEnd: async (evt) => {
      if (evt.oldIndex === evt.newIndex) return
      const products = props.products
      const moved = products.splice(evt.oldIndex, 1)[0]
      products.splice(evt.newIndex, 0, moved)
      const order = products.map((p, i) => ({ productId: p.productId, sortOrder: i + 1 }))
      emit('reorder', order)
    }
  })
}

watch(() => props.products?.length, () => { nextTick(initSortable) })
onMounted(() => nextTick(initSortable))
onUnmounted(() => { if (sortableInstance) sortableInstance.destroy() })
</script>

<style scoped>
.p-list { display: flex; flex-direction: column; gap: 8px; }
.p-item { display: flex; overflow: hidden; position: relative; transition: box-shadow 0.2s; }
.p-order { width: 44px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: var(--pri); background: var(--pri-l); flex-shrink: 0; cursor: grab; user-select: none; }
.p-order:active { cursor: grabbing; }
.order-input {
  width: 32px; height: 32px; text-align: center; border: 1px solid transparent;
  border-radius: 6px; font-size: 16px; font-weight: 700; color: var(--pri);
  background: transparent; outline: none; -moz-appearance: textfield;
}
.order-input::-webkit-outer-spin-button, .order-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.order-input:focus { border-color: var(--pri); background: #fff; }
.drag-ghost { opacity: 0.4; background: var(--pri-l); }
.p-main { flex: 1; padding: 14px 16px; cursor: pointer; }
.p-main:hover .p-name { color: var(--pri); }
.p-name { font-size: 14px; font-weight: 600; margin-bottom: 2px; transition: color 0.2s; }
.p-brand { font-size: 12px; color: var(--txt2); }
.p-remove { position: absolute; top: 8px; right: 8px; background: none; border: none; color: var(--bdr); cursor: pointer; font-size: 18px; opacity: 0; transition: opacity 0.2s; padding: 4px 8px; }
.p-item:hover .p-remove { opacity: 1; }
.p-remove:hover { color: #EF4444; }

/* 提报表信息（卡片右侧） */
.live-info { padding: 14px 16px; border-left: 1px solid var(--bdr); min-width: 220px; background: #FAFBFC; }
.live-info-empty { color: var(--txt2); font-size: 12px; font-style: italic; }
.live-order { font-size: 12px; font-weight: 600; color: var(--pri); margin-bottom: 4px; }
.live-variant-count { font-size: 11px; color: var(--txt2); margin-bottom: 4px; }
.live-price-range { font-size: 16px; font-weight: 700; color: var(--red); }
.live-price { font-size: 20px; font-weight: 700; color: var(--red); margin-bottom: 4px; }
.live-price::before { content: '¥'; font-size: 14px; }
.live-gifts { font-size: 12px; color: var(--ok); margin-bottom: 4px; }
.live-sub { font-size: 11px; color: var(--txt2); }
.live-sub span + span::before { content: ''; }
.edit-sub-btn { margin-top: 6px; font-size: 11px; padding: 3px 8px; }
</style>
