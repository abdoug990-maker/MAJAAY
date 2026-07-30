module.exports = {
  apps: [
    {
      name: 'majaay-chat',
      script: 'index.ts',
      cwd: './mini-services/chat-service',
      interpreter: 'bun',
      interpreter_args: 'run',
      watch: true,
      env: {
        NODE_ENV: 'development',
        PORT: 3003,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};
