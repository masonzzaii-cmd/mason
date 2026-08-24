// 直接调用 Supabase REST 接口绕过 JS SDK 的 upload，先检查 storage.objects 里有没有已上传的成功案例
import 'dotenv/config';
import { SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY } from '../src/utils/supabaseClient';

async function main() {
  const res = await fetch(
    `${SUPABASE_PROJECT_URL}/rest/v1/storage/objects?select=*&bucket_id=eq.assets&order=created_at.desc&limit=10`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: 'application/vnd.pgrst.object+json',
      },
    }
  );
  console.log('storage.objects REST status:', res.status);
  const text = await res.text();
  console.log(text.substring(0, 2000));
}
main().catch(e => console.error(e));
