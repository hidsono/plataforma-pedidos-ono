import { NextResponse } from 'next/server';
import { getProducts, saveProducts, Product } from '@/lib/db';

export async function GET() {
    const products = getProducts();
    return NextResponse.json(products);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        if (body.product) {
            const currentProducts = getProducts();
            const newProduct: Product = body.product;
            if (!newProduct.id) {
                newProduct.id = `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            }
            saveProducts([...currentProducts, newProduct]);
            return NextResponse.json({ success: true, product: newProduct });
        }

        const { products } = body;

        if (!Array.isArray(products)) {
            return NextResponse.json({ error: 'Invalid payload, expected array of products' }, { status: 400 });
        }

        saveProducts(products as Product[]);

        return NextResponse.json({ success: true, count: products.length });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save products' }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        saveProducts([]);
        return NextResponse.json({ success: true, message: 'Products cleared successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to clear products' }, { status: 500 });
    }
}
