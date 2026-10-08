export default defineNuxtPlugin(() => {
  const available = useState('install-available', () => false)
  const installed = useState('app-installed', () => false)
  const installEvent = useState<Event | null>('install-event', () => null)
  installed.value = window.matchMedia('(display-mode: standalone)').matches
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installEvent.value = event; available.value = true })
  window.addEventListener('appinstalled', () => { installed.value = true; available.value = false; installEvent.value = null })
  if (!import.meta.dev && 'serviceWorker' in navigator) {
    const register=()=>{void navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => { /* Device storage stays available even if offline installation fails. */ })}
    if(document.readyState==='complete')register();else window.addEventListener('load',register,{once:true})
  }
})
