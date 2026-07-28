module.exports = {
  apps: [
    {
      name: 'absence-ace',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};