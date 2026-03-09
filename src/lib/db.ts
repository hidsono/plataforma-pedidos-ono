import fs from 'fs';
import path from 'path';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
  imageUrl?: string;
  isVariableWeight?: boolean;
}

const DATA_FILE = path.join(process.cwd(), 'data', 'products.json');

export function initDb() {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
  }
}

export function getProducts(): Product[] {
  initDb();
  const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
  try {
    return JSON.parse(fileContent);
  } catch (e) {
    return [];
  }
}

export function saveProducts(products: Product[]) {
  initDb();
  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
}
