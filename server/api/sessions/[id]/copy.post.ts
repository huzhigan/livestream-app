// POST /api/sessions/:id/copy — 复制场次（保留产品列表和排序，清空提报表数据）
export default defineEventHandler(async (event) => {
  const sessionId = Number(getRouterParam(event, 'id'))

  const original = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { products: { orderBy: { sortOrder: 'asc' } } }
  })
  if (!original) {
    throw createError({ statusCode: 404, message: '场次不存在' })
  }

  // 创建新场次
  const copy = await prisma.session.create({
    data: {
      name: `${original.name} - 副本`,
      date: original.date,
      platform: original.platform,
      notes: original.notes,
      status: 'prep',
    }
  })

  // 复制产品关联（清空 submissionData）
  if (original.products.length) {
    await prisma.sessionProduct.createMany({
      data: original.products.map(sp => ({
        sessionId: copy.id,
        productId: sp.productId,
        sortOrder: sp.sortOrder,
        submissionData: '{}',
      }))
    })
  }

  return copy
})
