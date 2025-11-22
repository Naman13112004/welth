"use client";

import { useMemo, useState } from "react";
import { Transaction } from "@/generated/prisma";
import { endOfDay, format, startOfDay, subDays } from "date-fns";

import {
    BarChart,
    Bar,
    Rectangle,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
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

const DATE_RANGES = {
    "7D": { label: "Last 7 Days", days: 7 },
    "1M": { label: "Last Month", days: 30 },
    "3M": { label: "Last 3 Months", days: 90 },
    "6M": { label: "Last 6 Months", days: 180 },
    "ALL": { label: "All Time", days: null },
}

type DateRange = keyof typeof DATE_RANGES;

const AccountChart = ({ transactions }: { transactions: Transaction[] }) => {
    const [dateRange, setDateRange] = useState<DateRange>("1M");

    const filteredData = useMemo(() => {
        const range = DATE_RANGES[dateRange];
        const now = new Date();
        const startDate = range.days
            ? startOfDay(subDays(now, range.days))
            : startOfDay(new Date(0));

        // Filter transactions within date range
        const filteredTransactions = transactions.filter(
            (transaction) => new Date(transaction.date) >= startDate && new Date(transaction.date) <= endOfDay(now)
        );

        const groupedData = filteredTransactions.reduce((acc, transaction) => {
            const date = format(new Date(transaction.date), "MMM dd");

            if (!acc[date]) {
                acc[date] = { date, income: 0, expense: 0 };
            }

            if (transaction.type === "INCOME") {
                acc[date].income += Number(transaction.amount);
            } else {
                acc[date].expense += Number(transaction.amount);
            }

            return acc;
        }, {} as Record<string, { date: string, income: number, expense: number }>);

        // Convert to array and sort by date
        return Object.values(groupedData).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
    }, [transactions, dateRange]);

    const totals = useMemo(() => {
        return filteredData.reduce(
            (acc, day) => ({
                income: acc.income + day.income,
                expense: acc.expense + day.expense,
            }),
            { income: 0, expense: 0 }
        );
    }, [filteredData]);

    return (
        <Card>
            <CardHeader className="flex items-center justify-between space-y-0 pb-7">
                <CardTitle className="text-base font-normal">Transaction Overview</CardTitle>
                <Select defaultValue={dateRange} onValueChange={(value) => setDateRange(value as DateRange)} >
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(DATE_RANGES).map(([key, { label }]) => (
                            <SelectItem key={key} value={key}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                <div className="flex justify-around mb-6 text-sm">
                    <div className="text-center">
                        <p className="text-muted-foreground">Total Income</p>
                        <p className="text-lg font-bold text-green-500">Rs. {totals.income.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-muted-foreground">Total Expense</p>
                        <p className="text-lg font-bold text-red-500">Rs. {totals.expense.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-muted-foreground">
                            Net Balance
                        </p>
                        <p className={`text-lg font-bold
                            ${totals.income - totals.expense >= 0
                                ? "text-green-500"
                                : "text-red-500"}`
                        }>
                            Rs. {(totals.income - totals.expense).toFixed(2)}
                        </p>
                    </div>
                </div>

                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={filteredData}
                            margin={{
                                top: 10,
                                right: 10,
                                left: 10,
                                bottom: 0,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" />
                            <YAxis
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `Rs. ${value}`}
                            />
                            <Tooltip formatter={(value) => [`Rs. ${value}`, undefined]} />
                            <Legend />
                            <Bar
                                dataKey="income"
                                name="Income"
                                fill="#22c55e"
                                radius={[4, 4, 0, 0]}
                            />
                            <Bar
                                dataKey="expense"
                                name="Expense"
                                fill="#ef4444"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

export default AccountChart;