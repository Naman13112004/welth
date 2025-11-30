import { Transaction } from "@/generated/prisma";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get all user transactions
        const transactions = await db.transaction.findMany({
            where: { userId: user.id },
            orderBy: { date: "desc" },
        });

        return NextResponse.json(
            { transactions: transactions.map(serializeAmount) },
            { status: 200 },
        );

    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

const serializeAmount = (obj: Transaction) => ({
    ...obj,
    amount: Number(obj.amount),
});