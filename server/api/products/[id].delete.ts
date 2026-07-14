// DELETE /api/products/:id — 删除产品（级联删除关联的 SessionProduct）
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  const existing = await prisma.product.findUnique({
    where: { id },
    include: { _count: { select: { sessions: true } } }
  })
  if (!existing) {
    throw createError({ statusCode: 404, message: '产品不存在' })
  }

  // 返回关联场次数量供前端确认
  if (event.method === 'GET') {
    return { sessionCount: existing._count.sessions }
  }

  await prisma.product.delete({ where: { id } })
  return { success: true, sessionCount: existing._count.sessions }
})
