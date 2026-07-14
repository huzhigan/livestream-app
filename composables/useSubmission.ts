// composables/useSubmission.ts — 提报表 Excel 解析与产品匹配逻辑

// 小红书平台列索引 → 字段名映射
const XHS_COLUMNS: Record<number, string> = {
  0: 'productFullName',   // A: 品牌名-产品名-规格
  2: 'retailPrice',       // C: 日常/官方价
  4: 'livePrice',         // E: 直播到手价
  5: 'discountType',      // F: 优惠方式
  6: 'gifts',             // G: 直播赠品
  10: 'giftDelivery',     // K: 赠品配送方式
  11: 'shipFrom',         // L: 发货地
  12: 'shipTime',         // M: 发货时效
  15: 'shopService',      // P: 店铺服务
  16: 'expiryInfo',       // Q: 保质期/到期日期
}
// B(图片) D(卖点) H(赠品图片) I(佣金) J(邀请码) N(库存) O(不包邮地区) R(产品链接) 不导入

export interface ExcelRow {
  productFullName: string
  [key: string]: string
}

export interface MatchResult {
  excelRow: ExcelRow
  matchedSp: any | null     // 匹配到的 SessionProduct
  confidence: number        // 匹配分数
}

// 直播卡片上展示的字段及中文标签
const DISPLAY_LABELS: Record<string, string> = {
  retailPrice: '日常价',
  livePrice: '直播价',
  discountType: '优惠方式',
  gifts: '赠品',
  giftDelivery: '赠品配送',
  shipFrom: '发货地',
  shipTime: '发货时效',
  shopService: '店铺服务',
  expiryInfo: '保质期',
}

export function useSubmission() {

  /** 解析 Excel 文件，返回数据行数组 */
  async function parseExcel(file: File): Promise<ExcelRow[]> {
    const XLSX = await import('xlsx')
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })

    // 优先找"直播产品信息" sheet，否则取第一个
    const sheetName = wb.SheetNames.find(n => n.includes('直播产品信息')) || wb.SheetNames[0]
    const ws = wb.Sheets[sheetName]
    const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 })

    if (raw.length < 3) return [] // 至少表头 + 1行数据 + 备注行

    // 跳过第1行（表头），去掉最后一行（品牌方注意事项）
    const dataRows = raw.slice(1, -1)

    return dataRows
      .map(row => {
        const obj: Record<string, string> = {}
        for (const [colIdx, field] of Object.entries(XHS_COLUMNS)) {
          const val = row[Number(colIdx)]
          if (val !== undefined && val !== null && String(val).trim()) {
            obj[field] = String(val).trim()
          }
        }
        return obj as ExcelRow
      })
      .filter(row => row.productFullName)
  }

  /** 将 Excel 行与场次产品做模糊匹配 */
  function matchProducts(excelRows: ExcelRow[], sessionProducts: any[]): MatchResult[] {
    return excelRows.map(row => {
      const fullName = row.productFullName.toLowerCase()
      let bestSp: any = null
      let bestScore = 0

      for (const sp of sessionProducts) {
        const p = sp.product
        const name = (p.name || '').toLowerCase()
        const brand = (p.brand || '').toLowerCase()
        const spec = (p.spec || '').toLowerCase()

        let score = 0
        if (name && fullName.includes(name)) score += 3
        if (brand && fullName.includes(brand)) score += 2
        if (spec && spec.length >= 2 && fullName.includes(spec)) score += 1

        if (score > bestScore) {
          bestScore = score
          bestSp = sp
        }
      }

      return {
        excelRow: row,
        matchedSp: bestScore >= 3 ? bestSp : null,
        confidence: bestScore,
      }
    })
  }

  /** 从 submissionData 中提取需要展示的字段列表 */
  function getDisplayFields(data: Record<string, string>) {
    if (!data) return []
    return Object.entries(data)
      .filter(([key, val]) => DISPLAY_LABELS[key] && val)
      .map(([key, value]) => ({ key, label: DISPLAY_LABELS[key], value }))
  }

  return { parseExcel, matchProducts, getDisplayFields }
}
