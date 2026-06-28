import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateRequestId } from "@/lib/correlation";
import Organisation from "@/models/Organisation";
import User from "@/models/User";
import TeamMemberProfile from "@/models/TeamMemberProfile";
import CompensationProfile from "@/models/CompensationProfile";
import mongoose from "mongoose";

export async function POST() {
  const requestId = generateRequestId();
  try {
    await connectDB();

    const existingUser = await User.findOne({ email: "mhmk1399@gmail.com" });
    if (existingUser) {
      return successResponse({ message: "Seed user already exists", userId: existingUser._id, organisationId: existingUser.organisationId }, requestId);
    }

    const orgId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    const org = await Organisation.create({
      _id: orgId,
      name: "Cheetah Nova",
      slug: "cheetah-nova",
      ownerId: userId,
      settings: {
        currency: "IRR",
        timezone: "Asia/Tehran",
        capacitySplit: { delivery: 70, salesMarketing: 15, internal: 10, buffer: 5 },
        defaultWorkingHoursPerWeek: 44,
        defaultBillablePercentage: 75,
      },
    });

    const passwordHash = await bcrypt.hash("Mhmk#1399", 12);

    const user = await User.create({
      _id: userId,
      email: "mhmk1399@gmail.com",
      passwordHash,
      name: "MHMK",
      organisationId: orgId,
      role: "owner",
      isActive: true,
    });

    await TeamMemberProfile.create({
      organisationId: orgId,
      userId: userId,
      title: "Founder & CEO",
      department: "Management",
      skills: ["Product Management", "Full-Stack Development", "Business Strategy"],
      startDate: new Date("2024-01-01"),
      employmentType: "full_time",
      weeklyCapacityHours: 50,
      isActive: true,
    });

    await CompensationProfile.create({
      organisationId: orgId,
      userId: userId,
      salary: 80000000,
      employerCosts: 18400000,
      softwareAllocation: 3000000,
      equipmentAllocation: 2000000,
      officeAllocation: 4000000,
      managementAllocation: 0,
      otherOverhead: 1500000,
      fullyLoadedMonthlyCost: 108900000,
      realisticBillableHours: 120,
      internalHourlyCost: 907500,
      effectiveFrom: new Date("2024-01-01"),
      isActive: true,
    });

    return successResponse({
      message: "Seed complete",
      userId: user._id,
      organisationId: org._id,
      email: "mhmk1399@gmail.com",
      role: "owner",
    }, requestId, 201);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
