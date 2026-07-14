// GET /api/products — 返回产品列表
// prisma 从 server/utils/prisma.ts 自动导入

export default defineEventHandler(async () => {
  const products = await prisma.product.findMany({
    orderBy: { id: 'asc' }
  })
  return products
})
