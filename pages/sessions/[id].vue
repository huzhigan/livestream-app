<template>
  <div class="wrap">
    <div class="breadcrumb"><NuxtLink to="/sessions">直播场次</NuxtLink> / {{ session?.name || '...' }}</div>

    <div v-if="pending" class="loading">加载中...</div>
    <template v-else-if="session">
      <!-- 场次头部 -->
      <div class="sess-hd card">
        <div class="sess-top">
          <div>
            <div class="sess-title">{{ session.name }}</div>
            <div class="sess-meta">
              <span :class="['tag', session.platform === 'xiaohongshu' ? 'tag-xhs' : 'tag-ks']">
                {{ session.platform === 'xiaohongshu' ? '📕 小红书' : '📹 快手' }}
              </span>
              <span>📅 {{ session.date }}</span>
              <span v-if="session.notes">📝 {{ session.notes }}</span>
            </div>
          </div>
          <div class="actions">
            <button class="btn btn-live" :disabled="!session.products.length" @click="enterLive">🔴 直播模式</button>
            <button class="btn btn-outline" @click="copySession" :disabled="copying">{{ copying ? '复制中...' : '📋 复制场次' }}</button>
            <button class="btn btn-outline" @click="triggerUpload">📥 上传提报表</button>
            <button class="btn btn-outline" @click="openAdd">➕ 添加产品</button>
            <input ref="fileInput" type="file" accept=".xlsx,.xls" style="display:none" @change="onFileChange">
          </div>
        </div>
        <!-- 状态切换 -->
        <div class="status-bar">
          <span class="status-label">状态：</span>
          <button v-for="s in statusOptions" :key="s.value"
            :class="['btn btn-sm', session.status === s.value ? s.activeClass : 'btn-outline']"
            @click="changeStatus(s.value)">{{ s.label }}</button>
        </div>
      </div>

      <!-- 产品列表 -->
      <div class="section-hd">
        <h2>产品列表</h2>
        <span>{{ session.products.length }} 个产品 · 编辑序号或拖拽左侧调整顺序</span>
      </div>

      <div v-if="!session.products.length" class="empty-products">
        还没有产品，点击"添加产品"开始组建本场直播
      </div>

      <div ref="listEl" class="p-list">
        <div v-for="(sp, idx) in session.products" :key="sp.id" :data-id="sp.product.id" class="p-item card">
          <div class="p-order drag-handle" title="拖拽排序">
            <input
              class="order-input"
              type="number"
              :value="idx + 1"
              min="1"
              :max="session.products.length"
              @mousedown.stop
              @blur="onOrderChange(sp, $event)"
              @keydown.enter="($event.target).blur()"
            >
          </div>
          <div class="p-main" @click="showDetail(sp)">
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
            <button class="btn btn-sm btn-outline edit-sub-btn" @click.stop="editSubmission(sp)">编辑</button>
          </div>
          <button class="p-remove" @click.stop="removeProduct(sp)" title="移除">&times;</button>
        </div>
      </div>
    </template>

    <!-- 产品详情弹窗（全屏） -->
    <div v-if="detailProduct" class="fs-overlay" @click.self="detailProduct = null">
      <div class="fs-panel">
        <div class="fs-hd">
          <div class="fs-hd-left">
            <h2>{{ detailProduct.product.name }}</h2>
            <div class="fs-hd-sub">{{ detailProduct.product.brand }} · {{ detailProduct.product.spec }}</div>
          </div>
          <button class="fs-close" @click="detailProduct = null">&times;</button>
        </div>
        <div class="fs-bd">
          <div class="fs-tags">
            <span v-for="t in parseTags(detailProduct.product.tags)" :key="t" class="tag">{{ t }}</span>
          </div>
          <!-- 提报表附加信息 -->
          <div v-if="getSubmission(detailProduct)" class="detail-submission">
            <!-- 新格式：变体表格 -->
            <template v-if="isGrouped(getSubmission(detailProduct))">
              <table class="variant-table">
                <thead><tr><th>规格</th><th>直播价</th><th>赠品</th></tr></thead>
                <tbody>
                  <tr v-for="(v, vi) in getVariants(getSubmission(detailProduct))" :key="vi">
                    <td>{{ v.productFullName }}</td>
                    <td class="price-cell">{{ v.livePrice || '—' }}</td>
                    <td>{{ v.gifts || '—' }}</td>
                  </tr>
                </tbody>
              </table>
              <div class="common-fields">
                <div v-for="f in getDisplayFields(getSubmission(detailProduct).commonData)" :key="f.key" class="sub-field">
                  <span class="sub-label">{{ f.label }}</span>
                  <span class="sub-value">{{ f.value }}</span>
                </div>
              </div>
            </template>
            <!-- 旧格式兼容 -->
            <template v-else>
              <div v-for="f in getDisplayFields(getSubmission(detailProduct))" :key="f.key" class="sub-field">
                <span class="sub-label">{{ f.label }}</span>
                <span :class="['sub-value', { 'sub-price': f.key === 'livePrice', 'sub-gift': f.key === 'gifts' }]">{{ f.value }}</span>
              </div>
            </template>
          </div>
          <div v-if="detailProduct.product.htmlContent" class="detail-html" v-html="detailProduct.product.htmlContent"></div>
          <div v-else-if="!getSubmission(detailProduct)" class="detail-empty">暂无详细资料</div>
        </div>
      </div>
    </div>

    <!-- 添加产品弹窗 -->
    <div :class="['modal-overlay', { open: showAdd }]" @click.self="closeAdd">
      <div class="modal">
        <div class="modal-hd">
          <h2>添加产品到场次</h2>
          <button class="modal-close" @click="closeAdd">&times;</button>
        </div>
        <div class="modal-bd">
          <input v-model="addSearch" class="input" placeholder="搜索产品名称或品牌..." style="margin-bottom:12px">
          <div v-if="!filteredAvailable.length" style="text-align:center;padding:24px;color:var(--txt2)">
            {{ addSearch ? '没有匹配的产品' : '所有产品都已添加到场次中' }}
          </div>
          <div v-for="p in filteredAvailable" :key="p.id"
            :class="['pick-item', { selected: pickedIds.has(p.id) }]" @click="togglePick(p.id)">
            <div class="pick-emoji">📦</div>
            <div class="pick-info">
              <div class="pick-name">{{ p.name }}</div>
              <div class="pick-sub">{{ p.brand }} · {{ p.spec }}</div>
            </div>
            <div class="pick-check">{{ pickedIds.has(p.id) ? '✓' : '' }}</div>
          </div>
        </div>
        <div class="modal-ft">
          <span style="font-size:13px;color:var(--txt2)">已选 {{ pickedIds.size }} 个</span>
          <button class="btn btn-pri" :disabled="!pickedIds.size" @click="addSelected">添加选中</button>
        </div>
      </div>
    </div>

    <!-- 提报表匹配结果弹窗 -->
    <div :class="['modal-overlay', { open: !!matchResults }]" @click.self="matchResults = null">
      <div v-if="matchResults" class="modal" style="max-width:640px">
        <div class="modal-hd">
          <h2>提报表导入结果</h2>
          <button class="modal-close" @click="matchResults = null">&times;</button>
        </div>
        <div class="modal-bd">
          <div class="match-summary">
            <span class="match-ok">✅ 匹配成功 {{ matchedCount }} 个</span>
            <span v-if="unmatchedCount" class="match-fail">❌ 未匹配 {{ unmatchedCount }} 个</span>
          </div>
          <!-- 匹配列表 -->
          <div v-for="(mr, i) in matchResults" :key="i" class="match-row">
            <div class="match-order">顺序 #{{ mr.group.liveOrder }}</div>
            <div class="match-excel-name">{{ mr.group.variants[0].productFullName }}</div>
            <div v-if="mr.group.variants.length > 1" class="match-variant-count">{{ mr.group.variants.length }} 个规格</div>
            <div v-if="mr.matchedProduct" class="match-result-ok">
              → {{ mr.matchedProduct.name }}
            </div>
            <div v-else class="match-result-fail">
              <input class="input match-search" placeholder="搜索产品名称..."
                v-model="matchSearch[i]" @focus="matchSearchFocus = i">
              <div v-if="matchSearchFocus === i && getMatchProducts(i).length" class="match-dropdown">
                <div v-for="p in getMatchProducts(i)" :key="p.id"
                  class="match-dropdown-item" @click="pickMatch(i, p)">
                  {{ p.name }} <span class="match-dropdown-sub">{{ p.brand }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-ft">
          <button class="btn btn-outline" @click="matchResults = null">取消</button>
          <button class="btn btn-pri" @click="saveSubmission" :disabled="saving">
            {{ saving ? '保存中...' : '确认保存' }}
          </button>
        </div>
      </div>
    </div>
    <!-- 提报表编辑弹窗 -->
    <SubmissionEdit ref="submissionEditRef" @close="onSubmissionEditClose" @saved="onSubmissionSaved" />

    <!-- 直播模式全屏覆盖层 -->
    <LiveMode ref="liveModeRef" :products="session?.products || []" :session-name="session?.name || ''" @close="onLiveClose" />
  </div>
</template>

<script setup>
const route = useRoute()
const sessionId = route.params.id
const { data: session, pending, refresh } = await useFetch(`/api/sessions/${sessionId}`)
const { data: allProducts } = await useFetch('/api/products')
const { parseExcel, matchProducts, getDisplayFields, isGrouped, getVariants } = useSubmission()
const { toast } = useToast()

// --- 直播模式 ---
const liveModeRef = ref(null)
function enterLive() { liveModeRef.value?.enter() }
function onLiveClose() { /* 退出后可刷新数据 */ }

// --- 复制场次 ---
const copying = ref(false)
const router = useRouter()
async function copySession() {
  copying.value = true
  try {
    const copy = await $fetch(`/api/sessions/${sessionId}/copy`, { method: 'POST' })
    toast('场次已复制', 'success')
    router.push(`/sessions/${copy.id}`)
  } catch (e) {
    alert('复制失败: ' + (e.data?.message || e.message))
  } finally {
    copying.value = false
  }
}

// --- 状态切换 ---
const statusOptions = [
  { value: 'prep', label: '准备中', activeClass: 'btn-pri' },
  { value: 'upcoming', label: '即将开播', activeClass: 'btn-pri' },
  { value: 'done', label: '已结束', activeClass: 'btn-pri' },
]
async function changeStatus(status) {
  try {
    await $fetch(`/api/sessions/${sessionId}`, { method: 'PUT', body: { status } })
    session.value.status = status
  } catch (e) {
    alert('状态更新失败: ' + (e.data?.message || e.message))
  }
}

// --- 提报表编辑 ---
const submissionEditRef = ref(null)
function editSubmission(sp) { submissionEditRef.value?.open(sp) }
function onSubmissionEditClose() {}
async function onSubmissionSaved() { await refresh() }

// --- 提报表数据读取（兼容新旧格式）---
function getSubmission(sp) {
  try {
    const obj = JSON.parse(sp.submissionData || '{}')
    if (Array.isArray(obj.variants) && obj.variants.length > 0) return obj
    if (obj.productFullName) return obj
    return null
  } catch { return null }
}

// --- 价格范围计算 ---
function getPriceRange(variants) {
  const prices = variants
    .map(v => v.livePrice)
    .filter(Boolean)
    .map(p => {
      const m = String(p).match(/[\d.]+/)
      return m ? parseFloat(m[0]) : null
    })
    .filter(p => p !== null)
  if (!prices.length) return '—'
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  if (min === max) return `¥${min}`
  return `¥${min} - ¥${max}`
}

// --- 提报表上传 ---
const fileInput = ref(null)
const matchResults = ref(null)
const saving = ref(false)

function triggerUpload() { fileInput.value?.click() }

async function onFileChange(e) {
  const file = e.target.files?.[0]
  if (!file || !session.value) return
  e.target.value = '' // 重置，允许重复选同一文件

  try {
    const groups = await parseExcel(file)
    if (!groups.length) { alert('Excel 中没有有效数据行'); return }
    const results = matchProducts(groups, allProducts.value || [])
    matchResults.value = results
  } catch (err) {
    alert('解析 Excel 失败: ' + err.message)
  }
}

const matchedCount = computed(() => matchResults.value?.filter(r => r.matchedProduct).length || 0)
const unmatchedCount = computed(() => matchResults.value?.filter(r => !r.matchedProduct).length || 0)

// --- 手动匹配搜索 ---
const matchSearch = reactive({})
const matchSearchFocus = ref(null)

function getMatchProducts(i) {
  const q = (matchSearch[i] || '').toLowerCase()
  const products = allProducts.value || []
  if (!q) return products.slice(0, 20)
  return products.filter(p =>
    p.name.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q)
  ).slice(0, 20)
}

function pickMatch(i, product) {
  if (!matchResults.value) return
  matchResults.value[i].matchedProduct = product
  matchSearchFocus.value = null
  matchSearch[i] = ''
}

// 点击其他地方关闭下拉
const closeMatchDropdown = (e) => {
  if (!e.target.closest('.match-result-fail')) matchSearchFocus.value = null
}
onMounted(() => document.addEventListener('click', closeMatchDropdown))
onUnmounted(() => document.removeEventListener('click', closeMatchDropdown))

async function saveSubmission() {
  if (!matchResults.value) return
  saving.value = true
  try {
    // 1. 收集匹配到的产品 ID
    const matchedIds = new Set(
      matchResults.value.filter(r => r.matchedProduct).map(r => r.matchedProduct.id)
    )
    const existingIds = new Set(session.value.products.map(sp => sp.productId))

    // 2. 添加新产品到场次
    const newIds = [...matchedIds].filter(id => !existingIds.has(id))
    for (const productId of newIds) {
      await $fetch(`/api/sessions/${sessionId}/products`, { method: 'POST', body: { productId } })
    }

    // 3. 刷新场次获取最新的 SessionProduct 记录
    if (newIds.length) await refresh()

    // 4. 构建提报表数据（通过 productId 查找对应的 SessionProduct）
    const updates = matchResults.value
      .filter(r => r.matchedProduct)
      .map(r => ({
        productId: r.matchedProduct.id,
        submissionData: {
          liveOrder: r.group.liveOrder,
          variants: r.group.variants,
          commonData: r.group.commonData,
        },
      }))

    // 5. 保存提报表数据
    await $fetch(`/api/sessions/${sessionId}/submission`, {
      method: 'PUT',
      body: { updates },
    })
    await refresh()

    // 6. 按直播顺序重新排序：有 liveOrder 的在前（按 liveOrder 升序），无的在后
    const products = session.value.products
    const withOrder = products
      .filter(sp => {
        try {
          const d = JSON.parse(sp.submissionData || '{}')
          return d.liveOrder != null && d.liveOrder > 0
        } catch { return false }
      })
      .sort((a, b) => {
        const oa = JSON.parse(a.submissionData).liveOrder
        const ob = JSON.parse(b.submissionData).liveOrder
        return oa - ob
      })
    const withoutOrder = products.filter(sp => {
      try {
        const d = JSON.parse(sp.submissionData || '{}')
        return d.liveOrder == null || d.liveOrder <= 0
      } catch { return true }
    })
    const sorted = [...withOrder, ...withoutOrder]
    const order = sorted.map((sp, i) => ({ productId: sp.productId, sortOrder: i + 1 }))
    await $fetch(`/api/sessions/${sessionId}/reorder`, { method: 'PUT', body: { order } })
    await refresh()

    matchResults.value = null
    toast(`已导入 ${updates.length} 个产品的提报表数据`, 'success')
  } catch (e) {
    alert('保存失败: ' + (e.data?.message || e.message))
  } finally {
    saving.value = false
  }
}

// --- 编辑序号排序 ---
async function onOrderChange(sp, evt) {
  const newVal = parseInt(evt.target.value)
  const products = session.value.products
  const oldIdx = products.findIndex(p => p.id === sp.id)
  if (oldIdx < 0 || isNaN(newVal)) { evt.target.value = oldIdx + 1; return }

  const newIdx = Math.max(0, Math.min(newVal - 1, products.length - 1))
  if (newIdx === oldIdx) { evt.target.value = oldIdx + 1; return }

  // 移动产品到新位置
  const moved = products.splice(oldIdx, 1)[0]
  products.splice(newIdx, 0, moved)
  const order = products.map((p, i) => ({ productId: p.productId, sortOrder: i + 1 }))
  try {
    await $fetch(`/api/sessions/${sessionId}/reorder`, { method: 'PUT', body: { order } })
  } catch (e) {
    await refresh()
  }
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
      const products = session.value.products
      const moved = products.splice(evt.oldIndex, 1)[0]
      products.splice(evt.newIndex, 0, moved)
      const order = products.map((sp, i) => ({ productId: sp.productId, sortOrder: i + 1 }))
      try {
        await $fetch(`/api/sessions/${sessionId}/reorder`, { method: 'PUT', body: { order } })
      } catch (e) {
        await refresh()
      }
    }
  })
}

watch(() => session.value?.products?.length, () => { nextTick(initSortable) })
onMounted(() => nextTick(initSortable))
onUnmounted(() => { if (sortableInstance) sortableInstance.destroy() })

// --- 移除产品 ---
async function removeProduct(sp) {
  if (!confirm(`确定移除「${sp.product.name}」？`)) return
  try {
    await $fetch(`/api/sessions/${sessionId}/products/${sp.productId}`, { method: 'DELETE' })
    await refresh()
    toast(`已移除「${sp.product.name}」`, 'success')
  } catch (e) {
    alert('移除失败: ' + (e.data?.message || e.message))
  }
}

// --- 产品详情弹窗 ---
const detailProduct = ref(null)
function showDetail(sp) { detailProduct.value = sp }
function parseTags(tags) { try { return JSON.parse(tags) } catch { return [] } }

// --- 添加产品弹窗 ---
const showAdd = ref(false)
const addSearch = ref('')
const pickedIds = ref(new Set())

const availableProducts = computed(() => {
  if (!session.value || !allProducts.value) return []
  const addedIds = new Set(session.value.products.map(sp => sp.productId))
  return allProducts.value.filter(p => !addedIds.has(p.id))
})
const filteredAvailable = computed(() => {
  const q = addSearch.value.toLowerCase()
  if (!q) return availableProducts.value
  return availableProducts.value.filter(p =>
    p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
  )
})

function openAdd() { pickedIds.value = new Set(); addSearch.value = ''; showAdd.value = true }
function closeAdd() { showAdd.value = false }
function togglePick(id) {
  const s = new Set(pickedIds.value); s.has(id) ? s.delete(id) : s.add(id); pickedIds.value = s
}
async function addSelected() {
  for (const pid of pickedIds.value) {
    await $fetch(`/api/sessions/${sessionId}/products`, { method: 'POST', body: { productId: pid } })
  }
  await refresh(); closeAdd()
  toast(`已添加 ${pickedIds.value.size} 个产品`, 'success')
}
</script>

<style scoped>
.breadcrumb { font-size: 13px; color: var(--txt2); margin-bottom: 16px; }
.breadcrumb a { color: var(--pri); }
.loading { text-align: center; padding: 40px; color: var(--txt2); }
.sess-hd { padding: 24px; margin-bottom: 20px; }
.sess-top { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
.sess-title { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
.sess-meta { display: flex; gap: 8px; align-items: center; font-size: 13px; color: var(--txt2); flex-wrap: wrap; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; }
.status-bar { margin-top: 12px; display: flex; align-items: center; gap: 6px; }
.status-label { font-size: 12px; color: var(--txt2); }
.edit-sub-btn { margin-top: 6px; font-size: 11px; padding: 3px 8px; }
.section-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.section-hd h2 { font-size: 16px; }
.section-hd span { font-size: 13px; color: var(--txt2); }
.empty-products { text-align: center; padding: 40px; color: var(--txt2); font-size: 14px; background: var(--card); border-radius: var(--radius); border: 1px dashed var(--bdr); margin-bottom: 16px; }

/* 产品列表 */
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

/* 产品详情弹窗（全屏） */
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

.detail-meta { font-size: 14px; color: var(--txt2); margin-bottom: 4px; }
.detail-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
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

/* 添加产品弹窗 */
.pick-item { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 8px; cursor: pointer; transition: background 0.15s; border: 1px solid transparent; }
.pick-item:hover { background: var(--pri-l); }
.pick-item.selected { background: var(--pri-l); border-color: var(--pri); }
.pick-emoji { font-size: 28px; width: 40px; text-align: center; }
.pick-info { flex: 1; }
.pick-name { font-size: 14px; font-weight: 500; }
.pick-sub { font-size: 12px; color: var(--txt2); }
.pick-check { width: 22px; height: 22px; border: 2px solid var(--bdr); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #fff; }
.pick-item.selected .pick-check { background: var(--pri); border-color: var(--pri); }

/* 匹配结果弹窗 */
.match-summary { display: flex; gap: 16px; margin-bottom: 16px; font-size: 15px; font-weight: 600; }
.match-ok { color: var(--ok); }
.match-fail { color: var(--red); }
.match-row { padding: 10px 0; border-bottom: 1px solid var(--bdr); }
.match-row:last-child { border-bottom: none; }
.match-excel-name { font-size: 13px; font-weight: 500; margin-bottom: 4px; }
.match-order { font-size: 11px; color: var(--pri); font-weight: 600; margin-bottom: 2px; }
.match-variant-count { font-size: 11px; color: var(--txt2); margin-bottom: 4px; }
.match-result-ok { font-size: 13px; color: var(--ok); }
.match-result-fail { margin-top: 4px; position: relative; }
.match-result-fail .select { width: 100%; font-size: 12px; }
.match-search { font-size: 12px; padding: 6px 10px; width: 100%; }
.match-dropdown {
  position: absolute; left: 0; right: 0; top: 100%; z-index: 10;
  background: var(--card); border: 1px solid var(--bdr); border-radius: 8px;
  max-height: 200px; overflow-y: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.match-dropdown-item {
  padding: 8px 12px; font-size: 13px; cursor: pointer;
  border-bottom: 1px solid var(--bdr);
}
.match-dropdown-item:last-child { border-bottom: none; }
.match-dropdown-item:hover { background: var(--pri-l); }
.match-dropdown-sub { font-size: 11px; color: var(--txt2); margin-left: 6px; }
.modal-ft { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; border-top: 1px solid var(--bdr); }
</style>
