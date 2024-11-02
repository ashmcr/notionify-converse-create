import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export const updateUserProfile = async (
  userId: string,
  data: {
    accessToken: string;
    workspaceId: string;
    templateDbId?: string;
    defaultPageId?: string;
  }
) => {
  console.log('[database] Updating user profile');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        notion_access_token: data.accessToken,
        notion_workspace_id: data.workspaceId,
        notion_template_db_id: data.templateDbId,
        notion_default_page_id: data.defaultPageId,
        template_db_installed: !!data.templateDbId,
        template_db_installed_at: data.templateDbId ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('[database] Error updating profile:', error);
      throw error;
    }

    console.log('[database] Successfully updated user profile');
  } catch (error) {
    console.error('[database] Error in updateUserProfile:', error);
    throw error;
  }
};