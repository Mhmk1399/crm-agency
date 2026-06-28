import { destroySession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateRequestId } from "@/lib/correlation";

export async function POST() {
  const requestId = generateRequestId();
  try {
    await destroySession();
    return successResponse({ loggedOut: true }, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
