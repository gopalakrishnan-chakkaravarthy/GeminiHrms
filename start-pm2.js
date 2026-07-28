// start-pm2.js
module.exports = {
  apps: [
    {
      name: 'absence-ace',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: './',
      instances: 1, // or 'max' for cluster mode
      exec_mode: 'cluster', // or 'fork'
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
    },
  ],
};