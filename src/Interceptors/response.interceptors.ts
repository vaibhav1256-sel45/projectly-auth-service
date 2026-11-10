import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { map, Observable } from "rxjs";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    return next.handle().pipe(
      map((response) => {
        const {
          message,
          data,
        } = response;

        this.logger.info(
          { data },
          message ?? 'Request successful',
        );

        return {
          success: true,
          message: message ?? 'Request successful',
          data,
        };
      }),
    );
  }
}
