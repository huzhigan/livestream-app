// GET /api/sessions/:id — 返回场次详情（含关联产品列表，按 sortOrder 排序）

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      products: {
        orderBy: { sortOrder: 'asc' },
        include: {
          product: {
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
          }
        }
      }
    }
  })

  if (!session) {
    throw createError({ statusCode: 404, message: '场次不存在' })
  }

  return session
})
