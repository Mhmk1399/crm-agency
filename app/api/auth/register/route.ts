import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod/v4";
import connectDB from "@/lib/db";
import { createSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateRequestId } from "@/lib/correlation";
import { ConflictError, ValidationError } from "@/lib/errors";
import User from "@/models/User";
import Organisation from "@/models/Organisation";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(8),
  organisationName: z.string().min(2),
});

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Invalid input", { errors: z.prettifyError(parsed.error) });
    }
    const { name, email, password, organisationName } = parsed.data;

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw new ConflictError("Email already registered");

    const slug = organisationName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const org = await Organisation.create({
      name: organisationName,
      slug: `${slug}-${Date.now().toString(36)}`,
      ownerId: new (await import("mongoose")).Types.ObjectId(),
      settings: {},
    });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      name,
      organisationId: org._id,
      role: "owner",
    });

    org.ownerId = user._id as typeof org.ownerId;
    await org.save();

    await createSession({
      userId: String(user._id),
      organisationId: String(org._id),
      role: "owner",
      email: user.email,
      name: user.name,
    });

    return successResponse({ userId: user._id, organisationId: org._id }, requestId, 201);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
