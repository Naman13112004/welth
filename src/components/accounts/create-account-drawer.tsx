"use client";

import { useForm } from "react-hook-form";
import { ReactNode, useEffect, useState } from "react";

import { AccountType } from "@/generated/prisma";
import { accountSchema } from "@/app/lib/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";

import { 
  Drawer, 
  DrawerClose, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerTrigger 
} from "@/components/ui/drawer";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

import useFetch from "@/hooks/use-fetch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const CreateAccountDrawer = ({ children }: {children: ReactNode}) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function createAccount(formData: FormData) {
    const res = await fetch("/api/dashboard", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Failed to create account");
    }

    router.refresh();

    return res.json();
  }


  const { 
    register, 
    handleSubmit, 
    formState:{ errors },
    setValue,
    watch,
    reset
  } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "CURRENT",
      balance: "",
      isDefault: false,
    },
  });

  const {
    data: newAccount,
    error,
    fn: createAccountFn,
    loading: createAccountLoading,
  } = useFetch(createAccount);

  useEffect(() => {
    if(newAccount && !createAccountLoading) {
      toast.success("Account created successfully");
      reset();
      setOpen(false);
    }
  }, [createAccountLoading, newAccount]);

  useEffect(() => {
    if(error) {
      toast.error((error as Error).message || "Failed to create account");
    }
  }, [error]);

  const onSubmit = async (data: any) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
    await createAccountFn(formData);
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent>
            <DrawerHeader className="items-start text-left">
                <DrawerTitle>Create New Account</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4">
              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Account Name
                  </label>
                  <Input 
                    id="name"
                    placeholder="e.g. Main Checking"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="type" className="text-sm font-medium">
                    Account Type
                  </label>
                  <Select
                    value={watch("type")}
                    onValueChange={(value) => setValue("type", value as AccountType)}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CURRENT">Current</SelectItem>
                      <SelectItem value="SAVINGS">Savings</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-red-500">{errors.type.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="balance" className="text-sm font-medium">
                    Initial Balance
                  </label>
                  <Input 
                    id="balance"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("balance")}
                  />
                  {errors.balance && (
                    <p className="text-sm text-red-500">{errors.balance.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <label 
                      htmlFor="isDefault" 
                      className="text-sm font-medium cursor-pointer"
                    >
                      Set as Default
                    </label>

                    <p className="text-sm text-muted-foreground">
                      This account will be selected by default for transactions
                    </p>
                  </div>
                  <Switch 
                    id="isDefault"
                    onCheckedChange={(checked) => setValue("isDefault", checked)}
                    checked={watch("isDefault")}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <DrawerClose asChild>
                    <Button type="button" variant="outline" className="flex-1">
                      Cancel
                    </Button>
                  </DrawerClose>
                  <Button type="submit" className="flex-1" disabled={createAccountLoading}>
                    {createAccountLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </div>
              </form>
            </div>
        </DrawerContent>
    </Drawer>
  );
};

export default CreateAccountDrawer;