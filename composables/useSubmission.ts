// composables/useSubmission.ts — 提报表 Excel 解析与产品匹配逻辑

// 小红书平台列索引 → 字段名映射（新版含直播顺序列，共 19 列 A-S）
const XHS_COLUMNS: Record<number, string> = {
  0: 'liveOrder',         // A: 直播顺序
  1: 'productFullName',   // B: 品牌名-产品名-规格
  3: 'retailPrice',       // D: 日常/官方价
  5: 'livePrice',         // F: 直播到手价
  6: 'discountType',      // G: 优惠方式
  7: 'gifts',             // H: 直播赠品
  11: 'giftDelivery',     // L: 赠品配送方式
  12: 'shipFrom',         // M: 发货地
  13: 'shipTime',         // N: 发货时效
  16: 'shopService',      // Q: 店铺服务
  17: 'expiryInfo',       // R: 保质期/到期日期
}
// C(图片) E(卖点) I(赠品图片) J(佣金) K(邀请码) O(库存) P(不包邮地区) S(产品链接) 不导入

export interface ExcelVariant {
  productFullName: string
  livePrice: string
  gifts: string
}

export interface ExcelGroup {
  liveOrder: number
  variants: ExcelVariant[]
  commonData: Record<string, string>
}

export interface MatchResult {
  group: ExcelGroup
  matchedProduct: any | null
  confidence: number
}

// 直播卡片上展示的公共字段及中文标签（变体字段单独用表格展示）
const DISPLAY_LABELS: Record<string, string> = {
  retailPrice: '日常价',
  discountType: '优惠方式',
  shipFrom: '发货地',
  shipTime: '发货时效',
  shopService: '店铺服务',
  expiryInfo: '保质期',
}

export function useSubmission() {

  /** 解析 Excel 文件，按直播顺序分组返回 */
  async function parseExcel(file: File): Promise<ExcelGroup[]> {
    const XLSX = await import('xlsx')
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })

    const sheetName = wb.SheetNames.find(n => n.includes('直播产品信息')) || wb.SheetNames[0]
    const ws = wb.Sheets[sheetName]
    const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 })

    if (raw.length < 3) return []

    // 处理合并单元格：将合并区域顶部的值填充到下方各行
    if (ws['!merges']) {
      for (const merge of ws['!merges']) {
        const topVal = raw[merge.s.r]?.[merge.s.c]
        if (topVal != null) {
          for (let r = merge.s.r + 1; r <= merge.e.r; r++) {
            if (!raw[r]) raw[r] = []
            raw[r][merge.s.c] = topVal
          }
        }
      }
    }

    // 跳过第1行（表头），去掉最后一行（品牌方注意事项）
    const dataRows = raw.slice(1, -1)

    // 按直播顺序号分组（保持 Excel 中出现顺序）
    const groupMap = new Map<number, { variants: ExcelVariant[]; common: Record<string, string> }>()

    for (const row of dataRows) {
      const obj: Record<string, string> = {}
      for (const [colIdx, field] of Object.entries(XHS_COLUMNS)) {
        const val = row[Number(colIdx)]
        if (val !== undefined && val !== null && String(val).trim()) {
          obj[field] = String(val).trim()
        }
      }

      if (!obj.productFullName) continue

      const orderNum = obj.liveOrder ? Number(obj.liveOrder) : 0
      if (!groupMap.has(orderNum)) {
        groupMap.set(orderNum, { variants: [], common: {} })
      }
      const group = groupMap.get(orderNum)!

      // 变体字段：每行独立
      group.variants.push({
        productFullName: obj.productFullName,
        livePrice: obj.livePrice || '',
        gifts: obj.gifts || '',
      })

      // 公共字段：取组内第一个非空值
      const COMMON_KEYS = ['retailPrice', 'discountType', 'giftDelivery', 'shipFrom', 'shipTime', 'shopService', 'expiryInfo']
      for (const key of COMMON_KEYS) {
        if (!group.common[key] && obj[key]) {
          group.common[key] = obj[key]
        }
      }
    }

    return Array.from(groupMap.entries()).map(([liveOrder, g]) => ({
      liveOrder,
      variants: g.variants,
      commonData: g.common,
    }))
  }

  /** 标准化：小写 + 去空格/标点/特殊符号 */
  function normalize(s: string): string {
    return s.toLowerCase()
      .replace(/[\s·\-–—_.,，。、;；:：!！?？'"\"'""()（）\[\]【】{}|\\@#$%^&*+=<>~`/]/g, '')
  }

  /** 提取核心名称（不含品牌前缀）：去掉括号和品牌·前缀 */
  function getCoreName(name: string): string {
    let core = name.replace(/[（(][^）)]*[）)]/g, '').trim()
    const dotIdx = core.indexOf('·')
    if (dotIdx > 0 && dotIdx < core.length - 1) {
      core = core.slice(dotIdx + 1).trim()
    }
    return core
  }

  /** 提取完整名称（含品牌前缀）：只去掉括号 */
  function getFullName(name: string): string {
    return name.replace(/[（(][^）)]*[）)]/g, '').trim()
  }

  /** 从 Excel 全名中提取品牌前缀（第一个 - 之前的部分，仅在有多段时提取） */
  function extractExcelBrand(fullName: string): string {
    const parts = fullName.split(/[-—]/)
    return parts.length >= 3 ? parts[0].trim() : ''
  }

  /** 最长公共子串 */
  function longestCommonSubstring(a: string, b: string): string {
    if (!a || !b) return ''
    const lenB = b.length
    const dp = new Array(lenB + 1).fill(0)
    let maxLen = 0, endIdx = 0
    for (let i = 1; i <= a.length; i++) {
      for (let j = lenB; j >= 1; j--) {
        if (a[i - 1] === b[j - 1]) {
          dp[j] = dp[j - 1] + 1
          if (dp[j] > maxLen) { maxLen = dp[j]; endIdx = j }
        } else {
          dp[j] = 0
        }
      }
    }
    return b.slice(endIdx - maxLen, endIdx)
  }

  /** 将 Excel 分组与产品库做模糊匹配（优化版） */
  function matchProducts(groups: ExcelGroup[], products: any[]): MatchResult[] {
    return groups.map(group => {
      const rawName = group.variants[0]?.productFullName || ''
      const normFull = normalize(rawName)
      const excelBrand = normalize(extractExcelBrand(rawName))
      // 去掉品牌前缀后的名称部分（用于名称对比）
      const normNameOnly = excelBrand
        ? normalize(rawName.replace(/^[^-—]*[-—]/, ''))
        : normFull

      let bestProduct: any = null
      let bestScore = 0

      for (const p of products) {
        const rawDbName = p.name || ''
        const rawDbBrand = p.brand || ''
        const normDbBrand = normalize(rawDbBrand)
        const normCoreName = normalize(getCoreName(rawDbName))

        // 计算品牌得分
        let brandScore = 0
        if (normDbBrand.length >= 2) {
          if (normFull.includes(normDbBrand)) {
            brandScore = 3
          } else if (excelBrand && (normDbBrand.includes(excelBrand) || excelBrand.includes(normDbBrand))) {
            brandScore = 3
          } else {
            const brandAlpha = normDbBrand.replace(/[^a-z]/g, '')
            const brandCjk = normDbBrand.replace(/[^一-鿿]/g, '')
            if (brandAlpha.length >= 3 && normFull.includes(brandAlpha)) brandScore = 2
            else if (brandCjk.length >= 2 && normFull.includes(brandCjk)) brandScore = 2
          }
        }

        // 名称评分函数
        function calcNameScore(candidate: string): number {
          if (candidate.length >= 4 && normFull.includes(candidate)) return 5
          if (candidate.length >= 3 && normFull.includes(candidate)) return 3
          if (normNameOnly.length >= 4 && candidate.includes(normNameOnly)) return 4
          if (normNameOnly.length >= 4 && normNameOnly.includes(candidate)) return 4
          const lcs = longestCommonSubstring(normFull, candidate)
          const coverage = candidate.length > 0 ? lcs.length / candidate.length : 0
          let ns = 0
          if (lcs.length >= 6) ns = 4
          else if (lcs.length >= 4) ns = 3
          else if (lcs.length >= 3) ns = 2
          if (coverage >= 0.6 && lcs.length >= 3) ns += 1
          return ns
        }

        // 方案 A：品牌得分 + 核心名称得分（品牌与名称分开计算，不重复计分）
        const coreNameScore = calcNameScore(normCoreName)
        const scoreA = brandScore + coreNameScore

        // 方案 B：完整名称得分（品牌已含在名称中，不单独加品牌分）
        const normDbFullName = normalize(getFullName(rawDbName))
        const fullNameScore = calcNameScore(normDbFullName)
        const scoreB = fullNameScore

        // 取两者较高值
        const score = Math.max(scoreA, scoreB)

        if (score > bestScore) {
          bestScore = score
          bestProduct = p
        }
      }

      return {
        group,
        matchedProduct: bestScore >= 5 ? bestProduct : null,
        confidence: bestScore,
      }
    })
  }

  /** 从 submissionData 中提取公共展示字段 */
  function getDisplayFields(data: Record<string, string>) {
    if (!data) return []
    return Object.entries(data)
      .filter(([key, val]) => DISPLAY_LABELS[key] && val)
      .map(([key, value]) => ({ key, label: DISPLAY_LABELS[key], value }))
  }

  /** 检查 submissionData 是否为新的分组格式 */
  function isGrouped(data: any): boolean {
    return data && Array.isArray(data.variants) && data.variants.length > 0
  }

  /** 获取变体列表（兼容旧格式，过滤全空的脏数据行） */
  function getVariants(data: any): ExcelVariant[] {
    if (!data) return []
    if (Array.isArray(data.variants)) {
      return data.variants
        .map((v: any) => ({
          productFullName: typeof v === 'string' ? v : v.productFullName || '',
          livePrice: typeof v === 'string' ? '' : v.livePrice || '',
          gifts: typeof v === 'string' ? '' : v.gifts || '',
        }))
        .filter(v => v.productFullName || v.livePrice || v.gifts)
    }
    // 旧格式兼容：productFullName 是字符串
    if (data.productFullName) {
      return [{
        productFullName: data.productFullName,
        livePrice: data.livePrice || '',
        gifts: data.gifts || '',
      }]
    }
    return []
  }

  return { parseExcel, matchProducts, getDisplayFields, isGrouped, getVariants }
}
