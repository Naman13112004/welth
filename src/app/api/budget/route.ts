import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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

        const budget = await db.budget.findFirst({
            where: { userId: user.id },
        });

        const currentDate = new Date();
        const startOfMonth = new Date(
            currentDate.getFullYear(), 
            currentDate.getMonth(), 
            1
        );
        const endOfMonth = new Date(
            currentDate.getFullYear(), 
            currentDate.getMonth() + 1, 
            0
        );

        const { searchParams } = new URL(req.url);
        const accountId = searchParams.get("accountId");

        if (!accountId) {
            return NextResponse.json({ error: "Account ID required" }, { status: 400 });
        }

        const totalExpenses = await db.transaction.aggregate({
            where: {
                userId: user.id,
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
                type: "EXPENSE",
                accountId: accountId,
            },
            _sum: {
                amount: true,
            },
        });

        return NextResponse.json(
            { 
                budget: budget ? { ...budget, amount: budget.amount.toNumber() } : null,
                currentExpenses: totalExpenses._sum.amount ? totalExpenses._sum.amount.toNumber() : 0,
            }, 
            { status: 201 }
        );        

    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });        
    }
}

export async function PUT(req: Request) {
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

        const { amount } = await req.json();

        const budget = await db.budget.upsert({
            where: { userId: user.id },
            update: { amount },
            create: { amount, userId: user.id },
        });

        return NextResponse.json(
            { budget: { ...budget, amount: budget.amount.toNumber(), success: true } }, 
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}