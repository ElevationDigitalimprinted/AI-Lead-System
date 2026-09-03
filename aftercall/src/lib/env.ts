function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new ConfigError(`Missing required environment variable: ${name}`);
  }
  return value;
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export function getPublicEnv() {
  return {
    supabaseUrl: required(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    supabaseAnonKey: required(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elevationpipeline.com",
  };
}

export function getServiceRoleEnv() {
  return {
    ...getPublicEnv(),
    supabaseServiceRoleKey: required(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
  };
}

export function getLemonSqueezyEnv() {
  return {
    webhookSecret: required(
      "LEMONSQUEEZY_WEBHOOK_SECRET",
      process.env.LEMONSQUEEZY_WEBHOOK_SECRET,
    ),
    apiKey: required("LEMONSQUEEZY_API_KEY", process.env.LEMONSQUEEZY_API_KEY),
    storeId: required(
      "LEMONSQUEEZY_STORE_ID",
      process.env.LEMONSQUEEZY_STORE_ID,
    ),
    variantId: required(
      "LEMONSQUEEZY_VARIANT_ID",
      process.env.LEMONSQUEEZY_VARIANT_ID,
    ),
  };
}
