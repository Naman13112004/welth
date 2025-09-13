import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { AccountType } from "@/generated/prisma";


const serializeTransaction = (obj: any) => {
    const serialized = {...obj};

    if(obj.balance) {
        serialized.balance = obj.balance.toNumber();
    }

    return serialized;
}

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
        const balance = data.get("balance")!.toString();
        const isDefault = data.get("isDefault")!.toString() === "true";
        const name = data.get("name")!.toString();
        const type = data.get("type")!.toString();

        // Convert balance to float before saving
        const balanceFloat = parseFloat(balance);
        if(isNaN(balanceFloat)) {
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

        const serializedAccount = serializeTransaction(account);

        revalidatePath("/dashboard");
        return NextResponse.json({ success: true, data: serializedAccount }, { status: 201 });

    } catch(error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}