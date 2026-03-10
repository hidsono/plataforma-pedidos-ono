import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/db";

export async function GET() {
    const settings = await getSettings();
    return NextResponse.json(settings);
}

export async function POST(req: Request) {
    try {
        const settings = await req.json();
        await saveSettings(settings);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Erro ao salvar configurações' }, { status: 500 });
    }
}
