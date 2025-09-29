import { Suspense } from "react";
import { BarLoader } from "react-spinners";

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Account, Transaction } from "@/generated/prisma";

import TransactionTable from "@/components/transactions/transaction-table";

type AccountPageProps = {
    params: {
        id: string;
    },
}

export type AccountWithTransactions = Account & {
    transactions: Transaction[],
    _count: {
        transactions: number;
    };
};

const AccountPage = async ({ params }: AccountPageProps) => {
  const authHeaders = await headers();

  const accountData = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/transactions?accountId=${params.id}`, {
    method: "GET",
    headers: {
      cookie: (authHeaders).get("cookie") ?? "",
    },
  });

  if(!accountData) {
    notFound();
  }

  const { account, transactions } : {account: AccountWithTransactions, transactions: Transaction[]} = await accountData.json();

  return (
    <div className="space-y-8 px-5">
        <div className="flex gap-4 items-end justify-between">
            <div>
                <h1 className="text-5xl sm:text-6xl font-bold gradient gradient-title capitalize">
                    {account.name}
                </h1>
                <p className="text-muted-foreground">
                    {account.type.charAt(0) + account.type.slice(1).toLowerCase()} Account
                </p>
            </div>

            <div className="text-right pb-7">
                <div className="text-xl sm:text-2xl font-bold">
                    Rs. {Number(account.balance).toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">
                    {account._count.transactions} Transactions
                </p>
            </div>
        </div>

        {/* Chart Section */}

        {/* Transaction Table */}
        <Suspense 
            fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
        >
            <TransactionTable transactions={transactions} />
        </Suspense>
    </div>
  );
};

export default AccountPage;