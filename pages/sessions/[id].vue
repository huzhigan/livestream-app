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
            <button class="btn btn-outline" @click="triggerUpload">📥 上传提报表</button>
            <button class="btn btn-outline" @click="openAdd">➕ 添加产品</button>
            <input ref="fileInput" type="file" accept=".xlsx,.xls" style="display:none" @change="onFileChange">
          </div>
        </div>
      </div>

      <!-- 产品列表 -->
      <div class="section-hd">
        <h2>产品列表</h2>
        <span>{{ session.products.length }} 个产品 · 拖拽左侧序号调整讲解顺序</span>
      </div>

      <div v-if="!session.products.length" class="empty-products">
        还没有产品，点击"添加产品"开始组建本场直播
      </div>

      <div ref="listEl" class="p-list">
        <div v-for="(sp, idx) in session.products" :key="sp.id" :data-id="sp.product.id" class="p-item card">
          <div class="p-order drag-handle" title="拖拽排序">{{ idx + 1 }}</div>
          <div class="p-main" @click="showDetail(sp)">
            <div class="p-name">{{ sp.product.name }}</div>
            <div class="p-brand">{{ sp.product.brand }} · {{ sp.product.spec }}</div>
          </div>
          <!-- 提报表信息展示 -->
          <div class="live-info">
            <template v-if="getSubmission(sp)">
              <div class="live-price">{{ getSubmission(sp).livePrice || '—' }}</div>
              <div v-if="getSubmission(sp).gifts" class="live-gifts">🎁 {{ getSubmission(sp).gifts }}</div>
              <div class="live-sub">
                <span v-if="getSubmission(sp).shipFrom">{{ getSubmission(sp).shipFrom }}</span>
                <span v-if="getSubmission(sp).shipTime">· {{ getSubmission(sp).shipTime }}</span>
                <span v-if="getSubmission(sp).stock">· {{ getSubmission(sp).stock }}</span>
              </div>
            </template>
            <div v-else class="live-info-empty">暂无提报表信息</div>
          </div>
          <button class="p-remove" @click.stop="removeProduct(sp)" title="移除">&times;</button>
        </div>
      </div>
    </template>

    <!-- 产品详情弹窗 -->
    <div :class="['modal-overlay', { open: !!detailProduct }]" @click.self="detailProduct = null">
      <div v-if="detailProduct" class="modal" style="max-width:640px">
        <div class="modal-hd">
          <h2>{{ detailProduct.product.name }}</h2>
          <button class="modal-close" @click="detailProduct = null">&times;</button>
        </div>
        <div class="modal-bd">
          <div class="detail-meta">{{ detailProduct.product.brand }} · {{ detailProduct.product.spec }}</div>
          <div class="detail-tags">
            <span v-for="t in parseTags(detailProduct.product.tags)" :key="t" class="tag">{{ t }}</span>
          </div>
          <!-- 提报表附加信息 -->
          <div v-if="getSubmission(detailProduct)" class="detail-submission">
            <div v-for="f in getDisplayFields(getSubmission(detailProduct))" :key="f.key" class="sub-field">
              <span class="sub-label">{{ f.label }}</span>
              <span v-if="f.key === 'productLink'"><a :href="f.value" target="_blank" class="sub-link">查看链接</a></span>
              <span v-else :class="['sub-value', { 'sub-price': f.key === 'livePrice', 'sub-gift': f.key === 'gifts' }]">{{ f.value }}</span>
            </div>
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
            <div class="match-excel-name">{{ mr.excelRow.productFullName }}</div>
            <div v-if="mr.matchedSp" class="match-result-ok">
              → {{ mr.matchedSp.product.name }}
            </div>
            <div v-else class="match-result-fail">
              <select class="select" @change="manualMatch(i, $event)">
                <option value="">手动选择产品...</option>
                <option v-for="sp in session.products" :key="sp.id" :value="sp.id">
                  {{ sp.product.name }}
                </option>
              </select>
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
    <!-- 直播模式全屏覆盖层 -->
    <LiveMode ref="liveModeRef" :products="session?.products || []" :session-name="session?.name || ''" @close="onLiveClose" />
  </div>
</template>

<script setup>
const route = useRoute()
const sessionId = route.params.id
const { data: session, pending, refresh } = await useFetch(`/api/sessions/${sessionId}`)
const { data: allProducts } = await useFetch('/api/products')
const { parseExcel, matchProducts, getDisplayFields } = useSubmission()

// --- 直播模式 ---
const liveModeRef = ref(null)
function enterLive() { liveModeRef.value?.enter() }
function onLiveClose() { /* 退出后可刷新数据 */ }

// --- 提报表数据读取 ---
function getSubmission(sp) {
  try {
    const obj = JSON.parse(sp.submissionData || '{}')
    return obj.productFullName ? obj : null
  } catch { return null }
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
    const rows = await parseExcel(file)
    if (!rows.length) { alert('Excel 中没有有效数据行'); return }
    const results = matchProducts(rows, session.value.products)
    matchResults.value = results
  } catch (err) {
    alert('解析 Excel 失败: ' + err.message)
  }
}

const matchedCount = computed(() => matchResults.value?.filter(r => r.matchedSp).length || 0)
const unmatchedCount = computed(() => matchResults.value?.filter(r => !r.matchedSp).length || 0)

function manualMatch(rowIdx, e) {
  const spId = Number(e.target.value)
  if (!spId || !matchResults.value) return
  const sp = session.value.products.find(s => s.id === spId)
  if (sp) matchResults.value[rowIdx].matchedSp = sp
}

async function saveSubmission() {
  if (!matchResults.value) return
  saving.value = true
  try {
    const updates = matchResults.value
      .filter(r => r.matchedSp)
      .map(r => ({
        productId: r.matchedSp.productId,
        submissionData: r.excelRow,
      }))
    await $fetch(`/api/sessions/${sessionId}/submission`, {
      method: 'PUT',
      body: { updates },
    })
    await refresh()
    matchResults.value = null
  } catch (e) {
    alert('保存失败: ' + (e.data?.message || e.message))
  } finally {
    saving.value = false
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
.actions { display: flex; gap: 8px; }
.section-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.section-hd h2 { font-size: 16px; }
.section-hd span { font-size: 13px; color: var(--txt2); }
.empty-products { text-align: center; padding: 40px; color: var(--txt2); font-size: 14px; background: var(--card); border-radius: var(--radius); border: 1px dashed var(--bdr); margin-bottom: 16px; }

/* 产品列表 */
.p-list { display: flex; flex-direction: column; gap: 8px; }
.p-item { display: flex; overflow: hidden; position: relative; transition: box-shadow 0.2s; }
.p-order { width: 44px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: var(--pri); background: var(--pri-l); flex-shrink: 0; cursor: grab; user-select: none; }
.p-order:active { cursor: grabbing; }
.drag-ghost { opacity: 0.4; background: var(--pri-l); }
.p-main { flex: 1; padding: 14px 16px; cursor: pointer; }
.p-main:hover .p-name { color: var(--pri); }
.p-name { font-size: 14px; font-weight: 600; margin-bottom: 2px; transition: color 0.2s; }
.p-brand { font-size: 12px; color: var(--txt2); }
.p-remove { position: absolute; top: 8px; right: 8px; background: none; border: none; color: var(--bdr); cursor: pointer; font-size: 18px; opacity: 0; transition: opacity 0.2s; padding: 4px 8px; }
.p-item:hover .p-remove { opacity: 1; }
.p-remove:hover { color: #EF4444; }

/* 提报表信息（卡片右侧） */
.live-info { padding: 14px 16px; border-left: 1px solid var(--bdr); min-width: 200px; background: #FAFBFC; }
.live-info-empty { color: var(--txt2); font-size: 12px; font-style: italic; }
.live-price { font-size: 20px; font-weight: 700; color: var(--red); margin-bottom: 4px; }
.live-price::before { content: '¥'; font-size: 14px; }
.live-gifts { font-size: 12px; color: var(--ok); margin-bottom: 4px; }
.live-sub { font-size: 11px; color: var(--txt2); }
.live-sub span + span::before { content: ''; }

/* 产品详情弹窗 */
.detail-meta { font-size: 14px; color: var(--txt2); margin-bottom: 4px; }
.detail-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
.detail-html { font-size: 14px; line-height: 1.8; }
.detail-html :deep(table) { width: 100%; border-collapse: collapse; margin: 8px 0; }
.detail-html :deep(th), .detail-html :deep(td) { padding: 6px 8px; border: 1px solid var(--bdr); text-align: left; font-size: 13px; }
.detail-html :deep(th) { background: var(--bg); }
.detail-empty { text-align: center; padding: 24px; color: var(--txt2); }
.detail-submission { background: #F9FAFB; border: 1px solid var(--bdr); border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }
.sub-field { display: flex; gap: 8px; padding: 4px 0; font-size: 13px; }
.sub-label { color: var(--txt2); min-width: 70px; flex-shrink: 0; }
.sub-value { color: var(--txt); }
.sub-price { color: var(--red); font-weight: 700; font-size: 16px; }
.sub-gift { color: var(--ok); font-weight: 500; }
.sub-link { color: var(--pri); text-decoration: underline; }

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
.match-result-ok { font-size: 13px; color: var(--ok); }
.match-result-fail { margin-top: 4px; }
.match-result-fail .select { width: 100%; font-size: 12px; }
.modal-ft { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; border-top: 1px solid var(--bdr); }
</style>
