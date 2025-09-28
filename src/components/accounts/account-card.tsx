"use client";

import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import Link from "next/link";
import { toast } from "sonner";
import { useEffect } from "react";
import useFetch from "@/hooks/use-fetch";
import { useRouter } from "next/navigation";
import type { Account } from "@/generated/prisma";

const AccountCard = ({ account }: {account: Account}) => {
  const { name, type, balance, id, isDefault } = account;
  const router = useRouter();

  async function updateDefaultAccount(accountId: string) {
    const res = await fetch("/api/accounts", {
      method: "PUT",
      body: JSON.stringify({ accountId }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to update default account");
    }

    router.refresh();

    return res.json();
  }

  const {
    loading: updateDefaultLoading,
    fn: updateDefaultFn,
    data: updatedAccount,
    error,
  } = useFetch(updateDefaultAccount);

  const handleDefaultChange = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if(isDefault) {
      toast.warning("You need atleast 1 default account");
      return; // Make sure the default account is not toggled to false
    }

    await updateDefaultFn(id);
  };

  useEffect(() => {
    if(updatedAccount?.success) {
      toast.success("Default account updated successfully");
    }
  }, [updatedAccount, updateDefaultLoading]);

  useEffect(() => {
    if(error) {
      toast.error((error as Error).message || "Failed to update default account");
    }
  }, [error]);

  return (
    <Card className="hover:shadow-md transition-shadow group relative">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Link href={`/account/${id}`}>
            <CardTitle className="text-sm font-medium capitalize">{account.name}</CardTitle>
          </Link>
          <Switch 
            checked={isDefault} 
            onClick={handleDefaultChange}
            disabled={updateDefaultLoading}
            className="cursor-pointer"
          />
        </CardHeader>
      <Link href={`/account/${id}`}>
        <CardContent className="pb-4">
          <div className="text-2xl font-bold">
            Rs. {Number(balance).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {type.charAt(0) + type.slice(1).toLowerCase()} Account
          </p>
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
            Income
          </div>
          <div className="flex items-center">
            <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
            Expense
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
};

export default AccountCard;