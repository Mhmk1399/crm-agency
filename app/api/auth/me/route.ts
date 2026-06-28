import { getSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateRequestId } from "@/lib/correlation";
import { AuthenticationError } from "@/lib/errors";

export async function GET() {
  const requestId = generateRequestId();
  try {
    const session = await getSession();
    if (!session) throw new AuthenticationError();
    return successResponse(session, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
