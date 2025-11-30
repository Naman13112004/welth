import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type AccountLike = {
  balance?: unknown;
  amount?: unknown;
};

export const serializeAccount = <T extends AccountLike>(obj: T) => {
  const serialized: T = { ...obj };

  if (obj && "balance" in obj) {
    serialized.balance = Number(obj.balance);
  }

  if (obj && "amount" in obj) {
    serialized.amount = Number(obj.amount);
  }

  return serialized;
}