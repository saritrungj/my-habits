import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
const css=readFileSync(new URL('../../app/assets/css/main.css',import.meta.url),'utf8')
const luminance=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i]!,0)
for(const [theme,source] of [['light',css.split(':root.dark')[0]!],['dark',css.split(':root.dark')[1]!.split(':root {')[0]!]]) {
 it(`${theme} semantic foregrounds meet 4.5:1 on their surfaces`,()=>{
  const colors=Object.fromEntries([...source!.matchAll(/--mh-([\w-]+):\s*(#[0-9A-Fa-f]{6})/g)].map(match=>[match[1],match[2]]))
  for(const [fg,bg] of [['ink','bg'],['ink','surface'],['muted','bg'],['muted','surface'],['accent','accent-soft'],['success','success-soft'],['danger','danger-soft'],['warning','warning-soft'],['accent-ink','accent'],['ink','heat-0'],['ink','heat-1'],['heat-ink','heat-2'],['accent-ink','heat-3']]) {
   const a=luminance(colors[fg!]!),b=luminance(colors[bg!]!)
   expect((Math.max(a,b)+.05)/(Math.min(a,b)+.05),`${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5)
  }
 })
}
