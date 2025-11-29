import { db } from "@/lib/prisma";
import { inngest } from "./client";
import { Transaction } from "@/generated/prisma";
import { GoogleGenAI } from "@google/genai";

export const checkBudgetAlerts = inngest.createFunction(
    { id: "check-budget-alerts", name: "Check Budget Alerts" },
    { cron: "0 */6 * * *" },
    async ({ step }) => {
        const budgets = await step.run("fetch-budget", async () => {
            return await db.budget.findMany({
                include: {
                    user: {
                        include: {
                            accounts: {
                                where: {
                                    isDefault: true,
                                },
                            },
                        },
                    },
                },
            });
        });

        for (const budget of budgets) {
            const defaultAccount = budget.user.accounts[0];
            if (!defaultAccount) continue;

            await step.run(`check-budget-${budget.id}`, async () => {
                const currentDate = new Date();
                const startOfMonth = new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth(),
                    1
                );
                const endOfMonth = new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() + 1,
                    0
                );

                const expenses = db.transaction.aggregate({
                    where: {
                        userId: budget.userId,
                        accountId: defaultAccount.id,
                        type: "EXPENSE",
                        date: {
                            gte: startOfMonth,
                            lte: endOfMonth,
                        },
                    },
                    _sum: {
                        amount: true,
                    },
                });

                const totalExpenses = (await expenses)._sum.amount?.toNumber() || 0;
                const rawBudgetAmount = budget ? Number(budget.amount) : 0;
                const percentageUsed =
                    rawBudgetAmount > 0
                        ? Math.min(100, Math.max(0, (totalExpenses / rawBudgetAmount) * 100))
                        : 0;

                if (
                    percentageUsed >= 80 &&
                    (!budget.lastAlertSent ||
                        isNewMonth(new Date(budget.lastAlertSent), new Date())
                    )
                ) {
                    // Send Email
                    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            to: budget.user.email,
                            subject: `Budget Alert for ${defaultAccount.name}`,
                            templateData: {
                                userName: budget.user.name,
                                type: "budget-alert",
                                data: {
                                    budgetAmount: Number(rawBudgetAmount).toFixed(1),
                                    totalExpenses: Number(totalExpenses).toFixed(1),
                                    percentageUsed,
                                },
                            },
                        }),
                    });

                    // Check if email was sent successfully
                    if (!response.ok) {
                        throw new Error(`Failed to send budget alert email: ${response.status} ${response.statusText}`);
                    }

                    // Update Last Alert Sent after successful sending of email
                    await db.budget.update({
                        where: { id: budget.id, },
                        data: { lastAlertSent: new Date(), },
                    });
                }

            });
        }
    },
);

function isNewMonth(lastAlertDate: Date, currentDate: Date) {
    return (
        lastAlertDate.getMonth() !== currentDate.getMonth() ||
        lastAlertDate.getFullYear() !== currentDate.getFullYear()
    );
}

export const triggerRecurringTransactions = inngest.createFunction(
    { id: "trigger-recurring-transactions", name: "Trigger Recurring Transactions" },
    { cron: "0 0 * * *" },
    async ({ step }) => {
        // 1. Fetch all due recurring transactions
        const recurringTransactions = await step.run("fetch-recurring-transactions", async () => {
            return await db.transaction.findMany({
                where: {
                    isRecurring: true,
                    status: "COMPLETED",
                    OR: [
                        { lastProcessed: null }, // Never processed
                        { nextRecurringDate: { lte: new Date() } }, // Due date passed
                    ],
                },
            });
        });

        // 2. Create events for each transaction
        if (recurringTransactions.length > 0) {
            const events = recurringTransactions.map((transaction) => ({
                name: "transaction.recurring.process",
                data: {
                    transactionId: transaction.id,
                    userId: transaction.userId,
                },
            }));

            // 3. Send events to be processed
            await inngest.send(events);
        }

        return {
            triggered: recurringTransactions.length,
        }
    },
);

export const processRecurringTransaction = inngest.createFunction(
    {
        id: "process-recurring-transaction",
        throttle: {
            limit: 10, // Only process 10 transactions 
            period: "1m", // per minute
            key: "event.data.userId", // per user
        },
    },
    { event: "transaction.recurring.process" },
    async ({ event, step }) => {
        // Validate event data
        if (!event?.data?.transactionId || !event?.data?.userId) {
            console.error("Invalid event data", event);
            return { error: "Missing required event data" };
        }

        await step.run("process-transaction", async () => {
            const transaction = await db.transaction.findUnique({
                where: {
                    id: event.data.transactionId,
                    userId: event.data.userId,
                },
                include: {
                    account: true,
                }
            });

            if (!transaction || !isTransactionDue(transaction)) return;

            await db.$transaction(async (tx) => {
                await tx.transaction.create({
                    data: {
                        type: transaction.type,
                        amount: transaction.amount,
                        description: `${transaction.description} (Recurring)`,
                        date: new Date(),
                        category: transaction.category,
                        userId: transaction.userId,
                        accountId: transaction.accountId,
                        isRecurring: false,
                    }
                });

                const balanceChange = transaction.type === "EXPENSE" ? -transaction.amount : transaction.amount;

                await tx.account.update({
                    where: {
                        id: transaction.accountId,
                    },
                    data: {
                        balance: { increment: balanceChange },
                    },
                });

                // Update last processed date and next recurring date
                await tx.transaction.update({
                    where: {
                        id: transaction.id,
                    },
                    data: {
                        lastProcessed: new Date(),
                        nextRecurringDate: calculateNextRecurringDate(new Date(), transaction.recurringInterval),
                    },
                });
            });
        });
    }
);

const isTransactionDue = (transaction: Transaction) => {
    // If no last processed date, it means the transaction is due
    if (!transaction.lastProcessed) return true;

    const today = new Date();
    if (!transaction.nextRecurringDate) return false;
    const nextDueDate = new Date(transaction.nextRecurringDate);
    return nextDueDate <= today;
}

function calculateNextRecurringDate(startDate: Date, interval: string | null) {
    const date = new Date(startDate);

    switch (interval) {
        case "DAILY":
            date.setDate(date.getDate() + 1);
            break;
        case "WEEKLY":
            date.setDate(date.getDate() + 7);
            break;
        case "MONTHLY":
            date.setMonth(date.getMonth() + 1);
            break;
        case "YEARLY":
            date.setFullYear(date.getFullYear() + 1);
            break;
    }

    return date;
}

export const generateMonthlyReports = inngest.createFunction(
    { id: "generate-monthly-reports", name: "Generate Monthly Reports" },
    { cron: "0 0 1 * *" },
    async ({ step }) => {
        const users = await step.run("fetch-users", async () => {
            return await db.user.findMany({
                include: {
                    accounts: true,
                },
            });
        });

        for (const user of users) {
            await step.run(`generate-report-${user.id}`, async () => {
                const lastMonth = new Date();
                lastMonth.setMonth(lastMonth.getMonth() - 1);

                const stats = await getMonthlyStats(user.id, lastMonth);
                const monthName = lastMonth.toLocaleString("default", { month: "long" });

                const insights = await generateFinancialInsights(stats, monthName);

                const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        to: user.email,
                        subject: `Your Monthly Financial Report - ${monthName}`,
                        templateData: {
                            userName: user.name,
                            type: "monthly-report",
                            data: {
                                stats,
                                month: monthName,
                                insights,
                            }
                        },
                    }),
                });

                // Check if email was sent successfully
                if (!response.ok) {
                    throw new Error(`Failed to send financial report email: ${response.status} ${response.statusText}`);
                }
            });
        }

        return { processed: users.length };
    }
);

const generateFinancialInsights = async (stats: MonthlyStats, monthName: string) => {
    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `
        Analyze this financial data and provide 3 concise, actionable insights.
        Focus on spending patterns and practical advice.
        Keep it friendly and conversational.

        Financial Data for ${monthName}:
        - Total Income: Rs. ${stats.totalIncome}
        - Total Expenses: Rs. ${stats.totalExpenses}
        - Net Income: Rs. ${stats.totalIncome - stats.totalExpenses}
        - Expense Categories: ${Object.entries(stats.byCategory)
            .map(([category, amount]) => `${category}: Rs. ${amount}`)
            .join(", ")}

        Format the response as a JSON array of strings, like this:
        ["insight 1", "insight 2", "insight 3"]
    `;

    const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            { text: prompt },
        ],
    });

    try {
        const text = result.text;
        if (!text) {
            return "";
        }
        const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

        const data = JSON.parse(cleanedText);
        return data;
    } catch (error) {
        console.error("Error generating insights:", error);
        return [
            "Your highest expense category this month might need attention.",
            "Consider setting up a budget for better financial management.",
            "Track your recurring expenses to identify potential savings.",
        ];
    }
}

const getMonthlyStats = async (userId: string, month: Date) => {
    const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
    const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const transactions = await db.transaction.findMany({
        where: {
            userId,
            date: {
                gte: startDate,
                lte: endDate,
            },
        },
    });

    return transactions.reduce(
        (stats: MonthlyStats, t: Transaction) => {
            const amount = Number(t.amount);
            if (t.type === "EXPENSE") {
                stats.totalExpenses += amount;
                stats.byCategory[t.category] = (stats.byCategory[t.category] || 0) + amount;
            } else {
                stats.totalIncome += amount;
            }
            return stats;
        },
        {
            totalExpenses: 0,
            totalIncome: 0,
            byCategory: {},
            transactionCount: transactions.length,
        })
}

interface MonthlyStats {
    totalExpenses: number;
    totalIncome: number;
    byCategory: Record<string, number>;
    transactionCount: number;
}