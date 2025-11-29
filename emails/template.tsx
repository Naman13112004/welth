import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
} from "@react-email/components";

export default function EmailTemplate({
    userName = "",
    type = "budget-alert",
    data = {},
}: {
    userName: string | null;
    type: "budget-alert" | "monthly-report";
    data: any;
}) {
    if (type === "monthly-report") {
        return (
            <Html>
                <Head />
                <Preview>Your Monthly Financial Report</Preview>
                <Body style={styles.body}>
                    <Container style={styles.container}>
                        <Heading style={styles.title}>Monthly Financial Report</Heading>

                        <Text style={styles.text}>Hello {userName},</Text>
                        <Text style={styles.text}>
                            Here&apos;s your financial summary for {data?.month}.
                        </Text>

                        {/* Main Stats */}
                        <Section style={styles.statsContainer}>
                            <Section style={styles.stat}>
                                <Text style={styles.text}>Total Income</Text>
                                <Text style={styles.heading}>
                                    Rs. {data?.stats.totalIncome}
                                </Text>
                            </Section>

                            <Section style={styles.stat}>
                                <Text style={styles.text}>Total Expenses</Text>
                                <Text style={styles.heading}>
                                    Rs. {data?.stats.totalExpenses}
                                </Text>
                            </Section>

                            <Section style={styles.stat}>
                                <Text style={styles.text}>Net</Text>
                                <Text style={styles.heading}>
                                    Rs.{" "}
                                    {data?.stats.totalIncome - data?.stats.totalExpenses}
                                </Text>
                            </Section>
                        </Section>

                        {/* Category Breakdown */}
                        {data?.stats?.byCategory && (
                            <Section style={styles.section}>
                                <Heading style={styles.heading}>
                                    Expenses by Category
                                </Heading>

                                {Object.entries(data.stats.byCategory).map(
                                    ([category, amount]) => (
                                        <table
                                            key={category}
                                            width="100%"
                                            style={{
                                                borderBottom: "1px solid #e5e7eb",
                                                padding: "12px 0",
                                                marginBottom: "8px",
                                            }}
                                        >
                                            <tbody>
                                                <tr>
                                                    <td>
                                                        <Text style={styles.text}>
                                                            {category}
                                                        </Text>
                                                    </td>
                                                    <td style={{ textAlign: "right" }}>
                                                        <Text style={styles.text}>
                                                            Rs. {`${amount}`}
                                                        </Text>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    )
                                )}
                            </Section>
                        )}

                        {/* AI Insights */}
                        {data?.insights && (
                            <Section style={styles.section}>
                                <Heading style={styles.heading}>
                                    Welth Insights
                                </Heading>
                                {data.insights.map(
                                    (insight: string, index: number) => (
                                        <Text key={index} style={styles.text}>
                                            • {insight}
                                        </Text>
                                    )
                                )}
                            </Section>
                        )}

                        <Section style={styles.footerSection}>
                            <Text style={styles.footerText}>
                                Thank you for using Welth. Keep tracking your finances
                                for better financial health!
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Html>
        );
    }

    /* Budget Alert */
    return (
        <Html>
            <Head />
            <Preview>Budget Alert</Preview>
            <Body style={styles.body}>
                <Container style={styles.container}>
                    <Heading style={styles.title}>Budget Alert</Heading>

                    <Text style={styles.text}>Hello {userName},</Text>

                    <Text style={styles.text}>
                        You've used {(data?.percentageUsed ?? 0).toFixed(1)}% of
                        your monthly budget.
                    </Text>

                    <Section style={styles.statsContainer}>
                        <Section style={styles.stat}>
                            <Text style={styles.text}>Budget Amount</Text>
                            <Text style={styles.heading}>Rs. {data?.budgetAmount}</Text>
                        </Section>

                        <Section style={styles.stat}>
                            <Text style={styles.text}>Spent So Far</Text>
                            <Text style={styles.heading}>Rs. {data?.totalExpenses}</Text>
                        </Section>

                        <Section style={styles.stat}>
                            <Text style={styles.text}>Remaining</Text>
                            <Text style={styles.heading}>
                                Rs. {data?.budgetAmount - data?.totalExpenses}
                            </Text>
                        </Section>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

const styles = {
    body: {
        backgroundColor: "#f6f9fc",
        fontFamily: "-apple-system, sans-serif",
    },
    container: {
        backgroundColor: "#ffffff",
        margin: "0 auto",
        padding: "20px",
        borderRadius: "5px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    },
    title: {
        color: "#1f2937",
        fontSize: "32px",
        fontWeight: "bold",
        textAlign: "center" as const,
        margin: "0 0 20px",
    },
    heading: {
        color: "#1f2937",
        fontSize: "20px",
        fontWeight: "600",
        margin: "0 0 16px",
    },
    text: {
        color: "#4b5563",
        fontSize: "16px",
        margin: "0 0 16px",
    },
    section: {
        marginTop: "32px",
        padding: "20px",
        backgroundColor: "#f9fafb",
        borderRadius: "5px",
        border: "1px solid #e5e7eb",
    },
    statsContainer: {
        margin: "32px 0",
        padding: "20px",
        borderRadius: "5px",
        backgroundColor: "#f9fafb",
    },
    stat: {
        marginBottom: "16px",
        padding: "12px",
        backgroundColor: "#fff",
        borderRadius: "4px",
    },
    footerSection: {
        marginTop: "32px",
        paddingTop: "16px",
        borderTop: "1px solid #e5e7eb",
        textAlign: "center" as const,
    },
    footerText: {
        color: "#6b7280",
        fontSize: "14px",
        margin: "0",
    },
};
