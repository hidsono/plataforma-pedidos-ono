import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const DATA_FILE = path.join(process.cwd(), 'data', 'products.json');
const uri = process.env.DATABASE_URL;

async function migrate() {
    if (!uri || uri.includes('SUA_SENHA_AQUI')) {
        console.error('❌ ERRO: Você ainda não colocou sua senha real no arquivo .env!');
        process.exit(1);
    }

    console.log('🚀 Iniciando migração para a nuvem...');

    try {
        // 1. Ler arquivo local
        if (!fs.existsSync(DATA_FILE)) {
            console.error('❌ Arquivo local products.json não encontrado.');
            return;
        }
        const products = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        console.log(`📦 Encontrados ${products.length} produtos no PC local.`);

        // 2. Conectar ao MongoDB
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db('plataforma-pedidos');
        const collection = db.collection('products');

        // 3. Limpar e Inserir
        await collection.deleteMany({});
        if (products.length > 0) {
            await collection.insertMany(products);
        }

        console.log('✅ SUCESSO! Todos os produtos foram enviados para a nuvem.');
        await client.close();
    } catch (error) {
        console.error('❌ Erro durante a migração:', error);
    }
}

migrate();
