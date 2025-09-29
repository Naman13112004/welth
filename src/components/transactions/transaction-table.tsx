"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Transaction } from "@/generated/prisma";
import { categoryColors } from "../../../data/categories";
import { ChevronDown, ChevronUp, Clock, MoreHorizontal, RefreshCw } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const RECURRING_INTERVALS = {
    DAILY: "Daily",
    WEEKLY: "Weekly",
    MONTHLY: "Monthly",
    YEARLY: "Yearly",
}

const TransactionTable = ({ transactions }: { transactions: Transaction[] }) => {
  const router = useRouter();
  const filteredAndSortedTransactions = transactions;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState({
    field: "date",
    direction: "desc",
  });

  const handleSort = (field: any) => {
    setSortConfig((current) => ({
        field,
        direction:
            current.field == field && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelect = (id: string) => {
    setSelectedIds((current) => (
        current.includes(id)
            ? current.filter(item => item !== id)
            : [...current, id]
    ));
  };

  const handleSelectAll = () => {
    setSelectedIds((current) => (
        current.length === filteredAndSortedTransactions.length
            ? []
            : filteredAndSortedTransactions.map(t => t.id)
    ));
  };

  return (
    <div className="space-y-4">
        {/* Filters */}

        {/* Transactions */}
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">
                            <Checkbox 
                                onCheckedChange={handleSelectAll}
                                checked = {
                                    selectedIds.length === filteredAndSortedTransactions.length &&
                                    filteredAndSortedTransactions.length > 0
                                }
                            />
                        </TableHead>
                        <TableHead 
                            className="cursor-pointer"
                            onClick={() => handleSort("date")}
                        >
                            <div className="flex items-center">
                                Date{" "}
                                {sortConfig.field === "date" && (
                                    sortConfig.direction === "asc" ? (
                                        <ChevronUp className="ml-1 h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="ml-1 h-4 w-4" />
                                    )
                                )}
                            </div>
                        </TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead 
                            className="cursor-pointer"
                            onClick={() => handleSort("category")}
                        >
                            <div className="flex items-center">
                                Category{" "}
                                {sortConfig.field === "category" && (
                                    sortConfig.direction === "asc" ? (
                                        <ChevronUp className="ml-1 h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="ml-1 h-4 w-4" />
                                    )
                                )}
                            </div>
                        </TableHead>
                        <TableHead 
                            className="cursor-pointer"
                            onClick={() => handleSort("amount")}
                        >
                            <div className="flex items-center justify-end">
                                Amount{" "}
                                {sortConfig.field === "amount" && (
                                    sortConfig.direction === "asc" ? (
                                        <ChevronUp className="ml-1 h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="ml-1 h-4 w-4" />
                                    )
                                )}
                            </div>
                        </TableHead>
                        <TableHead>Recurring</TableHead>
                        <TableHead className="w-[50px]" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredAndSortedTransactions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground">
                                No Transactions Found
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredAndSortedTransactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                                <TableCell>
                                    <Checkbox 
                                        onCheckedChange={() => handleSelect(transaction.id)} 
                                        checked={selectedIds.includes(transaction.id)}
                                    />
                                </TableCell>
                                <TableCell>{format(new Date(transaction.date), "PP")}</TableCell>
                                <TableCell>{transaction.description}</TableCell>
                                <TableCell>
                                    <span
                                        style={{
                                            background: categoryColors[transaction.category]
                                        }}
                                        className="px-2 py-1 rounded text-white text-sm"
                                    >
                                        {transaction.category}
                                    </span>
                                </TableCell>
                                <TableCell 
                                    className="text-right font-medium"
                                    style={{
                                        color: transaction.type === "EXPENSE" ? "red" : "green"
                                    }}
                                >
                                    {transaction.type === "EXPENSE" ? '-' : '+'}
                                    Rs. {transaction.amount.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                    {transaction.isRecurring ? (
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Badge 
                                                    variant="outline" 
                                                    className="gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200"
                                                >
                                                    <RefreshCw className="h-3 w-3" />
                                                    {
                                                        transaction.recurringInterval
                                                            ? RECURRING_INTERVALS[transaction.recurringInterval]
                                                            : ""
                                                    }
                                                </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <div className="text-sm">
                                                    <div className="font-medium">Next Date:</div>
                                                    <div>
                                                        {
                                                            transaction.nextRecurringDate
                                                                ? format(new Date(transaction.nextRecurringDate), "PP")
                                                                : "Not scheduled"
                                                        }
                                                    </div>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    ) : (
                                        <Badge variant="outline" className="gap-1">
                                            <Clock className="h-3 w-3" />
                                            One-time
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuLabel
                                                onClick={() => {
                                                    router.push(`/transaction/create?edit=${transaction.id}`)
                                                }}
                                                className="cursor-pointer"
                                            >
                                                Edit
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem 
                                                className="text-destructive cursor-pointer"
                                                // onClick={() => deleteTransaction([transaction.id])}
                                            >
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    </div>
  );
};

export default TransactionTable;