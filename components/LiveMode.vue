<template>
  <Teleport to="body">
    <div v-if="show" class="live-overlay">
      <!-- 顶部状态栏 -->
      <div class="live-bar">
        <h3>🔴 直播模式 — {{ sessionName }}</h3>
        <div class="live-bar-mid">
          <span class="live-counter">{{ currentIdx + 1 }} / {{ products.length }}</span>
          <span class="live-done">已讲 {{ presentedCount }}/{{ products.length }}</span>
          <input class="jump-input" type="number" min="1" :max="products.length" placeholder="跳号" @keydown.enter="jump">
        </div>
        <div class="live-bar-right">
          <button :class="['live-mark', { on: isPresented }]" @click="togglePresented">
            {{ isPresented ? '✓ 已讲' : '标记已讲' }}
          </button>
          <button class="live-close" @click="exit">退出直播模式</button>
        </div>
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

          <!-- 卖点提词（置顶、放大、可扫读） -->
          <div v-if="sellPoints.length" class="lc-sell">
            <div class="lc-sell-hd">🎯 卖点提词</div>
            <div v-for="(s, i) in sellPoints" :key="i" class="lc-sell-item">
              <span class="lc-sell-num">{{ i + 1 }}</span>
              <div class="lc-sell-body">
                <div class="lc-sell-title">{{ s.title }}</div>
                <div v-if="s.desc" class="lc-sell-desc">{{ s.desc }}</div>
              </div>
            </div>
          </div>

          <!-- 详细资料：默认折叠，按需展开 -->
          <div v-if="detailData" class="lc-detail">
            <button class="lc-detail-toggle" @click="detailOpen = !detailOpen">
              {{ detailOpen ? '▾ 收起详细资料' : '▸ 展开详细资料' }}
            </button>
            <div v-if="detailOpen" class="lc-detail-body">
              <StructuredDetail :data="detailData" />
            </div>
          </div>
          <div v-else-if="cur.product.htmlContent" class="lc-content" v-html="cur.product.htmlContent"></div>
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
const detailOpen = ref(false)
const presentedIds = ref(new Set())

function enter() {
  currentIdx.value = 0
  detailOpen.value = false
  presentedIds.value = new Set()
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
function jump(e) {
  const n = parseInt(e.target.value)
  if (!isNaN(n)) currentIdx.value = Math.max(0, Math.min(n - 1, props.products.length - 1))
  e.target.value = ''
}
function onKey(e) {
  if (!show.value) return
  if (e.key === 'ArrowLeft') nav(-1)
  else if (e.key === 'ArrowRight') nav(1)
  else if (e.key === 'Escape') exit()
}

// 切换产品时收起详情
watch(currentIdx, () => { detailOpen.value = false })

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

// --- 结构化数据 ---
const structured = computed(() => {
  const raw = cur.value?.product?.structured
  if (!raw) return null
  try {
    const o = JSON.parse(raw)
    return o && Array.isArray(o.sections) ? o : null
  } catch { return null }
})

// 卖点提词：优先 sell 块，回退"卖点"标题板块的列表/段落，最多 5 条
const sellPoints = computed(() => {
  if (!structured.value) return []
  const pts = []
  for (const sec of structured.value.sections)
    for (const b of sec.blocks)
      if (b.type === 'sell') for (const it of b.items) if (it.title || it.desc) pts.push({ title: it.title, desc: it.desc })
  if (pts.length) return pts.slice(0, 5)
  for (const sec of structured.value.sections) {
    if (!/卖点/.test(sec.title)) continue
    for (const b of sec.blocks) {
      if (b.type === 'list') b.items.forEach(t => pts.push({ title: t, desc: '' }))
      else if (b.type === 'text') pts.push({ title: b.text, desc: '' })
    }
    if (pts.length) return pts.slice(0, 5)
  }
  return []
})

// 详细资料：剔除 sell 块后的结构化数据（卖点已置顶，不重复）
const detailData = computed(() => {
  if (!structured.value) return null
  const sections = structured.value.sections
    .map(s => ({ ...s, blocks: s.blocks.filter(b => b.type !== 'sell') }))
    .filter(s => s.blocks.length)
  return sections.length ? { ...structured.value, sections } : null
})

// --- 已讲/未讲 ---
const presentedCount = computed(() => presentedIds.value.size)
const isPresented = computed(() => cur.value ? presentedIds.value.has(cur.value.productId) : false)
function togglePresented() {
  if (!cur.value) return
  const s = new Set(presentedIds.value)
  const id = cur.value.productId
  s.has(id) ? s.delete(id) : s.add(id)
  presentedIds.value = s
}

defineExpose({ enter })
</script>

<style scoped>
.live-overlay {
  position: fixed; inset: 0; background: #111827; z-index: 300;
  display: flex; flex-direction: column;
}
.live-bar {
  padding: 14px 24px; display: flex; justify-content: space-between;
  align-items: center; gap: 16px; color: #fff; background: rgba(0,0,0,0.3);
}
.live-bar h3 { font-size: 16px; }
.live-bar-mid { display: flex; align-items: center; gap: 14px; }
.live-counter { font-size: 14px; opacity: 0.7; }
.live-done { font-size: 13px; color: #6EE7B7; font-weight: 600; }
.jump-input {
  width: 64px; padding: 5px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3);
  background: rgba(255,255,255,0.1); color: #fff; font-size: 13px; text-align: center;
}
.jump-input::placeholder { color: rgba(255,255,255,0.5); }
.live-bar-right { display: flex; align-items: center; gap: 10px; }
.live-mark {
  background: rgba(255,255,255,0.15); border: none; color: #fff;
  padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 13px;
}
.live-mark:hover { background: rgba(255,255,255,0.25); }
.live-mark.on { background: #10B981; }
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

.lc-grouped-box { background: #FFF1F2; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
.lc-variant-table { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 10px; }
.lc-variant-table th { background: rgba(0,0,0,0.04); padding: 8px 10px; text-align: left; font-size: 12px; color: var(--txt2); border: 1px solid var(--bdr); }
.lc-variant-table td { padding: 8px 10px; border: 1px solid var(--bdr); vertical-align: top; }
.lc-variant-table .lc-v-price { color: #DC2626; font-weight: 700; white-space: nowrap; }

/* 卖点提词 */
.lc-sell { background: var(--pri-l); border-radius: 10px; padding: 16px; margin-bottom: 16px; }
.lc-sell-hd { font-size: 15px; font-weight: 700; color: var(--pri); margin-bottom: 10px; }
.lc-sell-item { display: flex; gap: 10px; margin-bottom: 10px; }
.lc-sell-item:last-child { margin-bottom: 0; }
.lc-sell-num {
  flex-shrink: 0; width: 26px; height: 26px; border-radius: 50%;
  background: var(--pri); color: #fff; font-weight: 700; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
}
.lc-sell-title { font-size: 16px; font-weight: 600; color: var(--txt); line-height: 1.5; }
.lc-sell-desc { font-size: 13px; color: var(--txt2); margin-top: 2px; line-height: 1.6; }

/* 详细资料折叠 */
.lc-detail { border-top: 1px solid var(--bdr); margin-top: 16px; padding-top: 12px; }
.lc-detail-toggle {
  background: none; border: none; color: var(--pri); font-size: 14px; font-weight: 600;
  cursor: pointer; padding: 4px 0;
}
.lc-detail-body { margin-top: 12px; }

.lc-content {
  font-size: 14px; line-height: 1.8; margin-bottom: 16px;
  border-top: 1px solid var(--bdr); padding-top: 16px;
}
.lc-content :deep(table) { width: 100%; border-collapse: collapse; font-size: 13px; margin: 8px 0; }
.lc-content :deep(th), .lc-content :deep(td) { padding: 6px 8px; border: 1px solid var(--bdr); text-align: left; }
.lc-content :deep([style*="display:none"]) { display: block !important; }
.lc-content-empty {
  text-align: center; padding: 24px; color: var(--txt2);
  font-size: 14px; border-top: 1px solid var(--bdr); margin-top: 16px;
}

.lc-more {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px;
  border-top: 1px solid var(--bdr); padding-top: 12px;
}
.lc-more-item { background: var(--bg); padding: 10px; border-radius: 8px; font-size: 13px; }
.lc-more-item label { display: block; font-size: 11px; color: var(--txt2); margin-bottom: 2px; }
</style>
