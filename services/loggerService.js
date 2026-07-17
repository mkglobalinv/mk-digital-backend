import fs from 'fs';
import path from 'path';

const LOGS_DIR = path.join(process.cwd(), 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

class LoggerService {
    constructor() {
        this.logFile = path.join(LOGS_DIR, `system-${new Date().toISOString().split('T')[0]}.log`);
    }

    /**
     * Internal write to file
     */
    _write(level, message, context = {}) {
        const timestamp = new Date().toISOString();
        const contextStr = Object.keys(context).length > 0 ? ` | Context: ${JSON.stringify(context)}` : '';
        const line = `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}\n`;
        
        fs.appendFileSync(this.logFile, line);
        
        // Also log to console in development
        if (process.env.NODE_ENV !== 'production') {
            const colors = {
                info: '\x1b[36m', // Cyan
                warn: '\x1b[33m', // Yellow
                error: '\x1b[31m', // Red
                critical: '\x1b[35m', // Magenta
                reset: '\x1b[0m'
            };
            console.log(`${colors[level] || ''}[${level.toUpperCase()}]${colors.reset} ${message}`);
        }
    }

    info(message, context) {
        this._write('info', message, context);
    }

    warn(message, context) {
        this._write('warn', message, context);
    }

    error(message, context) {
        this._write('error', message, context);
    }

    critical(message, context) {
        this._write('critical', message, context);
    }

    /**
     * Specialized logging for builds
     */
    buildError(jobId, resellerId, message, err) {
        this.error(`Build Failed: ${message}`, { 
            jobId, 
            resellerId, 
            errorMessage: err?.message, 
            stack: err?.stack 
        });
    }

    /**
     * Specialized logging for database
     */
    dbError(operation, err) {
        this.critical(`Database Error during ${operation}`, { 
            errorMessage: err?.message, 
            stack: err?.stack 
        });
    }

    /**
     * Search logs (basic implementation)
     */
    async search(query, limit = 100) {
        if (!fs.existsSync(this.logFile)) return [];
        const content = fs.readFileSync(this.logFile, 'utf8');
        const lines = content.split('\n').filter(l => l.trim().length > 0);
        
        const results = lines
            .filter(l => !query || l.toLowerCase().includes(query.toLowerCase()))
            .reverse()
            .slice(0, limit);
            
        return results;
    }
}

const logger = new LoggerService();
export default logger;
