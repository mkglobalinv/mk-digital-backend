module.exports = {
  apps: [{
    name: 'mk-digital-backend',
    script: 'server.js',
    instances: '1', // Or 'max' for cluster mode if scaling
    exec_mode: 'fork', // Use 'cluster' if instances > 1
    env: {
      NODE_ENV: 'production'
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true,
    max_memory_restart: '1G'
  }]
};
