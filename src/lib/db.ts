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
      throw new Error("DATABASE_URL não configurada nas variáveis de ambiente");
    }
    client = new MongoClient(DATABASE_URL);
    await client.connect();
  }
  return client;
}

export async function getProducts(): Promise<Product[]> {
  try {
    const client = await getClient();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Buscamos todos e removemos o _id do MongoDB para manter o formato do app
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
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Na nuvem, o gerenciamento de produtos é um pouco diferente.
    // Se você estiver enviando uma lista completa (Excel), vamos limpar e inserir todos.
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
