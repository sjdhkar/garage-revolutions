import { ErrorHandler, Injectable, Injector, inject } from '@angular/core';
import { LoggingService } from './services/logging.service';

/**
 * Catches every uncaught exception app-wide (template errors, unhandled
 * promise rejections routed through Zone.js, etc.) and routes it through
 * LoggingService instead of leaving it as a browser-console-only event that
 * a garage owner has no way to ever see after the fact.
 */
@Injectable()
export class AppErrorHandler implements ErrorHandler {
    private injector = inject(Injector);

    handleError(error: unknown): void {
        // Lazily resolve LoggingService (which itself injects AuthService) to
        // avoid a circular construction order issue with Angular's own
        // error-handling bootstrap sequence.
        const logging = this.injector.get(LoggingService);
        logging.logError('uncaught', error);
    }
}
