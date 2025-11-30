import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { serializeAccount } from "@/lib/utils";
import aj from "@/lib/arcjet";
import { Transaction } from "@/generated/prisma";

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

        const { searchParams } = new URL(req.url);
        const accountId = searchParams.get("accountId");

        if (!accountId) {
            return NextResponse.json({ error: "Account ID required" }, { status: 400 });
        }

        // Get current account with all it's transactions
        const account = await db.account.findUnique({
            where: { id: accountId, userId: user.id },
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

        if (!account) {
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

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) {
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

            for (const [accountId, balanceChange] of Object.entries(accountBalanceChanges)) {
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

export async function POST(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Arcjet for rate limiting
        const decision = await aj.protect(req, {
            requested: 1,
        });

        if (decision.isDenied()) {
            if (decision.reason.isRateLimit()) {
                const { remaining, reset } = decision.reason;
                return NextResponse.json(
                    {
                        error: "Rate limit exceeded! Try after " + Math.round(reset / 60) + " minutes",
                        details: {
                            remaining,
                            reset,
                        },
                    },
                    { status: 429 }
                );
            }
            return NextResponse.json({ error: "Internal server error" }, { status: 500 });
        }

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const data = await req.json();
        const { accountId, amount, type, date, isRecurring, recurringInterval } = data;

        const account = await db.account.findUnique({
            where: { id: accountId, userId: user.id },
        });

        if (!account) {
            return NextResponse.json({ error: "Account not found" }, { status: 404 });
        }

        const balanceChange = type === "EXPENSE" ? -amount : amount;
        const newBalance = account.balance.toNumber() + balanceChange;

        const transaction = await db.$transaction(async (tx) => {
            const newTransaction = await tx.transaction.create({
                data: {
                    ...data,
                    userId: user.id,
                    nextRecurringDate:
                        isRecurring && recurringInterval
                            ? calculateNextRecurringDate(date, recurringInterval)
                            : null,
                }
            });
            await tx.account.update({
                where: { id: account.id },
                data: { balance: newBalance },
            });
            return newTransaction;
        });

        return NextResponse.json(
            { transaction: serializeAmount(transaction), success: true },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json({ error: "Internal server error", success: false }, { status: 500 });
    }
}

function calculateNextRecurringDate(startDate: Date, recurringInterval: string) {
    const date = new Date(startDate);

    switch (recurringInterval) {
        case "DAILY":
            date.setDate(date.getDate() + 1);
            break;
        case "WEEKLY":
            date.setDate(date.getDate() + 7);
            break;
        case "MONTHLY":
            date.setMonth(date.getMonth() + 1);
            break;
        case "YEARLY":
            date.setFullYear(date.getFullYear() + 1);
            break;
    }

    return date;
}

const serializeAmount = (obj: Transaction) => ({
    ...obj,
    amount: Number(obj.amount),
});