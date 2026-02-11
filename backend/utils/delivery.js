export function getDeliveryPrice(delivery, country) {
    if (!delivery) return 89; // стандартна доставка

    const c = (country || '').trim().toLowerCase();

    if (delivery === 'zasilkovna') {
        if (c === 'czechia' || c === 'česko') return 89;
        if (c === 'slovakia') return 99;
        if (c === 'hungary') return 119;
        return 0; // інші країни
    }

    if (delivery === 'ceska_posta') {
        if (c === 'czechia' || c === 'česko') return 75;
        return 0; // недоступно для інших країн
    }

    return 89; // дефолт
}