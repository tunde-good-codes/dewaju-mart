import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RESPONSE_MESSAGE_KEY } from "libs/decorator/response.message.decorator";
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';


@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();
    
    const customMessage = this.reflector.get<string>(
      RESPONSE_MESSAGE_KEY,
      context.getHandler(),
    );

    return next.handle().pipe(
      map((data) => ({
        success: response.statusCode >= 200 && response.statusCode < 300,
        data: data === undefined ? null : data,
        message: customMessage || 'Operation executed successfully',
      })),
    );
  }
}