// server/utils/prisma.ts — 全局 Prisma 客户端单例
import { PrismaClient } from '@prisma/client'
import path from 'node:path'

// 生产打包后 file:./dev.db 会被解析到 .output 内部的空库,导致"表不存在"。
// 这里显式指定数据库路径:优先环境变量,否则用"项目目录/prisma/dev.db"。
const dbPath = path.join(process.cwd(), 'prisma', 'dev.db').replace(/\\/g, '/')

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL ?? `file:${dbPath}`
})

export { prisma }
