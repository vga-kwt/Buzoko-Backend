import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export const RESPONSE_MESSAGE_KEY = 'response_message_key';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const message: string | undefined = this.reflector.getAllAndOverride<string>(
      RESPONSE_MESSAGE_KEY,
      [context.getHandler(), context.getClass()],
    );

    return next.handle().pipe(
      map((data) => {
        // If the handler already returns the standardized shape, pass through
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return data;
        }
        const normalized = data == null ? [] : Array.isArray(data) ? data : [data];
        return {
          success: true,
          message: message,
          // Ensure array of objects as requested
          data: normalized,
        };
      }),
    );
  }
}


