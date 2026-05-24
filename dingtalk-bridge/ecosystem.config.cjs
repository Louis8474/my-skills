/**
 * PM2 配置文件
 * 使用方式：
 *   pm2 start ecosystem.config.js
 *   pm2 logs dingtalk-bot
 *   pm2 restart dingtalk-bot
 *   pm2 stop dingtalk-bot
 */
module.exports = {
  apps: [
    {
      name: 'dingtalk-bot',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',

      // 日志配置
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      merge_logs: true,

      // 重启策略
      exp_backoff_restart_delay: 100, // 指数退避重启
      max_restarts: 10,
      restart_delay: 3000,
      kill_timeout: 5000,

      // 环境变量
      env: {
        NODE_ENV: 'production',
        NO_PROXY: 'dingtalk.com,wss-open-connection.dingtalk.com,api.dingtalk.com',
        no_proxy: 'dingtalk.com,wss-open-connection.dingtalk.com,api.dingtalk.com',
      },
      env_development: {
        NODE_ENV: 'development',
      },
    },
  ],
};
