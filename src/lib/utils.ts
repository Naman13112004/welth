import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const serializeAccount = (obj: any) => {
  const serialized: any = {...obj};

  if(obj !== null && obj !== undefined && "balance" in obj) {
      serialized.balance = Number((obj as any).balance);
  }

  if(obj !== null && obj !== undefined && "amount" in obj) {
      serialized.amount = Number((obj as any).amount);
  }

  return serialized;
}