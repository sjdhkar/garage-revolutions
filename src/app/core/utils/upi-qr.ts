/**
 * Builds a scannable UPI payment QR code image URL from a garage's UPI ID —
 * generated on the fly via a free public QR-rendering API, no file upload or
 * Storage bucket required. `amount`/`note` are optional so the same builder
 * covers both a generic "pay us" QR (Settings/Wizard preview) and a specific
 * per-invoice QR with a fixed amount (job card print/WhatsApp).
 */
export function buildUpiQrUrl(params: { upiId: string; payeeName: string; amount?: number; note?: string }): string {
    const { upiId, payeeName, amount, note } = params;
    let upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}`;
    if (amount !== undefined) upiString += `&am=${amount}`;
    if (note) upiString += `&tn=${encodeURIComponent(note)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiString)}`;
}
