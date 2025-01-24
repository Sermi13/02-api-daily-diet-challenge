import { app } from './app';
import { env } from './env';

app
  .listen({
    port: env.PORT,
    host: '0.0.0.0',
  })
  .then(() => {
    console.log(`Http server running at ${env.PORT}`);
    return;
  })
  .catch((err) => {
    console.error(`Failed to start server, error ${err.message}`);
  });
