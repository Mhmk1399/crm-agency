import { nanoid } from "nanoid";
import { headers } from "next/headers";

export function generateRequestId(): string {
  return `req_${nanoid(16)}`;
}

export async function getRequestId(): Promise<string> {
  const hdrs = await headers();
  return hdrs.get("x-request-id") ?? generateRequestId();
}
