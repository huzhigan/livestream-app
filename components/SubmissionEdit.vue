<template>
  <Teleport to="body">
    <div :class="['modal-overlay', { open: show }]" @click.self="close">
      <div v-if="show" class="modal" style="max-width:640px">
        <div class="modal-hd">
          <h2>编辑提报表信息</h2>
          <button class="modal-close" @click="close">&times;</button>
        </div>
        <div class="modal-bd">
          <div v-if="productName" class="edit-product-name">{{ productName }}</div>

          <!-- 变体编辑：每个规格一行 -->
          <div v-if="variantForms.length > 0" class="variant-section">
            <div class="variant-section-hd">规格价格与赠品</div>
            <div v-for="(v, i) in variantForms" :key="i" class="variant-edit-row">
              <div class="variant-row-hd">
                <input v-model="v.productFullName" class="input variant-name-input" placeholder="规格名称">
                <button v-if="variantForms.length > 1" class="variant-remove" @click="removeVariant(i)" title="删除此规格">&times;</button>
              </div>
              <div class="variant-inputs">
                <div class="form-group">
                  <label>直播价</label>
                  <input v-model="v.livePrice" class="input" placeholder="例: 249元/盒">
                </div>
                <div class="form-group">
                  <label>赠品</label>
                  <input v-model="v.gifts" class="input" placeholder="无赠品填 /">
                </div>
              </div>
            </div>
            <button class="btn btn-sm btn-outline variant-add" @click="addVariant">➕ 添加规格</button>
          </div>

          <!-- 旧格式（无变体数据）：直接显示价格和赠品 -->
          <div v-else class="form-grid">
            <div class="form-group">
              <label>直播到手价</label>
              <input v-model="singlePrice" class="input" placeholder="例: 79.9">
            </div>
            <div class="form-group">
              <label>赠品</label>
              <input v-model="singleGifts" class="input" placeholder="例: 香氛卡*2">
            </div>
          </div>

          <!-- 公共字段 -->
          <div class="form-grid" style="margin-top:16px">
            <div class="form-group">
              <label>日常价</label>
              <input v-model="form.retailPrice" class="input" placeholder="例: 149.9">
            </div>
            <div class="form-group">
              <label>优惠方式</label>
              <input v-model="form.discountType" class="input" placeholder="例: 拍立减">
            </div>
            <div class="form-group">
              <label>赠品配送</label>
              <input v-model="form.giftDelivery" class="input" placeholder="例: 随单">
            </div>
            <div class="form-group">
              <label>发货地</label>
              <input v-model="form.shipFrom" class="input" placeholder="例: 义乌/广州">
            </div>
            <div class="form-group">
              <label>发货时效</label>
              <input v-model="form.shipTime" class="input" placeholder="例: 48h">
            </div>
            <div class="form-group">
              <label>保质期</label>
              <input v-model="form.expiryInfo" class="input" placeholder="例: 2026年 3年">
            </div>
            <div class="form-group full-width">
              <label>店铺服务</label>
              <input v-model="form.shopService" class="input" placeholder="例: 支持7天无理由">
            </div>
          </div>
        </div>
        <div class="modal-ft">
          <button class="btn btn-outline" @click="close">取消</button>
          <button class="btn btn-pri" @click="save" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const emit = defineEmits(['close', 'saved'])

const show = ref(false)
const saving = ref(false)
const productName = ref('')
const sessionProduct = ref(null)

const COMMON_FIELDS = [
  'retailPrice', 'discountType', 'giftDelivery',
  'shipFrom', 'shipTime', 'shopService', 'expiryInfo'
]

const form = reactive(Object.fromEntries(COMMON_FIELDS.map(f => [f, ''])))
const variantForms = ref([])
const singlePrice = ref('')
const singleGifts = ref('')

function open(sp) {
  sessionProduct.value = sp
  productName.value = sp.product?.name || ''
  try {
    const data = JSON.parse(sp.submissionData || '{}')
    if (Array.isArray(data.variants) && data.variants.length > 0) {
      const common = data.commonData || {}
      COMMON_FIELDS.forEach(f => { form[f] = common[f] || '' })
      variantForms.value = data.variants.map(v => ({
        productFullName: v.productFullName || '',
        livePrice: v.livePrice || '',
        gifts: v.gifts || '',
      }))
    } else {
      COMMON_FIELDS.forEach(f => { form[f] = data[f] || '' })
      singlePrice.value = data.livePrice || ''
      singleGifts.value = data.gifts || ''
      variantForms.value = []
    }
  } catch {
    COMMON_FIELDS.forEach(f => { form[f] = '' })
    singlePrice.value = ''
    singleGifts.value = ''
    variantForms.value = []
  }
  show.value = true
}

function close() {
  show.value = false
  emit('close')
}

async function save() {
  if (!sessionProduct.value) return
  saving.value = true
  try {
    const sessionId = sessionProduct.value.sessionId
    const productId = sessionProduct.value.productId

    let existingData = {}
    try { existingData = JSON.parse(sessionProduct.value.submissionData || '{}') } catch {}

    let submissionData
    if (Array.isArray(existingData.variants) && existingData.variants.length > 0) {
      // 分组格式：更新所有变体的价格/赠品 + 公共字段（过滤全空行）
      const cleanedVariants = variantForms.value
        .map(v => ({
          productFullName: v.productFullName,
          livePrice: v.livePrice || '',
          gifts: v.gifts || '',
        }))
        .filter(v => v.productFullName || v.livePrice || v.gifts)
      submissionData = {
        liveOrder: existingData.liveOrder,
        variants: cleanedVariants.length > 0 ? cleanedVariants : existingData.variants,
        commonData: {
          retailPrice: form.retailPrice || undefined,
          discountType: form.discountType || undefined,
          giftDelivery: form.giftDelivery || undefined,
          shipFrom: form.shipFrom || undefined,
          shipTime: form.shipTime || undefined,
          shopService: form.shopService || undefined,
          expiryInfo: form.expiryInfo || undefined,
        },
      }
    } else {
      // 旧格式
      submissionData = { productFullName: existingData.productFullName || '' }
      COMMON_FIELDS.forEach(f => { if (form[f]) submissionData[f] = form[f] })
      if (singlePrice.value) submissionData.livePrice = singlePrice.value
      if (singleGifts.value) submissionData.gifts = singleGifts.value
    }

    await $fetch(`/api/sessions/${sessionId}/submission`, {
      method: 'PUT',
      body: { updates: [{ productId, submissionData }] }
    })
    close()
    emit('saved')
  } catch (e) {
    alert('保存失败: ' + (e.data?.message || e.message))
  } finally {
    saving.value = false
  }
}

function addVariant() {
  variantForms.value.push({ productFullName: '', livePrice: '', gifts: '' })
}

function removeVariant(index) {
  if (variantForms.value.length > 1) {
    variantForms.value.splice(index, 1)
  }
}

defineExpose({ open })
</script>

<style scoped>
.edit-product-name { font-weight: 600; font-size: 15px; margin-bottom: 16px; color: var(--txt); }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-group { display: flex; flex-direction: column; }
.form-group.full-width { grid-column: 1 / -1; }
.form-group label { font-size: 12px; color: var(--txt2); margin-bottom: 4px; }
.form-group .input { font-size: 13px; padding: 8px 10px; }

/* 多变体编辑区域 */
.variant-section { margin-bottom: 16px; }
.variant-section-hd { font-size: 13px; font-weight: 600; color: var(--txt2); margin-bottom: 10px; }
.variant-edit-row {
  background: var(--bg); border-radius: 8px; padding: 10px 14px;
  margin-bottom: 8px; border: 1px solid var(--bdr);
}
.variant-row-hd { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.variant-name-input { flex: 1; font-size: 13px; font-weight: 500; padding: 6px 10px; }
.variant-remove {
  background: none; border: none; color: var(--txt2); font-size: 18px;
  cursor: pointer; padding: 2px 6px; border-radius: 4px; line-height: 1;
}
.variant-remove:hover { color: #EF4444; background: #FEF2F2; }
.variant-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.variant-add { margin-top: 4px; font-size: 12px; }
</style>
