import dotenv from 'dotenv';
import joi from 'joi';

dotenv.config();

const envSchema = joi.object({
  DISCORD_TOKEN: joi.string().required(),
  AUTH_TOKEN: joi.string().required(),
}).unknown().required();

const { error, value: vars } = joi.validate(process.env, envSchema);

if (error) {
  throw new Error(`Config validation errors, please check the .env file: ${error.message}`);
}

export default {
  discord: {
    token: vars.DISCORD_TOKEN as string,
  },
  authToken: vars.AUTH_TOKEN as string,
}
