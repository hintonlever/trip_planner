import session from 'express-session';
import db from './database.js';

export class SQLiteStore extends session.Store {
  private getStmt = db.prepare('SELECT sess FROM sessions WHERE sid = ? AND expired > ?');
  private setStmt = db.prepare('INSERT OR REPLACE INTO sessions (sid, sess, expired) VALUES (?, ?, ?)');
  private destroyStmt = db.prepare('DELETE FROM sessions WHERE sid = ?');

  get(sid: string, cb: (err?: Error | null, session?: session.SessionData | null) => void) {
    try {
      const row = this.getStmt.get(sid, Date.now()) as { sess: string } | undefined;
      cb(null, row ? JSON.parse(row.sess) : null);
    } catch (err) {
      cb(err as Error);
    }
  }

  set(sid: string, sess: session.SessionData, cb?: (err?: Error | null) => void) {
    try {
      const maxAge = sess.cookie?.maxAge ?? 86400000;
      const expired = Date.now() + maxAge;
      this.setStmt.run(sid, JSON.stringify(sess), expired);
      cb?.(null);
    } catch (err) {
      cb?.(err as Error);
    }
  }

  destroy(sid: string, cb?: (err?: Error | null) => void) {
    try {
      this.destroyStmt.run(sid);
      cb?.(null);
    } catch (err) {
      cb?.(err as Error);
    }
  }
}
