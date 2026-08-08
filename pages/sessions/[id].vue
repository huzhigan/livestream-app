<template>
  <div class="wrap">
    <div class="breadcrumb"><NuxtLink to="/sessions">直播场次</NuxtLink> / {{ session?.name || '...' }}</div>

    <div v-if="pending" class="loading">加载中...</div>
    <template v-else-if="session">
      <SessionHeader
        :session="session"
        :copying="copying"
        @enter-live="enterLive"
        @copy="copySession"
        @delete="deleteSession"
        @change-status="changeStatus"
        @open-add="openAdd"
        @upload-file="onUploadFile"
      />

      <div class="section-hd">
        <h2>产品列表</h2>
        <span>{{ session.products.length }} 个产品 · 编辑序号或拖拽左侧调整顺序</span>
      </div>

      <div v-if="!session.products.length" class="empty-products">
        还没有产品，点击"添加产品"开始组建本场直播
      </div>

      <ProductList
        v-else
        :products="session.products"
        @reorder="onReorder"
        @show-detail="showDetail"
        @edit-submission="editSubmission"
        @remove="removeProduct"
      />
    </template>

    <ProductDetailOverlay :sp="detailProduct" @close="detailProduct = null" />

    <AddProductModal
      :open="showAdd"
      :available-products="availableProducts"
      @close="closeAdd"
      @add="onAdd"
    />

    <MatchResultModal
      :results="matchResults"
      :all-products="allProducts || []"
      :saving="saving"
      @close="matchResults = null"
      @save="onSaveImport"
    />

    <SubmissionEdit ref="submissionEditRef" @close="onSubmissionEditClose" @saved="onSubmissionSaved" />

    <LiveMode ref="liveModeRef" :products="session?.products || []" :session-name="session?.name || ''" @close="onLiveClose" />
  </div>
</template>

<script setup>
const route = useRoute()
const sessionId = route.params.id
const { data: session, pending, refresh } = await useFetch(`/api/sessions/${sessionId}`)
const { data: allProducts } = await useFetch('/api/products')
const { parseExcel, matchProducts } = useSubmission()
const { toast } = useToast()

// --- 直播模式 ---
const liveModeRef = ref(null)
function enterLive() { liveModeRef.value?.enter() }
function onLiveClose() {}

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

// --- 删除场次 ---
async function deleteSession() {
  if (!confirm(`确定删除场次「${session.value.name}」？\n其下的产品编排和提报表数据将一并删除，不可恢复。`)) return
  try {
    await $fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' })
    toast('场次已删除', 'success')
    router.push('/sessions')
  } catch (e) {
    alert('删除失败: ' + (e.data?.message || e.message))
  }
}

// --- 状态切换 ---
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

// --- 产品详情弹窗 ---
const detailProduct = ref(null)
function showDetail(sp) { detailProduct.value = sp }

// --- 添加产品弹窗 ---
const showAdd = ref(false)
const availableProducts = computed(() => {
  if (!session.value || !allProducts.value) return []
  const addedIds = new Set(session.value.products.map(sp => sp.productId))
  return allProducts.value.filter(p => !addedIds.has(p.id))
})
function openAdd() { showAdd.value = true }
function closeAdd() { showAdd.value = false }
async function onAdd(productIds) {
  for (const pid of productIds) {
    await $fetch(`/api/sessions/${sessionId}/products`, { method: 'POST', body: { productId: pid } })
  }
  await refresh()
  closeAdd()
  toast(`已添加 ${productIds.length} 个产品`, 'success')
}

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

// --- 拖拽/序号排序后的持久化（子组件已 mutate 本地数组，这里只负责落库 + 失败回滚）---
async function onReorder(order) {
  try {
    await $fetch(`/api/sessions/${sessionId}/reorder`, { method: 'PUT', body: { order } })
  } catch (e) {
    await refresh()
  }
}

// --- 提报表上传 ---
const matchResults = ref(null)
const saving = ref(false)

async function onUploadFile(file) {
  if (!file || !session.value) return
  try {
    const groups = await parseExcel(file)
    if (!groups.length) { alert('Excel 中没有有效数据行'); return }
    const results = matchProducts(groups, allProducts.value || [])
    matchResults.value = results
  } catch (err) {
    alert('解析 Excel 失败: ' + err.message)
  }
}

async function onSaveImport(updates) {
  if (!updates.length) { matchResults.value = null; return }
  saving.value = true
  try {
    // 1. 添加新产品到场次（匹配到但不在场次里的）
    const existingIds = new Set(session.value.products.map(sp => sp.productId))
    const newIds = updates.map(u => u.productId).filter(id => !existingIds.has(id))
    for (const productId of newIds) {
      await $fetch(`/api/sessions/${sessionId}/products`, { method: 'POST', body: { productId } })
    }
    if (newIds.length) await refresh()

    // 2. 保存提报表数据
    await $fetch(`/api/sessions/${sessionId}/submission`, {
      method: 'PUT',
      body: { updates },
    })
    await refresh()

    // 3. 按直播顺序重排：有 liveOrder 的在前（升序），无的在后
    await reorderByLiveOrder()
    await refresh()

    matchResults.value = null
    toast(`已导入 ${updates.length} 个产品的提报表数据`, 'success')
  } catch (e) {
    alert('保存失败: ' + (e.data?.message || e.message))
  } finally {
    saving.value = false
  }
}

async function reorderByLiveOrder() {
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
}
</script>

<style scoped>
.breadcrumb { font-size: 13px; color: var(--txt2); margin-bottom: 16px; }
.breadcrumb a { color: var(--pri); }
.loading { text-align: center; padding: 40px; color: var(--txt2); }
.section-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.section-hd h2 { font-size: 16px; }
.section-hd span { font-size: 13px; color: var(--txt2); }
.empty-products { text-align: center; padding: 40px; color: var(--txt2); font-size: 14px; background: var(--card); border-radius: var(--radius); border: 1px dashed var(--bdr); margin-bottom: 16px; }
</style>
