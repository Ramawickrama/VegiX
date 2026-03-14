module.exports = {
  apps: [
    {
      name: 'vegix-backend',
      script: 'server.js',
      cwd: './backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        CLIENT_URL: 'http://13.48.136.109:3000',
        MONGO_URI: process.env.MONGO_URI,
        JWT_SECRET: process.env.JWT_SECRET
      },
      error_file: 'logs/backend-error.log',
      out_file: 'logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'vegix-frontend',
      script: 'npm',
      args: 'run preview -- --port 3000 --host',
      cwd: './frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      error_file: 'logs/frontend-error.log',
      out_file: 'logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
