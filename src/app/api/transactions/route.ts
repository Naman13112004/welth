import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { serializeAccount } from "@/lib/utils";

export async function GET(req: Request) {
    try {
        const { userId } = await auth();

        if(!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if(!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { searchParams } = new URL(req.url);
        const accountId = searchParams.get("accountId");

        if (!accountId) {
            return NextResponse.json({ error: "Account ID required" }, { status: 400 });
        }

        // Get current account with all it's transactions
        const account = await db.account.findUnique({
            where: { id: accountId, userId: user.id},
            include: {
                transactions: {
                    orderBy: { date: "desc" },
                },
                _count: {
                    select: {
                        transactions: true,
                    },
                },
            },
        });

        if(!account) {
            return NextResponse.json({ error: "Account not found" }, { status: 404 });
        };

        return NextResponse.json({
            account: serializeAccount(account),
            transactions: account.transactions.map(serializeAccount),
        });

    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}