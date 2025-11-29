import { Account, Transaction } from "@/generated/prisma";
import { headers } from "next/headers";
import { defaultCategories } from "../../../../../data/categories";
import AddTransactionForm from "@/components/transactions/transaction-form";

const AddTransactionPage = async ({ searchParams }: { searchParams: Promise<{ edit?: string }> }) => {
    const editId = (await searchParams)?.edit;
    const authHeaders = await headers();

    let initialData = null;
    if (editId) {
        const transactionRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/edit-transaction?transactionId=${editId}`, {
            method: "GET",
            headers: {
                cookie: (authHeaders).get("cookie") ?? "",
            },
        });

        if (!transactionRes.ok) {
            throw new Error("Failed to fetch transaction");
        }

        const { transaction }: { transaction: Transaction } = await transactionRes.json();
        initialData = transaction;
    }

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
            <h1 className="text-5xl gradient gradient-title mb-8">{editId ? "Edit" : "Add"} Transaction</h1>

            <AddTransactionForm
                accounts={accounts}
                categories={defaultCategories}
                editMode={!!editId}
                initialData={initialData}
            />
        </div>
    );
};

export default AddTransactionPage;