// GET /api/sessions — 返回场次列表（含产品数量统计）

export default defineEventHandler(async () => {
  const sessions = await prisma.session.findMany({
    orderBy: { date: 'desc' },
    include: {
      _count: { select: { products: true } }
    }
  })
  return sessions
})
