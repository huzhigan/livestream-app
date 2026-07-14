<template>
  <div class="wrap">
    <div class="page-hd">
      <h1>产品库</h1>
      <div class="page-actions">
        <button class="btn btn-outline" @click="openImport">📥 批量导入</button>
        <button class="btn btn-pri" @click="openAdd">➕ 新增产品</button>
      </div>
    </div>

    <!-- 搜索和筛选工具栏 -->
    <div class="toolbar">
      <input v-model="search" class="input search" placeholder="搜索产品名称、品牌...">
      <select v-model="catFilter" class="select filter">
        <option value="">全部品类</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
      <select v-model="brandFilter" class="select filter">
        <option value="">全部品牌</option>
        <option v-for="b in brands" :key="b" :value="b">{{ b }}</option>
      </select>
    </div>

    <div class="count">共 {{ filtered.length }} 个产品</div>

    <div v-if="pending" class="loading">加载中...</div>
    <div v-else-if="!filtered.length" class="empty-state">
      {{ search || catFilter || brandFilter ? '没有匹配的产品' : '暂无产品数据' }}
    </div>
    <div v-else class="grid">
      <div v-for="p in filtered" :key="p.id" class="p-card card card-hover" @click="openDetail(p)">
        <div :class="['p-thumb', colorClass(p.category)]">{{ emojiMap[p.category] || '📦' }}</div>
        <div class="p-body">
          <div class="p-name">{{ p.name }}</div>
          <div class="p-brand">{{ p.brand }} · {{ p.spec }}</div>
          <div class="p-tags">
            <span v-for="t in parseTags(p.tags)" :key="t" class="tag">{{ t }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 产品详情弹窗 -->
    <ProductDetailModal
      :product="detailProduct"
      @close="detailProduct = null"
      @edit="onEdit"
      @delete="onDelete"
    />

    <!-- 产品表单弹窗（新增/编辑） -->
    <ProductForm
      ref="formRef"
      :product="editTarget"
      :category-options="categories"
      @close="editTarget = null"
      @saved="onSaved"
    />

    <!-- 批量导入弹窗 -->
    <ProductImport ref="importRef" @close="importDone" @imported="importDone" />
  </div>
</template>

<script setup>
const { data: products, pending, refresh } = await useFetch('/api/products')

// --- 搜索和筛选 ---
const search = ref('')
const catFilter = ref('')
const brandFilter = ref('')
const detailProduct = ref(null)
const editTarget = ref(null)
const formRef = ref(null)
const importRef = ref(null)

const categories = computed(() => {
  if (!products.value) return []
  return [...new Set(products.value.map(p => p.category).filter(Boolean))].sort()
})
const brands = computed(() => {
  if (!products.value) return []
  return [...new Set(products.value.map(p => p.brand).filter(Boolean))].sort()
})

const filtered = computed(() => {
  if (!products.value) return []
  const q = search.value.toLowerCase()
  const cat = catFilter.value
  const brand = brandFilter.value
  return products.value.filter(p => {
    if (q && !p.name.toLowerCase().includes(q) && !p.brand.toLowerCase().includes(q)) return false
    if (cat && p.category !== cat) return false
    if (brand && p.brand !== brand) return false
    return true
  })
})

// --- 品类配色和图标 ---
const colorMap = { '保健品': 'c4', '护肤品': 'c1', '彩妆': 'c5', '个护清洁': 'c2' }
const emojiMap = { '保健品': '💊', '护肤品': '🧴', '彩妆': '💄', '个护清洁': '🧼' }
function colorClass(cat) { return colorMap[cat] || 'c4' }
function parseTags(tags) {
  try { return JSON.parse(tags) } catch { return [] }
}

// --- 详情/新增/编辑/删除 ---
function openDetail(p) { detailProduct.value = p }

function openAdd() {
  editTarget.value = null
  nextTick(() => formRef.value?.open(null))
}

function onEdit(product) {
  detailProduct.value = null
  editTarget.value = product
  nextTick(() => formRef.value?.open(product))
}

async function onDelete(product) {
  const msg = `确定删除「${product.name}」？\n此操作会同时移除该产品在所有场次中的记录，不可恢复。`
  if (!confirm(msg)) return
  try {
    await $fetch(`/api/products/${product.id}`, { method: 'DELETE' })
    detailProduct.value = null
    await refresh()
  } catch (e) {
    alert('删除失败: ' + (e.data?.message || e.message))
  }
}

async function onSaved() {
  await refresh()
}

// --- 批量导入 ---
function openImport() { importRef.value?.open() }
async function importDone() {
  await refresh()
}
</script>

<style scoped>
.page-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-hd h1 { font-size: 22px; }
.page-actions { display: flex; gap: 8px; }
.loading { text-align: center; padding: 40px; color: var(--txt2); }
.empty-state { text-align: center; padding: 48px; color: var(--txt2); font-size: 14px; background: var(--card); border-radius: var(--radius); border: 1px dashed var(--bdr); }

/* 工具栏 */
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.search { flex: 1; min-width: 200px; }
.filter { min-width: 120px; }
.count { font-size: 13px; color: var(--txt2); margin-bottom: 16px; }

/* 产品网格 */
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
.p-card { overflow: hidden; cursor: pointer; }
.p-thumb { height: 140px; display: flex; align-items: center; justify-content: center; font-size: 48px; }
.p-thumb.c1 { background: linear-gradient(135deg, #FDF4FF, #FAE8FF); }
.p-thumb.c2 { background: linear-gradient(135deg, #FFF7ED, #FFEDD5); }
.p-thumb.c3 { background: linear-gradient(135deg, #ECFDF5, #D1FAE5); }
.p-thumb.c4 { background: linear-gradient(135deg, #EFF6FF, #DBEAFE); }
.p-thumb.c5 { background: linear-gradient(135deg, #FEF2F2, #FECACA); }
.p-body { padding: 14px; }
.p-name { font-size: 14px; font-weight: 600; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.p-brand { font-size: 12px; color: var(--txt2); margin-bottom: 8px; }
.p-tags { display: flex; flex-wrap: wrap; gap: 4px; }
</style>
