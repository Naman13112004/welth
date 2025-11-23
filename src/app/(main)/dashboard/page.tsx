import { Card, CardContent } from "@/components/ui/card";
import AccountCard from "@/components/accounts/account-card";
import CreateAccountDrawer from "@/components/accounts/create-account-drawer";

import { Plus } from "lucide-react";
import { headers } from "next/headers";
import type { Account, Budget } from "@/generated/prisma";
import BudgetProgress from "@/components/budget/budget-progress";

const DashboardPage = async () => {
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

  const defaultAccount = accounts?.find((account) => account.isDefault);
  let budgetData: { budget: Budget | null; currentExpenses: number } | null = null;
  if (defaultAccount) {
    const budgetRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/budget?accountId=${defaultAccount.id}`, {
      method: "GET",
      headers: {
        cookie: (authHeaders).get("cookie") ?? "",
      },
    });

    if (!budgetRes.ok) {
      throw new Error("Failed to fetch budget");
    }

    budgetData = await budgetRes.json();
  }

  return (
    <div className="space-y-8">
      {/* Budget Progress */}
      {defaultAccount && (
        <BudgetProgress
          initialBudget={budgetData?.budget}
          currentExpenses={budgetData?.currentExpenses || 0}
        />
      )}

      {/* Overview */}

      {/* Accounts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CreateAccountDrawer>
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
            <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-2">
              <Plus className="h-10 w-10 mb-2" />
              <p className="text-sm font-medium">Add New Account</p>
            </CardContent>
          </Card>
        </CreateAccountDrawer>

        {accounts?.length > 0 &&
          accounts.map((account: Account) => {
            return <AccountCard key={account.id} account={account} />
          })
        }
      </div>
    </div>
  );
};

export default DashboardPage;