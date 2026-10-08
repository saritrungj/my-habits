import { createClient } from "@supabase/supabase-js";
import "./style.css";

const SB_URL = import.meta.env.VITE_SUPABASE_URL;
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const sb = SB_URL && SB_KEY ? createClient(SB_URL, SB_KEY) : null;

const IC={
  moon:'<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  paw:'<circle cx="6" cy="10" r="1.8"/><circle cx="10" cy="5.5" r="1.8"/><circle cx="14" cy="5.5" r="1.8"/><circle cx="18" cy="10" r="1.8"/><path d="M12 11c-3 0-5.5 3.5-5.5 6 0 1.7 1.3 2.5 2.7 2.5 1.2 0 1.8-.6 2.8-.6s1.6.6 2.8.6c1.4 0 2.7-.8 2.7-2.5 0-2.5-2.5-6-5.5-6z"/>',
  dumb:'<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  run:'<circle cx="14" cy="4.5" r="1.8"/><path d="M8 21l3-6 3 2v4M6 12l3-4h4l2 3 3 1M11 8l-1 5"/>',
  apple:'<path d="M12 7c-1.5-1.2-4-1.4-5.6.2C4.6 9 5 13 6.8 16.2 8 18.4 9.6 20 11 19.6c.5-.1.7-.3 1-.3s.5.2 1 .3c1.4.4 3-1.2 4.2-3.4C19 13 19.4 9 17.6 7.2 16 5.6 13.5 5.8 12 7z"/><path d="M12 7c0-2 1-3.5 3-4"/>'
};
const svg=(k,cls="")=>`<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${IC[k]}</svg>`;
const HABITS=[
  {id:"sleep",g:0,i:"moon", t:"22:00",n:"เข้านอนตรงเวลา",s:"เมื่อคืนนอนก่อน 4 ทุ่ม"},
  {id:"wake", g:0,i:"sun",  t:"05:20",n:"ตื่นตามเวลา",s:"ไม่กดเลื่อนนาฬิกาปลุก"},
  {id:"dog",  g:0,i:"paw",  t:"06:05",n:"พาหมาเดิน",s:"10 นาที เดินเร็วเป็นวอร์มอัพ"},
  {id:"am",   g:0,i:"dumb", t:"06:15",n:"ออกกำลังกายเช้า",s:"15–25 นาที ก่อนอาบน้ำ"},
  {id:"snack",g:1,i:"apple",t:"ทั้งวัน",n:"ของว่างมีประโยชน์",s:"ผลไม้ ถั่ว ไข่ต้ม แทนขนม"},
  {id:"pm",   g:2,i:"run",  t:"17:20",n:"ออกกำลังกายเย็น",s:"เลิกงานแล้วเปลี่ยนชุดทันที"}
];
const GROUPS=["ตอนเช้า","ระหว่างวัน","ตอนเย็น"];
const N=HABITS.length, PASS=4, C=2*Math.PI*48;
const PLAN={1:"เช้าแรงต้าน · เย็นเดินเบา",2:"เช้ายืดเหยียด · เย็นคาร์ดิโอ",3:"เช้าแรงต้าน · เย็นเดินเบา",4:"เช้ายืดเหยียด · เย็นคาร์ดิโอ",5:"เช้าแรงต้าน · เย็นเดินเบา",6:"วันสบาย · กิจกรรมสนุก ๆ",0:"วันสบาย · พักได้ 1 วัน"};
const TH_M=["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const TH_MF=["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const TH_D=["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์"];
const TH_DS=["อา","จ","อ","พ","พฤ","ศ","ส"];
const $=id=>document.getElementById(id);

let data={}, session=null;
const today=new Date(); today.setHours(0,0,0,0);
let cur=new Date(today), mView=new Date(today.getFullYear(),today.getMonth(),1), yView=today.getFullYear();
const key=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const cnt=k=>{const h=data[k];return h?HABITS.filter(x=>h[x.id]).length:0};
const lvl=c=>c===0?0:c<=2?1:c<=3?2:c<=5?3:4;
const be=y=>y+543;
const fmtLong=d=>"วัน"+TH_D[d.getDay()]+"ที่ "+d.getDate()+" "+TH_MF[d.getMonth()]+" "+be(d.getFullYear());

function loadLocal(){try{data=JSON.parse(localStorage.getItem("habits-v1")||"{}")}catch(e){data={}}}
function saveLocal(){try{localStorage.setItem("habits-v1",JSON.stringify(data))}catch(e){}}
function setSync(on,txt){$("sync").classList.toggle("on",on);$("sync").querySelector("span").textContent=txt}

async function toggle(hid,on){
  const k=key(cur), before=cnt(k); const h={...(data[k]||{})}; h[hid]=on; data[k]=h;
  renderDay(); renderMonth(); renderYear();
  if(cnt(k)===N&&before<N){$("ring").classList.remove("pop");void $("ring").offsetWidth;$("ring").classList.add("pop")}
  saveLocal();
  if(session){const{error}=await sb.from("habit_days").upsert({user_id:session.user.id,day:k,habits:h,updated_at:new Date().toISOString()});if(error)setSync(false,"บันทึกไม่สำเร็จ");else setSync(true,"ซิงก์แล้ว")}
}
function streakEnding(end){let s=0,d=new Date(end);if(cnt(key(d))<PASS)d=addDays(d,-1);while(cnt(key(d))>=PASS){s++;d=addDays(d,-1)}return s}

function renderHeader(){
  const h=new Date().getHours();
  $("greet").textContent=h<11?"อรุณสวัสดิ์":h<16?"สวัสดีตอนบ่าย":h<19?"ได้เวลาออกกำลังกาย":"พักผ่อนให้พอนะ";
  $("today").textContent=fmtLong(today);
}

function renderDay(){
  const k=key(cur), c=cnt(k), isToday=+cur===+today, h=data[k]||{};
  $("ringVal").style.strokeDashoffset=C*(1-c/N);
  $("ring").classList.toggle("full",c===N);
  $("dCount").textContent=c;
  $("dTitle").textContent=isToday?(c===N?"ครบทุกข้อแล้ว":c>=PASS?"วันนี้ผ่านแล้ว":"วันนี้"):fmtLong(cur).replace("วัน","");
  $("dMsg").textContent=c===N?"สุดยอด รักษาจังหวะนี้ไว้":c>=PASS?"อีก "+(N-c)+" ข้อจะครบทุกข้อ":"ทำอีก "+(PASS-c)+" ข้อ จะนับว่าวันนี้ผ่าน";
  $("dPlan").textContent=PLAN[cur.getDay()];
  // week strip: 7 days ending at max(cur, ...) aligned so cur visible
  let end=addDays(cur,3); if(end>today)end=new Date(today);
  let w="";
  for(let i=6;i>=0;i--){const d=addDays(end,-i),kk=key(d),fut=d>today;
    w+=`<button class="wd${+d===+cur?" sel":""}${fut?" fut":""}" data-k="${kk}" ${fut?"disabled":""} aria-label="${fmtLong(d)} ทำได้ ${cnt(kk)} จาก ${N}"><small>${TH_DS[d.getDay()]}</small><span class="dot l${lvl(cnt(kk))}">${d.getDate()}</span></button>`}
  $("week").innerHTML=w;
  const y1=cnt(key(addDays(cur,-1))), y2=cnt(key(addDays(cur,-2))), a=$("dAlert");
  if(isToday&&y1<PASS&&c<PASS){a.hidden=false;a.textContent=y2<PASS?"พลาดมา 2 วันแล้ว วันนี้ขอแค่เริ่ม 5 นาทีก็พอ":"เมื่อวานพลาดไป วันนี้อย่าพลาดซ้ำ ทำเบา ๆ ก็นับ"}else a.hidden=true;
  $("groups").innerHTML=GROUPS.map((g,gi)=>{const list=HABITS.filter(x=>x.g===gi),done=list.filter(x=>h[x.id]).length;
    return `<div class="group"><div class="ghead"><h3>${g}</h3><span>${done}/${list.length}</span></div><div class="rows">${list.map(x=>
    `<label class="row" for="h-${x.id}"><input type="checkbox" id="h-${x.id}" data-h="${x.id}" ${h[x.id]?"checked":""}><span class="ico">${svg(x.i)}</span><span class="rt"><strong>${x.n}</strong><span>${x.s}</span></span><span class="tm">${x.t}</span><span class="ck"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span></label>`).join("")}</div></div>`}).join("");
}

function habitRows(keys,el){
  if(!keys.length){el.innerHTML='<p class="empty">ยังไม่มีข้อมูลในช่วงนี้ เริ่มติ๊กที่แท็บวันนี้ได้เลย</p>';return}
  const rows=HABITS.map(x=>({x,p:Math.round(keys.filter(k=>data[k]&&data[k][x.id]).length/keys.length*100)})).sort((a,b)=>b.p-a.p);
  el.innerHTML=rows.map(r=>`<div class="hrow${r.p<50?" low":""}"><span class="mi">${svg(r.x.i)}</span><span class="nm">${r.x.n}</span><span class="pc">${r.p}%</span><div class="br"><i style="width:${r.p}%"></i></div></div>`).join("");
}

function renderMonth(){
  const y=mView.getFullYear(), m=mView.getMonth(), days=new Date(y,m+1,0).getDate();
  $("mLabel").textContent=TH_MF[m]+" "+be(y);
  $("mNext").disabled=y===today.getFullYear()&&m===today.getMonth();
  let html=TH_DS.map(d=>`<div class="dow">${d}</div>`).join("");
  for(let i=0;i<new Date(y,m,1).getDay();i++)html+="<div></div>";
  const keys=[];let good=0,sum=0,best=0,run=0;
  for(let d=1;d<=days;d++){const dt=new Date(y,m,d),k=key(dt),fut=dt>today,c=cnt(k);
    if(!fut){keys.push(k);sum+=c;if(c>=PASS){good++;run++;best=Math.max(best,run)}else run=0}
    html+=`<button class="d ${fut?"fut":"l"+lvl(c)}${+dt===+today?" today":""}" data-k="${k}" ${fut?"disabled":""} aria-label="${d} ${TH_MF[m]} ทำได้ ${c} จาก ${N}">${d}</button>`}
  $("mCal").innerHTML=html;
  $("mAvg").textContent=keys.length?Math.round(sum/(keys.length*N)*100)+"%":"–";
  $("mGood").textContent=good; $("mStreak").textContent=best;
  habitRows(keys.filter(k=>data[k]),$("mHabits"));
}

function renderYear(){
  const y=yView, isCur=y===today.getFullYear(); $("yLabel").textContent="ปี "+be(y); $("yNext").disabled=isCur;
  let bars="",grid="",rec=0,good=0;const keys=[];
  for(let m=0;m<12;m++){let s=0,n=0;const days=new Date(y,m+1,0).getDate();
    for(let d=1;d<=days;d++){const dt=new Date(y,m,d);if(dt>today)break;const k=key(dt),c=cnt(k);s+=c;n++;if(data[k]){rec++;keys.push(k)}if(c>=PASS)good++}
    const p=n?Math.round(s/(n*N)*100):0;
    bars+=`<button class="mc${isCur&&m===today.getMonth()?" now":""}" data-m="${m}" aria-label="${TH_MF[m]} ${p}%"><em>${n&&p?p:""}</em><div class="tr"><div class="fl" style="height:${p}%"></div></div><span>${TH_M[m].replace(".","").slice(0,3)}</span></button>`}
  const st=new Date(y,0,1);for(let i=0;i<st.getDay();i++)grid+='<i class="x"></i>';
  for(let dt=new Date(st);dt.getFullYear()===y;dt=addDays(dt,1)){const f=dt>today;grid+=`<i class="${f?"f":"l"+lvl(cnt(key(dt)))}"></i>`}
  $("yMonths").innerHTML=bars;$("yGrid").innerHTML=grid;
  $("yDays").textContent=rec;$("yGood").textContent=good;$("yStreak").textContent=streakEnding(today);
  habitRows(keys,$("yHabits"));
  if(isCur){const g=$("yGrid").parentElement;g.scrollLeft=g.scrollWidth}
}
function renderAll(){renderHeader();renderDay();renderMonth();renderYear()}

function show(v){["day","month","year"].forEach(x=>{$("v-"+x).hidden=x!==v;$("t-"+x).setAttribute("aria-selected",x===v)});window.scrollTo({top:0});if(v==="year")renderYear();try{localStorage.setItem("habits-tab",v)}catch(e){}}
["day","month","year"].forEach(v=>$("t-"+v).onclick=()=>show(v));
$("mPrev").onclick=()=>{mView=new Date(mView.getFullYear(),mView.getMonth()-1,1);renderMonth()};
$("mNext").onclick=()=>{mView=new Date(mView.getFullYear(),mView.getMonth()+1,1);renderMonth()};
$("yPrev").onclick=()=>{yView--;renderYear()};
$("yNext").onclick=()=>{yView++;renderYear()};
$("groups").addEventListener("change",e=>{const h=e.target.dataset.h;if(h){if(navigator.vibrate)try{navigator.vibrate(8)}catch(_){};toggle(h,e.target.checked)}});
const goDay=k=>{const[a,b,c]=k.split("-").map(Number);cur=new Date(a,b-1,c);renderDay();show("day")};
$("week").addEventListener("click",e=>{const b=e.target.closest(".wd");if(b&&!b.disabled){const[a,m,c]=b.dataset.k.split("-").map(Number);cur=new Date(a,m-1,c);renderDay()}});
$("mCal").addEventListener("click",e=>{const b=e.target.closest(".d");if(b&&!b.disabled)goDay(b.dataset.k)});
$("yMonths").addEventListener("click",e=>{const b=e.target.closest(".mc");if(!b)return;mView=new Date(yView,+b.dataset.m,1);renderMonth();show("month")});



/* ---------- Supabase sync ---------- */
async function pull(){
  if(!session)return;
  setSync(false,"กำลังซิงก์…");
  const{data:rows,error}=await sb.from("habit_days").select("day,habits");
  if(error){setSync(false,"โหลดไม่สำเร็จ");return}
  const next={};rows.forEach(r=>{next[r.day]=r.habits||{}});
  // ส่งวันที่ติ๊กไว้ในเครื่อง (ก่อนล็อกอิน) ขึ้นบัญชี
  const ups=[];
  Object.keys(data).forEach(k=>{if(!next[k]&&Object.values(data[k]).some(Boolean)){next[k]=data[k];ups.push({user_id:session.user.id,day:k,habits:data[k]})}});
  if(ups.length)await sb.from("habit_days").upsert(ups);
  data=next;saveLocal();renderDay();renderMonth();renderYear();
  setSync(true,"ซิงก์แล้ว");
}

function showAuth(on){$("auth").hidden=!on;$("app").hidden=on;document.querySelector(".tabbar").hidden=on}
function applySession(s){
  session=s;
  $("acct").textContent=s?s.user.email:"ไม่ได้ล็อกอิน";
  $("signout").textContent=s?"ออกจากระบบ":"ล็อกอินเพื่อซิงก์";
  if(s){showAuth(false);pull()}else setSync(false,"ในเครื่องนี้");
}

$("authForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const email=$("email").value.trim(), btn=$("authBtn"), msg=$("authMsg");
  if(!email)return;
  btn.disabled=true;btn.textContent="กำลังส่ง…";msg.textContent="";
  const{error}=await sb.auth.signInWithOtp({email,options:{emailRedirectTo:window.location.origin}});
  btn.disabled=false;btn.textContent="ส่งลิงก์เข้าสู่ระบบ";
  msg.className="amsg"+(error?" err":" ok");
  msg.textContent=error?"ส่งไม่สำเร็จ: "+error.message:"ส่งลิงก์ไปที่ "+email+" แล้ว เปิดอีเมลแล้วกดลิงก์เพื่อเข้าใช้งาน";
});
$("skip").onclick=()=>{try{localStorage.setItem("habits-skip","1")}catch(_){};showAuth(false)};
$("signout").onclick=async()=>{
  if(session){await sb.auth.signOut();applySession(null);showAuth(true)}
  else showAuth(true);
};
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&session)pull()});

/* ---------- start ---------- */
loadLocal();renderAll();
try{const t=localStorage.getItem("habits-tab");if(t)show(t)}catch(e){}
if(!sb){
  $("acct").textContent="ยังไม่ได้ตั้งค่า Supabase · บันทึกในเครื่องนี้";$("signout").hidden=true;showAuth(false);
}else{
  const{data:{session:s}}=await sb.auth.getSession();
  let skipped=false;try{skipped=localStorage.getItem("habits-skip")==="1"}catch(_){}
  applySession(s);
  if(!s&&!skipped)showAuth(true);
  sb.auth.onAuthStateChange((_ev,s2)=>{if((s2&&s2.user.id)!==(session&&session.user.id))applySession(s2)});
}
