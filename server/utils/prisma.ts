// server/utils/prisma.ts — 全局 Prisma 客户端单例
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export { prisma }
