<template>
  <div :class="['modal-overlay', { open: !!results }]" @click.self="$emit('close')">
    <div v-if="results" class="modal" style="max-width:640px">
      <div class="modal-hd">
        <h2>提报表导入结果</h2>
        <button class="modal-close" @click="$emit('close')">&times;</button>
      </div>
      <div class="modal-bd">
        <div class="match-summary">
          <span class="match-ok">✅ 匹配成功 {{ matchedCount }} 个</span>
          <span v-if="unmatchedCount" class="match-fail">❌ 未匹配 {{ unmatchedCount }} 个</span>
        </div>
        <!-- 匹配列表 -->
        <div v-for="(mr, i) in results" :key="i" class="match-row">
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
        <button class="btn btn-outline" @click="$emit('close')">取消</button>
        <button class="btn btn-pri" @click="confirm" :disabled="saving">
          {{ saving ? '保存中...' : '确认保存' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  results: { type: Array, default: null },     // matchResults
  allProducts: { type: Array, default: () => [] },
  saving: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'save'])

const matchSearch = reactive({})
const matchSearchFocus = ref(null)

const matchedCount = computed(() => props.results?.filter(r => r.matchedProduct).length || 0)
const unmatchedCount = computed(() => props.results?.filter(r => !r.matchedProduct).length || 0)

function getMatchProducts(i) {
  const q = (matchSearch[i] || '').toLowerCase()
  const products = props.allProducts
  if (!q) return products.slice(0, 20)
  return products.filter(p =>
    p.name.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q)
  ).slice(0, 20)
}

function pickMatch(i, product) {
  if (!props.results) return
  props.results[i].matchedProduct = product
  matchSearchFocus.value = null
  matchSearch[i] = ''
}

// 点击其他地方关闭下拉
const closeMatchDropdown = (e) => {
  if (!e.target.closest('.match-result-fail')) matchSearchFocus.value = null
}
onMounted(() => document.addEventListener('click', closeMatchDropdown))
onUnmounted(() => document.removeEventListener('click', closeMatchDropdown))

function confirm() {
  if (!props.results) return
  const updates = props.results
    .filter(r => r.matchedProduct)
    .map(r => ({
      productId: r.matchedProduct.id,
      submissionData: {
        liveOrder: r.group.liveOrder,
        variants: r.group.variants,
        commonData: r.group.commonData,
      },
    }))
  emit('save', updates)
}
</script>

<style scoped>
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
