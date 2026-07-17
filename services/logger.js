import SystemLog from "../models/SystemLog.js";

const createLog = async (data) => {
  try {
    const logData = {
      ...data,
      timestamp: new Date()
    };
    
    // Console output for direct visibility
    const colorCode = data.severity === 'CRITICAL' ? '\x1b[41m\x1b[37m[CRITICAL]\x1b[0m' : 
                      data.severity === 'ERROR' ? '\x1b[31m[ERROR]\x1b[0m' :
                      data.severity === 'WARNING' ? '\x1b[33m[WARNING]\x1b[0m' : '\x1b[32m[INFO]\x1b[0m';
    console.log(`${colorCode} [${data.service || 'System'}] [${data.module || 'Default'}] ${data.message}`);
    
    if (data.stack_trace) {
      console.error(data.stack_trace);
    }

    // Save asynchronously to DB without blocking
    SystemLog.create(logData).catch(dbErr => {
      console.error("Failed to persist SystemLog to MongoDB:", dbErr.message);
    });
  } catch (err) {
    console.error("Logger failure:", err.message);
  }
};

export const logger = {
  info: (data) => createLog({ ...data, severity: "INFO" }),
  warn: (data) => createLog({ ...data, severity: "WARNING" }),
  error: (data) => createLog({ ...data, severity: "ERROR" }),
  critical: (data) => createLog({ ...data, severity: "CRITICAL" }),
  log: (severity, data) => createLog({ ...data, severity })
};

export default logger;
