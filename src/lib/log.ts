type Level = 'silent' | 'error' | 'warn' | 'info' | 'debug';
const order: Record<Level, number> = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 };
function currentLevel(): Level {
  const env = process.env.NEXT_PUBLIC_LOG_LEVEL as Level | undefined;
  if (env) return env;
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}
function enabled(target: Level) { return order[target] <= order[currentLevel()]; }
export const log = {
  debug: (...a: unknown[]) => enabled('debug') && console.debug(...a),
  info: (...a: unknown[]) => enabled('info') && console.log(...a),
  warn: (...a: unknown[]) => enabled('warn') && console.warn(...a),
  error: (...a: unknown[]) => enabled('error') && console.error(...a),
};
