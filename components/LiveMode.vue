<template>
  <Teleport to="body">
    <div v-if="show" class="live-overlay">
      <!-- 顶部状态栏 -->
      <div class="live-bar">
        <h3>🔴 直播模式 — {{ sessionName }}</h3>
        <div class="live-counter">{{ currentIdx + 1 }} / {{ products.length }}</div>
        <button class="live-close" @click="exit">退出直播模式</button>
      </div>

      <!-- 卡片舞台 -->
      <div class="live-stage">
        <button class="live-nav prev" :disabled="currentIdx === 0" @click="nav(-1)">‹</button>

        <div v-if="cur" class="live-card">
          <div class="lc-order">第 {{ currentIdx + 1 }} 个产品</div>
          <div class="lc-name">{{ cur.product.name }}</div>
          <div class="lc-brand">{{ cur.product.brand }} · {{ cur.product.spec }}</div>

          <!-- 价格区域 -->
          <div v-if="sub && isGrouped(sub)" class="lc-grouped-box">
            <div v-if="sub.liveOrder" class="lc-order-num">顺序 #{{ sub.liveOrder }}</div>
            <div v-if="commonData.retailPrice" class="lc-orig">日常价 ¥{{ commonData.retailPrice }}</div>
            <table class="lc-variant-table">
              <thead><tr><th>规格</th><th>直播价</th><th>赠品</th></tr></thead>
              <tbody>
                <tr v-for="(v, vi) in variants" :key="vi">
                  <td>{{ v.productFullName }}</td>
                  <td class="lc-v-price">{{ v.livePrice || '—' }}</td>
                  <td>{{ v.gifts || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else-if="sub" class="lc-price-box">
            <div>
              <div class="lc-price">¥{{ sub.livePrice || '—' }}</div>
              <div v-if="sub.retailPrice" class="lc-orig">日常价 ¥{{ sub.retailPrice }}</div>
            </div>
            <div v-if="sub.gifts" class="lc-gift">🎁 赠品：{{ sub.gifts }}</div>
          </div>

          <!-- 产品资料 HTML -->
          <div v-if="cur.product.htmlContent" class="lc-content" v-html="cur.product.htmlContent"></div>
          <div v-else class="lc-content-empty">暂无产品详细资料</div>

          <!-- 底部附加信息 -->
          <div v-if="sub && hasMore" class="lc-more">
            <div v-if="commonData.shipFrom || commonData.shipTime" class="lc-more-item">
              <label>发货地/时效</label>{{ commonData.shipFrom || '—' }} {{ commonData.shipTime || '' }}
            </div>
            <div v-if="commonData.expiryInfo" class="lc-more-item">
              <label>保质期</label>{{ commonData.expiryInfo }}
            </div>
            <div v-if="commonData.discountType" class="lc-more-item">
              <label>优惠方式</label>{{ commonData.discountType }}
            </div>
            <div v-if="commonData.shopService" class="lc-more-item">
              <label>店铺服务</label>{{ commonData.shopService }}
            </div>
          </div>
        </div>

        <button class="live-nav next" :disabled="currentIdx === products.length - 1" @click="nav(1)">›</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  products: { type: Array, default: () => [] },
  sessionName: { type: String, default: '' },
})
const emit = defineEmits(['close'])
const { isGrouped, getVariants } = useSubmission()

const show = ref(false)
const currentIdx = ref(0)

function enter() {
  currentIdx.value = 0
  show.value = true
}
function exit() {
  show.value = false
  emit('close')
}
function nav(dir) {
  const next = currentIdx.value + dir
  if (next >= 0 && next < props.products.length) currentIdx.value = next
}
function onKey(e) {
  if (!show.value) return
  if (e.key === 'ArrowLeft') nav(-1)
  else if (e.key === 'ArrowRight') nav(1)
  else if (e.key === 'Escape') exit()
}

// 全局键盘监听：进入直播模式时注册，退出时移除
watch(show, (val) => {
  if (val) document.addEventListener('keydown', onKey)
  else document.removeEventListener('keydown', onKey)
})
onUnmounted(() => document.removeEventListener('keydown', onKey))

// 当前产品和提报表数据
const cur = computed(() => props.products[currentIdx.value] || null)
const sub = computed(() => {
  if (!cur.value) return null
  try {
    const obj = JSON.parse(cur.value.submissionData || '{}')
    if (Array.isArray(obj.variants) && obj.variants.length > 0) return obj
    if (obj.productFullName) return obj
    return null
  } catch { return null }
})
const variants = computed(() => sub.value ? getVariants(sub.value) : [])
const commonData = computed(() => sub.value?.commonData || sub.value || {})
const hasMore = computed(() => {
  if (!sub.value) return false
  const data = isGrouped(sub.value) ? sub.value.commonData : sub.value
  return ['shipFrom', 'shipTime', 'expiryInfo', 'discountType', 'shopService']
    .some(k => data[k])
})

defineExpose({ enter })
</script>

<style scoped>
.live-overlay {
  position: fixed; inset: 0; background: #111827; z-index: 300;
  display: flex; flex-direction: column;
}
.live-bar {
  padding: 16px 24px; display: flex; justify-content: space-between;
  align-items: center; color: #fff; background: rgba(0,0,0,0.3);
}
.live-bar h3 { font-size: 16px; }
.live-counter { font-size: 14px; opacity: 0.7; }
.live-close {
  background: rgba(255,255,255,0.15); border: none; color: #fff;
  padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px;
}
.live-close:hover { background: rgba(255,255,255,0.25); }

.live-stage {
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: 24px; position: relative;
}
.live-nav {
  position: absolute; top: 50%; transform: translateY(-50%);
  background: rgba(255,255,255,0.15); border: none; color: #fff;
  width: 48px; height: 48px; border-radius: 50%; font-size: 22px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.live-nav:hover { background: rgba(255,255,255,0.3); }
.live-nav:disabled { opacity: 0.2; cursor: default; }
.live-nav.prev { left: 24px; }
.live-nav.next { right: 24px; }

.live-card {
  background: #fff; border-radius: 16px; width: 90vw; max-width: 1100px;
  max-height: 88vh; overflow-y: auto; padding: 32px 40px;
}
.lc-order { font-size: 13px; color: var(--pri); font-weight: 600; margin-bottom: 4px; }
.lc-name { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
.lc-brand { font-size: 15px; color: var(--txt2); margin-bottom: 16px; }

.lc-price-box {
  background: #FFF1F2; border-radius: 10px; padding: 16px;
  margin-bottom: 16px; display: flex; gap: 24px; align-items: center;
}
.lc-price { font-size: 32px; font-weight: 700; color: #DC2626; }
.lc-orig { font-size: 14px; color: var(--txt2); text-decoration: line-through; }
.lc-gift { font-size: 15px; color: var(--ok); font-weight: 500; }
.lc-order-num { font-size: 13px; font-weight: 600; color: var(--pri); margin-bottom: 4px; }

/* 变体表格 */
.lc-grouped-box {
  background: #FFF1F2; border-radius: 10px; padding: 16px;
  margin-bottom: 16px;
}
.lc-variant-table { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 10px; }
.lc-variant-table th { background: rgba(0,0,0,0.04); padding: 8px 10px; text-align: left; font-size: 12px; color: var(--txt2); border: 1px solid var(--bdr); }
.lc-variant-table td { padding: 8px 10px; border: 1px solid var(--bdr); vertical-align: top; }
.lc-variant-table .lc-v-price { color: #DC2626; font-weight: 700; white-space: nowrap; }

.lc-content {
  font-size: 14px; line-height: 1.8; margin-bottom: 16px;
  border-top: 1px solid var(--bdr); padding-top: 16px;
}
.lc-content :deep(table) { width: 100%; border-collapse: collapse; font-size: 13px; margin: 8px 0; }
.lc-content :deep(th), .lc-content :deep(td) { padding: 6px 8px; border: 1px solid var(--bdr); text-align: left; }
.lc-content :deep(th) { background: var(--bg); }
.lc-content :deep([style*="display:none"]) { display: block !important; }
.lc-content-empty {
  text-align: center; padding: 24px; color: var(--txt2);
  font-size: 14px; border-top: 1px solid var(--bdr); margin-top: 16px;
}

.lc-more {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px;
  border-top: 1px solid var(--bdr); padding-top: 12px;
}
.lc-more-item {
  background: var(--bg); padding: 10px; border-radius: 8px; font-size: 13px;
}
.lc-more-item label {
  display: block; font-size: 11px; color: var(--txt2); margin-bottom: 2px;
}
</style>
