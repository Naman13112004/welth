"use client";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";
import { Account, Transaction } from "@/generated/prisma";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface DashboardOverviewProps {
    accounts: Account[];
    transactions: Transaction[];
}

const COLORS = [
    '#0088FE',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#FF0066',
    '#FF0000',
    '#FF00FF',
    '#00FF00',
    '#00FF00',
    '#00FF00',
]

const DashboardOverview = ({ accounts, transactions }: DashboardOverviewProps) => {
    const [selectedAccountId, setSelectedAccountId] = useState(
        accounts.find((a) => a.isDefault)?.id || accounts[0]?.id
    );

    // Filter transactions for selected account
    const accountTransactions = transactions.filter(
        (t) => t.accountId === selectedAccountId
    );

    const recentTransactions = accountTransactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    // Calculate expense breakdown for current month
    const currentDate = new Date();
    const currentMonthExpenses = accountTransactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return (
            t.type === "EXPENSE" &&
            transactionDate.getMonth() === currentDate.getMonth() &&
            transactionDate.getFullYear() === currentDate.getFullYear()
        );
    });

    // Group expenses by category
    const expensesByCategory = currentMonthExpenses.reduce((acc, transaction) => {
        const category = transaction.category;
        if (!acc[category]) {
            acc[category] = 0;
        }
        acc[category] += Number(transaction.amount);
        return acc;
    }, {} as Record<string, number>);

    // Format data for pie chart
    const pieChartData = Object.entries(expensesByCategory)
        .map(([category, amount]) => ({
            name: category,
            value: amount,
        }));

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-base font-normal">
                        Recent Transactions
                    </CardTitle>
                    <Select
                        value={selectedAccountId}
                        onValueChange={setSelectedAccountId}
                    >
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Select Account" />
                        </SelectTrigger>
                        <SelectContent>
                            {accounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                    {account.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentTransactions.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                                No recent transactions
                            </p>
                        ) : (
                            recentTransactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="flex items-center justify-between"
                                >
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {transaction.description || "Untitled Description"}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {format(transaction.date, "PP")}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={cn(
                                                "flex items-center",
                                                transaction.type === "EXPENSE"
                                                    ? "text-red-500"
                                                    : "text-green-500"
                                            )}
                                        >
                                            {transaction.type === "EXPENSE" ? (
                                                <ArrowDownRight className="mr-1 h-4 w-4" />
                                            ) : (
                                                <ArrowUpRight className="mr-1 h-4 w-4" />
                                            )}
                                            Rs. {transaction.amount.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-normal">
                        Monthly Expense Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 pb-5">
                    {pieChartData.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                            No expenses this month
                        </p>
                    ) : (
                        <div className="h-[300px]">
                            <ResponsiveContainer height="100%" width="100%">
                                <PieChart>
                                    <Pie
                                        style={{ width: '100%', maxWidth: '500px', maxHeight: '70vh', aspectRatio: 1 }}
                                        data={pieChartData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label={({ name, value }) => `${name}: Rs. ${value.toFixed(2)}`}
                                        dataKey="value"
                                        fill="#8884d8"
                                    >
                                        {pieChartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </Pie>

                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default DashboardOverview;