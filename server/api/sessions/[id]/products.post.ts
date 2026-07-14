// POST /api/sessions/:id/products — 添加产品到场次

export default defineEventHandler(async (event) => {
  const sessionId = Number(getRouterParam(event, 'id'))
  const body = await getBody(event)

  if (!body.productId) {
    throw createError({ statusCode: 400, message: '缺少 productId' })
  }

  // 检查场次存在
  const session = await prisma.session.findUnique({ where: { id: sessionId } })
  if (!session) {
    throw createError({ statusCode: 404, message: '场次不存在' })
  }

  // 检查是否已添加
  const existing = await prisma.sessionProduct.findUnique({
    where: { sessionId_productId: { sessionId, productId: body.productId } }
  })
  if (existing) {
    throw createError({ statusCode: 409, message: '该产品已在此场次中' })
  }

  // 计算下一个排序号
  const maxSort = await prisma.sessionProduct.findFirst({
    where: { sessionId },
    orderBy: { sortOrder: 'desc' }
  })

  const sp = await prisma.sessionProduct.create({
    data: {
      sessionId,
      productId: body.productId,
      sortOrder: (maxSort?.sortOrder || 0) + 1
    },
    include: { product: true }
  })

  return sp
})
