import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class WhatsappService {

    generateUrl(mobile: string, message: string): string {
        // Remove non-digit characters
        const cleanMobile = mobile.replace(/\D/g, '');
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/91${cleanMobile}?text=${encodedMessage}`;
    }

    openChat(mobile: string, message: string): void {
        const url = this.generateUrl(mobile, message);
        window.open(url, '_blank');
    }
}
