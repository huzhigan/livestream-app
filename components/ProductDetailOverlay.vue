<template>
  <div v-if="sp" class="fs-overlay" @click.self="$emit('close')">
    <div class="fs-panel">
      <div class="fs-hd">
        <div class="fs-hd-left">
          <h2>{{ sp.product.name }}</h2>
          <div class="fs-hd-sub">{{ sp.product.brand }} · {{ sp.product.spec }}</div>
        </div>
        <button class="fs-close" @click="$emit('close')">&times;</button>
      </div>
      <div class="fs-bd">
        <div class="fs-tags">
          <span v-for="t in parseTags(sp.product.tags)" :key="t" class="tag">{{ t }}</span>
        </div>
        <!-- 提报表附加信息 -->
        <div v-if="getSubmission(sp)" class="detail-submission">
          <!-- 新格式：变体表格 -->
          <template v-if="isGrouped(getSubmission(sp))">
            <table class="variant-table">
              <thead><tr><th>规格</th><th>直播价</th><th>赠品</th></tr></thead>
              <tbody>
                <tr v-for="(v, vi) in getVariants(getSubmission(sp))" :key="vi">
                  <td>{{ v.productFullName }}</td>
                  <td class="price-cell">{{ v.livePrice || '—' }}</td>
                  <td>{{ v.gifts || '—' }}</td>
                </tr>
              </tbody>
            </table>
            <div class="common-fields">
              <div v-for="f in getDisplayFields(getSubmission(sp).commonData)" :key="f.key" class="sub-field">
                <span class="sub-label">{{ f.label }}</span>
                <span class="sub-value">{{ f.value }}</span>
              </div>
            </div>
          </template>
          <!-- 旧格式兼容 -->
          <template v-else>
            <div v-for="f in getDisplayFields(getSubmission(sp))" :key="f.key" class="sub-field">
              <span class="sub-label">{{ f.label }}</span>
              <span :class="['sub-value', { 'sub-price': f.key === 'livePrice', 'sub-gift': f.key === 'gifts' }]">{{ f.value }}</span>
            </div>
          </template>
        </div>
        <StructuredDetail v-if="structuredData" :data="structuredData" />
        <div v-else-if="sp.product.htmlContent" class="detail-html" v-html="sp.product.htmlContent"></div>
        <div v-else-if="!getSubmission(sp)" class="detail-empty">暂无详细资料</div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  sp: { type: Object, default: null },
})
defineEmits(['close'])

const { isGrouped, getVariants, getDisplayFields } = useSubmission()

const structuredData = computed(() => {
  const raw = props.sp?.product?.structured
  if (!raw) return null
  try {
    const obj = JSON.parse(raw)
    return obj && Array.isArray(obj.sections) ? obj : null
  } catch { return null }
})

function getSubmission(sp) {
  try {
    const obj = JSON.parse(sp.submissionData || '{}')
    if (Array.isArray(obj.variants) && obj.variants.length > 0) return obj
    if (obj.productFullName) return obj
    return null
  } catch { return null }
}

function parseTags(tags) { try { return JSON.parse(tags) } catch { return [] } }
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
.fs-close {
  font-size: 28px; cursor: pointer; color: var(--txt2);
  background: none; border: none; padding: 4px 10px; line-height: 1;
}
.fs-close:hover { color: var(--txt); }
.fs-bd { padding: 20px 28px 28px; overflow-y: auto; flex: 1; }
.fs-tags { display: flex; gap: 6px; margin-bottom: 20px; flex-wrap: wrap; }

.detail-html { font-size: 15px; line-height: 1.8; max-width: 960px; }
.detail-html :deep(table) { width: 100%; border-collapse: collapse; margin: 8px 0; }
.detail-html :deep(th), .detail-html :deep(td) { padding: 8px 10px; border: 1px solid var(--bdr); text-align: left; font-size: 14px; }
.detail-html :deep(th) { background: var(--bg); }
.detail-html :deep(img) { max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; }
.detail-html :deep([style*="display:none"]) { display: block !important; }
.detail-empty { text-align: center; padding: 24px; color: var(--txt2); }
.detail-submission { background: #F9FAFB; border: 1px solid var(--bdr); border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }
.sub-field { display: flex; gap: 8px; padding: 4px 0; font-size: 13px; }
.sub-label { color: var(--txt2); min-width: 70px; flex-shrink: 0; }
.sub-value { color: var(--txt); }
.sub-price { color: var(--red); font-weight: 700; font-size: 16px; }
.sub-gift { color: var(--ok); font-weight: 500; }

/* 变体表格 */
.variant-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 12px; }
.variant-table th { background: var(--bg); padding: 8px 10px; text-align: left; font-size: 12px; color: var(--txt2); border: 1px solid var(--bdr); }
.variant-table td { padding: 8px 10px; border: 1px solid var(--bdr); vertical-align: top; }
.variant-table .price-cell { color: var(--red); font-weight: 600; white-space: nowrap; }
.common-fields { margin-top: 8px; }
</style>
