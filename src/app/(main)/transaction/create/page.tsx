import { Account } from "@/generated/prisma";
import { headers } from "next/headers";
import { defaultCategories } from "../../../../../data/categories";
import AddTransactionForm from "@/components/transactions/transaction-form";

const AddTransactionPage = async () => {
    const authHeaders = await headers();

    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/accounts`, {
        method: "GET",
        headers: {
            cookie: (authHeaders).get("cookie") ?? "",
        },
    });

    if (!res.ok) {
        throw new Error("Failed to fetch accounts");
    }

    const { data: accounts }: { data: Account[] } = await res.json();

    return (
        <div className="max-w-3xl mx-auto px-5">
            <h1 className="text-5xl gradient gradient-title mb-8">Add Transaction</h1>

            <AddTransactionForm
                accounts={accounts}
                categories={defaultCategories}
            />
        </div>
    );
};

export default AddTransactionPage;