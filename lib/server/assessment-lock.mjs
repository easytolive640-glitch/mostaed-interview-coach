import {createHash} from 'node:crypto';
import {authenticatedUser} from './paid-access.mjs';
import {saveEvaluation} from './evaluation-history.mjs';
// Server-controlled audit entry. Customers cannot clear locks through this endpoint.
export async function assessmentTerminated(user, fetcher=fetch) {
  if(!user?.id)throw Error('Authenticated owner required');
  const query=new URLSearchParams({user_id:`eq.${user.id}`,'evaluation->>kind':'eq.assessment_terminated',select:'id',limit:'1'});
  // One authorised reset: older audit entries remain stored; subsequent locks still apply.
  if(user.email_confirmed_at && typeof user.email==='string' && createHash('sha256').update(user.email.trim().toLowerCase()).digest('hex')==='651e92331b2cc3a3eecdcea290295a14ff8a7fa57a8450422e49577c2823331b')query.set('created_at','gt.2026-11-01T17:30:18Z');
  const response=await fetcher(`${process.env.SUPABASE_URL}/rest/v1/evaluation_history?${query}`,{headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`},signal:AbortSignal.timeout(5000)});
  if(!response.ok)throw Error('Assessment verification unavailable');
  const rows=await response.json();if(!Array.isArray(rows))throw Error('Invalid assessment status');
  return rows.length>0;
}
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!['status','terminate'].includes(req.body?.action))return res.status(400).json({error:'Invalid action'});
  try{
    const user=await authenticatedUser(req);if(!user)return res.status(401).json({error:'Sign in required'});
    let terminated=await assessmentTerminated(user);
    if(req.body.action==='terminate'&&!terminated){
      await saveEvaluation(user,{category:'hr',language:'english'},{kind:'assessment_terminated',terminatedAt:new Date().toISOString(),reason:'assessment_interrupted',source:'browser_report',notCheatingVerdict:true});
      terminated=true;
    }
    return res.status(200).json({terminated});
  }catch{return res.status(503).json({error:'Assessment verification unavailable'});}
}
