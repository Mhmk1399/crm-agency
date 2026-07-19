import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod/v4";
import connectDB from "@/lib/db";
import { createSession, getSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateRequestId } from "@/lib/correlation";
import { AuthenticationError, ConflictError, ValidationError } from "@/lib/errors";
import { getPermissionsForRole } from "@/lib/permission-store";
import User from "@/models/User";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.email("Invalid email").optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "New password must be at least 6 characters").optional(),
});

export async function GET() {
  const requestId = generateRequestId();
  try {
    const session = await getSession();
    if (!session) throw new AuthenticationError();
    const permissions = await getPermissionsForRole(
      session.role,
      session.organisationId
    );
    return successResponse({ ...session, permissions }, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const session = await getSession();
    if (!session) throw new AuthenticationError();

    const parsed = profileSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("Invalid profile input", {
        errors: z.prettifyError(parsed.error),
      });
    }

    const { name, email, currentPassword, newPassword } = parsed.data;
    if (!name && !email && !newPassword) {
      throw new ValidationError("Nothing to update");
    }

    await connectDB();

    const user = await User.findOne({
      _id: session.userId,
      organisationId: session.organisationId,
    }).select("+passwordHash");
    if (!user) throw new AuthenticationError();

    const normalizedEmail = email?.toLowerCase().trim();
    if (normalizedEmail && normalizedEmail !== user.email) {
      const existing = await User.findOne({
        organisationId: session.organisationId,
        email: normalizedEmail,
        _id: { $ne: user._id },
      }).lean();
      if (existing) throw new ConflictError("Email already exists in this organisation");
      user.email = normalizedEmail;
    }

    if (name) user.name = name.trim();

    if (newPassword) {
      if (!currentPassword) {
        throw new ValidationError("Current password is required to change password");
      }
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) throw new ValidationError("Current password is incorrect");
      user.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    await user.save();
    await createSession({
      userId: session.userId,
      organisationId: session.organisationId,
      role: session.role,
      email: user.email,
      name: user.name,
    });

    const permissions = await getPermissionsForRole(
      session.role,
      session.organisationId
    );

    return successResponse(
      {
        userId: session.userId,
        organisationId: session.organisationId,
        role: session.role,
        email: user.email,
        name: user.name,
        permissions,
      },
      requestId
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
