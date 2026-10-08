import { resolveModule } from '#shared/domain/settings'
import { readTimerSnapshot, timerRemaining, type TimerSnapshot } from '#shared/domain/focus-timer'
export function useFocusTimer(clock=false){
  const {state,touch,ownerId,initialized,status}=useWorkspace()
  const phase=useState<'focus'|'break'>('focus-phase',()=> 'focus'),running=useState('focus-running',()=>false)
  const remaining=useState('focus-remaining',()=>25*60),duration=useState('focus-duration',()=>25*60)
  const deadline=useState('focus-deadline',()=>0),startedAt=useState('focus-started-at',()=>''),selectedTask=useState('focus-task',()=>''),now=useState('focus-now',()=>Date.now())
  const mounted=useState('focus-clock-mounted',()=>false)
  const sessionId=useState('focus-session-id',()=>''),restoredOwner=useState('focus-restored-owner',()=> '')
  function persistTimer(){
    if(!import.meta.client || restoredOwner.value!==ownerId.value)return
    const snapshot:TimerSnapshot={version:1,id:sessionId.value,phase:phase.value,running:running.value,remaining:remaining.value,duration:duration.value,deadline:deadline.value,startedAt:startedAt.value,selectedTask:selectedTask.value}
    try{localStorage.setItem(`myhabit-focus:${ownerId.value}`,JSON.stringify(snapshot))}catch{/* The active clock still works when device storage is unavailable. */}
  }
  const configured=computed(()=>{const config=resolveModule(state.value.settings,'focus');return (phase.value==='focus'?config.focusMinutes??25:config.breakMinutes??5)*60})
  function setPhase(next:'focus'|'break'){phase.value=next;running.value=false;startedAt.value='';sessionId.value='';deadline.value=0;duration.value=configured.value;remaining.value=duration.value;persistTimer()}
  function reset(){setPhase(phase.value)}
  function start(){if(running.value||!initialized.value)return;if(!startedAt.value){duration.value=configured.value;remaining.value=duration.value;startedAt.value=new Date().toISOString();sessionId.value=crypto.randomUUID()}deadline.value=Date.now()+remaining.value*1000;running.value=true;persistTimer()}
  function complete(){running.value=false;if(phase.value==='focus'){if(!state.value.focusSessions.some(session=>session.id===sessionId.value)){state.value.focusSessions.push({id:sessionId.value||crypto.randomUUID(),taskId:selectedTask.value||undefined,startedAt:startedAt.value,endedAt:new Date(deadline.value).toISOString(),minutes:duration.value/60});touch()}setPhase('break')}else setPhase('focus')}
  function tick(){now.value=Date.now();if(!running.value)return;remaining.value=Math.max(0,Math.ceil((deadline.value-now.value)/1000));if(!remaining.value)complete()}
  function pause(){tick();running.value=false;persistTimer()}
  watch(configured,()=>{if(!startedAt.value&&!running.value){duration.value=configured.value;remaining.value=duration.value}},{immediate:true})
  function restore(){
    if(!import.meta.client||!clock||!initialized.value||status.value==='loading'||restoredOwner.value===ownerId.value)return
    restoredOwner.value='';selectedTask.value='';setPhase('focus')
    try{const saved=readTimerSnapshot(JSON.parse(localStorage.getItem(`myhabit-focus:${ownerId.value}`)||'null'));if(saved){phase.value=saved.phase;duration.value=saved.duration;remaining.value=timerRemaining(saved,Date.now());deadline.value=saved.deadline;startedAt.value=saved.startedAt;running.value=saved.running;sessionId.value=saved.id;selectedTask.value=state.value.tasks.some(task=>task.id===saved.selectedTask)?saved.selectedTask:''}}catch{/* Malformed clocks start fresh. */}
    restoredOwner.value=ownerId.value;tick();persistTimer()
  }
  watch([initialized,status,ownerId],restore)
  watch(selectedTask,persistTimer)
  onMounted(()=>{if(!clock||mounted.value)return;restore();mounted.value=true;const interval=window.setInterval(tick,250);window.addEventListener('pagehide',persistTimer);onBeforeUnmount(()=>{persistTimer();window.clearInterval(interval);window.removeEventListener('pagehide',persistTimer);mounted.value=false})})
  const percent=computed(()=>duration.value?Math.max(0,Math.min(100,100-remaining.value/duration.value*100)):0)
  return {phase,running,remaining,duration,now,selectedTask,percent,setPhase,start,pause,reset}
}
