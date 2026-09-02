import 'server-only';
import { prisma, type AuditAction } from '@oasisa2/database';

/** Record an admin change. Called from server actions after a successful mutation. */
export async function writeAudit(params: {
  actorId: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      before: (params.before ?? undefined) as never,
      after: (params.after ?? undefined) as never,
    },
  });
}

export async function recentAudit(limit = 20) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { actor: { select: { firstName: true, lastName: true, email: true } } },
  });
}
