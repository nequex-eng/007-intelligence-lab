import { generate } from "../_lib/llm.js";
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
function parseObject(t){const s=String(t||"").trim().replace(/^```(?:json)?/i,"").replace(/```$/,"").trim();try{return JSON.parse(s)}catch(_){}const a=s.indexOf("{"),b=s.lastIndexOf("}");if(a>=0&&b>a)try{return JSON.parse(s.slice(a,b+1))}catch(_){}return null}
const clamp=(v,a,b)=>{const n=Number(v);return Number.isFinite(n)?Math.max(a,Math.min(b,n)):0};
export async function onRequestPost({request,env}){try{
 const b=await request.json(),en=b.language==="en",m=b.mission||{},s=b.stage||{},c=b.selected||{},st=b.state||{};
 if(!m.id||!s.id||!c.text)return json({error:en?"Missing mission context or selected action.":"任务信息或行动选择缺失。"},400);
 const system=en
 ?"You are M, director of a demanding James Bond interactive mission. Adjudicate the selected action through causal reasoning, never dice, random chance or automatic success. Evaluate the situation, evidence, preparation, funds, risk, credibility, equipment, relationships and prior actions. Outcomes may be success, partial success, failure, deception, complications or a new lead. Never grant every listed effect automatically. Preserve continuity. Return ONLY JSON: {outcome:'success|partial|failure',narrative:'2-5 vivid English sentences with consequences and dialogue',delta:{funds:number,risk:number,cred:number,day:number},clues:['optional'],equipment:'optional',relationship:{name:'optional',change:number},nextStage:'allowed next stage id or end',grade:'short label',debrief:'short English debrief'}. Deltas are relative. Use meaningful but bounded consequences. Poorly prepared or reckless actions can fail. Never reveal scoring."
 :"你是M，是一场高难度007互动任务的总指挥。根据玩家行动做因果推理裁定，绝不使用骰子、随机概率或自动成功。综合现场、证据、准备、资金、风险、情报可信度、装备、人物关系和此前行动。结果可以成功、部分成功、失败、受骗、意外复杂情况或新线索。绝不自动兑现选项列出的所有效果。保持连续性。只返回JSON：{outcome:'success|partial|failure',narrative:'2-5句中文，写出后果与必要对话',delta:{funds:number,risk:number,cred:number,day:number},clues:['可选'],equipment:'可选',relationship:{name:'可选',change:number},nextStage:'允许的下一阶段id或end',grade:'简短等级',debrief:'中文行动总结'}。数值为相对变化，幅度适中但有实质后果。准备不足或鲁莽行动可以失败。不要透露评分过程。";
 const payload={mission:m,stage:s,selected:c,currentState:{funds:st.funds,risk:st.risk,cred:st.cred,day:st.day,clues:st.clues,equipment:st.equip,relationships:st.rels,attempts:st.attempts,failures:st.failures},priorActions:(b.history||[]).slice(-8),allowedNextStages:[c.next,"end"]};
 const out=await generate(env||{},[{role:"system",content:system},{role:"user",content:JSON.stringify(payload)}]);
 if(!out.ok)return json({error:en?"Mission AI unavailable; no state was changed.":"任务大模型暂不可用，状态未改变。",code:out.code},503);
 const d=parseObject(out.text);if(!d||!["success","partial","failure"].includes(d.outcome))return json({error:en?"Invalid AI decision; no state was changed.":"大模型裁定格式无效，状态未改变。"},502);
 if(![c.next,"end"].includes(d.nextStage))d.nextStage=c.next;
 const x=d.delta||{};d.delta={funds:clamp(x.funds,-5000,3000),risk:clamp(x.risk,-25,35),cred:clamp(x.cred,-25,20),day:clamp(x.day,-1,2)};
 d.clues=Array.isArray(d.clues)?d.clues.filter(v=>typeof v==="string").slice(0,2):[];if(d.relationship&&typeof d.relationship.name!=="string")d.relationship=null;
 return json({decision:d,model:out.model});
 }catch(e){return json({error:"Invalid mission request."},400)}}
export async function onRequest(c){return c.request.method==="POST"?onRequestPost(c):json({error:"Method not allowed."},405)}
