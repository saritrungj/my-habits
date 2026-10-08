# แผนรวม 3 โปรเจกต์เป็น Myhabit

วันที่สำรวจ/ลงมือ: 8 ตุลาคม 2026 · สถานะ: สร้างแอป Nuxt ในเครื่องและตรวจ build แล้ว; ยังไม่ได้เชื่อมโปรเจกต์ Supabase จริงหรือ cutover production

### บันทึกผลการลงมือ

| ระยะ | ผลใน repository | สถานะภายนอก/เงื่อนไขที่ยังเหลือ |
|---|---|---|
| 0 · Stack/compatibility | ตรึง Node/npm และ stack ใน lockfile; `typecheck`, unit tests, production build ผ่าน; แก้ Nitro renderer สำหรับ Windows | Nuxt/Vue SFC typecheck ใช้ไม่ได้กับ TypeScript 7 เพราะ `vue-tsc` ล่าสุดไม่เข้ากัน; npm audit ของ stack ล่าสุดพบ advisories ดู [STACK_RESEARCH_2026.md](./STACK_RESEARCH_2026.md) |
| 1 · Core | shell/แบรนด์, ไทย-อังกฤษ, ธีม, วันนี้/ความคืบหน้า/งาน, IndexedDB guest, Myhabit import/backup, Supabase migration/RLS/RPC และ flow magic link เขียนครบ | ทดสอบ RLS ด้วย anon/user A/B, auth จริง, reconnect/conflict และทดสอบชุดข้อมูล Myhabit จริงยังไม่ได้ทำ |
| 2 · Sprout | importer, goals, ledger, focus, mood, settings/backup และ in-app reminder ทำแล้ว; มี fixture ทดสอบ importer | ยังไม่มี source dataset ที่ไม่ใช่ข้อมูลส่วนตัวสำหรับ reconciliation เต็มจำนวน |
| 3 · Alcon/หารบิล | split เป็น satang, weighted share, VAT/service, PromptPay QR ในเครื่อง และ converter ที่อนุมัติทำแล้ว; ไม่มี FX fallback ปลอม | ยังไม่ได้ยืนยัน QR กับผู้รับทดสอบและหลายแอปธนาคาร; FX/PWA เลื่อนตาม compatibility/ข้อตกลงผู้ให้บริการ |
| 4 · Release | Vitest/Playwright และ production build ผ่าน; root legacy projects ถูกเก็บไว้ | ไม่มี Supabase credentials/hosting target สำหรับ migration dry-run, preview, RLS test, rollback rehearsal หรือ production cutover; npm audit ต้องได้รับการแก้ใน release ที่ปลอดภัยก่อน deploy |

มี environment ตัวอย่างที่ `.env.example`; การ apply migration และการเปลี่ยน production ไม่ได้ทำในงานนี้เพราะ repository ไม่มีปลายทาง Supabase/hosting ให้ตรวจหรือ rollback

## 1. ข้อสรุปและขอบเขต

ให้ Myhabit เป็นผลิตภัณฑ์หลักสำหรับกิจวัตรและการดูแลชีวิตประจำวัน รวมความสามารถที่จำเป็นจาก `sprout-universe`, `han-tao-gun` และ `alcon-all-conversion` เข้าแอป Nuxt เดียว มีบัญชีเดียว การตั้งค่าเดียว ระบบข้อมูลเดียว และ deployment เดียว ไม่ฝังแอปเดิมผ่าน iframe และไม่คง React runtime ไว้ในแอปใหม่

ลำดับความสำคัญคือ **วันนี้ → ความคืบหน้า → เป้าหมาย → เครื่องมือ** ทุกความสามารถต้องช่วยการใช้งานประจำวัน ไม่ต้องนำทุกหน้าหรือทุก dependency เข้ามา

คำว่า “ล่าสุดในปี 2026” ในแผนนี้หมายถึง stable release ล่าสุดที่ตรวจสอบได้ ณ วันที่สำรวจ ไม่ใช้ beta/RC/canary และไม่ตีความว่าทุก dependency ต้องเริ่มเผยแพร่ในปี 2026 ก่อนลงมือแต่ละระยะให้ตรวจ registry และ peer dependencies อีกครั้ง ตรึงเวอร์ชันที่เข้ากันได้ใน lockfile หาก latest ขัดกันให้บันทึกปัญหาและเลื่อน dependency เสริมนั้น ไม่แอบลดเวอร์ชัน stack หลัก

เอกสารอ้างอิงเวอร์ชันและหลักฐาน registry: [STACK_RESEARCH_2026.md](./STACK_RESEARCH_2026.md)

## 2. ผลสำรวจจากโค้ดจริง

การสำรวจนี้เป็น static review ของ source/config/schema ไม่ได้ยืนยันว่า build ผ่าน หรือว่า external API และ production deployment ยังทำงาน รายการด้านล่างแยกสิ่งที่พบในโค้ดออกจากข้อเสนอใหม่

| โปรเจกต์ | สิ่งที่พบจริง | โครงสร้างเดิม | ส่วนที่นำมาใช้ |
|---|---|---|---|
| Myhabit ที่ root | 6 กิจวัตร กลุ่มเช้า/ระหว่างวัน/เย็น วงความคืบหน้า เกณฑ์ผ่าน 4/6 วัน เดือน ปี heatmap, magic link, guest และ cloud sync | Vanilla JS, Vite 5, Supabase JS 2; `habit_days` เก็บ JSON ต่อวัน | เป็นฐานประสบการณ์และแบรนด์; ย้ายข้อมูลและกติกาเดิม |
| alcon-all-conversion | มี 23 ไฟล์ converter; Sidebar เปิดใช้ 22 ตัว; BMI/BMR/TDEE อยู่ใน Sidebar แม้รายการใน App ไม่ครบ; Base ไม่ถูกลงทะเบียน | Vue 3, Tailwind 3, Vite 5; converter ถูก import ล่วงหน้า; FX/Crypto fetch และ polling ใน browser | สูตรที่ผ่านทดสอบและเครื่องมือชีวิตประจำวัน; เขียน presentation ใหม่ |
| han-tao-gun | หารเท่ากันและปรับยอดรายคน, service charge 10%, VAT 7% จากฐานรวม service charge, PromptPay QR, TH/EN/CN, draft ในเครื่องหมดอายุ 3 ชั่วโมง | Vue 3, Tailwind 3, Vite 5; BillSplitter รวม UI และ logic; QR ผ่าน promptpay.io | สูตรหารบิล, หน้ารายคน, ดาวน์โหลด QR; แยก logic และแก้ยอดเศษ |
| sprout-universe | planner, recurrence รายวัน/รายสัปดาห์, monthly membership, งานและ Kanban, goal เงิน/น้ำหนัก, focus, mood, export/import, reminder, AI | React/TS, Tailwind 3, Vite MPA หลาย HTML; localStorage state เดียว; หลาย shell/settings/manifest | domain logic ที่เป็นอิสระจาก React; habits/tasks/goals/focus/mood/finance ตามระยะ |

README ของ Sprout ระบุบางโมดูลว่า coming soon แต่มี route/component และ data functions แล้ว จึงจัดเป็น “มี implementation ให้ศึกษา” ไม่ถือว่าพร้อม production โดยอัตโนมัติ ส่วน Finance ใช้ financial goals และ daily records ร่วมกับ Goals ยังไม่ใช่บัญชีธุรกรรมแยกครบระบบ

หลักฐานใน repo:

- Myhabit: [`src/main.js`](../src/main.js), [`src/style.css`](../src/style.css), [`supabase/schema.sql`](../supabase/schema.sql), [`index.html`](../index.html)
- Alcon: [`src/App.vue`](../alcon-all-conversion/src/App.vue), [`Sidebar.vue`](../alcon-all-conversion/src/components/Sidebar.vue), [`useCurrencyRates.js`](../alcon-all-conversion/src/composables/useCurrencyRates.js)
- หารบิล: [`BillSplitter.vue`](../han-tao-gun/src/components/BillSplitter.vue), [`encryption.js`](../han-tao-gun/src/utils/encryption.js), [`security.js`](../han-tao-gun/src/utils/security.js)
- Sprout: [`store.ts`](../sprout-universe/src/lib/store.ts), [`storage.ts`](../sprout-universe/src/lib/storage.ts), [`goals.ts`](../sprout-universe/src/lib/goals.ts), [`modules.ts`](../sprout-universe/src/lib/modules.ts), [`FinanceRoutes.tsx`](../sprout-universe/src/components/finance/FinanceRoutes.tsx), [`ai.ts`](../sprout-universe/src/lib/ai.ts)

### ปัญหาที่ต้องแก้ระหว่างย้าย

1. **Myhabit sync:** `habits-v1` ไม่แยกตามบัญชี; sign out ยังทิ้งข้อมูลเดิมไว้ และ pull ส่ง local วันที่ cloud ไม่มีขึ้นบัญชีใหม่ได้ ต้องแยก guest/user namespaces และห้ามนำข้อมูลบัญชี A ไปอัปโหลดให้ B
2. **Myhabit lost edits:** pull เลือก cloud ทั้งวันเมื่อมีอยู่แล้ว จึงทิ้ง local edit วันเดียวกันได้; upsert หลังนำเข้าไม่ตรวจ error แต่รายงานว่าซิงก์แล้ว ต้องใช้ queue, conflict detection และสถานะสำเร็จหลัง server ยืนยัน
3. **Myhabit day rollover:** today ถูกคำนวณครั้งเดียวตอนเปิด ต้อง refresh วันที่เมื่อข้ามเที่ยงคืน/กลับเข้าแอป; สถิตินิสัยบางส่วนใช้เฉพาะวันที่มีข้อมูล ต่างจาก monthly average ต้องนิยาม denominator ให้ตรงกัน
4. **Assets:** root อ้าง manifest และ icon แต่ `public` ปัจจุบันไม่มีไฟล์ ต้องสร้างชุด Myhabit ให้ครบ ตรวจ asset path ในทุก route และ preview
5. **บิล:** ปัดยอดทุกคนแยกกัน ทำให้ 100 บาท / 3 คนรวมได้ 99.99 บาท; แก้ด้วยหน่วยสตางค์และแจก remainder แบบ deterministic ผลรวมต้องตรงยอดบิล
6. **QR:** URL รูปมี PromptPay ID และยอดเงิน ส่งให้ third party; เปลี่ยนเป็นสร้าง payload/QR ภายในเครื่อง ตรวจชนิด ID ตามมาตรฐาน ไม่รับเลขบัญชีทั่วไปเป็น PromptPay โดยอาศัยความยาวอย่างเดียว
7. **การเก็บ draft:** encryption key ของหารบิลเป็นค่าคงที่ใน source จึงไม่ใช่การแยกความลับของผู้ใช้; เอา implementation นี้ออกจากระบบใหม่ เหลือเฉพาะ adapter อ่านข้อมูลเก่า ห้าม rate limit local save จนทำข้อมูลล่าสุดหาย
8. **Sprout AI:** เส้นทาง Gemini ใช้ `VITE_GEMINI_API_KEY` ซึ่งถูก bundle สู่ client; ไม่ย้ายการออกแบบนี้ ถ้าเคย deploy คีย์จริงให้ตรวจและ rotate ระหว่าง release ส่วน AI เลื่อนจากรุ่นแรก
9. **FX:** fallback ใช้ตัวเลขคงที่และเวลาอัปเดตอาจเป็นเวลาที่ client fetch ไม่ใช่เวลาจาก provider; ต้องแสดงแหล่งข้อมูล/เวลาจริง/stale state และห้ามนำตัวเลขตัวอย่างมาแสดงเสมือนอัตราปัจจุบัน
10. **Focus/reminders:** timer นับ tick ใน browser และ reminder ต้องเปิดแอปอยู่; timer ใหม่คำนวณจาก deadline และไม่รับประกันเตือนเมื่อปิดแอปจนมี backend push

## 3. สิ่งที่เก็บ รวม เลื่อน และตัด

การตัดเป็นขอบเขตของแอปใหม่ ไม่ใช่คำสั่งลบ source หรือข้อมูลเดิมทันที

| ความสามารถ | การตัดสินใจ | เหตุผล/รูปแบบใหม่ |
|---|---|---|
| Myhabit วันนี้/เดือน/ปี/heatmap | เก็บเป็นแกนหลัก | ใช้หน้าวันนี้และหน้าความคืบหน้าเดียว; เดือน/ปีเป็นตัวเลือกช่วงเวลา |
| กิจวัตร 6 ข้อและแผนออกกำลังกายเดิม | เก็บเป็น starter template | ผู้ใช้แก้ได้; ไม่ hardcode เป็นกิจวัตรบังคับสำหรับทุกคน |
| Sprout planner + Myhabit checklist | รวม | habits สำหรับสิ่งทำซ้ำ, tasks สำหรับงานครั้งเดียว; นำมารวมในมุมมองวันนี้ได้แต่ไม่ปน denominator |
| งานประจำวัน/recurrence/subtasks | เก็บ | ทำก่อน Kanban; recurrence และ daily snapshot ต้องคงประวัติ |
| เป้าหมายเงิน/น้ำหนัก | เก็บระยะ 2 | เชื่อม habit/task ได้โดยไม่บังคับสร้าง task ตัวแทน goal ทุกครั้ง |
| Financial Goals + Finance | รวมข้อมูล | ledger เดียวและ goal allocation; ไม่บันทึกเงินรายการเดียวซ้ำในสองโมดูล |
| Focus timer + sessions | เก็บระยะ 2 | ผูกงานได้ ใช้ deadline เพื่อรองรับ background tab |
| Mood + energy + notes | เก็บระยะ 2 แบบเลือกใช้ | เปิดจากเมนูเพิ่มเติม; ไม่ส่งข้อความส่วนตัวออกภายนอกโดยอัตโนมัติ |
| หารบิล + QR | เก็บระยะ 3 | ใช้ได้โดยไม่ล็อกอิน; การบันทึกบิลเข้าบัญชีต้องเป็น action ชัดเจน |
| Converter น้ำหนัก/ระยะทาง/ปริมาตร/อุณหภูมิ/เวลา/ความเร็ว/เชื้อเพลิง | เก็บระยะ 3 | ตัวแปลงที่สัมพันธ์กับกิจวัตร การออกกำลัง และชีวิตประจำวัน |
| Currency | เก็บระยะ 3 เมื่อ provider พร้อม | server proxy/cache และสถานะ stale; offline ใช้ last known rate พร้อมวันที่ |
| BMI/BMR/TDEE | เก็บระยะ 3 เป็นเครื่องมือเสริม | ทดสอบสูตร/input/unit; ไม่บันทึกผลเป็น goal โดยอัตโนมัติ |
| Area/Data/Angle/Energy/Pressure/Force/Power/Frequency/Torque/Math/Base | ตัดจาก scope แรก | ไม่มีความจำเป็นต่อแกน habit; แยกสูตรต้นฉบับไว้เพื่อพิจารณาภายหลัง |
| Crypto และ price modal/polling | ตัด | เพิ่ม network และภาระดูแลที่ไม่ช่วยการเช็กกิจวัตร |
| Kanban drag-and-drop | เลื่อน | รุ่นแรกใช้ task list + เปลี่ยนสถานะด้วยปุ่ม; ไม่ต้องเพิ่ม React DnD dependencies |
| AI planner/chat | เลื่อน | ต้องมี server secrets, quota, validated output และตรวจ privacy ก่อน |
| Team/shared garden/social/XP | ตัดจากแผนรวมนี้ | ยังไม่มี requirement รองรับ; บิลแชร์รูป/ดาวน์โหลดได้แต่ไม่มี public shared database |
| Sprout mascots/สวน/สีเขียว และ Alcon/หารเท่ากัน logos | ตัดจาก UI ใหม่ | ใช้ชื่อ Myhabit สีส้ม ไอคอนและภาษาเดียวกัน |
| Landing/hub แยกแบรนด์, footer donate, splash หลายชุด | รวม/ตัด | landing Myhabit สั้นหนึ่งหน้า และ app shell เดียว |
| Theme/i18n/settings/reminder implementation ซ้ำ | รวม | settings รวมระดับบัญชีและตัวเลือกเฉพาะฟีเจอร์ในหน้าเดียว |
| Manifest/service worker ต่อโมดูล, Vite MPA fallback, React router | ตัด | ใช้ Nuxt routes และ PWA เดียวเมื่อผ่าน compatibility spike |
| JSON backup และ export รูป | เก็บ | JSON มาก่อน; export รูป lazy load และออกแบบเป็น Myhabit ในระยะ 3 |

## 4. เอกลักษณ์ Myhabit และโครงสร้างหน้า

ใช้ identity ที่พบจริงใน `src/style.css`: primary `#F26B1D`, dark primary `#FF8A3D`, light background `#F5F6F8`, dark background `#0E1015`, สีสำเร็จเขียว, Anuphan สำหรับข้อความ และ JetBrains Mono เฉพาะเวลา/ตัวเลขที่จำเป็น นำสีเหล่านี้ไปสร้าง semantic tokens ผ่าน Nuxt UI/Tailwind ตรวจ contrast ก่อนใช้ทุกคู่

หน้าวันนี้คง greeting, วันที่ภาษาไทย, progress ring, แถบ 7 วัน และรายการแบ่งช่วงเวลา; งานเสริม/เป้าหมายที่ถึงกำหนดแสดงต่ำกว่ากิจวัตร ไม่เพิ่มการ์ดทุกโมดูลในหน้าหลัก เกณฑ์เดิม 4/6 เก็บสำหรับข้อมูล legacy; กิจวัตรที่ผู้ใช้ปรับให้ใช้ threshold policy ที่แก้ได้และมี version ตามวัน

ไทยเป็นค่าเริ่มต้น อังกฤษรองรับตั้งแต่ shell ใหม่ แปลง `cn` เก่าเป็น `zh-CN`; เก็บสถานะ `zh-CN`/`zh-TW` จาก Sprout แต่เปิด locale สู่ผู้ใช้เมื่อแปลเส้นทางที่รองรับครบ ใช้คริสต์ศักราช/ISO ในฐานข้อมูล และแสดง พ.ศ. เฉพาะ presentation

| Route ใหม่ | ความสามารถ | การเข้าถึง |
|---|---|---|
| `/` | landing Myhabit และปุ่มเข้าใช้งาน | Public, SSR |
| `/today` | habits, งานวันนี้, เป้าหมายที่ถึงกำหนด | Guest/client และบัญชี |
| `/progress` | calendar, month/year, heatmap, streak | Guest/client และบัญชี |
| `/tasks` | งานครั้งเดียวและ subtasks | Guest/client และบัญชี |
| `/goals`, `/goals/[id]` | เงิน/น้ำหนักและประวัติ | ระยะ 2 |
| `/finance` | รายรับรายจ่ายและสรุปเชื่อม goal | ระยะ 2 |
| `/focus`, `/mood` | เครื่องมือดูแลกิจวัตร | ระยะ 2, เลือกใช้ |
| `/tools` | ค้นหาเครื่องมือ | Public |
| `/tools/split-bill` | หารบิลและสร้าง QR | Public, save เมื่อเลือก |
| `/tools/convert/[kind]` | Converter ที่อนุญาต | Public; lazy route |
| `/settings` | บัญชี/theme/language/timezone/backup/โมดูล | หน้าเดียว |
| `/auth/callback` | จัดการ magic-link PKCE | ไม่ cache |

Mobile bottom navigation 4 รายการ: วันนี้, ความคืบหน้า, เป้าหมาย, เพิ่มเติม; เพิ่มเติมรวมงาน/การเงิน/เครื่องมือ/ตั้งค่า Desktop ใช้ sidebar ของ Myhabit เดียว พร้อมเนื้อหากว้างตามชนิดหน้า รองรับ viewport 360px ขึ้นไป, keyboard, focus visible, touch target 44px และ reduced motion

Redirect legacy ที่เคยเผยแพร่: `/app` และ `/planner/today` → `/today`, `/planner/calendar` และ `/planner/dashboard` → `/progress`, `/hub` → `/today`, `/work/list` → `/tasks`, `/work/board` → `/tasks?view=list`, `/planner/settings` และ settings โมดูลอื่น → `/settings` พร้อม section ที่สัมพันธ์ ส่วน `/focus`, `/mood`, `/goals`, `/finance` คง deep link ที่จำเป็น

## 5. Stack และสถาปัตยกรรมเป้าหมาย

### เวอร์ชันฐาน ณ วันที่สำรวจ

| Package/runtime | Latest stable ที่ตรวจสอบ | ใช้ทำอะไร |
|---|---|---|
| Node.js | 26.11.1 Latest Current | dev/CI/hosting ตามข้อกำหนดใหม่สุด; 24.21.0 เป็น latest LTS แต่ไม่ใช่ baseline นี้ |
| `nuxt` | 4.6.0 | app, routing, Nitro server |
| `@nuxt/ui` | 4.11.3 | components/accessibility/theme |
| `tailwindcss` | 4.3.3 | styling ผ่าน integration ของ Nuxt UI |
| `vite` | 8.3.3 | Nuxt Vite builder; ไม่สร้าง config แยก |
| `vue` | 3.5.43 | runtime ของ Nuxt |
| `typescript` | 7.0.2 | typed domain และ API contracts |
| `@supabase/supabase-js` | 2.117.3 | database/auth SDK |
| `@nuxtjs/supabase` | 2.0.10 | Nuxt integration และ session plumbing |
| `@nuxtjs/i18n` | 10.6.0 | locale routing/copy |
| `vitest` | 5.0.3 | domain/migration unit tests |
| `@playwright/test` | 1.64.0 | critical user flows |

ตารางเป็น release snapshot ไม่ใช่คำรับรองว่ารวมทุก package แล้ว build ผ่าน ดูหลักฐาน publish time/engines/peers ใน [งานวิจัย stack](./STACK_RESEARCH_2026.md) ต้องผ่าน clean install, typecheck และ production build ก่อนปิด phase foundation

Nuxt builder เป็นเจ้าของ Vite integration; ตรวจว่าล็อกไฟล์ resolve Vite 8.3.3 ตาม requirement ไม่ติดตั้ง `@vitejs/plugin-react`/`@vitejs/plugin-vue` หรือสร้าง Vite app อีกชุด Tailwind v4 ใช้แนวทาง CSS-first จึงไม่คัดลอก tailwind.config/postcss.config v3 ของแต่ละแอป

ใช้ Nuxt `useState`/composables ก่อน ยังไม่ต้องเพิ่ม Pinia, ORM, microservices, queue server หรือ chart library หากไม่จำเป็น กราฟเบื้องต้นใช้ SVG; dates ใช้ Intl และ helper ที่ทดสอบแล้ว เงินใช้ integer minor units, สูตร decimal/precision ซับซ้อนค่อยเพิ่ม library หลังตรวจเวอร์ชัน

PWA เป็น optional ระยะ 3: `@vite-pwa/nuxt` latest มี dependency range ที่ไม่ตรงกับ `vite-plugin-pwa` latest major ต้องทดลอง compatibility และบันทึก dependency tree ก่อนใช้ ไม่บังคับ override peer dependency ถ้า requirement latest ทุก package ทำให้ใช้ module นี้ไม่ได้ ให้คง app แบบ browser ก่อนแล้วทำ PWA แยกภายหลัง

### โครงสร้างโค้ด

```text
app/
  app.vue
  app.config.ts
  assets/css/main.css
  layouts/default.vue
  layouts/app.vue
  pages/                  # routes ในตารางข้างต้น
  components/habits/
  components/tasks/
  components/goals/
  components/tools/
  composables/            # UI state, auth, sync, feature adapters
shared/
  domain/                 # habits, recurrence, goals, finance, splitBill, converters
  schemas/                # import/API validators
  types/
server/
  api/rates.get.ts         # เฉพาะเมื่อ FX เปิดใช้
  utils/                  # provider/cache; private runtime config
supabase/
  migrations/
  tests/                  # RLS, cross-owner FK, idempotency
tests/
  unit/
  e2e/
docs/
nuxt.config.ts
```

Public landing/tools ใช้ SSR หรือ prerender ตามความจำเป็น ส่วน private app ช่วงแรกใช้ client rendering เพื่อให้ง่ายต่อ guest/offline state; server routes ตรวจ session เองทุกครั้ง ห้ามอาศัย route middleware เป็น authorization ฝั่งฐานข้อมูล ใช้ request-scoped session และ `no-store` สำหรับ auth/private responses ไม่ cache HTML/API ผู้ใช้ร่วมกัน

Auth ใช้ magic link เดิมแต่เปลี่ยน callback/session ตาม Nuxt Supabase/SSR PKCE flow; private/service-role keys อยู่ server เท่านั้น และไม่จำเป็นต้องใช้ service role เพื่อ CRUD ข้อมูลส่วนตัวทั่วไป อ้างอิง [Supabase SSR](https://supabase.com/docs/guides/auth/server-side) และ [advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide)

## 6. ข้อมูล การนำเข้า และ sync

### Schema เป้าหมาย

| ตาราง | ข้อมูลหลักและข้อกำหนด |
|---|---|
| `profiles` | user_id, locale, timezone, theme, feature preferences |
| `habits` | user_id, id, title, slot, schedule, active_from/archive_at |
| `habit_schedule_versions` | habit_id, effective dates, recurrence; เปลี่ยนแผนไม่แก้ประวัติย้อนหลัง |
| `habit_day_plans` | user_id, local_date, scheduled habit IDs/threshold snapshot; ระบุวันพักและกติกาผ่าน |
| `habit_entries` | user_id, habit_id, local_date, completed, revision; unique ต่อ habit/วัน |
| `tasks`, `task_subtasks` | user_id, id, status, scheduled_date, priority; ไม่เป็น habit อัตโนมัติ |
| `goals`, `goal_entries` | typed money/weight goal, วันที่/ค่าที่บันทึก, ความสัมพันธ์กับ habit/task แบบ optional |
| `finance_entries`, `goal_allocations` | รายรับ/รายจ่ายใน minor units + currency; allocation เชื่อม goal แบบไม่ทำยอดซ้ำ |
| `focus_sessions`, `mood_entries` | task_id optional, timestamps/duration; mood/energy/private notes ต่อวัน |
| `bill_drafts`, `bill_participants` | เฉพาะผู้ใช้เลือก save; PromptPay ไม่เก็บค่าเริ่มต้นใน cloud |
| `import_runs`, `import_items`, `mutation_receipts` | source fingerprint, legacy ID mapping, import/mutation idempotency |

ทุกตารางส่วนตัวมี RLS SELECT/INSERT/UPDATE/DELETE ตาม `auth.uid() = user_id` พร้อม indexes; FK ระหว่างข้อมูลผู้ใช้ต้องตรวจเจ้าของร่วมกันด้วย composite owner FK หรือ constraint ที่เทียบเท่า ไม่พอที่จะตรวจเฉพาะ user_id ของ child row ใช้ RLS เป็นการบังคับสิทธิ์จริง ตาม [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)

`local_date` เป็น DATE ตาม timezone ของ profile (ค่าเริ่มต้น Asia/Bangkok); event time เป็น UTC timestamptz; เปลี่ยน timezone ไม่ย้ายวันประวัติเดิม เงินไม่รวมหลาย currency เป็นยอดเดียวหากไม่มี rate snapshot ประกอบ

Streak และเปอร์เซ็นต์คิดจากรายการที่ถูกกำหนดให้ทำในวันนั้น ไม่ใช้จำนวน habits ปัจจุบันหารประวัติทั้งหมด งานครั้งเดียว/focus/mood ไม่เพิ่มจำนวน habit ที่ต้องทำ วันพักต้องนิยามว่าไม่ทำให้ streak ขาด และ zero scheduled habits แสดงว่าไม่มีแผน ไม่แสดง 100% อัตโนมัติ Legacy เก็บ PASS=4, N=6 และสถิติตาม policy เดิมไว้เทียบ ผลลัพธ์กติกาใหม่ต้องระบุให้ผู้ใช้เข้าใจและไม่เปลี่ยนย้อนหลังเงียบ ๆ

### Migration ที่ทำซ้ำได้และ rollback ได้

1. Snapshot source และ database ก่อนเริ่ม repo ปัจจุบันมี README modified และ source จำนวนมาก untracked จึงห้าม reset/clean หรือย้ายโฟลเดอร์ทับโดยไม่บันทึกสถานะ เก็บต้นฉบับไว้นอก build context ของ Nuxt จน migration ผ่าน
2. Export Myhabit `habit_days` และ local `habits-v1`; สร้าง habit mapping จาก sleep/wake/dog/am/snack/pm พร้อม original policy และวันเริ่มข้อมูลที่ตรวจสอบได้
3. อ่าน Sprout `sprout-planner:v1` หรือ backup envelope `app: sprout-planner, version: 1`; เก็บ original IDs, month membership, day taskIds, doneAt, subtasks, skipped, recurrence, focus/mood และ goal records
4. แยก recurring self-dev tasks เป็น habits; one-off/work เป็น tasks; goal task เป็น goal และ linked action ตามความจำเป็น ไม่ copy ไปสามตารางแล้วนับ progress ซ้ำ แยกเงินจาก `goalRecords` และรองรับ `goalEntries` เก่าโดยแจ้งรายการที่ไม่มีข้อมูลพอ
5. นำเงิน legacy เข้า ledger พร้อม source_key ต่อ goal/date; รายรับและรายจ่ายอาจแยกเป็นสอง entries แต่ยอดสุทธิต้องเท่าเดิม weight เก็บหน่วยและวันที่ ค่าไม่ครบเป็น import warning ไม่เดาเงียบ ๆ
6. หารบิลอ่าน `hanTaoGunData` และ flag `hanTaoGunDataEncrypted`; legacy decrypt ใช้เฉพาะ importer ในเครื่อง ให้ preview ทั้ง draft ที่ยังไม่หมดอายุและ raw expired draft ถ้ายังมี ห้ามยกข้อมูลที่โค้ดเก่าลบไปแล้วกลับมาเสมือนกู้ได้
7. LocalStorage ข้าม origin อ่านกันไม่ได้ หากแอปเก่าอยู่คนละโดเมนต้อง export จากโดเมนเก่าแล้ว import file ใน Myhabit; ไม่สัญญาว่าจะย้ายข้อมูลทุก browser อัตโนมัติ
8. Import preview แสดงจำนวนข้อมูล, conflict, unknown IDs, skipped records และเวลา; แยก guest กับ cloud account และเลือก merge อย่างชัดเจน ไม่ deduplicate habit ตามชื่อเพียงอย่างเดียวเพราะอาจเป็นคนละกิจวัตร
9. เขียนเป็น batch transaction/RPC ที่ตรวจ session/owner พร้อม import fingerprint และ stable mapping; import ไฟล์เดิมซ้ำไม่เพิ่มรายการอีก ตรวจจำนวน/ยอด/ประวัติก่อน mark completed
10. เก็บ `habit_days` เป็น read-only legacy จนผ่าน reconciliation และ backup/restore rehearsal; rollback ใช้โค้ดเดิมและ snapshot พร้อม export ข้อมูลใหม่ที่เกิดหลัง cutover ไม่ทิ้งข้อมูลใหม่โดย rollback DB ทับทันที

### Offline และบัญชี

- Guest ใช้ IndexedDB พร้อม schema version และ outbox; namespace ของ guest ต่างจาก namespace ต่อ user_id localStorage ใช้เฉพาะ preferences/import source
- Habit toggle บันทึก local และ mutation ID ก่อนแสดง saved locally; sync acknowledged หลัง server commit ใช้ retry/backoff และ online/visibility events
- Server เป็นเจ้าของ revision และเวลาที่ commit; ใช้ expected revision เพื่อจับชนกัน ไม่ใช้ clock จากอุปกรณ์ตัดสินว่าค่าไหนใหม่เสมอ ล็อกอินแล้ว local/cloud วันเดียวกันต่างค่าให้ resolve ก่อนทับ
- Delete ใช้ tombstone จนทุก mutation ยืนยัน; server receipt ทำ retry idempotent
- Logout หยุด request/queue ของบัญชีและล้าง state ใน memory; cache ของบัญชีถูกล็อกตาม namespace ไม่ปรากฏให้ guest/บัญชีอื่น งาน upload เก่าห้ามใช้ session ใหม่
- ถ้ามี guest data ตอน login ให้ preview การนำเข้าก่อนส่ง cloud; ไม่รวมข้อมูลบัญชีอื่นแบบ automatic

## 7. ลำดับลงมือและเกณฑ์ผ่าน

### ระยะ 0 — ทำฐานอ้างอิงและ compatibility spike

- [x] สำรวจ source/config/schema ของ Myhabit และ 3 โปรเจกต์
- [x] กำหนด keep/merge/defer/remove และ identity ของ Myhabit
- [x] ตรวจ release snapshot และจัดทำเอกสาร stack แยก
- [ ] บันทึก source baseline ที่รักษาไฟล์ modified/untracked และ export DB/local fixtures ที่ไม่ใช้ข้อมูลส่วนตัวจริง
- [x] Clean install Nuxt 4 + UI 4 + Tailwind 4 + Vite 8 + TS 7 + Supabase module; มี lockfile และผ่าน TS typecheck, unit tests, production build (ข้อยกเว้น platform/typecheck บันทึกใน stack research)
- [ ] เทียบ screen/flow เดิมใน browser; แยก functional baseline จากสิ่งที่ README กล่าวไว้

**ผ่านเมื่อ:** dependency tree ใช้ latest stable ที่เข้ากันได้ มี lockfile, engine pin, clean build และ fixture/source snapshot ที่นำกลับได้ หาก module เสริมติด compatibility ให้เลื่อนและบันทึก ไม่ใช้ workaround โดยไม่มีหลักฐาน

### ระยะ 1 — Myhabit Core + ระบบข้อมูล

- [x] Nuxt shell, design tokens, ไทย/อังกฤษ, light/dark, mobile/desktop navigation
- [x] habits/template editor, daily schedule, วันนี้, calendar/month/year/heatmap/streak
- [x] tasks รายวันและ subtasks พื้นฐาน; ไม่เพิ่ม Kanban
- [~] Supabase migrations/RLS/typed client, magic-link callback, guest IndexedDB และ account isolation; durable outbox และการทดสอบบน Supabase จริงยังไม่เสร็จ
- [~] Import Myhabit legacy และ backup JSON; reconciliation report กับข้อมูลจริงยังไม่เสร็จ

**ผ่านเมื่อ:** ผู้ใช้เดิมติ๊ก 6 กิจวัตรและดูประวัติเดิมได้, PASS=4 migration ถูกต้อง, offline reload ไม่หาย, toggle แล้ว reconnect ซิงก์ได้, บัญชี A/B แยกข้อมูล, วันข้ามเที่ยงคืนถูกต้อง และ schema migration ซ้ำไม่ทำข้อมูลเพิ่ม

### ระยะ 2 — รวมฟีเจอร์ Sprout ที่จำเป็น

- [x] Import recurrence/month/day snapshots และ tasks จาก Sprout
- [x] Goals เงิน/น้ำหนัก, ledger/allocations, focus deadline, mood แบบเลือกเปิด
- [x] Settings รวมและ backup round-trip ครอบคลุมโมดูลใหม่
- [x] Reminder ขณะเปิดแอปพร้อมข้อความอธิบายขอบเขต; backend push อยู่นอก release นี้

**ผ่านเมื่อ:** import Sprout ซ้ำไม่สร้างข้อมูลซ้ำ; ยอดเงิน/น้ำหนัก/จำนวน task และ session ตรง fixture; เงินที่ผูก goal ไม่ถูกนับสองครั้ง; timer กลับจาก background ถูกต้อง; daily progress ไม่ปน task/goal completion

### ระยะ 3 — หารบิลและ converters

- [x] แยก pure splitBill functions, หน่วยสตางค์, service/VAT ที่ตั้งค่าได้; 10%/7% เป็นค่า default จากแอปเดิม ไม่ hardcode เป็นข้อบังคับ
- [~] QR ภายในเครื่อง, validation ID, ดาวน์โหลด และ save draft แบบเลือกใช้; payload มี unit test แต่การทดสอบรับเงินจริงกับธนาคารยังเหลือ
- [x] Converters ตาม scope, typed unit registry, input errors, lazy routes; FX ที่ยังไม่มี provider ไม่แสดงอัตราสมมติ
- [ ] FX provider spike: ตรวจ terms/key/quota, server cache, timeout, stale state และ timestamp จาก provider
- [ ] Export รูปแบบ Myhabit และ PWA เดียวเมื่อ compatibility ผ่าน; migration service worker/cache เก่า

**ผ่านเมื่อ:** 100/3 แจกเป็น 33.34 + 33.33 + 33.33 และยอดรวมตรง, กรณี 0 คน/ค่าติดลบ/ยอดแก้เองมี validation, QR ไม่ส่ง ID ไป external image API, converters round-trip ผ่าน tolerance และ FX failure ไม่แสดงอัตราคงที่เสมือนข้อมูลสด

### ระยะ 4 — ตรวจและเปลี่ยนระบบใช้งาน

- [~] Production build, TypeScript check (`tsc`), unit tests เฉพาะ domain ที่มีความเสี่ยง และ Playwright critical flows ผ่าน; checker สำหรับ template `.vue` ถูกปิดเพราะ incompatibility ของ TS 7/`vue-tsc`
- [ ] RLS tests จาก anon/user A/user B รวม cross-owner FK, import และ retry
- [ ] Keyboard/mobile/reduced-motion/contrast; direct route reload และ auth redirect
- [ ] Preview deployment ด้วย environment แยก, migration dry-run, reconciliation, backup/rollback rehearsal
- [ ] เปลี่ยน deployment เดิมเป็น Nuxt/Nitro; environment จาก VITE_* เป็น Nuxt/Supabase config ตาม module รุ่นที่ใช้, redirect URLs และ build output ตาม hosting ใหม่
- [ ] ลบ legacy shell/dependencies/assets ที่ไม่มีผู้ใช้ในแอปใหม่ หลังเก็บ snapshot และ migration ผ่าน; รักษา license notices ของ source ที่นำกลับใช้

**ผ่านเมื่อ:** smoke test ใน preview ผ่าน, domain/import reconciliation ไม่มี unexplained difference, rollback พร้อม, asset/manifest ไม่มี 404, ไม่มี secret ฝั่ง client และ private routes ไม่ถูก cache ร่วมข้ามผู้ใช้

การเปลี่ยน production ยังไม่เกิดขึ้นในงานสำรวจนี้ จัด preview และผล migration ให้ตรวจได้ก่อน cutover ไม่รัน SQL production จากเอกสารแผนโดยอัตโนมัติ

## 8. ชุดตรวจที่ต้องมีและสิ่งที่ยังต้องตัดสินจากหลักฐาน

| ความเสี่ยง | การตรวจที่จำเป็น |
|---|---|
| เปลี่ยน habits แล้วประวัติเพี้ยน | schedule version, archived habit, skipped/rest day, 4/6 legacy, recurrence weekdays, denominator ไม่มีข้อมูล |
| ข้อมูลหายหรือข้ามบัญชี | guest → user import, A logout → B login, reconnect retries, concurrent edit/revision conflict, stale pull ไม่ทับ pending mutation |
| Migration ไม่ครบ | raw/envelope backup, malformed/unknown version, duplicate import, month membership, goal financial/weight/savings legacy, expired/encrypted bill draft |
| ยอดเงินผิด | uneven split, service/VAT rounding order, edited shares validation, large safe integer input, currency separation, no double counting |
| สิทธิ์รั่ว | CRUD ทุก RLS policy, child เชื่อม parent ของบัญชีอื่น, auth callback และ cache isolation |
| ใช้งานมือถือไม่ได้ | 360/390/768/desktop, keyboard, Thai text overflow, empty/loading/error state, background focus timer |
| Upgrade/build ไม่ผ่าน | latest direct/transitive versions, peer ranges, clean lockfile install, Nuxt typecheck/build, test runner, hosting Node engine |

ยังต้องยืนยันตอน implementation: baseline ใน browser, ข้อมูลจริงที่มีอยู่แต่ละ origin, hosting ที่ใช้งานจริง, FX provider และ PromptPay payload/QR library ที่ผ่านการตรวจล่าสุด ไม่เลือกแพ็กเกจ QR เก่าจากความคุ้นเคยเพียงอย่างเดียว

License เป็นข้อมูลที่ต้องรักษาระหว่าง cutover: root/Alcon/หารบิลมี MIT notices ส่วน Sprout ระบุ proprietary; คง provenance ของส่วนที่นำมาใช้และอย่าทำเอกสารแจกจ่ายเสมือนทุก asset อยู่ใต้ MIT เดียวกัน งานวางแผนนี้ไม่ได้เปลี่ยน license และไม่ได้ขออนุมัติเพิ่มเพื่อสำรวจ source ที่ผู้ใช้ให้มา

ผลลัพธ์ปลายทาง: **Myhabit หนึ่งแอป** ที่เช็กกิจวัตรได้เร็ว มีความคืบหน้าและเป้าหมายที่เชื่อถือได้ พร้อมเครื่องมือหารบิล/แปลงค่าที่เลือกใช้ โดยไม่มี shell แบรนด์ ระบบข้อมูล หรือ runtime ซ้ำจากสามโปรเจกต์
