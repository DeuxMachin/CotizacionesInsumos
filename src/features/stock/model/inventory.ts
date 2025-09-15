import { StockService, type InventoryItem as DBInventoryItem } from '@/services/stockService'

export type StockStatus = "in-stock" | "low" | "out";

// Re-export the InventoryItem from StockService for backward compatibility
export type InventoryItem = DBInventoryItem

// Legacy interface for backward compatibility (if needed)
export interface LegacyInventoryItem {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  packSize: number;
  price: number;
  cost: number;
  updatedAt: string;
  status?: StockStatus;
}

// Functions to fetch data from DB
export async function getAllInventory(): Promise<InventoryItem[]> {
  return await StockService.getAllInventory()
}

export async function searchInventory(searchTerm: string): Promise<InventoryItem[]> {
  return await StockService.searchInventory(searchTerm)
}

export async function getInventoryByCategory(categoryId: number): Promise<InventoryItem[]> {
  return await StockService.getInventoryByCategory(categoryId)
}

export async function getCategories() {
  return await StockService.getCategories()
}

// Utility function to infer status (kept for compatibility)
export function inferStatus(totalStock: number): StockStatus {
  return StockService.inferStatus(totalStock)
}

// Format currency helper
export function formatCLP(amount: number | null): string {
  if (amount === null) return '$0'
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(amount)
}
