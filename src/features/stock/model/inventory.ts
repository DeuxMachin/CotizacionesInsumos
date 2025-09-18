import { StockService, type InventoryItem as DBInventoryItem } from '@/services/stockService'

// Re-export the InventoryItem from StockService for backward compatibility
export type InventoryItem = DBInventoryItem

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

// Format currency helper
export function formatCLP(amount: number | null): string {
  if (amount === null) return '$0'
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(amount)
}
