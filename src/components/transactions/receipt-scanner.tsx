"use client";

import { useEffect, useRef } from "react";
import type { ScannedData } from "./transaction-form";
import { useRouter } from "next/navigation";
import useFetch from "@/hooks/use-fetch";
import { Button } from "../ui/button";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ReceiptScannerProps {
    onScanComplete: (scannedData: ScannedData) => void;
}

const ReceiptScanner = ({ onScanComplete }: ReceiptScannerProps) => {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function scanReceipt(file: File) {
        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch("/api/analyze", {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to analyze receipt");
        }

        router.refresh();

        return res.json();
    }

    const {
        loading: scanReceiptLoading,
        fn: scanReceiptFn,
        data: scannedData,
        error,
    } = useFetch((file: File) => scanReceipt(file));

    const handleReceiptScan = async (file: File) => {
        if (file.size > 4 * 1024 * 1024) {
            toast.error("File size should be less than 4MB");
            return;
        }
        await scanReceiptFn(file);
    };

    useEffect(() => {
        if (scannedData && !scanReceiptLoading) {
            onScanComplete(scannedData);
            toast.success("Receipt scanned successfully");
        }
    }, [scannedData, scanReceiptLoading]);

    return (
        <div>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleReceiptScan(file);
                }}
            />

            <Button
                type="button"
                variant="outline"
                className="w-full h-10 bg-linear-to-br from-orange-500 via-pink-500 to-purple-500 animate-gradient hover:opacity-90 transition-opacity text-white hover:text-white cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                disabled={scanReceiptLoading}
            >
                {scanReceiptLoading ? (
                    <>
                        {" "}
                        <Loader2 className="mr-2 animate-spin" />
                        <span>Scanning Receipt...</span>
                    </>
                ) : (
                    <>
                        <Camera className="mr-2" />
                        <span>Scan Receipt with AI</span>
                    </>
                )}
            </Button>
        </div>
    );
};

export default ReceiptScanner;