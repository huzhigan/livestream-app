// GET /api/products — 返回产品列表（摘要字段，不含 htmlContent，降低传输体积）
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
      structured: true,
      createdAt: true,
      updatedAt: true,
    }
  })
  return products
})
