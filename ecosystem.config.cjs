module.exports = {
  apps: [
    {
      name: "amdj-api",
      script: "./app.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
