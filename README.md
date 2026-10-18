# Adham Client Hub

نظام خاص لإدارة العملاء والمشاريع والفيديوهات والدفعات. بعد ما ترفعه مرة وحدة، كل شي بتعمله من داخل الموقع (أزرار وفورمات) بدون كود وبدون SQL.

**شو بتحتاج:** ايميل + 3 حسابات مجانية (GitHub, Supabase, Cloudflare). الوقت: حوالي 20 دقيقة. ولا شي منهم بيطلب بطاقة دفع.

---

## الخطوة 1: GitHub (مكان تخزين الملفات)

1. افتح https://github.com وسوّي حساب (Sign up).
2. اضغط **+** فوق يمين ← **New repository**.
3. الاسم: `adham-client-hub` ← اختار **Private** ← **Create repository**.
4. فك ضغط ملف الـ zip عندك. ادخل على الفولدر.
5. **مهم:** في ملفات مخفية (اسمها بيبدأ بنقطة) لازم ترتفع كمان: `.npmrc` و `.node-version` و `.gitignore`.
   - Mac: اضغط `Cmd + Shift + .` لتظهرها.
   - Windows: من View ← Show ← Hidden items.
6. بصفحة الـ repository اضغط **uploading an existing file** وسحّب **كل محتويات** الفولدر (مو الفولدر نفسه) ← **Commit changes**.

## الخطوة 2: Supabase (قاعدة البيانات)

1. افتح https://supabase.com ← **Start your project** ← سجّل (ممكن بحساب GitHub).
2. **New project** ← اكتب اسم (`adham-client-hub`)، اختار كلمة سر لقاعدة البيانات (**احفظها**)، واختار أقرب منطقة ← **Create new project**. استنى دقيقتين.
3. من القائمة اليسار اختار **SQL Editor** ← **New query**.
4. افتح الملف `supabase/migrations/0001_init.sql` من الفولدر، انسخ **كل** محتواه والصقه بالـ SQL Editor ← اضغط **Run**. لازم يطلع "Success". (هاد آخر مرة بتحتاج SQL بحياتك.)
5. من **Project Settings** ← **API** (أو **API Keys**) انسخ 3 أشياء وخليها جنبك:
   - **Project URL**
   - **anon public key**
   - **service_role key** ← هاد **سرّي**. ما تعطيه لحدا وما تنشره.
6. من **Authentication** ← **Sign In / Providers** (أو Providers ← Email): طفّي **Allow new users to sign up**. هيك محد غريب بيقدر يسجّل حساب.

## الخطوة 3: Cloudflare Pages (النشر)

1. افتح https://dash.cloudflare.com وسوّي حساب مجاني.
2. **Workers & Pages** ← **Create application** ← تبويب **Pages** ← **Connect to Git**.
   (إذا الواجهة صارت شكلها مختلف، دوّر على خيار **Pages** وربط GitHub.)
3. اربط حساب GitHub واختار الـ repository `adham-client-hub` ← **Begin setup**.
4. الإعدادات:
   - **Project name:** `adham-client-hub`
   - **Framework preset:** `Next.js`
   - **Build command:** `npx @cloudflare/next-on-pages@1`
   - **Build output directory:** `.vercel/output/static`
5. افتح **Environment variables** وزيد هدول الثلاثة (الاسم بالحرف مثل ما هو):

   | الاسم | القيمة |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key |

6. اضغط **Save and Deploy** واستنى 2 إلى 4 دقايق.
7. رابط موقعك رح يكون: **https://adham-client-hub.pages.dev** (إذا الاسم مأخوذ، Cloudflare بيضيف أرقام بآخره، وبتشوف الرابط الحقيقي بنهاية النشر).
8. **مهم (وإلا بيطلع 500):** لازم تفعّل `nodejs_compat`: **Settings** ← **Runtime** (أو **Functions**) ← **Compatibility flags** ← زيد `nodejs_compat` للـ Production وللـ Preview، وبعدها **Deployments** ← **Retry deployment**.
   - لا تحط ملف `wrangler.toml` بالمشروع: وجوده بيخلي Cloudflare يتجاهل المتغيرات اللي حطيتها من اللوحة.
9. إذا غيّرت أي متغير بعد النشر لازم تعمل **Retry deployment** حتى ياخد التغيير.

## الخطوة 4: أول دخول (إنشاء حساب الأدمن)

1. افتح `https://adham-client-hub.pages.dev/login`.
2. رح تشوف فورم **Create admin account** ← اكتب اسمك وايميلك وكلمة سر ← اضغط الزر.
3. هاد الفورم بيظهر مرة وحدة بس. بعدها الصفحة بتصير تسجيل دخول عادي.

## الخطوة 5: أول عميل

1. **Clients** ← **Add client** ← عبّي الفورم ← **Save**.
2. افتح العميل ← **Create portal login** ← اكتب اسم وايميل وكلمة سر مؤقتة.
3. اضغط **Copy portal link** وابعت الرابط مع الايميل وكلمة السر للعميل. هو بيدخل من نفس صفحة `/login` وبيوصل لبوابته لحاله.
4. لإيقاف دخول عميل: بنفس القسم اضغط **Disable**.

## شو بتعمل يومياً (كله من الموقع)

- **Dashboard:** قسم **My Actions** (شو لازم تشتغل عليه) وقسم **Waiting for Client** (شو مستني من العميل) + أزرار سريعة لإضافة عميل/مشروع/فيديو/دفعة.
- **Videos:** إضافة وتعديل (الاسم، السعر، الحالة، التاريخ، الروابط، الملاحظات) + بحث وفلاتر وترتيب.
- **Payments:** تسجيل الدفعات وتعديلها. المتبقي بيتحسب لحاله.
- **Clients / Projects / Settings:** إدارة العملاء والمشاريع والاسم واللون واللوغو.
- الملاحظات الداخلية (**Internal notes**) ما بتنعرض للعميل أبداً، وهي محمية من قاعدة البيانات نفسها.

## اختبار سريع بعد النشر (10 دقايق)

مهم تعمله مرة، لأني فحصت إنه الكود يبني ويشتغل على Cloudflare، بس **ما قدرت أجرّب على قاعدة بياناتك الحقيقية**:

1. سجّل دخول أدمن ← أضف عميل جديد ← أضف مشروع ← أضف فيديو.
2. عدّل سعر الفيديو وغيّر حالته إلى **Sent for review**.
3. سجّل دفعة جزئية ← تأكد إنه **Remaining** نقص.
4. سوّي portal login لعميل، وافتح نافذة خاصة (Incognito) وادخل فيها بحساب العميل.
5. تأكد إنه العميل بيشوف فيديوهاته بس، وإنه ما في أي **Internal notes**.
6. جرّب تفتح رابط فيديو عميل ثاني (غيّر الـ ID بالرابط): لازم يطلع "page doesn't exist".
7. كعميل: اترك **feedback** ثم اضغط **Approve video**. ارجع للأدمن وتأكد إنه ظهر بالـ Activity.
8. اطلع وادخل من جديد وتأكد إنه كل شي لسا موجود.

إذا شي فشل، خبّر اللي ساعدك بالبناء وبنصلحه.

## ملاحظات مهمة

- **الداتا التجريبية:** الخطوة 2 بتضيف عميل اسمه **Hidden** مع 8 فيديوهات للتجربة. لما تبدأ شغل حقيقي: افتح العميل ← **Delete client**.
- **العملات:** المجاميع بالـ Dashboard بتجمع الأرقام بغض النظر عن العملة (ما في تحويل). الأفضل تستعمل عملة وحدة غالباً.
- **اللوغو:** بيتحط كرابط صورة (مو رفع ملف).
- **الوضع:** الواجهة داكنة فقط حالياً (ما في Light mode).
- **الإشعارات:** إشعار الأدمن بموافقة العميل بيظهر بقسم **Recent activity** بالـ Dashboard (ما في ايميلات).
- **دومين خاص لاحقاً:** من Cloudflare ← مشروعك ← **Custom domains**. ما بيحتاج تعديل بالكود.
- **النسخ الاحتياطي:** Supabase المجاني بيوقّف المشروع إذا ما استخدمته أسبوع. فتحه مرة وحدة بيرجّعه. لنسخة احتياطية: Supabase ← **Database** ← **Backups**.
- **الأمان:** لا تنشر `SUPABASE_SERVICE_ROLE_KEY` أبداً ولا تحطه بـ GitHub.

---

## للمطوّرين (اختياري)

```bash
cp .env.example .env.local   # عبّي القيم
npm install
npm run dev
```

- Next.js 15 (App Router) + TypeScript + Tailwind + Supabase (Auth, Postgres, RLS).
- النشر عبر `@cloudflare/next-on-pages` (مُهمَل رسمياً لصالح OpenNext على Workers، بس لسا شغّال ومتفحوص مع Next 15.5.28).
- كل جدول عليه RLS. العميل بيقرأ بياناته بس، وأفعاله (موافقة، طلب تعديل، feedback) بتمر عبر دوال قاعدة بيانات محدودة. عمود `admin_notes` محجوب عن كل المستخدمين ويُقرأ للأدمن فقط عبر دالة.
