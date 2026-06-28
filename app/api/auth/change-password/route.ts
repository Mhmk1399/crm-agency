import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateRequestId } from "@/lib/correlation";
import { AuthenticationError, ValidationError } from "@/lib/errors";
import { decrypt } from "@/lib/auth";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const token = request.cookies.get("session")?.value;
    if (!token) throw new AuthenticationError();
    const session = await decrypt(token);
    if (!session) throw new AuthenticationError();

    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) throw new ValidationError("Both passwords required");
    if (newPassword.length < 6) throw new ValidationError("New password must be at least 6 characters");

    await connectDB();

    const user = await User.findById(session.userId).select("+passwordHash");
    if (!user) throw new AuthenticationError();

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new ValidationError("Current password is incorrect");

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    return successResponse({ message: "Password changed" }, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
