import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { AccountType } from "@/generated/prisma";
import { serializeAccount } from "@/lib/utils";

export async function POST(req: Request) {
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

        const data = await req.formData();
        const nameRaw = data.get("name");
        const typeRaw = data.get("type");
        const balanceRaw = data.get("balance");
        const isDefaultRaw = data.get("isDefault");

        if (typeof nameRaw !== "string" || typeof typeRaw !== "string" || typeof balanceRaw !== "string") {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        const name = nameRaw.trim();
        const type = typeRaw as AccountType;
        const isDefault = 
            typeof isDefaultRaw === "string" && isDefaultRaw.toLowerCase() === "true";

        // Convert balance to float before saving
        const balanceFloat = Number(balanceRaw);
        if (!Number.isFinite(balanceFloat) || balanceFloat < 0) {
          return NextResponse.json({ error: "Invalid balance amount" }, { status: 400 });
        }

        // Check if this is the user's first account
        const existingAccounts = await db.account.findMany({
            where: { userId: user.id },
        });

        const shouldBeDefault = existingAccounts.length === 0 ? true : isDefault;

        // Make sure no other accounts remain default
        if(shouldBeDefault) {
            await db.account.updateMany({
                where: { userId: user.id, isDefault: true },
                data: { isDefault: false },
            });
        }

        const account = await db.account.create({
            data: {
                name: name as string,
                type: type as AccountType,
                balance: balanceFloat,
                userId: user.id,
                isDefault: shouldBeDefault,
            },
        });

        const serializedAccount = serializeAccount(account);

        return NextResponse.json({ success: true, data: serializedAccount }, { status: 201 });

    } catch(error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function GET() {
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

        const accounts = db.account.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: {
                        transactions: true,
                    },
                },
            },
        });

        const serializedAccount = (await accounts).map(serializeAccount);

        return NextResponse.json({ success: true, data: serializedAccount }, { status: 201 });        

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

        const { accountId } = await req.json();  

        if (!accountId) {
        return NextResponse.json({ error: "Account ID required" }, { status: 400 });
        }

        // Remove all accounts from default before setting anyone to default 
        await db.account.updateMany({
            where: { userId: user.id, isDefault: true },
            data: { isDefault: false },
        });

        // Set the account to default
        const account = await db.account.update({
            where: { id: accountId, userId: user.id, },
            data: { isDefault: true, }
        });

        return NextResponse.json({ success: true, data: serializeAccount(account) }, { status: 201 });  

    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });        
    }
}