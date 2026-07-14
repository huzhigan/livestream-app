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
            <button class="btn btn-outline" @click="showAdd = true">➕ 添加产品</button>
          </div>
        </div>
      </div>

      <!-- 产品列表 -->
      <div class="section-hd">
        <h2>产品列表</h2>
        <span>{{ session.products.length }} 个产品</span>
      </div>

      <div v-if="!session.products.length" class="empty-products">
        还没有产品，点击"添加产品"开始组建本场直播
      </div>

      <div class="p-list">
        <div v-for="sp in session.products" :key="sp.id" class="p-item card">
          <div class="p-order">{{ sp.sortOrder }}</div>
          <div class="p-main">
            <div class="p-name">{{ sp.product.name }}</div>
            <div class="p-brand">{{ sp.product.brand }} · {{ sp.product.spec }}</div>
          </div>
          <div class="live-info">
            <div class="live-info-empty">暂无提报表信息</div>
          </div>
        </div>
      </div>
    </template>

    <!-- 添加产品弹窗 -->
    <div :class="['modal-overlay', { open: showAdd }]" @click.self="showAdd = false">
      <div class="modal">
        <div class="modal-hd">
          <h2>添加产品到场次</h2>
          <button class="modal-close" @click="showAdd = false">&times;</button>
        </div>
        <div class="modal-bd">
          <div v-if="!availableProducts.length" style="text-align:center;padding:24px;color:var(--txt2)">
            所有产品都已添加到场次中
          </div>
          <div v-for="p in availableProducts" :key="p.id" class="pick-item" @click="addProduct(p.id)">
            <div class="pick-emoji">📦</div>
            <div class="pick-info">
              <div class="pick-name">{{ p.name }}</div>
              <div class="pick-sub">{{ p.brand }}</div>
            </div>
            <button class="btn btn-sm btn-outline">添加</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const sessionId = route.params.id

const { data: session, pending, refresh } = await useFetch(`/api/sessions/${sessionId}`)
const { data: allProducts } = await useFetch('/api/products')

const showAdd = ref(false)

// 过滤出未添加到本场次的产品
const availableProducts = computed(() => {
  if (!session.value || !allProducts.value) return []
  const addedIds = new Set(session.value.products.map(sp => sp.productId))
  return allProducts.value.filter(p => !addedIds.has(p.id))
})

async function addProduct(productId) {
  try {
    await $fetch(`/api/sessions/${sessionId}/products`, {
      method: 'POST',
      body: { productId }
    })
    await refresh()
    if (availableProducts.value.length === 0) showAdd.value = false
  } catch (e) {
    alert('添加失败: ' + (e.data?.message || e.message))
  }
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
.p-list { display: flex; flex-direction: column; gap: 10px; }
.p-item { display: flex; overflow: hidden; }
.p-order { width: 44px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: var(--pri); background: var(--pri-l); flex-shrink: 0; }
.p-main { flex: 1; padding: 14px 16px; }
.p-name { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
.p-brand { font-size: 12px; color: var(--txt2); }
.live-info { padding: 14px 16px; border-left: 1px solid var(--bdr); min-width: 180px; background: #FAFBFC; }
.live-info-empty { color: var(--txt2); font-size: 12px; font-style: italic; }
.pick-item { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 8px; cursor: pointer; transition: background 0.15s; }
.pick-item:hover { background: var(--pri-l); }
.pick-emoji { font-size: 28px; width: 40px; text-align: center; }
.pick-info { flex: 1; }
.pick-name { font-size: 14px; font-weight: 500; }
.pick-sub { font-size: 12px; color: var(--txt2); }
</style>
