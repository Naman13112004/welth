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

        const { searchParams } = new URL(req.url);
        const transactionId = searchParams.get("transactionId");

        if (!transactionId) {
            return NextResponse.json({ error: "Transaction ID required" }, { status: 400 });
        }

        const transaction = await db.transaction.findUnique({
            where: { id: transactionId, userId: user.id },
        });

        if (!transaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        return NextResponse.json(
            { transaction: serializeAmount(transaction) },
            { status: 200 },
        );
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
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

        const data = await req.json();
        const { transactionId, accountId, date, isRecurring, recurringInterval } = data;

        if (!transactionId) {
            return NextResponse.json({ error: "Transaction ID required" }, { status: 400 });
        }

        const originalTransaction = await db.transaction.findUnique({
            where: { id: transactionId, userId: user.id },
        });

        if (!originalTransaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        // Calculate balance changes
        const oldBalanceChange =
            originalTransaction.type === "EXPENSE"
                ? -Number(originalTransaction.amount)
                : Number(originalTransaction.amount);

        const newBalanceChange =
            data.type === "EXPENSE"
                ? -Number(data.amount)
                : Number(data.amount);

        const netBalanceChange = newBalanceChange - oldBalanceChange;

        // Verify new account belongs to user
        const newAccount = await db.account.findUnique({
            where: {
                id: accountId,
                userId: user.id,
            },
        });

        if (!newAccount) {
            return NextResponse.json({ error: "Account not found" }, { status: 404 });
        }

        // Update transaction and account balance in a transaction
        const transaction = await db.$transaction(async (tx) => {
            const updated = await tx.transaction.update({
                where: { id: transactionId, userId: user.id },
                data: {
                    type: data.type,
                    amount: data.amount,
                    description: data.description,
                    date: data.date,
                    category: data.category,
                    isRecurring: data.isRecurring,
                    recurringInterval: data.recurringInterval,
                    account: { connect: { id: accountId } },
                    nextRecurringDate:
                        isRecurring && recurringInterval
                            ? calculateNextRecurringDate(date, recurringInterval)
                            : null,
                }
            });
            if (originalTransaction.accountId !== accountId) {
                await tx.account.update({
                    where: { id: originalTransaction.accountId },
                    data: { balance: { increment: -oldBalanceChange }, },
                });

                await tx.account.update({
                    where: { id: accountId },
                    data: { balance: { increment: newBalanceChange }, },
                });
            } else {
                await tx.account.update({
                    where: { id: accountId },
                    data: { balance: { increment: netBalanceChange } },
                });
            }
            return updated;
        });

        return NextResponse.json(
            { transaction: serializeAmount(transaction), success: true },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

const serializeAmount = (obj: Transaction) => ({
    ...obj,
    amount: Number(obj.amount),
});

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
};