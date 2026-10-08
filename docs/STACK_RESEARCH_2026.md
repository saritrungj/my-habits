# Stack ที่ตรวจสอบสำหรับแผนรวม MyHabit

วันที่อ้างอิงแผน: **8 ตุลาคม 2026 (Asia/Bangkok)** ตรวจสอบกับ npm registry สดและเอกสารผู้พัฒนาโดยตรง โดยเลือก `dist-tags.latest` ของ stable release และอ่านเวลาเผยแพร่จริง ไม่เลือก alpha, beta, RC, canary หรือ nightly หลักฐานดิบอยู่ใน [registry snapshot](./stack-registry-snapshot-2026-10-08.json) ซึ่งมีเวลาที่ดึงข้อมูล UTC และ metadata ของทุก package

## เวอร์ชันล่าสุดที่พบ

วันที่เผยแพร่ในตารางเป็น UTC ทุก release ที่ระบุเผยแพร่ภายในปี 2026 และก่อนวันที่อ้างอิงแผน การตรวจ metadata ยืนยันหมายเลข release และช่วง compatibility ที่ประกาศ แต่ยังไม่ใช่การยืนยันว่า application นี้ build หรือทำงานได้ ต้องมี integration spike ก่อนย้ายจริง

| เทคโนโลยี | Latest stable | เผยแพร่ | การใช้ใน MyHabit / แหล่งข้อมูลตรง |
|---|---|---|---|
| Nuxt | 4.6.0 | 2026-10-05 | Framework หลัก, routing, SSR, server routes — [registry](https://registry.npmjs.org/nuxt) |
| Nuxt UI | 4.11.3 | 2026-10-01 | UI component foundation ปรับให้เป็นอัตลักษณ์ MyHabit — [registry](https://registry.npmjs.org/@nuxt%2Fui) |
| Tailwind CSS | 4.3.3 | 2026-07-16 | Tokens และ styling — [registry](https://registry.npmjs.org/tailwindcss) |
| Vite | 8.3.3 | 2026-10-06 | ใช้ผ่าน Nuxt builder — [registry](https://registry.npmjs.org/vite) |
| Supabase JS | 2.117.3 | 2026-10-07 | Client SDK สำหรับ Auth, database, storage — [registry](https://registry.npmjs.org/@supabase%2Fsupabase-js) |
| Nuxt Supabase | 2.0.10 | 2026-08-10 | Nuxt integration และ session SSR — [registry](https://registry.npmjs.org/@nuxtjs%2Fsupabase) |
| Vue | 3.5.43 | 2026-09-17 | Nuxt runtime dependency — [registry](https://registry.npmjs.org/vue) |
| TypeScript | 7.0.2 | 2026-07-08 | Type safety และ domain model — [registry](https://registry.npmjs.org/typescript) |
| Nuxt i18n | 10.6.0 | 2026-07-30 | เพิ่มเมื่อจำเป็นต้องรองรับหลายภาษา — [registry](https://registry.npmjs.org/@nuxtjs%2Fi18n) |
| Vitest | 5.0.3 | 2026-09-30 | ทดสอบ domain logic และ migration logic — [registry](https://registry.npmjs.org/vitest) |
| Playwright Test | 1.64.0 | 2026-10-07 | ทดสอบ flow สำคัญบน browser — [registry](https://registry.npmjs.org/@playwright%2Ftest) |
| Nuxt Test Utils | 4.3.3 | 2026-10-02 | เพิ่มเมื่อมี Nuxt component/runtime tests — [registry](https://registry.npmjs.org/@nuxt%2Ftest-utils) |
| Nuxt PWA | 1.1.1 | 2026-02-06 | ทางเลือกในระยะหลัง ต้องผ่าน compatibility spike — [registry](https://registry.npmjs.org/@vite-pwa%2Fnuxt) |
| Vite PWA plugin | 2.0.0 | 2026-10-03 | Latest upstream อยู่นอก dependency range ของ Nuxt PWA รุ่นล่าสุด — [registry](https://registry.npmjs.org/vite-plugin-pwa) |

## Compatibility ที่ต้องใช้ตัดสินใจ

### Nuxt และ Vite

Nuxt 4.6.0 รวม `@nuxt/vite-builder` 4.6.0 และ builder ประกาศ dependency `vite: ^8.3.2` จึงครอบคลุม Vite 8.3.3 ที่พบ ใช้ Nuxt dev/build commands และ config ของ Nuxt; ไม่สร้าง Vite application อีกชุดขนานกับ Nuxt และไม่ใช้ overrides เพื่อบังคับ major ของ build tooling โดยไม่มีเหตุผล [Nuxt package metadata](https://registry.npmjs.org/nuxt/latest), [builder metadata](https://registry.npmjs.org/@nuxt%2Fvite-builder/latest), [Nuxt Vite plugins](https://nuxt.com/docs/4.x/guide/recipes/vite-plugin)

### Nuxt UI และ Tailwind

Nuxt UI 4.11.3 ประกาศ peer `tailwindcss: ^4` และ dependencies ของ Tailwind tooling `^4.3.3`; รุ่นที่พบตรงกัน เอกสารติดตั้งให้เพิ่ม `@nuxt/ui` ใน modules และ import ทั้ง `tailwindcss` กับ `@nuxt/ui` ใน CSS นอกจากนี้ UI module ลงทะเบียน icon, fonts และ color mode ให้แล้ว จึงไม่เพิ่ม modules เดิมซ้ำโดยไม่มีเหตุผล ปรับสี ฟอนต์ ระยะห่าง และ component variants ให้เป็น MyHabit แทนการยกหน้าตาของ source projects มาใช้ [metadata](https://registry.npmjs.org/@nuxt%2Fui/latest), [Nuxt UI installation](https://ui.nuxt.com/docs/getting-started/installation/nuxt)

### Node.js runtime

Nuxt 4.6.0 มี engine **`^22.22.3 || ^24.15.0 || >=26.0.0`** และ Supabase JS 2.117.3 ต้องการ Node `>=22.0.0` จึงไม่ใช้ขั้นต่ำ Node 20.19 ที่พบในเอกสาร Vite เป็นขั้นต่ำรวมของระบบนี้ [Nuxt metadata](https://registry.npmjs.org/nuxt/latest), [Supabase JS metadata](https://registry.npmjs.org/@supabase%2Fsupabase-js/latest), [Vite guide](https://vite.dev/guide/)

Node release index ที่ตรวจพบมี latest Current **26.11.1** (2026-10-07, `lts: false`) และ latest LTS **24.21.0** (2026-09-07, Krypton) ทั้งคู่เข้า engine range ข้างต้น เลือก Node 26.11.1 สำหรับ baseline หากตีความคำว่า “ใหม่สุด” ครอบคลุม runtime ทุกชนิด; สำหรับ production ที่ต้องการสาย LTS ให้บันทึกการเลือก Node 24.21.0 เป็น latest LTS อย่างชัดเจน ไม่เรียกว่า latest overall [Node official release index](https://nodejs.org/dist/index.json), [Nuxt installation guidance](https://nuxt.com/docs/4.x/getting-started/installation)

### Supabase integration และ TypeScript tests

Nuxt Supabase 2.0.10 ประกาศ `@supabase/supabase-js: ^2.112.2` ซึ่งครอบคลุม 2.117.3 และใช้ `@supabase/ssr` สำหรับ SSR integration ต้องทดสอบ login, refresh, logout และ server/client session agreement ใน spike ก่อนย้ายข้อมูล [module metadata](https://registry.npmjs.org/@nuxtjs%2Fsupabase/latest), [Nuxt Supabase documentation](https://supabase.nuxtjs.org/getting-started/introduction)

Nuxt UI รองรับ TypeScript `^7` ตาม peer metadata และ Nuxt Test Utils 4.3.3 รองรับ Vitest `^5.0.0`, Nuxt `^4.0.0`, Vue `^3.5.0` ขณะที่ Vitest 5.0.3 รองรับ Vite `^8.0.0` จึงผ่านช่วงเวอร์ชันที่ประกาศ แต่ `vue-tsc` latest 3.3.12 ที่ตรวจบนชุดนี้พยายาม import `typescript/lib/tsc` ซึ่ง TypeScript 7 ไม่ export ทำให้ Nuxt checker/build ล้ม ใช้ `nuxt prepare && tsc --noEmit` แทนสำหรับ `.ts` และปิด Nuxt Vite checker; production build ยัง compile `.vue` แต่ **ไม่ได้ typecheck template/SFC** จนกว่าจะมี `vue-tsc` รุ่นที่รองรับ TypeScript 7 หรือ Nuxt เปลี่ยน checker [UI metadata](https://registry.npmjs.org/@nuxt%2Fui/latest), [test utils metadata](https://registry.npmjs.org/@nuxt%2Ftest-utils/latest), [Vitest metadata](https://registry.npmjs.org/vitest/latest)

### PWA: ยังไม่ควรเพิ่มโดยอัตโนมัติ

`@vite-pwa/nuxt` latest 1.1.1 ใช้ `vite-plugin-pwa: ^1.2.0` โดย 1.2.0 ประกาศรองรับ Vite ถึง major 7 แต่ range สามารถ resolve plugin 1.3.0 ที่เพิ่ม Vite 8 แล้ว อย่างไรก็ตาม upstream latest 2.0.0 ไม่อยู่ใน range `^1.2.0` ทำให้ข้อกำหนด latest ทุก package กับ module นี้ไม่ตรงกันโดยตรง ถ้า offline/installable app ยังไม่จำเป็น ให้เลื่อน PWA ออกจาก baseline; หากจำเป็นต้องใช้ ให้ทำ spike กับ plugin 2.0.0 ที่รองรับ Vite 8 และ integration ที่รองรับจริงก่อนเลือก ไม่ force override หรือเลือกเวอร์ชันเก่าโดยไม่บันทึกเหตุผล [Nuxt module metadata](https://registry.npmjs.org/@vite-pwa%2Fnuxt/latest), [plugin 1.3.0 metadata](https://registry.npmjs.org/vite-plugin-pwa/1.3.0), [plugin latest metadata](https://registry.npmjs.org/vite-plugin-pwa/latest)

## แนวทางล็อกชุดเวอร์ชันที่ใช้กับ implementation

1. ดึง latest stable และ publish timestamps ใหม่ในวันที่เริ่มจริง หากเปลี่ยนจาก snapshot นี้ ให้อัปเดตตารางและ compatibility checks ก่อนติดตั้ง
2. Pin direct dependencies ด้วย exact versions และ commit lockfile ของ package manager เพียงตัวเดียว ให้ transitive dependencies ของ Nuxt resolve ภายใน ranges ที่ผู้พัฒนากำหนด
3. ยืนยันบน Windows development และ runtime เป้าหมายว่า install, dev, typecheck, production build, Supabase session และ test flows สำคัญผ่าน
4. ตรวจ native tooling ของ TypeScript 7, Nuxt/Vite และ runtime/image ของ deploy target; metadata compatibility ยังไม่ยืนยัน platform support
5. เพิ่ม i18n, PWA, state library, validation/chart dependencies เฉพาะเมื่อ feature ใช้งานจริง และตรวจ latest ของ package เพิ่มเติมก่อนเลือก ไม่ย้าย dependencies ทั้งสามโปรเจคมาแบบรวมรายการ

## ผล compatibility spike และความเสี่ยงก่อน production

- ตรวจจริงบน Windows 11: Nuxt 4.6.0 + Nitro 2.13.4 + Vite 8.3.3 ปล่อย SSR renderer เป็น external ทำให้ทุกหน้า 500 เพราะไม่ได้รับ manifest/precomputed data อาการตรงกับ [Nuxt issue #36467](https://github.com/nuxt/nuxt/issues/36467) ที่รายงาน Windows/Nitro รุ่นเดียวกัน เพิ่ม `nitro.externals.inline` regex สำหรับ `node_modules/nuxt/dist` แล้ว production SSR ทำงานและ Playwright ผ่าน
- `npm audit --omit=dev` ณ 8 ต.ค. 2026 รายงาน 17 advisories (7 critical, 9 high, 1 low) ใน dependency tree ของ latest Nuxt/i18n stack; npm เสนอ downgrade ไป Nuxt 3.7.4 และ i18n 7.3.1 ซึ่งผิด major/ข้อกำหนด baseline จึงไม่ใช้ `--force` และไม่ deploy ก่อน upstream มี release ที่แก้หรือมี mitigation ที่ตรวจได้ รายละเอียด advisories อยู่ใน `npm audit --omit=dev` และ URL GHSA ที่ npm รายงาน
- `@nuxt/ui` นำ Tailwind 4.3.3 มาเป็น dependency และ Nuxt builder resolve Vite 8.3.3; exact versions อยู่ใน `package-lock.json` แม้สอง package นี้ไม่ประกาศตรงใน `package.json`
- Production build ผ่านบน Windows Node 26.11.1; TypeScript `tsc` ผ่าน; Vitest 7 domain tests และ Playwright 3 critical flows ผ่านหลังติดตั้ง Chromium ของ Playwright (guest persistence, split-bill totals, route smoke test)
- ไม่มี Supabase URL/key หรือ credentials สำหรับ hosting จึงยังไม่ได้ apply migration, test RLS/auth กับ hosted project, run reconciliation จากข้อมูลจริง, preview deploy, rollback rehearsal หรือ cutover

ข้อจำกัด: Supabase hosted service และ PostgreSQL version เป็น version ของ service/instance ไม่ใช่หมายเลข npm release ตารางนี้ยืนยัน SDK กับ Nuxt module เท่านั้น ต้องตรวจ instance จริงตอน migration; version snapshot นี้เป็นหลักฐาน ณ 8 ต.ค. 2026 ไม่ใช่คำรับรองว่า upstream ไม่มีช่องโหว่ที่เปิดเผยภายหลัง
