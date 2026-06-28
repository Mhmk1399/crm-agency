import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateRequestId } from "@/lib/correlation";
import { AuthenticationError } from "@/lib/errors";
import { decrypt } from "@/lib/auth";
import Lead from "@/models/Lead";
import Proposal from "@/models/Proposal";

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const token = request.cookies.get("session")?.value;
    if (!token) throw new AuthenticationError();
    const session = await decrypt(token);
    if (!session) throw new AuthenticationError();

    await connectDB();
    const orgId = new mongoose.Types.ObjectId(session.organisationId);
    const now = new Date();

    const [leadsByStatus, followUpsDue, proposalStats, lostReasons] = await Promise.all([
      Lead.aggregate([
        { $match: { organisationId: orgId } },
        { $group: { _id: "$status", count: { $sum: 1 }, totalValue: { $sum: "$estimatedValue" }, weightedValue: { $sum: { $multiply: ["$estimatedValue", { $divide: ["$probability", 100] }] } } } },
      ]),
      Lead.countDocuments({ organisationId: orgId, nextFollowUpAt: { $lte: now }, status: { $nin: ["won", "lost"] } }),
      Proposal.aggregate([
        { $match: { organisationId: orgId } },
        { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$total" } } },
      ]),
      Lead.aggregate([
        { $match: { organisationId: orgId, status: "lost", lostReason: { $ne: null } } },
        { $group: { _id: "$lostReason", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const won = leadsByStatus.find((s: { _id: string }) => s._id === "won")?.count ?? 0;
    const lost = leadsByStatus.find((s: { _id: string }) => s._id === "lost")?.count ?? 0;
    const total = won + lost;
    const winRate = total > 0 ? Math.round((won / total) * 10000) / 100 : 0;

    const proposalStatusMap: Record<string, { count: number; total: number }> = {};
    for (const p of proposalStats) proposalStatusMap[p._id] = { count: p.count, total: p.total };

    return successResponse({
      leadsByStatus,
      followUpsDue,
      proposalsSent: proposalStatusMap["sent"]?.count ?? 0,
      proposalsWon: proposalStatusMap["accepted"]?.count ?? 0,
      proposalsLost: proposalStatusMap["rejected"]?.count ?? 0,
      proposalValue: proposalStatusMap["sent"]?.total ?? 0,
      winRate,
      lostReasons,
    }, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
