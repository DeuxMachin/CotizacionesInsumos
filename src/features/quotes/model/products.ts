export type Product = { id: string; name: string; price: number; category: string; subcategory?: string };

export const products: Product[] = [
  { id: "P-001", name: "Laptop Dell Inspiron 15", price: 850000, category: "Electrónicos", subcategory: "Computadores" },
  { id: "P-002", name: "PC Desktop HP", price: 650000, category: "Electrónicos", subcategory: "Computadores" },
  { id: "P-003", name: "Teclado Mecánico", price: 79000, category: "Electrónicos", subcategory: "Accesorios" },
  { id: "P-004", name: "Mouse Inalámbrico", price: 39000, category: "Electrónicos", subcategory: "Accesorios" },
  { id: "P-005", name: "Silla Ergonómica", price: 159000, category: "Oficina", subcategory: "Mobiliario" },
];
