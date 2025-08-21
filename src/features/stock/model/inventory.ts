export type StockStatus = "in-stock" | "low" | "out";

export interface InventoryItem {
  id: string;
  code: string; // SKU o código
  name: string;
  category: string;
  unit: string; // unidad de medida (un, kg, lt)
  stock: number;
  packSize: number; // tamaño de pack (6, 12, 24, 36, ...)
  price: number; // precio de venta unitario
  cost: number; // costo unitario
  updatedAt: string; // ISO date
  status?: StockStatus;
}

export const inventoryMock: InventoryItem[] = [
  {
    id: "P-001",
    code: "2A-AP-148833",
    name: "Ácido Peracético al 15%, Bidón 20 KG",
    category: "Químicos",
    unit: "kg",
  stock: 12,
  packSize: 12,
    price: 85569,
    cost: 63500,
    updatedAt: "2025-08-15",
  },
  {
    id: "P-002",
    code: "IT-A3-522086",
    name: "Adhesivo 300 Café",
    category: "Adhesivos",
    unit: "un",
  stock: 2,
  packSize: 6,
    price: 448800,
    cost: 350000,
    updatedAt: "2025-08-14",
  },
  {
    id: "P-003",
    code: "RD-901588",
    name: "Adhesivo Doble Contacto, Lata 18 LT",
    category: "Adhesivos",
    unit: "lt",
  stock: 0,
  packSize: 24,
    price: 117283,
    cost: 92000,
    updatedAt: "2025-08-10",
  },
  {
    id: "P-004",
    code: "RZ-2152L",
    name: "Adhesivo Montaje 5 KG",
    category: "Adhesivos",
    unit: "kg",
    stock: 41,
    packSize: 12,
    price: 19080,
    cost: 12300,
    updatedAt: "2025-08-18",
  },
];

export function inferStatus(i: InventoryItem): StockStatus {
  if (i.stock <= 0) return "out";
  if (i.stock < i.packSize) return "low"; // bajo si queda menos que un pack completo
  return "in-stock";
}
