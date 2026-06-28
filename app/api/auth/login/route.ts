import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod/v4";
import connectDB from "@/lib/db";
import { createSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateRequestId } from "@/lib/correlation";
import { AuthenticationError, ValidationError } from "@/lib/errors";
import User from "@/models/User";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Invalid input", { errors: z.prettifyError(parsed.error) });
    }

    await connectDB();

    const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select("+passwordHash");
    if (!user || !user.isActive) throw new AuthenticationError("Invalid email or password");

    const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!valid) throw new AuthenticationError("Invalid email or password");

    user.lastLoginAt = new Date();
    await user.save();

    await createSession({
      userId: String(user._id),
      organisationId: user.organisationId.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
    });

    return successResponse({
      userId: user._id,
      organisationId: user.organisationId,
      role: user.role,
      name: user.name,
    }, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
