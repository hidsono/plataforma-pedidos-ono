
export interface BusinessStatus {
    isOpen: boolean;
    isOrderingOpen: boolean;
    message: string;
    nextOpening: string;
}

export function getBusinessStatus(): BusinessStatus {
    // Usando Date nativo. Em produção, considerar timezone se necessário, 
    // mas para rodar no cliente/servidor com o mesmo timezone do usuário/loja funciona bem.
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTimeMinutes = hours * 60 + minutes;

    // Configurações
    const WEEKDAY_OPEN = 8 * 60;       // 08:00
    const WEEKDAY_CLOSE = 17 * 60;      // 17:00
    const WEEKDAY_CUTOFF = 16 * 60;     // 16:00

    const SATURDAY_OPEN = 8 * 60;      // 08:00
    const SATURDAY_CLOSE = 16 * 60;     // 16:00
    const SATURDAY_CUTOFF = 15 * 60;    // 15:00

    let isOpen = false;
    let isOrderingOpen = false;
    let message = "";
    let nextOpening = "";

    // Domingo
    if (day === 0) {
        isOpen = false;
        isOrderingOpen = false;
        message = "Fechado hoje";
        nextOpening = "Segunda-feira às 08:00";
    }
    // Sábado
    else if (day === 6) {
        if (currentTimeMinutes >= SATURDAY_OPEN && currentTimeMinutes < SATURDAY_CLOSE) {
            isOpen = true;
            if (currentTimeMinutes < SATURDAY_CUTOFF) {
                isOrderingOpen = true;
                message = "Aberto (Pedidos para hoje)";
            } else {
                isOrderingOpen = false;
                message = "Aberto (Pedidos para Segunda)";
                nextOpening = "Segunda-feira às 08:00";
            }
        } else if (currentTimeMinutes < SATURDAY_OPEN) {
            message = "Abre às 08:00";
            nextOpening = "Hoje às 08:00";
        } else {
            message = "Fechado agora";
            nextOpening = "Segunda-feira às 08:00";
        }
    }
    // Segunda a Sexta
    else {
        if (currentTimeMinutes >= WEEKDAY_OPEN && currentTimeMinutes < WEEKDAY_CLOSE) {
            isOpen = true;
            if (currentTimeMinutes < WEEKDAY_CUTOFF) {
                isOrderingOpen = true;
                message = "Aberto (Pedidos para hoje)";
            } else {
                isOrderingOpen = false;
                const isFriday = day === 5;
                message = isFriday ? "Aberto (Pedidos para Sábado)" : "Aberto (Pedidos para amanhã)";
                nextOpening = isFriday ? "Sábado às 08:00" : "Amanhã às 08:00";
            }
        } else if (currentTimeMinutes < WEEKDAY_OPEN) {
            message = "Abre às 08:00";
            nextOpening = "Hoje às 08:00";
        } else {
            const isFriday = day === 5;
            message = "Fechado agora";
            nextOpening = isFriday ? "Sábado às 08:00" : "Amanhã às 08:00";
        }
    }

    return { isOpen, isOrderingOpen, message, nextOpening };
}
