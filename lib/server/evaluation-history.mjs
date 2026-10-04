import { authenticatedUser } from './paid-access.mjs';
const headers = () => ({apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'});
export async function saveEvaluation(user, body, evaluation) {
  if (!user?.id) throw new Error('Authenticated owner required');
  const response = await fetch(process.env.SUPABASE_URL + '/rest/v1/evaluation_history', {
    method:'POST',headers:{...headers(),Prefer:'return=minimal'},
    body:JSON.stringify({user_id:user.id,category:body.category,language:['english','arabic'].includes(body.language)?body.language:'english',evaluation:{...evaluation,reportLanguage:body.language}}),
    signal:AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('History save unavailable: ' + response.status);
}
export default async function historyHandler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if (req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  try {
    const user = await authenticatedUser(req);
    if(!user) return res.status(401).json({error:'Sign in to view your history'});
    // reportLanguage in JSON preserves extended locales on legacy two-language database schemas.
    // Owner comes only from the verified session, never from a request parameter.
    const query = new URLSearchParams({user_id:'eq.'+user.id,select:'id,created_at,category,language,evaluation',order:'created_at.desc',limit:'50'});
    const response = await fetch(process.env.SUPABASE_URL+'/rest/v1/evaluation_history?'+query,{headers:headers(),signal:AbortSignal.timeout(5000)});
    if(!response.ok) return res.status(503).json({error:'Evaluation history is not available yet. Please try again later.'});
    return res.status(200).json({items:await response.json()});
  } catch { return res.status(503).json({error:'Evaluation history is temporarily unavailable'}); }
}
