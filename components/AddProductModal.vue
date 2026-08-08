<template>
  <div :class="['modal-overlay', { open }]" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-hd">
        <h2>添加产品到场次</h2>
        <button class="modal-close" @click="$emit('close')">&times;</button>
      </div>
      <div class="modal-bd">
        <input v-model="search" class="input" placeholder="搜索产品名称或品牌..." style="margin-bottom:12px">
        <div v-if="!filtered.length" style="text-align:center;padding:24px;color:var(--txt2)">
          {{ search ? '没有匹配的产品' : '产品库为空' }}
        </div>
        <div v-for="p in filtered" :key="p.id"
          :class="['pick-item', { selected: pickedIds.has(p.id), added: isAdded(p.id) }]"
          @click="onClick(p)">
          <div class="pick-emoji">📦</div>
          <div class="pick-info">
            <div class="pick-name">{{ p.name }}</div>
            <div class="pick-sub">{{ p.brand }} · {{ p.spec }}</div>
          </div>
          <span v-if="isAdded(p.id)" class="pick-added-tag">已添加</span>
          <div class="pick-check">{{ (pickedIds.has(p.id) || isAdded(p.id)) ? '✓' : '' }}</div>
        </div>
      </div>
      <div class="modal-ft">
        <span style="font-size:13px;color:var(--txt2)">新选 {{ pickedIds.size }} 个 · 已添加 {{ addedCount }} 个</span>
        <button class="btn btn-pri" :disabled="!pickedIds.size" @click="confirm">添加选中</button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  open: { type: Boolean, default: false },
  allProducts: { type: Array, default: () => [] },
  addedIds: { type: Array, default: () => [] }, // 当前场次已有的 productId
})
const emit = defineEmits(['close', 'add'])

const search = ref('')
const pickedIds = ref(new Set()) // 仅本次新勾选的

const addedSet = computed(() => new Set(props.addedIds))
const addedCount = computed(() => props.addedIds.length)
function isAdded(id) { return addedSet.value.has(id) }

// 搜索全部产品(含已添加),已添加的打勾展示但不可重复加
const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return props.allProducts
  return props.allProducts.filter(p =>
    p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
  )
})

// 打开时重置选择与搜索词
watch(() => props.open, (v) => {
  if (v) { pickedIds.value = new Set(); search.value = '' }
})

function onClick(p) {
  if (isAdded(p.id)) return // 已添加的不可再勾选
  const s = new Set(pickedIds.value)
  s.has(p.id) ? s.delete(p.id) : s.add(p.id)
  pickedIds.value = s
}

function confirm() {
  if (!pickedIds.value.size) return
  emit('add', [...pickedIds.value])
}
</script>

<style scoped>
.pick-item { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 8px; cursor: pointer; transition: background 0.15s; border: 1px solid transparent; }
.pick-item:hover { background: var(--pri-l); }
.pick-item.selected { background: var(--pri-l); border-color: var(--pri); }
.pick-item.added { opacity: 0.6; cursor: default; }
.pick-item.added:hover { background: transparent; }
.pick-emoji { font-size: 28px; width: 40px; text-align: center; }
.pick-info { flex: 1; }
.pick-name { font-size: 14px; font-weight: 500; }
.pick-sub { font-size: 12px; color: var(--txt2); }
.pick-added-tag { font-size: 11px; color: var(--ok); background: #ECFDF5; padding: 2px 8px; border-radius: 999px; }
.pick-check { width: 22px; height: 22px; border: 2px solid var(--bdr); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #fff; }
.pick-item.selected .pick-check { background: var(--pri); border-color: var(--pri); }
.pick-item.added .pick-check { background: var(--ok); border-color: var(--ok); }
.modal-ft { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; border-top: 1px solid var(--bdr); }
</style>
