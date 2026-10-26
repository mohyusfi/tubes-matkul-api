// Modul Logger Standar (Bebas Emoji)
// Format: [YYYY-MM-DD HH:mm:ss] [LEVEL] [MODULE] Pesan

function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function formatMessage(level, moduleName, message) {
  return `[${getTimestamp()}] [${level.toUpperCase()}] [${moduleName.toUpperCase()}] ${message}`;
}

export const logger = {
  info(moduleName, message) {
    console.log(formatMessage('INFO', moduleName, message));
  },
  warn(moduleName, message) {
    console.warn(formatMessage('WARN', moduleName, message));
  },
  error(moduleName, message) {
    console.error(formatMessage('ERROR', moduleName, message));
  },
  debug(moduleName, message) {
    if (process.env.LOG_LEVEL === 'DEBUG') {
      console.debug(formatMessage('DEBUG', moduleName, message));
    }
  }
};

export default logger;
