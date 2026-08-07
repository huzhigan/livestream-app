// POST /api/products — 创建新产品
export default defineEventHandler(async (event) => {
  const body = await getBody(event)

  if (!body.name || !body.brand) {
    throw createError({ statusCode: 400, message: '缺少必填字段: name, brand' })
  }

  const product = await prisma.product.create({
    data: {
      name: body.name,
      brand: body.brand,
      spec: body.spec || '',
      category: body.category || '',
      tags: body.tags || '[]',
      htmlContent: body.htmlContent || '',
      structured: body.structured || '',
    }
  })

  return product
})
