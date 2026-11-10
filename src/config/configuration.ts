export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),

  grpc: {
    url: process.env.GRPC_URL ?? '0.0.0.0:50051',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',

    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },

  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },

  mongo: {
    uri: process.env.MONGO_URI,
  },
});
