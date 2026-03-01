export const getServerEnv = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ownerId = process.env.APP_OWNER_ID ?? "personal-owner";

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수를 설정하세요.");
  }

  return {
    supabaseUrl,
    supabaseServiceRoleKey,
    ownerId,
  };
};
