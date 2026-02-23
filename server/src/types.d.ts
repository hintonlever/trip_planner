import type { User } from './services/userService.js';

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
  }
}
