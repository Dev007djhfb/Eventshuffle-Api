import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const headerId = req.headers?.['x-request-id'];
    const id = (typeof headerId === 'string' && headerId) ? headerId : randomUUID();

    req.id = id;
    res.setHeader('x-request-id', id);

    next();
  }
}
