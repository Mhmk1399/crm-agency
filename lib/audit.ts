import connectDB from "./db";
import type { SessionPayload } from "./auth";

export interface AuditEntry {
  organisationId: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  source?: string;
  ipAddress?: string;
  requestId?: string;
}

export async function createAuditLog(entry: AuditEntry): Promise<void> {
  const db = await connectDB();
  const AuditLog = db.models.AuditLog ?? (await import("@/models/AuditLog")).default;
  await AuditLog.create({
    ...entry,
    timestamp: new Date(),
  });
}

export function buildAuditEntry(
  session: SessionPayload,
  action: string,
  entityType: string,
  entityId: string,
  opts: {
    previousValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    requestId?: string;
    ipAddress?: string;
  } = {}
): AuditEntry {
  return {
    organisationId: session.organisationId,
    actor: session.userId,
    action,
    entityType,
    entityId,
    ...opts,
  };
}
