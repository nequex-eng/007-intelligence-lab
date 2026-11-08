import { generate, llmStatus } from "../_lib/llm.js";
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const modes={infiltration:["潜入行动","Covert Infiltration"],intelligence:["情报分析","Intelligence Analysis"],negotiation:["审讯与交涉","Interrogation & Negotiation"],crisis:["危机处置","Crisis Response"],surveillance:["监视与反监视","Surveillance & Counter-surveillance"]};
function parse(s){s=String(s||"").replace(/^\x60\x60\x60(?:json)?\s*/i,"").replace(/\s*\x60\x60\x60$/,"").trim();try{return JSON.parse(s)}catch(e){}const a=s.indexOf("{"),b=s.lastIndexOf("}");if(a>=0&&b>a){try{return JSON.parse(s.slice(a,b+1))}catch(e){}}return null;}
const clamp=n=>{const v=Number(n);return Number.isFinite(v)?Math.max(0,Math.min(100,Math.round(v))):50;};
export async function onRequestPost(ctx){
 try{
 let lang="zh";
 const b=await ctx.request.json();lang=b.language==="en"?"en":"zh";const mode=modes[b.mode]?b.mode:"infiltration",kind=b.action==="act"?"act":"start",env=ctx.env||{};
 if(!llmStatus(env).available)return json({error:lang==="en"?"The AI model is not connected. Configure the MiniMax API key.":"模型尚未接入，请配置 MiniMax API Key。",errorEn:"The AI model is not connected. Configure the MiniMax API key.",code:"MODEL_NOT_CONNECTED"},503);
 const history=Array.isArray(b.history)?b.history.filter(x=>x&&["user","assistant"].includes(x.role)&&typeof x.content==="string").slice(-10).map(x=>({role:x.role,content:x.content.slice(0,2200)})):[];
 const action=typeof b.actionText==="string"?b.actionText.trim().slice(0,700):"";
 if(kind==="act"&&!action)return json({error:lang==="en"?"Enter or select an action first.":"请先输入或选择行动。",errorEn:"Enter or select an action first."},400);
 const title=mode[lang==="en"?1:0];
 const schema=lang==="en"?'IMPORTANT: Every user-facing string value must be fluent English only. Do not include Chinese characters or bilingual text. Return ONLY JSON: {"phase":"label","scene":"80-150 words","intel":"evidence","options":[{"label":"action","rationale":"trade-off"}],"feedback":"coaching","stats":{"pressure":50,"intel":50,"exposure":20},"completed":false}. Exactly 3 options.':'只返回JSON：{"phase":"阶段","scene":"现场发展，约150-250字","intel":"线索与证据","options":[{"label":"行动选项","rationale":"取舍"}],"feedback":"行动结果与复盘","stats":{"pressure":50,"intel":50,"exposure":20},"completed":false}。必须恰好3个选项。';
 const rules=lang==="en"?"You are a cinematic, demanding game master for an original fictional intelligence training simulator. The trainee is not Bond. Maintain continuity and make choices matter. Distinguish facts, inference and assumptions. ENGLISH-ONLY OUTPUT: every JSON string value, phase, scene, clue, feedback, option label and rationale must be written in fluent English. Never output Chinese characters. Translate Chinese names, input and history internally; do not quote Chinese source text. Keep scenarios fictional and non-operational: never give actionable instructions for violence, weapons, unlawful entry, surveillance/evasion, cyber intrusion, sabotage, coercion or evading law enforcement. Resolve risky actions abstractly and prefer lawful, protective decisions. End after 5-8 meaningful turns. "+schema:"你是电影感虚构情报训练模拟器的主持人与教官。任务必须原创，玩家不是邦德。保持连续性，让选择产生真实后果，区分事实、推断和假设。内容必须虚构且非操作性：不得给出现实可执行的暴力、武器、非法入侵、监视规避、网络入侵、破坏、胁迫或逃避执法方法；危险行为抽象处理，优先合法与保护人员安全。5至8个有效回合后结束。"+schema;
 const prompt=kind==="start"?"开始一场新的"+title+"训练。建立鲜明现场、目标、时间或资源限制、一名有动机的人物和一个信息疑点。给出三个不同首轮行动。初始状态压力50、情报50、暴露20。":"受训者刚才采取的行动："+action+"。延续同一任务，评估行动并呈现后果，更新状态，给出下一轮选择。";
 const promptEn=kind==="start"?"Start a new "+title+" exercise. Establish a vivid setting, objective, time or resource constraint, a motivated character and one unresolved intelligence question. Offer exactly three distinct opening actions. Initial stats: pressure 50, intelligence 50, exposure 20.":"The trainee just took this action: "+action+". Continue the same scenario. Assess it fairly, show consequences, update the state and present the next decision.";
 const promptForModel=lang==="en"?promptEn:prompt;
 const out=await generate(env,[{role:"system",content:rules},{role:"user",content:promptForModel+"\nPrior exercise history (interpret any Chinese internally, but respond only in English): "+JSON.stringify(history)}]);
 if(!out.ok)return json({error:lang==="en"?"The model could not generate the next turn. Please try again.":"模型生成失败，请重试。",errorEn:"The model could not generate the next turn. Please try again.",code:out.code||"MODEL_ERROR"},out.code==="MODEL_NOT_CONNECTED"?503:502);
 let d=parse(out.text);
 const hasChinese=s=>/[\u3400-\u9fff]/.test(String(s||""));
 const hasChineseOutput=x=>x&&[x.phase,x.scene,x.intel,x.feedback,...(x.options||[]).flatMap(o=>typeof o==="string"?[o]:[o.label,o.rationale])].some(hasChinese);
 if(lang==="en"&&hasChineseOutput(d)){const fix=await generate(env,[{role:"system",content:"Translate this JSON into fluent English. Preserve the exact structure, facts, choices, stats and meaning. Do not add or remove options. Output ONLY valid JSON and no Chinese characters."},{role:"user",content:out.text}]);if(fix.ok)d=parse(fix.text);}
 if(!d||typeof d.scene!=="string"||!Array.isArray(d.options)||(lang==="en"&&hasChineseOutput(d)))return json({error:lang==="en"?"The model returned content in the wrong language. Please retry.":"模型返回格式异常，请重新开始。",errorEn:"The model returned content in the wrong language. Please retry."},502);
 d.options=d.options.slice(0,3).map(x=>typeof x==="string"?{label:x,rationale:""}:{label:String(x.label||"继续观察"),rationale:String(x.rationale||"")});
 while(d.options.length<3)d.options.push({label:lang==="en"?"Observe and reassess":"继续观察并重新评估",rationale:""});
 d.stats={pressure:clamp(d.stats?.pressure),intel:clamp(d.stats?.intel),exposure:clamp(d.stats?.exposure)};
 d.completed=Boolean(d.completed)||history.filter(x=>x.role==="user").length>=7;
 d.phase=String(d.phase||title).slice(0,80);d.scene=d.scene.slice(0,3500);d.intel=String(d.intel||"").slice(0,1800);d.feedback=String(d.feedback||"").slice(0,1600);d.model=out.model;
 return json(d);
 }catch(e){console.error("training failed",e?.message);return json({error:lang==="en"?"The training request failed. Please try again.":"训练请求处理失败，请重试。",errorEn:"The training request failed. Please try again."},400);}
}
export async function onRequest(ctx){return ctx.request.method==="POST"?onRequestPost(ctx):json({error:"只接受POST"},405);}
