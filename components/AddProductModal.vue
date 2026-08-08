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
          <template v-if="addedMatch">「{{ search }}」已在当前场次中，无需重复添加</template>
          <template v-else>{{ search ? '没有匹配的产品' : '所有产品都已添加到场次中' }}</template>
        </div>
        <div v-for="p in filtered" :key="p.id"
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
        <button class="btn btn-pri" :disabled="!pickedIds.size" @click="confirm">添加选中</button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  open: { type: Boolean, default: false },
  availableProducts: { type: Array, default: () => [] },
  addedNames: { type: Array, default: () => [] },
})
const emit = defineEmits(['close', 'add'])

const search = ref('')
const pickedIds = ref(new Set())

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return props.availableProducts
  return props.availableProducts.filter(p =>
    p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
  )
})

// 搜索无可选结果,但命中的是已在场次中的产品 → 提示"已在场次中"
const addedMatch = computed(() => {
  const q = search.value.toLowerCase()
  if (!q || filtered.value.length) return false
  return props.addedNames.some(n => n.toLowerCase().includes(q))
})

// 打开时重置选择与搜索词
watch(() => props.open, (v) => {
  if (v) { pickedIds.value = new Set(); search.value = '' }
})

function togglePick(id) {
  const s = new Set(pickedIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
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
.pick-emoji { font-size: 28px; width: 40px; text-align: center; }
.pick-info { flex: 1; }
.pick-name { font-size: 14px; font-weight: 500; }
.pick-sub { font-size: 12px; color: var(--txt2); }
.pick-check { width: 22px; height: 22px; border: 2px solid var(--bdr); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #fff; }
.pick-item.selected .pick-check { background: var(--pri); border-color: var(--pri); }
.modal-ft { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; border-top: 1px solid var(--bdr); }
</style>
