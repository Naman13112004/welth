import { db } from "@/lib/prisma";
import { inngest } from "./client";

export const checkBudgetAlerts = inngest.createFunction(
  { id: "check-budget-alerts" ,name: "Check Budget Alerts" },
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
        if(!defaultAccount) continue;
        
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

            if(
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
                if(!response.ok) {
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