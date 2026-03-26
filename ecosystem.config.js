module.exports = {
  apps: [
    {
      name: "fintrack-backend",
      script: "dist/server.js",
      instances: "max",
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOST: "0.0.0.0"
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 3000,
        HOST: "0.0.0.0"
      },
      env_staging: {
        NODE_ENV: "staging",
        PORT: 3001,
        HOST: "0.0.0.0"
      },
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true,
      source_map_support: true,
      disable_logs: false,
      pmx: true,
      v8: {
        max_old_space_size: 1024
      },
      node_args: [
        "--max-old-space-size=1024",
        "--enable-source-maps"
      ],
      time: true,
      pmx: true,
      inspect: false,
      vizion: false,
      autorestart: true,
      force: false,
      cron_restart: "0 2 * * *",
      post_update: [
        "npm install",
        "npm run build"
      ],
      treekill: true,
      windowsHide: true,
      port: 3000,
      protocol: "http",
      host: "0.0.0.0",
      stdin: false,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
      shutdown_with_message: true,
      increment_var: "PORT",
      render: {
        template: "{{name}}-{{env.NODE_ENV}}-{{pid}}",
        manager: "pm2-logrotate",
        max_files: 30,
        max_size: "10M",
        retain: 30,
        compress: true,
        dateFormat: "YYYY-MM-DD_HH-mm-ss"
      }
    }
  ],
  deploy: {
    production: {
      user: "deploy",
      host: ["192.168.1.100"],
      ref: "origin/main",
      repo: "git@github.com:fintrack/backend.git",
      path: "/var/www/fintrack-backend",
      pre_deploy_local: "",
      post_deploy: "npm install && npm run build && pm2 reload ecosystem.config.js --env production",
      pre_setup: "apt-get install git",
      ssh_options: "StrictHostKeyChecking=no"
    },
    staging: {
      user: "deploy",
      host: ["192.168.1.101"],
      ref: "origin/develop",
      repo: "git@github.com:fintrack/backend.git",
      path: "/var/www/fintrack-backend-staging",
      post_deploy: "npm install && npm run build && pm2 reload ecosystem.config.js --env staging",
      env: {
        NODE_ENV: "staging"
      }
    }
  }
};
