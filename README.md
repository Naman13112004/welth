# Welth - Personal Finance Management App

Welth is a modern, AI-powered Personal Finance Management application aimed at helping users take control of their financial health. It provides intuitive tools for tracking income, expenses, budgets, and recurring transactions, all wrapped in a premium, responsive interface.

## 🚀 Live Demo

**[View Live Application - Welth](https://welth-ashen-one.vercel.app/)** 

## ✨ Key Features

*   **Dashboard Overview**: Real-time financial insights with interactive charts.
*   **Account Management**: Support for multiple accounts (Current, Savings).
*   **Transaction Tracking**: Log incomes and expenses with categories and receipt attachments.
*   **Smart Budgets**: Set monthly budgets and get alerts when you're close to limits.
*   **Recurring Transactions**: Automate tracking for subscriptions and bills (Daily, Weekly, Monthly, Yearly).
*   **AI Insights**: Intelligent financial advice powered by Gemini.
*   **Secure Authentication**: User management powered by Clerk.

## 🛠️ Tech Stack

This project is built with the latest web technologies to ensure performance, scalability, and developer experience.

### Core
*   **[Next.js 15](https://nextjs.org/)**: React framework with App Router.
*   **[TypeScript](https://www.typescriptlang.org/)**: Static type checking for robust code quality.
*   **[Prisma](https://www.prisma.io/)**: Next-generation ORM for type-safe database interactions with PostgreSQL.

### UI & UX
*   **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first CSS framework for rapid UI development.
*   **[Shadcn UI](https://ui.shadcn.com/)**: Reusable components built with Radix UI and Tailwind.
*   **[Recharts](https://recharts.org/)**: Composable charting library for React.
*   **[React Hook Form](https://react-hook-form.com/)** + **[Zod](https://zod.dev/)**: Flexible and type-safe form validation.

### Infrastructure & Services
*   **[Clerk](https://clerk.com/)**: Complete user management and authentication.
*   **[Inngest](https://www.inngest.com/)**: Serverless background jobs for processing recurring transactions.
*   **[Arcjet](https://arcjet.com/)**: Security and bot protection.
*   **[Resend](https://resend.com/)**: Email delivery service for notifications (using React Email).

## 💡 Why This Stack?

*   **Next.js 15 & React 19**: Chosen for its seamless integration of server-side rendering and client-side interactivity.
*   **Prisma & PostgreSQL**: Ensures strict data integrity and provides an excellent developer experience with auto-generated types matching our database schema.
*   **Inngest**: Essential for reliably handling background tasks like processing recurring transactions without managing a separate worker infrastructure.
*   **Clerk**: Offloads complex authentication security concerns, allowing us to focus on core features.

## 💻 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

*   Node.js 18+
*   npm / yarn / pnpm

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Naman13112004/welth.git
    cd welth
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory. You will need keys for the following services:

    ```env
    # Database (Supabase/PostgreSQL)
    DATABASE_URL="postgresql://..."
    DIRECT_URL="postgresql://..."

    # Authentication (Clerk)
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
    CLERK_SECRET_KEY=...
    NEXT_PUBLIC_CLERK_SIGN_IN_URL=sign-in
    NEXT_PUBLIC_CLERK_SIGN_UP_URL=sign-up

    # Security (Arcjet)
    ARCJET_KEY=...
    
    # Email (Resend)
    RESEND_API_KEY=...

    # Gemini API
    GEMINI_API_KEY=...

    # Default App URL 
    NEXT_PUBLIC_BASE_URL="http://localhost:3000" (default value)
    ```

4.  **Database Setup**
    Push the schema to your database:
    ```bash
    npx prisma generate
    npx prisma db push
    ```

5.  **Run Development Server**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
