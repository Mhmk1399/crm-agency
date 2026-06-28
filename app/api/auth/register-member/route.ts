import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod/v4";
import connectDB from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateRequestId } from "@/lib/correlation";
import { AuthenticationError, ConflictError, ValidationError } from "@/lib/errors";
import { decrypt } from "@/lib/auth";
import { requirePermission, PERMISSIONS } from "@/lib/permissions";
import User from "@/models/User";

const schema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
  role: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const token = request.cookies.get("session")?.value;
    if (!token) throw new AuthenticationError();
    const session = await decrypt(token);
    if (!session) throw new AuthenticationError();
    requirePermission({ role: session.role, permission: PERMISSIONS.TEAM_MANAGE });

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Invalid input", { errors: z.prettifyError(parsed.error) });
    }

    await connectDB();

    const existing = await User.findOne({ email: parsed.data.email.toLowerCase(), organisationId: session.organisationId });
    if (existing) throw new ConflictError("Email already registered in this organisation");

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await User.create({
      email: parsed.data.email.toLowerCase(),
      passwordHash,
      name: parsed.data.name,
      role: parsed.data.role,
      organisationId: session.organisationId,
    });

    return successResponse({ _id: user._id, name: user.name, email: user.email, role: user.role }, requestId, 201);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
