// 测试数据种子脚本 — 运行: npx tsx server/utils/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('清理旧数据...')
  await prisma.sessionProduct.deleteMany()
  await prisma.session.deleteMany()
  await prisma.product.deleteMany()

  console.log('插入测试产品...')
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: '黑松露净润香氛洗手蜜',
        brand: '绽家 Lycocelle',
        spec: '380g',
        category: '个护清洁',
        tags: JSON.stringify(['洗手', '香氛', '抗老']),
        htmlContent: '<div class="sec"><div class="sell-list"><li class="sell-item"><div class="sell-num">1</div><div class="sell-content"><div class="sell-title">清洁+抗老修护+持久留香三合一</div><div class="sell-desc">黑松露提取物抗氧修护，氨基酸表活温和不刺激</div></div></li></div></div>'
      }
    }),
    prisma.product.create({
      data: {
        name: '复合维生素B胶囊',
        brand: '多特倍斯 Doctors Best',
        spec: '60粒/瓶',
        category: '保健品',
        tags: JSON.stringify(['能量/代谢', '大脑/神经', '肝脏']),
        htmlContent: '<div class="sec"><div class="sell-list"><li class="sell-item"><div class="sell-num">1</div><div class="sell-content"><div class="sell-title">三重活性型配方</div><div class="sell-desc">活性B6(P5P)+活性叶酸(5-MTHF)+甲钴胺(活性B12)，无需肝脏转化</div></div></li></div></div>'
      }
    }),
    prisma.product.create({
      data: {
        name: 'A醇晚霜 2.0',
        brand: 'HBN',
        spec: '50g',
        category: '护肤品',
        tags: JSON.stringify(['抗老', '淡纹', '夜间修护']),
        htmlContent: '<div class="sec"><div class="sell-list"><li class="sell-item"><div class="sell-num">1</div><div class="sell-content"><div class="sell-title">双A醇复配技术</div><div class="sell-desc">0.5%视黄醇+视黄醇棕榈酸酯，渐进式释放</div></div></li></div></div>'
      }
    })
  ])

  console.log(`✅ 已插入 ${products.length} 个测试产品:`)
  products.forEach(p => console.log(`   #${p.id} ${p.name} (${p.brand})`))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
