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

export async function DELETE(req: Request) {
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

        const body = await req.json();
        const transactionIds: string[] = body.transactionIds;

        const transactions = await db.transaction.findMany({
            where: {
                id: { in: transactionIds },
                userId: user.id,
            },
        });

        const accountBalanceChanges = transactions.reduce<Record<string, number>>((acc, transaction) => {
            const change = 
                transaction.type === "EXPENSE"
                    ? transaction.amount
                    : -transaction.amount;

            acc[transaction.accountId] = (acc[transaction.accountId] || 0) + Number(change);
            return acc;
        }, {});

        // Delete transactions and update account balances in a transaction
        await db.$transaction(async (tx) => {
            await tx.transaction.deleteMany({
                where: {
                    id: { in: transactionIds },
                    userId: user.id,
                },
            });

            for(const [accountId,balanceChange] of Object.entries(accountBalanceChanges)) {
                await tx.account.update({
                    where: { id: accountId },
                    data: {
                        balance: {
                            increment: balanceChange,
                        },
                    },
                });
            }

        });
        
        return NextResponse.json({ message: "Accounts deleted successfully" }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}