"use client";

import { transactionSchema } from "@/app/lib/zod-schema";
import { Account, RecurringInterval, Transaction, TransactionType } from "@/generated/prisma";
import useFetch from "@/hooks/use-fetch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "../ui/input";
import CreateAccountDrawer from "../accounts/create-account-drawer";
import { Button } from "../ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { Switch } from "../ui/switch";
import z from "zod";
import { useEffect } from "react";
import { toast } from "sonner";
import ReceiptScanner from "./receipt-scanner";

export interface ScannedData {
    amount: number;
    date: Date;
    description: string;
    category: string;
    merchantName: string;
}

interface AddTransactionFormProps {
    accounts: Account[];
    categories: {
        id: string;
        name: string;
        type: string;
        color: string;
        icon: string;
        subcategories?: string[];
    }[];
    editMode?: boolean;
    initialData?: Transaction | null;
}

const AddTransactionForm = ({ accounts, categories, editMode, initialData }: AddTransactionFormProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("edit");

    const {
        register,
        setValue,
        getValues,
        watch,
        reset,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(transactionSchema),
        defaultValues: editMode && initialData ? {
            type: initialData.type,
            amount: initialData.amount.toString(),
            description: initialData.description || "",
            accountId: initialData.accountId,
            category: initialData.category,
            date: new Date(initialData.date),
            isRecurring: initialData.isRecurring,
            ...(initialData.recurringInterval && {
                recurringInterval: initialData.recurringInterval,
            }),
        } : {
            type: "EXPENSE",
            amount: "",
            category: "",
            description: "",
            accountId: accounts.find((acc) => acc.isDefault)?.id,
            date: new Date(),
            isRecurring: false,
        }
    });

    const type = watch("type");
    const isRecurring = watch("isRecurring");
    const date = watch("date");
    const recurringInterval = watch("recurringInterval");

    const filterredCategories = categories.filter((category) => category.type === type);

    async function createTransaction(formData: z.infer<typeof transactionSchema>) {
        const res = await fetch("/api/transactions", {
            method: "POST",
            body: JSON.stringify({
                ...formData,
                recurringInterval: isRecurring ? recurringInterval : null,
            }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to create transaction");
        }

        router.refresh();

        return res.json();
    }

    async function updateTransaction(formData: z.infer<typeof transactionSchema>, editId: string) {
        const res = await fetch("/api/edit-transaction", {
            method: "PUT",
            body: JSON.stringify({
                ...formData,
                recurringInterval: isRecurring ? recurringInterval : null,
                transactionId: editId,
            }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to edit transaction");
        }

        router.refresh();

        return res.json();
    }

    const {
        loading: transactionLoading,
        fn: transactionFn,
        data: transactionResult,
    } = useFetch(editMode ? updateTransaction : createTransaction);

    const onSubmit = async (data: z.infer<typeof transactionSchema>) => {
        const formData = {
            ...data,
            amount: Number(data.amount),
        }
        if (editMode) {
            await transactionFn(formData, editId);

        } else {
            await transactionFn(formData);
        }
    }

    useEffect(() => {
        if (transactionResult?.success && !transactionLoading) {
            toast.success(
                editMode
                    ? "Transaction updated successfully"
                    : "Transaction created successfully"
            );
            reset();
            router.push(`/account/${transactionResult?.transaction?.accountId}`);
        }
    }, [transactionResult, transactionLoading, editMode]);

    const handleScanComplete = (scannedData: ScannedData) => {
        if (scannedData) {
            setValue("amount", scannedData.amount.toString());
            setValue("date", new Date(scannedData.date));
            if (scannedData.description) {
                setValue("description", scannedData.description);
            }
            if (scannedData.category) {
                setValue("category", scannedData.category);
            }
        }
    }

    return (
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* AI Receipt Scanner */}
            {!editMode && <ReceiptScanner onScanComplete={handleScanComplete} />}

            <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select
                    onValueChange={(value) => setValue("type", value as TransactionType)}
                    defaultValue={type}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="EXPENSE">Expense</SelectItem>
                        <SelectItem value="INCOME">Income</SelectItem>
                    </SelectContent>
                </Select>

                {errors.type && (
                    <p className="text-sm text-red-500">{errors.type.message}</p>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Amount</label>
                    <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...register("amount")}
                    />

                    {errors.amount && (
                        <p className="text-sm text-red-500">{errors.amount.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Account</label>
                    <Select
                        onValueChange={(value) => setValue("accountId", value)}
                        defaultValue={getValues("accountId")}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Account" />
                        </SelectTrigger>
                        <SelectContent>
                            {accounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                    {account.name} (Rs. {Number(account.balance).toFixed(2)})
                                </SelectItem>
                            ))}
                            <CreateAccountDrawer>
                                <Button
                                    variant="ghost"
                                    className="w-full select-none items-center text-sm outline-none"
                                >
                                    Create Account
                                </Button>
                            </CreateAccountDrawer>
                        </SelectContent>
                    </Select>

                    {errors.accountId && (
                        <p className="text-sm text-red-500">{errors.accountId.message}</p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                    onValueChange={(value) => setValue("category", value)}
                    defaultValue={getValues("category")}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                        {filterredCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {errors.category && (
                    <p className="text-sm text-red-500">{errors.category.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full pl-3 text-left font-normal"
                        >
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(date) => date && setValue("date", date)}
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                            autoFocus
                        />
                    </PopoverContent>
                </Popover>

                {errors.date && (
                    <p className="text-sm text-red-500">{errors.date.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input placeholder="Enter Description" {...register("description")} />

                {errors.description && (
                    <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                    <label
                        htmlFor="isRecurring"
                        className="text-sm font-medium cursor-pointer"
                    >
                        Recurring Transaction
                    </label>

                    <p className="text-sm text-muted-foreground">
                        Set up a recurring schedule for this transaction
                    </p>
                </div>
                <Switch
                    id="isRecurring"
                    onCheckedChange={(checked) => setValue("isRecurring", checked)}
                    checked={watch("isRecurring")}
                />
            </div>

            {isRecurring && (
                <div className="space-y-2">
                    <label className="text-sm font-medium">Recurring Interval</label>
                    <Select
                        onValueChange={(value) => setValue("recurringInterval", value as RecurringInterval)}
                        defaultValue={getValues("recurringInterval")}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Interval" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="DAILY">Daily</SelectItem>
                            <SelectItem value="WEEKLY">Weekly</SelectItem>
                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                            <SelectItem value="YEARLY">Yearly</SelectItem>
                        </SelectContent>
                    </Select>

                    {errors.recurringInterval && (
                        <p className="text-sm text-red-500">{errors.recurringInterval.message}</p>
                    )}
                </div>
            )}

            <div className="flex flex-col gap-4">
                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.back()}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="w-full"
                    disabled={transactionLoading}
                >
                    {transactionLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {editMode ? "Updating..." : "Creating..."}
                        </>
                    ) : (
                        editMode ? "Update Transaction" : "Create Transaction"
                    )}
                </Button>
            </div>
        </form>
    );
};

export default AddTransactionForm;