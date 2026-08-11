// GET /api/products — 返回产品列表（仅摘要字段；完整详情按 id 懒加载）
export default defineEventHandler(async () => {
  const products = await prisma.product.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true,
      name: true,
      brand: true,
      spec: true,
      category: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
    }
  })
  return products
})
