import { MongoClient, ObjectId } from 'mongodb';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
  imageUrl?: string;
  isVariableWeight?: boolean;
}

const DATABASE_URL = process.env.DATABASE_URL || "";
const DB_NAME = "plataforma-pedidos";
const COLLECTION_NAME = "products";

let client: MongoClient | null = null;

async function getClient() {
  if (!client) {
    if (!DATABASE_URL) {
      // Em ambiente de build na Vercel, o DATABASE_URL pode não estar disponível.
      // Retornamos um erro amigável em vez de travar o processo.
      console.warn("Aviso: DATABASE_URL não configurada. Verifique as variáveis de ambiente na Vercel.");
      return null;
    }
    client = new MongoClient(DATABASE_URL);
    await client.connect();
  }
  return client;
}

export async function getProducts(): Promise<Product[]> {
  try {
    const client = await getClient();
    if (!client) return [];

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const products = await collection.find({}).toArray();
    return products.map(p => {
      const { _id, ...rest } = p;
      return { ...rest } as Product;
    });
  } catch (e) {
    console.error("Erro ao buscar produtos no MongoDB:", e);
    return [];
  }
}

export async function saveProducts(products: Product[]) {
  try {
    const client = await getClient();
    if (!client) return;

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    await collection.deleteMany({});
    if (products.length > 0) {
      await collection.insertMany(products);
    }
  } catch (e) {
    console.error("Erro ao salvar produtos no MongoDB:", e);
  }
}

// Helper para salvar um único produto (usado no painel)
export async function saveSingleProduct(product: Product) {
  try {
    const client = await getClient();
    if (!client) return;

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    await collection.updateOne(
      { id: product.id },
      { $set: product },
      { upsert: true }
    );
  } catch (e) {
    console.error("Erro ao salvar produto único:", e);
  }
}

export interface DeliveryRule {
  neighborhood: string;
  fee: number;
}

export interface Settings {
  deliveryRules: DeliveryRule[];
  defaultFee: number;
}

const SETTINGS_COLLECTION = "settings";

// ... existing code ...

export async function getSettings(): Promise<Settings> {
  const defaultSettings: Settings = {
    deliveryRules: [
      { neighborhood: 'Centro', fee: 5.00 },
      { neighborhood: 'Vila', fee: 8.00 }
    ],
    defaultFee: 10.00
  };

  try {
    const client = await getClient();
    if (!client) return defaultSettings;

    const db = client.db(DB_NAME);
    const collection = db.collection(SETTINGS_COLLECTION);

    const settings = await collection.findOne({ type: 'delivery' });
    if (!settings) return defaultSettings;

    return {
      deliveryRules: settings.deliveryRules || defaultSettings.deliveryRules,
      defaultFee: settings.defaultFee ?? defaultSettings.defaultFee
    };
  } catch (e) {
    console.error("Erro ao buscar configurações:", e);
    return defaultSettings;
  }
}

export async function saveSettings(settings: Settings) {
  try {
    const client = await getClient();
    if (!client) return;

    const db = client.db(DB_NAME);
    const collection = db.collection(SETTINGS_COLLECTION);

    await collection.updateOne(
      { type: 'delivery' },
      { $set: { ...settings, type: 'delivery' } },
      { upsert: true }
    );
  } catch (e) {
    console.error("Erro ao salvar configurações:", e);
  }
}
