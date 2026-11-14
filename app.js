/* ===== הגדרות: לעדכן כאן ===== */
const CONFIG = {
  waNumber: "",        // מספר הוואטסאפ של היוזמה בפורמט בינלאומי, בלי + ובלי מקפים. לדוגמה: 972501234567
  channelUrl: "https://chat.whatsapp.com/FR8eUckPnGV6BjapSV4ThV",      // קישור הזמנה לקבוצת העדכונים בוואטסאפ (https://chat.whatsapp.com/...)
  sheetUrl: "",        // כתובת ה-Web App של Apps Script שמחובר לגיליון (https://script.google.com/macros/s/.../exec)
  formUrl: "",         // אופציונלי: קישור לטופס Google במקום וואטסאפ
  siteUrl: "https://omerpines.github.io/orange-peel-trail/"  // הקישור לאתר שמופיע בהודעה לקבוצת הבניין
};
const EVENTS = [ // status: open / tbc (מועד לאישור) / full. rain ריק = בגשם עוברים לסבב הבא
  {id:"R1", date:"2026-11-27", time:"12:00 או 13:00", title:"סבב פתיחה", place:"נקודת המפגש תישלח לנרשמים", seats:6, status:"open"},
  {id:"R2", date:"2026-12-11", time:"12:00 או 13:00", title:"סבב חנוכה", place:"נקודת המפגש תישלח לנרשמים", seats:6, status:"tbc"},
  {id:"R3", date:"2026-12-25", time:"12:00 או 13:00", title:"סבב סוף דצמבר", place:"נקודת המפגש תישלח לנרשמים", seats:6, status:"tbc"},
  {id:"R4", date:"2027-01-08", time:"12:00 או 13:00", title:"סבב ינואר", place:"נקודת המפגש תישלח לנרשמים", seats:6, status:"tbc"},
  {id:"R5", date:"2027-01-22", time:"12:00 או 13:00", title:"סבב ערב ט\"ו בשבט", place:"נקודת המפגש תישלח לנרשמים", seats:6, status:"tbc", note:"תחנה מיוחדת על שבעת המינים"},
  {id:"R6", date:"2027-02-05", time:"12:00 או 13:00", title:"סבב פברואר", place:"נקודת המפגש תישלח לנרשמים", seats:6, status:"tbc"},
  {id:"R7", date:"2027-02-19", time:"12:00 או 13:00", title:"סבב סוף העונה", place:"נקודת המפגש תישלח לנרשמים", seats:6, status:"tbc"}
];
const SEASONS = [ // months 1..12, est = not verified
  {name:"זית (מסיק)", m:[9,10,11,12,1], est:false},
  {name:"הדרים", m:[12,1,2], est:false},
  {name:"לימון", m:[1,2,3,4,5,6,7,8,9,10,11,12], est:true},
  {name:"אבוקדו", m:[10,11,12,1,2,3], est:true},
  {name:"אפרסמון", m:[10,11,12], est:true},
  {name:"שסק", m:[3,4,5], est:true},
  {name:"תות עץ", m:[4,5,6], est:true},
  {name:"תאנה", m:[8,9,10], est:false},
  {name:"רימון", m:[9,10,11], est:false}
];
/* ============================== */
const $=id=>document.getElementById(id);
const store={get(k){try{return JSON.parse(sessionStorage.getItem(k)||"null")}catch(e){return null}},set(k,v){try{sessionStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

const HE_MONTHS=["ינו׳","פבר׳","מרץ","אפר׳","מאי","יוני","יולי","אוג׳","ספט׳","אוק׳","נוב׳","דצמ׳"];
const HE_MONTHS_FULL=["בינואר","בפברואר","במרץ","באפריל","במאי","ביוני","ביולי","באוגוסט","בספטמבר","באוקטובר","בנובמבר","בדצמבר"];
const DAYS=["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
const parse=s=>{const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)};
const fmt=d=>`${DAYS[d.getDay()]}, ${d.getDate()} ${HE_MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
const today=new Date(); today.setHours(0,0,0,0);

function gcal(ev){
  const d=parse(ev.date), pad=n=>String(n).padStart(2,"0");
  const ymd=`${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}`;
  const p=new URLSearchParams({action:"TEMPLATE",text:"שביל קליפות התפוזים: "+ev.title,dates:`${ymd}T120000/${ymd}T150000`,ctz:"Asia/Jerusalem",details:`שעת התחלה: ${ev.time}. ${ev.rain?"בגשם הסבב עובר ל-"+fmt(parse(ev.rain))+".":"בגשם הסבב מתבטל, והנרשמים עוברים ראשונים לסבב הבא."}`,location:"קריית השרון, נתניה"});
  return "https://calendar.google.com/calendar/render?"+p.toString();
}

function renderEvents(){
  const list=$("eventList"), sel=$("fRound");
  const limit=list&&list.dataset.limit?Number(list.dataset.limit):0;
  if(list) list.textContent="";
  if(sel){sel.textContent=""; const o0=document.createElement("option"); o0.value=""; o0.textContent="בחרו סבב"; sel.append(o0);}
  let shown=0;
  EVENTS.forEach(ev=>{
    const d=parse(ev.date), past=d<today;
    const left=seatsLeft(ev), full=ev.status==="full"||left===0;
    if(!past&&sel){const o=document.createElement("option"); o.value=ev.id; o.textContent=`${fmt(d)} · ${ev.title}${full?" (מלא, רשימת המתנה)":""}`; sel.append(o);}
    if(!list) return;
    if(limit&&(past||shown>=limit)) return;
    shown++;
    const el=document.createElement("article"); el.className="event"+(past?" past":"");
    el.innerHTML=`<div class="date"><b>${d.getDate()}</b><small>${HE_MONTHS[d.getMonth()]} ${d.getFullYear()}</small></div>
      <div style="display:grid;gap:4px;min-width:0"><h3></h3><div class="meta"><span>יום ${DAYS[d.getDay()]} · ${ev.time}</span><span class="pl"></span></div>
      <div class="meta"><span class="chip">${past?"התקיים":(full?"מלא, רשימת המתנה":(left!==null?`נשארו ${left} מקומות`:"ההרשמה פתוחה"))}</span>${!past&&ev.status==="tbc"?'<span class="chip peel">מועד לאישור</span>':""}<span class="chip peel">${ev.rain?"בגשם: "+parse(ev.rain).getDate()+" "+HE_MONTHS[parse(ev.rain).getMonth()]:"בגשם: עוברים לסבב הבא"}</span><span>עד ${ev.seats} משפחות</span></div></div>
      <div class="links"></div>`;
    el.querySelector("h3").textContent=ev.title+(ev.note?" · "+ev.note:"");
    el.querySelector(".pl").textContent=ev.place;
    if(!past){
      const a=document.createElement("a"); a.href=gcal(ev); a.target="_blank"; a.rel="noopener"; a.textContent="הוספה ליומן Google";
      const b=document.createElement("a"); b.href="register.html?r="+ev.id; b.textContent="להרשמה";
      el.querySelector(".links").append(b,a);
    }
    list.append(el);
  });
  const keep=sel&&sel.dataset.v; if(keep) sel.value=keep;
  const q=new URLSearchParams(location.search).get("r");
  if(sel&&!keep&&q&&[...sel.options].some(o=>o.value===q)) sel.value=q;
}

function renderSeasons(){
  const t=$("seasonTable"), cur=today.getMonth()+1; if(!t) return;
  let h="<thead><tr><th>פרי</th>"+HE_MONTHS.map((m,i)=>`<th class="${i+1===cur?"now":""}">${m}</th>`).join("")+"</tr></thead><tbody>";
  SEASONS.forEach(s=>{h+=`<tr><td>${s.name}</td>`+HE_MONTHS.map((_,i)=>{const on=s.m.includes(i+1);return `<td class="${on?"on":""}${on&&s.est?" est":""}${i+1===cur?" now":""}" aria-label="${on?"בעונה":""}"></td>`}).join("")+"</tr>"});
  t.innerHTML=h+"</tbody>";
}

function waUrl(text){return CONFIG.waNumber?`https://wa.me/${CONFIG.waNumber}?text=${encodeURIComponent(text)}`:""}

function renderUpdates(){
  const txt=$("updText"), row=$("updRow"); if(!txt||!row) return;
  row.textContent="";
  if(CONFIG.channelUrl){
    txt.textContent="הודעות על סבבים חדשים, ביטולים בגלל גשם ותזכורות יוצאות בקבוצת העדכונים בוואטסאפ. רק מנהלי היוזמה כותבים בה. מספרי הטלפון של חברי הקבוצה גלויים לכל החברים. מצטרפים בלחיצה, ואפשר לצאת מתי שרוצים.";
    const a=document.createElement("a"); a.className="btn primary"; a.href=CONFIG.channelUrl; a.target="_blank"; a.rel="noopener"; a.textContent="הצטרפות לקבוצת העדכונים"; row.append(a);
  } else {
    txt.textContent="קבוצת עדכונים בוואטסאפ תיפתח בקרוב, והקישור יופיע כאן. עד אז, מי שסימן בהרשמה \"אפשר לעדכן אותי\" יקבל הודעה ישירה על כל סבב חדש ועל ביטולים.";
  }
}

const form=$("regForm");
if(form) form.addEventListener("submit",async e=>{
  e.preventDefault();
  const v=id=>document.getElementById(id).value.trim(), ch=id=>document.getElementById(id).checked;
  const err=document.getElementById("formErr"); err.hidden=true;
  const miss=[];
  if(!v("fName"))miss.push("שם");
  if(!v("fPhone"))miss.push("טלפון");
  if(!v("fRound"))miss.push("סבב");
  if(!(Number(v("fAdults"))>=1))miss.push("מספר מבוגרים");
  if(v("fKids")==="")miss.push("מספר ילדים");
  if(!v("fStreet"))miss.push("כתובת הבניין");
  if(!ch("cResp"))miss.push("אישור האחריות על הילדים");
  if(miss.length){err.textContent="חסר: "+miss.join(", ")+".";err.hidden=false;return}
  const ev=EVENTS.find(x=>x.id===v("fRound"));
  const lines=[
    "הרשמה לשביל קליפות התפוזים",
    `סבב: ${fmt(parse(ev.date))} (${ev.id})`,
    `שם: ${v("fName")}`,
    `טלפון: ${v("fPhone")}`,
    `מבוגרים: ${v("fAdults")||1} · ילדים: ${v("fKids")||0}${v("fAges")?" · גילאים: "+v("fAges"):""}`,
    `בניין: ${v("fStreet")} · עץ פרי בגינה: ${v("fTree")}`,
    v("fNotes")?`הערות: ${v("fNotes")}`:"",
    "אחריות הורים: מאשר/ת",
    `הורה תורן: ${ch("cVol")?"כן":"לא"}`,
    `פרסום תמונות: ${ch("cPhoto")?"מאשר/ת":"לא"}`,
    `עדכונים בעונות הבאות: ${ch("cUpd")?"כן":"לא"}`
  ].filter(Boolean);
  const text=lines.join("\n");
  document.getElementById("msg").textContent=text;
  const wa=document.getElementById("waLink"), note=document.getElementById("waNote");
  const saved=await saveToSheet("family",{"שם ההורה":v("fName"),"טלפון":v("fPhone"),"סבב":ev.id,"תאריך הסבב":fmt(parse(ev.date)),"מבוגרים":v("fAdults")||"1","ילדים":v("fKids")||"0","גילאי הילדים":v("fAges"),"בניין":v("fStreet"),"עץ פרי בגינה":v("fTree"),"הערות":v("fNotes"),"אחריות הורים":"מאשר/ת","הורה תורן":ch("cVol")?"כן":"לא","אישור תמונות":ch("cPhoto")?"כן":"לא","עדכונים בעונות הבאות":ch("cUpd")?"כן":"לא"},v("fWeb"));
  document.getElementById("outHead").textContent=!saved?"ההודעה מוכנה. שלב אחרון: לשלוח אותה.":(saved.waitlist?"הסבב מלא, ונכנסתם לרשימת ההמתנה. אם יתפנה מקום, נעדכן אתכם.":"נרשמתם! נחזור אליכם עם אישור ונקודת המפגש.");
  if(saved&&!saved.waitlist&&TAKEN){TAKEN[ev.id]=(TAKEN[ev.id]||0)+1; const sl=$("fRound"); sl.dataset.v=ev.id; renderEvents();}
  if(CONFIG.formUrl){wa.href=CONFIG.formUrl; wa.textContent="מעבר לטופס ההרשמה"; note.textContent="אפשר להעתיק את הפרטים מכאן לטופס."}
  else if(CONFIG.waNumber){wa.href=waUrl(text); wa.textContent="שליחה בוואטסאפ"; note.textContent="אם וואטסאפ לא נפתח, העתיקו את ההודעה ושלחו אותה ידנית."}
  else {wa.hidden=true; note.textContent="מספר הוואטסאפ של היוזמה יפורסם כאן בקרוב. בינתיים אפשר להעתיק את ההודעה."}
  if(saved){wa.hidden=true; note.textContent="הפרטים נשמרו אצלנו. אפשר להעתיק אותם לעצמכם לתזכורת."}
  if(CONFIG.channelUrl&&!$("grpJoin")){const g=document.createElement("p"); g.id="grpJoin"; g.className="note"; g.innerHTML='עדכונים על הסבב, כולל ביטולים בגלל גשם, יוצאים בקבוצת הוואטסאפ. <a target="_blank" rel="noopener">להצטרפות לקבוצה</a>'; g.querySelector("a").href=CONFIG.channelUrl; note.after(g);}
  store.set("shvil_invite",{b:v("fStreet"),n:v("fName").split(" ")[0],t:v("fTree")!=="לא"});
  const out=document.getElementById("out"); out.hidden=false; out.scrollIntoView({behavior:"smooth",block:"nearest"});
});
// מחזיר null אם אין חיבור לגיליון, אחרת {ok, waitlist}
async function saveToSheet(type,fields,hp){
  if(!CONFIG.sheetUrl) return null;
  const body=JSON.stringify({type,fields,website:hp});
  try{
    const r=await fetch(CONFIG.sheetUrl,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body});
    const j=await r.json(); return j&&j.ok?j:null;
  }catch(e){
    try{await fetch(CONFIG.sheetUrl,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body}); return {ok:true};}catch(e2){return null}
  }
}
// כמה משפחות כבר רשומות בכל סבב (מהגיליון)
let TAKEN=null, MAXF=6;
async function loadTaken(){
  if(!CONFIG.sheetUrl) return;
  try{const r=await fetch(CONFIG.sheetUrl); const j=await r.json(); if(j&&j.ok){TAKEN=j.taken||{}; MAXF=j.max||MAXF; renderEvents();}}catch(e){}
}
const seatsLeft=ev=>TAKEN?Math.max(0,(ev.seats||MAXF)-(TAKEN[ev.id]||0)):null;
function wireCopy(btnId,preId){
  const b=$(btnId), pre=$(preId); if(!b||!pre) return;
  b.addEventListener("click",()=>{
    const done=()=>{b.textContent="הועתק"};
    const fallback=()=>{const r=document.createRange(); r.selectNodeContents(pre); const s=getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent="סמנו והעתיקו"};
    try{navigator.clipboard.writeText(pre.textContent).then(done,fallback)}catch(e){fallback()}
  });
}
function setSend(a,note,text){
  a.hidden=false;
  if(CONFIG.waNumber){a.href=waUrl(text); a.textContent="שליחה בוואטסאפ"; note.textContent="אם וואטסאפ לא נפתח, העתיקו את ההודעה ושלחו אותה ידנית."}
  else {a.hidden=true; note.textContent="מספר הוואטסאפ של היוזמה יפורסם כאן בקרוב. בינתיים אפשר להעתיק את ההודעה."}
}
wireCopy("copyBtn","msg"); wireCopy("sCopy","sMsg"); wireCopy("cCopy","cMsg");

/* --- שליחה לקבוצת הבניין --- */
const nextEvent=()=>EVENTS.find(e=>parse(e.date)>=today);
function renderShare(){
  const bld=document.getElementById("sBld").value.trim(), name=document.getElementById("sName").value.trim(), tree=document.getElementById("sTree").checked, nb=document.getElementById("sNb").checked;
  const ev=nextEvent();
  const when=ev?`הסבב הקרוב: ${fmt(parse(ev.date))}, בצהריים.`:"הסבבים מתקיימים בימי שישי אחרי הלימודים.";
  const lines=[
    `שלום לוועד הבית${bld?" ב"+bld:""},`,
    `${name?"כאן "+name+" מהבניין. ":""}נרשמנו ל"שביל קליפות התפוזים": סיור קטיף לילדים ולמבוגרים בגינות המשותפות של קריית השרון, בשיתוף המתנ"ס, בימי שישי אחרי הלימודים. ${when}`,
    "",
    tree?"יש לנו עץ פרי בגינה המשותפת, ואשמח מאוד שהבניין שלנו יירשם כתחנה בשביל.":"אשמח שהבניין שלנו יירשם לשביל, ואם יש בגינה עץ פרי, שיהיה תחנה בקטיף.",
    "",
    "מה זה דורש מהוועד: אישור, ותליית הודעה לדיירים שבוע לפני. מגיעות 6 משפחות עם מדריך, לכ-20 דקות בגינה, בלי כניסה לבניין, ועד 10 פירות מכל עץ. אם יש לוועד סולם, אפשר לסמן שהוא יספק אותו ביום הקטיף.",
    "",
    "רישום הבניין בטופס קצר באתר:",
    CONFIG.siteUrl+"committees.html",
    nb?"\nשכנים עם ילדים מוזמנים להירשם לסבב כאן: "+CONFIG.siteUrl+"register.html":"",
    "",
    "תודה!"
  ];
  const text=lines.join("\n").replace(/\n{3,}/g,"\n\n");
  document.getElementById("sMsg").textContent=text;
  document.getElementById("sWa").href="https://wa.me/?text="+encodeURIComponent(text);
}
if($("sMsg")){
  const pre=store.get("shvil_invite");
  if(pre){ if(pre.b)$("sBld").value=pre.b; if(pre.n)$("sName").value=pre.n; $("sTree").checked=!!pre.t; }
  ["sBld","sName","sTree","sNb"].forEach(id=>$(id).addEventListener("input",renderShare));
  $("shareForm").addEventListener("submit",e=>e.preventDefault());
  renderShare();
}

/* --- טופס ועד הבית --- */
const TREE_TYPES=["לימון","תפוז","קלמנטינה","אשכולית","פומלה","חושחש","זית","אבוקדו","שסק","רימון","גפן (ענבים)","תאנה","תות עץ","אפרסמון","מנגו","פקאן","אחר"];
function buildOpts(boxId,name,items){
  const box=document.getElementById(boxId); box.textContent="";
  items.forEach((it,i)=>{
    const l=document.createElement("label"); l.className="check"; l.htmlFor=name+i;
    const c=document.createElement("input"); c.type="checkbox"; c.id=name+i; c.value=it.value;
    const s=document.createElement("span"); s.textContent=it.label;
    l.append(c,s); box.append(l);
  });
}
const checked=boxId=>[...document.querySelectorAll("#"+boxId+" input:checked")].map(c=>c.value);
function renderComRounds(){
  const items=EVENTS.filter(e=>parse(e.date)>=today).map(e=>{const d=parse(e.date);return {value:`${d.getDate()}.${d.getMonth()+1} (${e.id})`,label:`${DAYS[d.getDay()]} ${d.getDate()} ${HE_MONTHS[d.getMonth()]}: ${e.title}`}});
  items.push({value:"מועד אחר בתיאום",label:"מועד אחר, בתיאום"});
  buildOpts("cRounds","cr",items);
}
if($("comForm")){
buildOpts("cTypes","ct",TREE_TYPES.map(t=>({value:t,label:t})));
renderComRounds();
document.querySelectorAll('input[name="ladder"]').forEach(r=>r.addEventListener("change",()=>{
  document.getElementById("ladderMore").hidden=!document.getElementById("lYes").checked;
}));
document.getElementById("comForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const v=id=>document.getElementById(id).value.trim();
  const err=document.getElementById("cErr"); err.hidden=true;
  const ladder=document.querySelector('input[name="ladder"]:checked');
  const miss=[];
  if(!v("cName"))miss.push("שם");
  if(!v("cPhone"))miss.push("טלפון");
  if(!v("cAddr"))miss.push("כתובת הבניין");
  if(!ladder)miss.push("סימון סולם");
  if(!document.getElementById("cOk").checked)miss.push("אישור הוועד");
  if(miss.length){err.textContent="חסר: "+miss.join(", ")+".";err.hidden=false;return}
  const types=checked("cTypes"), rounds=checked("cRounds");
  const ladderTxt=ladder.value==="yes"?`יש, הוועד יספק ביום הקטיף (${v("lType")}${v("lSteps")?", "+v("lSteps"):""})`:"אין";
  const lines=[
    "אישור ועד בית: שביל קליפות התפוזים",
    `בניין: ${v("cAddr")}`,
    `נציג/ה: ${v("cName")}, ${v("cRole")}`,
    `טלפון: ${v("cPhone")}`,
    `עצים: ${types.length?types.join(", "):"לא צוין"}${v("cTrees")?" · מספר: "+v("cTrees"):""}${v("cWhere")?" · "+v("cWhere"):""}`,
    `סבבים מאושרים: ${rounds.length?rounds.join(", "):"לתאם"}`,
    `סולם: ${ladderTxt}`,
    `משפחות בגינה: עד ${v("cMax")}`,
    `ריסוס בחודש האחרון: ${v("cSpray")}`,
    `ברז מים: ${v("cTap")}`,
    `חלוקת הפרי: ${v("cSplit")}`,
    v("cNotes")?`הערות: ${v("cNotes")}`:"",
    `הדגמת הרכבה על העץ: ${document.getElementById("cGraft").checked?"מאושר":"לא"}`,
    "הוועד מאשר השתתפות ותליית הודעה לדיירים שבוע מראש",
    `פנייה בעונות הבאות: ${document.getElementById("cCUpd").checked?"כן":"לא"}`
  ].filter(Boolean);
  const text=lines.join("\n");
  document.getElementById("cMsg").textContent=text;
  setSend(document.getElementById("cWa"),document.getElementById("cWaNote"),text);
  const ck=id=>document.getElementById(id).checked;
  const saved=await saveToSheet("building",{"כתובת הבניין":v("cAddr"),"שם נציג הוועד":v("cName"),"תפקיד":v("cRole"),"טלפון":v("cPhone"),"עצים":types.join(", "),"מספר עצים":v("cTrees"),"מיקום העצים":v("cWhere"),"סבבים מאושרים":rounds.join(", "),"סולם":ladder.value==="yes"?"יש":"אין","סוג הסולם":ladder.value==="yes"?v("lType"):"","מדרגות או גובה":ladder.value==="yes"?v("lSteps"):"","משפחות בגינה (עד)":v("cMax"),"ריסוס בחודש האחרון":v("cSpray"),"ברז מים":v("cTap"),"חלוקת הפרי":v("cSplit"),"מאשרים הרכבה":ck("cGraft")?"כן":"לא","אישור הוועד":"כן","פנייה בעונות הבאות":ck("cCUpd")?"כן":"לא","הערות":v("cNotes")},v("cWeb"));
  document.getElementById("cOutHead").textContent=saved?"תודה! הבניין נרשם, ונחזור אליכם לתאם מועד ומסלול.":"ההודעה מוכנה. שלב אחרון: לשלוח אותה.";
  if(saved){document.getElementById("cWa").hidden=true; document.getElementById("cWaNote").textContent="הפרטים נשמרו אצלנו."}
  const out=document.getElementById("cOut"); out.hidden=false; out.scrollIntoView({behavior:"smooth",block:"nearest"});
});
}

(function(){const ev=nextEvent(),el=$("nextDate");if(!el)return;if(ev){const d=parse(ev.date);el.textContent=`${DAYS[d.getDay()]} ${d.getDate()}.${d.getMonth()+1}`}else{document.getElementById("nextPill").hidden=true}})();
renderEvents(); renderSeasons(); renderUpdates(); loadTaken();
