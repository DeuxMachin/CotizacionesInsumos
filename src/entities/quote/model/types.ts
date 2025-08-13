export type QuoteStatus = "pending" | "approved" | "rejected";
export type Quote = { id: string; client: string; date: string; status: QuoteStatus; amount: number; };
