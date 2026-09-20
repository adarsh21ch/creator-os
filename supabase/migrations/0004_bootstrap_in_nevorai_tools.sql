-- ============================================================
-- 0004_bootstrap_in_nevorai_tools.sql
--
-- Run ONCE, in full, in the SQL Editor of the "Nevorai Tools"
-- Supabase project (wxgfaaaboftzsazknbvl). This is the entire
-- Creator OS backend moving from its old standalone project into
-- its own schema inside the shared Nevorai Tools project, so it
-- lives alongside future Nevorai apps without ever colliding with
-- their tables.
--
-- After running this, one manual dashboard step is still needed:
-- Project Settings -> API -> Exposed schemas -> add "creator_os"
-- to the list (keep "public" there too). Without that step,
-- PostgREST will not serve this schema and the app will get 404s.
--
-- RLS is enabled immediately in this file (unlike the old project,
-- where it was applied as a separate later step) because this
-- project has no existing session depending on the anon key -
-- there is nothing to break.
-- ============================================================

create schema if not exists creator_os;
set search_path to creator_os, public;

-- Creator OS — Phase 1 schema
-- Single-user personal app (Adarsh only). RLS is intentionally left off: there is
-- exactly one user and the Supabase anon key is never exposed beyond his own devices.
-- Revisit if this ever becomes multi-tenant (see docs/02-decisions.md).

-- ── Library — the foundation table ──────────────────────────────────────────
-- Every reel he has posted: transcript + metrics + which format it used.
-- The Scriptwriter reads this to sound like him, the Pattern Analyst reads it
-- to find what works, the Playbook Keeper reads it to know what changed.
create table if not exists reels (
  id uuid primary key default gen_random_uuid(),
  posted_at date,
  transcript text not null,
  caption text,
  pillar text,
  hook_type text,
  length_seconds int,
  format_id uuid, -- fk added once the Formats table exists (Phase 2+)
  is_organic boolean not null default true, -- false = paid promotion, confounds teardown comparisons
  views bigint,
  likes bigint,
  comments bigint,
  shares bigint,
  saves bigint,
  profile_visits bigint,
  follows bigint,
  source text not null default 'voice_training' check (source in ('voice_training', 'graph_api', 'manual')),
  notes text,
  created_at timestamptz not null default now()
);

comment on table reels is 'The Library. Foundation table — build this correctly before anything else (docs/01-architecture.md).';

-- ── Watchlist — 40 competitor accounts ──────────────────────────────────────
create table if not exists watchlist_accounts (
  id uuid primary key default gen_random_uuid(),
  handle text not null unique,
  wing text check (wing in ('right', 'left', 'neutral')),
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Sources — newspapers / RSS feeds for the News Desk Analyst ─────────────
create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  type text not null default 'rss' check (type in ('rss', 'newspaper', 'other')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Brand Brain — singleton voice profile ───────────────────────────────────
create table if not exists brand_brain (
  id smallint primary key default 1 check (id = 1),
  pillars jsonb not null default '[]',
  hook_formula text,
  voice_notes text,
  banned_claims text,
  language_register text check (language_register in ('clean', 'mixed', 'crude')),
  updated_at timestamptz not null default now()
);

insert into brand_brain (id) values (1) on conflict (id) do nothing;

-- ── Employees — the 13 AI staff, each a row not a code file ────────────────
create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, -- e.g. 'I-01'
  name text not null,
  desk text not null check (desk in ('intelligence', 'creative', 'production', 'performance', 'manager')),
  prompt text,
  provider text not null default 'anthropic' check (provider in ('anthropic', 'gemini')),
  model text,
  schedule text, -- cron expression, null = on-demand
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── App settings — singleton, non-secret connection state ──────────────────
create table if not exists app_settings (
  id smallint primary key default 1 check (id = 1),
  instagram_connected boolean not null default false,
  anthropic_key_set boolean not null default false,
  gemini_key_set boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into app_settings (id) values (1) on conflict (id) do nothing;

-- News ingestion + competitor post logging.
-- Twitter/X skipped by decision 2026-09-16 (cost, not in original architecture).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ── News stories — raw RSS pulls, not yet AI-scored (needs Anthropic/Gemini
-- keys, which are still pending — see STATUS.md). The News Desk Analyst's
-- shareability scoring is a later step once those keys exist.
create table if not exists news_stories (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references sources(id) on delete cascade,
  title text not null,
  url text not null unique,
  summary text,
  published_at timestamptz,
  fetched_at timestamptz not null default now()
);

create index if not exists news_stories_source_idx on news_stories(source_id);

-- ── Watchlist posts — what the 40 competitor accounts are posting.
-- Populated by pasting an Instagram link into the Watchlist screen; the
-- ingest-instagram Edge Function calls Apify to fill in the rest.
create table if not exists watchlist_posts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references watchlist_accounts(id) on delete cascade,
  post_url text not null unique,
  posted_at date,
  caption text,
  transcript text,
  views bigint,
  likes bigint,
  comments bigint,
  fetched_at timestamptz not null default now()
);

create index if not exists watchlist_posts_account_idx on watchlist_posts(account_id);

alter table reels              enable row level security;
alter table watchlist_accounts enable row level security;
alter table watchlist_posts    enable row level security;
alter table sources            enable row level security;
alter table news_stories       enable row level security;
alter table brand_brain        enable row level security;
alter table employees          enable row level security;
alter table app_settings       enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'reels','watchlist_accounts','watchlist_posts','sources',
    'news_stories','brand_brain','employees','app_settings'
  ] loop
    execute format(
      'create policy %I on %I for all to authenticated using (true) with check (true)',
      t || '_authenticated_all', t
    );
    -- anon gets nothing at all
    execute format('revoke all on table %I from anon', t);
  end loop;
end $$;

-- ============================================================
-- SEED: his 7 transcripts + brand brain, re-inserted here since
-- this is a fresh database. Metrics left NULL on purpose - real
-- figures were never supplied and a guess would poison the
-- teardown this table exists to support.
-- ============================================================
insert into reels (transcript, pillar, length_seconds, is_organic, notes, source) values
  ('00:00 India me logon ko job kaise milengi jab hamare yaha start-ups se jyada to NGOs kholne me lage hain.
00:04 Aur kitni badi problem hai hamare liye, aap video aakhri tak dekhna, me aapko explain kar deta hu.
00:07 Ok, so according to Department for Promotion of Industry and Internal Trade, hamare yaha lagbhag 2.5 lakh jo start-ups hai wo register hue hain.
00:14 Ab aap guess kar sakte ho NGO kitne register hue honge?
00:17 6 lakh, 6 lakh se jyada NGO register hue hain, iska matlab 2.5 guna jyada NGOs register hue hain start-ups se.
00:23 Ab jo start-up hota hai wo business karta hai, ek product hota hai, market me jata hai, bikta hai, revenue generate hota hai, job create hoti hai, logon ko naukri milti hai.
00:29 Jo log naukri karte hai wo paise kamate hai, wo tax pay karte hai, jo businesses hai wo tax pay karte hai, desh ki economy badi hoti hai.
00:34 But jo NGOs hote hai wo bante to achche motive ko leke hai, kyuki problem hai uska hame solution dena hai.
00:40 But wo solution ki jagah agar wo desh ki problem hi create kar rahe hai wo NGOs, ab wo problem-matic hai.
00:44 Ab aap ye bologe bhai to sarkar ka narrative hai ki foreign funding hoti hai, ye wo hota hai.
00:47 To bhai mere, 2012 me hamare jo previous prime minister the Manmohan Singh, unhone ye baat boli thi.
00:51 Kudankulam jo nuclear plant hai, isko videshi paise jin NGO ko aa rahe hai, uski wajah se isko roka gaya hai, rokne ki koshish kari gayi hai.
00:58 Ya fir Income Tax Department ne yaha pe Supreme Court me ye kaha tha ki jo hamare Odisha me coal project hai,
01:01 isko bahar se paise deke protest karaya gaya taki ye band ho jaye, ruk jaye.
01:07 Aur isse hua kya ki jo coal hum khud uga sakte the, mine kar sakte the, hume bahar se import karna pada wo bhi mehenge daamo me.
01:13 Ya fir hum IB ki report dekh le, unka khud kehna hai ki bhai 2 se 3% ke aaspaas ki jo GDP growth hai wo kam ho jati hai due to these protests ya foreign-funded NGOs ke.
01:21 Yaha pe aapko ek do list dikh rahi hongi, ek green state aur ek red state.
01:25 Green state me aapko wo saare states dikh rahe honge jo developed kar rahe hai, yaha pe aap NGOs ka ratio dekho lagbhag 1.5 ya fir 2 se kam hi hai.
01:31 But jo red state hai jo border areas hai, sensitive areas hai, waha pe number of NGOs aap dekho kitne jyada hai aur unki development kitni kam hai.
01:39 Hamare desh ke jo north-east ya border areas hai waha pe infrastructure hum develop nahi kar pa rahe, waha pe koi na koi environmental cause ke liye wo litigation daal dete hai, project delay hote rehte hai, aur wo ban hi nahi paate.
01:48 In fact agar hamare desh me aazadi se leke aaj tak agar sara ka sara infrastructure aache se developed kiya hota, sare projects bane hote, factories bani hoti, hamara manufacturing sector aache se bana hota,
01:58 to China pe hum itne dependent nahi hote aur China manufacturing hub nahi ban pata.
02:00 To isliye recently central government ne bhi FCRA laane ki baat kari hai, jaha pe FCRA me wo regulate karenge ki bahar se jo paisa aa raha hai NGOs ko,
02:08 wo paisa wahin pe kharch ho jis motive se wo aa raha hai.
02:11 Aisa na ho ki paisa aapne le liya logon ki help karne ke liye, aur us paise ko aapne laga diya 10 jagah, us paise se aap protest kara rahe ho, koi government ka important project hai, uske against me aap protest kar rahe ho.
02:21 Matlab ye sab na ho isliye jo FCRA bill central government prefer kar rahi hai, mere hisab se wo zaroori bhi hai India ke liye.
02:26 Ki at least hamare yaha ek strict aisa law ho ki jo hamare yaha NGOs hai, wo sirf NGO wala hi kaam kare, NGO ke naam pe aisa kaam na kare jisse desh ki jo growth hai aur desh ko jo youth hai, unko jo employment mil sakta hai,
02:38 jo unko government ki taraf se start-ups me support mil sakta hai, jo wo companies bana sakte hai, usme problem wo create na kare.
02:42 Baaki iske alawa ye bahut saari cheeze hai, me description aur comment section me isko pin kar dunga, aap jaake', 'Business politics', 165, false, 'LOSER. PAID PROMOTION, reported 5-6k views. No living villain - target is NGOs as an abstract category. Uses the same guess-the-number device as w03 and still failed: disproved the Counted Zero hypothesis. Longest in the sample. Ends on housekeeping.', 'voice_training'),
  ('00:00 Bhai aaj jo India BRICS summit host kar raha hai na,
00:03 ek time pe us BRICS se India ko nikalne ki baatein ho rahi thi,
00:07 kyuki us time pe India ki jo situation, jo halat thi wo itni kharab ho gayi thi.
00:12 Matlab hamari jo currency depreciate hoti ja rahi thi, inflation hamare yaha badte ja raha tha,
00:16 plus hamare jo India ki GDP growth thi wo pichle 9 saal me sabse kam thi.
00:21 Lekin uske baad hamne pichle 10-12 saalo me apna jo reputation hai, hamare jo star hai wo hamne itna achcha banaya hai,
00:28 ki aaj ke time pe bina India ke aap BRICS imagine bhi nahi kar sakte.
00:33 India world ki fastest growing economy hai,
00:37 aur hamare pas agle 20 saal pade hai developed hone ke liye.
00:40 Aur jo baki world leaders aa rahe hai,
00:42 aap ye samjho inko bhi malum hai ki hamara jo desh hai, hamara jo bharat hai,
00:47 wo ek sahi raste pe chal raha hai, aur jin logon ko India ki growth nahi dikh rahi hai, to mere bhai aapka kuch nahi ho sakta bhai.', 'Narrative war', 50, false, 'LOSER. PAID PROMOTION, reported 5-6k views. Positive good-news reel: no villain, no grievance, nothing at stake for the viewer. Shortest loser, so length is not the explanation here.', 'voice_training'),
  ('00:00 Naxalism ko lekar bahut saare logon ko ye clarity nahi hai ki jo Karl Marx aur jo communism hai, wo naxalism wala communism nahi hai.
00:06 Kai logon ko lagta hai ki yaar ye to Karl Marx ne jo communism ki baat kari thi, uske liye hi ye lad rahe hai.
00:10 Nahi bhai, inki jo communism jo ideology hai na, Lenin aur Mao wali, wo itself corrupt hai.
00:14 To me aapko thoda sa Karl Marx ki ideology bata deta hu.
00:17 Inka kehna ye tha ki jo labour class hai, jo working class hai, unko problem hoti hai aur unke against me jo industrial log hai, jo capitalist society hai, uske against me unhone aawaz uthane ki baat kari thi ki bhai ye hame difference khatam karna hai.
00:27 Ab jo Lenin aaye the Russia me aur jo China me jo Mao aaye hai, unhone is movement ko jo capitalist hai, usko side karke, seedha state ke against kar diya.
00:35 Ki jo state hai wahi aap pe atyachar kar rahi hai, wahi aapke against me hai, ab aapko seedha hathiyar uthane hai, state ke khilaf.
00:41 Ab ye start hua tha Russia me, jab Lenin ne ye bola tha ki bhai hamari ek party honi chahiye aur bina power ke hum communism nahi establish kar payenge aur is chakkar me unhone violence ki permission de di.
00:50 Ab wahi jab Mao aaye to unhone is cheez ko aur exploit kara ki bhai ab to koi rural class nahi hai, koi capitalist nahi hai, tum to bhai labours ho, tumko seedha China ke jo state hai na, uske against ladai karni hai, maro, kato, peeto.
01:00 Aur yahi jo soch hai ki bhai jo industrialist hai, jo capitalist hai, wo to chodo, state ke against bhi hum fight karenge.
01:06 Ye ideology yaha pe India me aati hai, jo naxalism ki problem hai, Bastar region me ya jitne bhi India me problem hai, ye itni kharab ye log hai,
01:14 ye cause pakadte hai ki jo India ke tribals hai, unko sahi tarike se treat nahi kara ja raha hai, isliye hum aawaz utha rahe hai.
01:19 Aur jo bhi government koi project laati hai naxalism ke, school bana diye, road bana diye, unko tod deti hai.
01:24 Jisse jo tribals hai wo aur deprived rahe, unke paas resources pahuch hi na paaye government ki taraf se, to bhai unka sath de de wo.
01:31 To ye na bahut sochi-samjhi ideology hai, ye dheere-dheere khatam ho rahi hai.
01:33 India me to lagbhag khatam hai, but kyuki abhi bhi skoolo me, collegeo me ye padhaya jata hai,
01:38 jo DU Universities ho gaye, to waha pe jo chote-chote bachche jaate hai, naye-naye bachche jaate hai, wo jab wo communism padhte hai, to unko itna fascinating lagta hai, jo hamare ye AISF waghera ho gaye, ye log join kar lete hai.
01:46 Ab inko ye samajh nahi aata, uska consequences kya honge?
01:49 Matlab inse agar aap ek sawaal bol lo na, aap jo ideology follow karte ho, aap jo governance chah rahe ho, aap jo safed achchi duniya dikha rahe ho na, aap uska ek example de do mujhe,
01:57 live example de do puri duniya me, jo aapki ideology hai wo successful hui hai aur usse logon ka bhala hua hai?
02:03 Kyuki jitna maine padhai kari hai, chahe wo Russia ho, wo China ho, logon ka qatal hi hua hai, mara hi gaya hai wo ideology puri fail hai.
02:08 China as a communist party bhi capitalist ban chuki hai.
02:11 To ab aap bhi decide kar lo ki ab ye dimagi naxal jo honge, wo kis tarike ke ho sakte hai, ab aapke upar hai.', 'Explainer', 133, true, 'LOSER. ORGANIC, under 10k views. The only organic loser, so the cleanest comparison available. Uses the state-then-contradict move from w01/w02/w04 and still failed: disproved Their Words Their Weapon. Target is Marx/Lenin/Mao: no living villain.', 'voice_training'),
  ('00:00 Left wing aur right wing mein kitna difference hai, yeh main aapko is particular case mein samjha deta hu.
00:03 Yahan pe main kisi bhi political party ki baat hi nahi karunga.
00:06 Yeh particular photo aapne bahut baar dekh li hogi, yeh aapko case bhi samajh mein aa gaya hoga ki jo bahar ki media agencies hoti hain, jo Western jo media hoti hain, wo Bharat ki image down karne ke liye aisi photo use karti hain.
00:14 Ki har article mein, har newspaper mein ek hi aisi photo chapti hai ki bhai wahan pe koi cycle chalata hua vyakti ja raha hai ya phir footpath pe so raha hai.
00:21 Ab yeh cheez aapko bhi maloom hai aur humein bhi maloom hai ki yeh jaan-boojh ke kara jata hai, India ki image down karne ke liye.
00:25 Aap mujhe batao desh mein aise kaun se creators hain jinhone is particular case ko pick kara, ispe baat kari.
00:30 Maine right wing ke bahut saare creators ko dekha hai ispe baat karte hue, par left wing ka ek creator bhi nahi hai.
00:35 Ek creator bhi nahi hai jo iske upar baat kar raha hai.
00:38 Even influencers, celebrities tak baat nahi kar rahe, jo bade-bade CGP ke time pe, student ke time pe muh khol rahe the social media pe ki hum desh ke liye khade rahenge, desh ke liye toh hum aawaz uthayenge, hum kisi political party se jude hue nahi hain.
00:49 Ispe kyu nahi bol rahe mere bhai?
00:52 Yahan aapne kya muh sil liye hain?
00:58 Pura left wing creator jo choti-choti cheezon ko pick kar leta hai, usko apne desh ke khilaaf aisa narrative chal raha hai social media pe, international newspaper chap rahe hain, toh unko wo cheez khabar nahi dikhayi de rahi.
01:03 Apne desh ke liye bolna nahi dikhayi de raha.
01:03 Lekin haan, jaise hi koi journalist kisi bhi state mein, kisi bhi level pe koi bhi cheez aisi bol de jo BJP ke against mein ho, wo turant pick kar lete hain, social media pe daal dete hain, Twitter pe daal dete hain, pura campaign run kar dete hain.
01:15 Lekin aisi cheez jo Bharat ke against mein boli ja rahi hai, Bharat ki image down kari ja rahi hai, usko defend karne ke liye, apne Bharat, apne desh ko defend karne ke liye, apne desh ki image sahi rakhne ke liye aapse muh nahi khola ja raha?', 'Narrative war', 81, true, 'WINNER (organic). Target: left-wing creators, celebrities, influencers. Fits F-01 + F-02. Exact metrics not supplied.', 'voice_training'),
  ('00:00 Matlab mudde ko bhatkao bas tumhare jo genuine issues usko lekar kro protest...
00:01 Reservation aa agr desh me to uski bhi ek wajah h and pahli baat yaha reservation ki
00:02 baat h hi nhi... Baat galat sahi ki h... Agr
00:03 tmhare bachcha bhi din raat mehnat kre and
00:04 uska selection sirf paper leak ki wajah se
00:08 to ye insan ko me bolna chahta hu ki
00:09 Sita ke pati, RSS murdabad, Brahmanwaad
00:10 murdabad, Article 370 ki Kashmir,
00:12 me kyu shri ram kyu bolu bas naam rahega
00:14 Allah ka... wo 2027 me UP me BJP ko harana hai,
00:17 me kyu premanand maharaj ji ko maharaj bolu,
00:20 AI SF aur Umar Khalid.
00:21 To jab ye baatein ho rahi thi stage me,
00:23 us protest me, to ye baatein divert nahi
00:24 kar rahi hongi protest ko, jo hume
00:26 chutiya laake bol rahe the ki bhai ye baatein
00:28 mat karo student ke protest me, tab
00:30 aap humko andhbhakt bol rahe the.
00:31 Aur jab me baat kar raha hu reservation pe,
00:33 to jo actual logon ki, student ki problem
00:35 hai, jo exam de rhe hain, unko face karna padta
00:37 hai reservation ki dikat. To bhai ye topic
00:38 ko divert kar raha hai.
00:39 Matlab toda kutta Tommy aur sara kutta kutta!', 'Reservation & social policy', 40, true, 'WINNER (organic). Target: protestors and their stage slogans. Fits F-01 + F-02. Contains one crude Hindi word - relevant to the language_register decision. Exact metrics not supplied.', 'voice_training'),
  ('00:00 BJP se Aam Aadmi Party char kadam aage hai,
00:02 ye aap video dekho. Yaha par 2022 me Bhagwant Mann ne announce kara tha ki hum ek medical college kholenge.
00:06 Ab aap guess karlo 2026 lach chuki hai, 4 saal me usko
00:09 hum kitne student ne padhai kar li hogi, kitne marizon ke waha pe ilaj ho gaya hoga? Guess karlo?
00:13 Chalo me aapko batata hu ye raha wo college.
00:15 College nahi dikha? Are wo college bana hi nahi kabhi!
00:17 Wo wahi shilanyas jitna bana tha na announcement ke time pe utna hi hai, pura khet pada hua hai.
00:21 Aur aapko lag raha hai ki ye koi ek college ke sath hi scam hua hai? Ek nahi hua!
00:24 2022 me Aam Aadmi Party ne announce kara tha ki hum 16 medical college kholenge Punjab me.
00:28 Ab aap guess karlo mota-mota kitne khol liye honge? Chalo 100% chodo,
00:31 50% aad khol liye honge?
00:33 Chalo chodo, 4 khol liye honge?
00:35 2 khol liye honge? Are ek to khola hoga?
00:37 Nahi.
00:38 Zero! Sannata.
00:39 Char saal me ek medical college nahi khola!
00:41 Planning thi 16 karne ki.
00:43 To ye kyu nahi hua? Matlab agar aap bolte ho ki hum BJP ki tarah nahi hai, hum kaam ki rajniti karte hai, hum dharm ki rajniti nahi karte, to kaam bhi kaha ho raha hai?', 'Accountability', 45, true, 'WINNER (organic). Target: AAP / Bhagwant Mann. Cleanest example of the counted-zero delivery. Fits F-01 + F-02. Exact metrics not supplied.', 'voice_training'),
  ('00:00 Reservation ko lekar sabse bada logon ko ye milti hai ki bhai ye hamara fundamental right hai, ye hamara constitutional right hai, humse koi cheen nahi sakta.
00:05 Aarakshan khairat nahi, sanvaidhanik adhikar hai ye.
00:07 Reservation koi constitution aur fundamental right nahi hai. Pehle baat ye samjho.
00:10 Reservation constitution me sirf ye adhikar diya hai bharat ki sarkar ko, state government ko, ki wo apne will ke accordingly agr unko lagta hai ki aapki caste hai, in logon ki jo caste hai,
00:20 ye abhi bhi lower hai ya fir inki representation nahi hai, to aap inko reservation ki de sakte ho taaki ye apni social upliftment kar sake.
00:27 Aarakshan kisi ke kehne se samapt hone wali cheez hai kya?
00:30 Aur waise hi state ya central government ko ye lagta hai ki is particular caste ya community ke jo log hai, inki upliftment ho chuki hai, ab inko reservation ki zarurat nahi hai, to simple order se aapki caste
00:40 us reservation category se hat bhi jayegi.
00:42 Aur plus ye ek good thing hai, ye bura kyu mante ho aap?
00:45 Reservation ka motive kya hai? Ki jo society me section log hai, unko uplift karana, taki wo baakiyo se equal ho sake.
00:51 To agr aapki category reservation category se hat ke ek equal category me aa rahi hai, ki aapko reservation ki zarurat nahi hai, to is a good thing na, ki aapki community aur aapki caste ke log ki upliftment ho chuki hai.
01:02 Baki jo caste abhi bhi deprived hai, jinko discrimination face karna padta hai, chahe gaon me, chahe shahro me, ya jinke bachcho ko discrimination face karna padna padta hai, jinke pas paisa nahi hai, unko reservation ka fayda milne do,
01:12 taki ek do generation ke baad wo bhi normal jo category ke log hai, unse compete kar sake aur un wo uplift ho sake.
01:18 Aur yahi to motive hai hamara reservation ka, lekin nahi, hum aaj bhi shahro me rehke hamare bachche na discrimination face kar rahe hain, hamare pas na paise ki kami hai, aur na hi hum kisi bhi tarike se socially aur economically weak hai.
01:29 Par tab bhi hamari jo community hai, hamari jo caste hai, hum jo log hai, hum reservation ka fayda uthayenge aur kiske naam pe uthayenge?
01:35 Us community aur us caste ke logon ko jo abhi bhi gaon me reh rahe hain, jo aaj bhi wahi kaam kar rahe hain, jisko aaj bhi discrimination face karna padta hai,
01:42 jinke bachche aaj bhi school nahi ja pa rahe, jinke bachche aaj bhi college nahi ja pa rahe, jo aaj bhi socially aur economically dono tarike se weaker hai,
01:49 unka reservation aap kha rahe ho.
01:50 Aur isliye hum reform ki baat kar rahe hain.', 'Explainer', 110, true, 'WINNER (organic). Target: people claiming reservation is a fundamental right. Fits F-01 + F-02. Exact metrics not supplied.', 'voice_training');

insert into brand_brain (id, pillars, hook_formula, voice_notes, banned_claims)
values (1, '["Accountability", "Reservation & social policy", "Narrative war", "Explainer", "Business politics"]'::jsonb, 'Recognizable trigger word first, then a specific outcome, with the method withheld and paid off in the body. Adarsh''s own rule.', 'Hinglish, Roman script, casual-argumentative. Six beats: (1) open by stating the other side''s position in their own words, never his own claim; (2) contradict it flatly in one short line before 0:10; (3) prove it with something countable, preferring an absence; (4) repeat a line for emphasis; (5) turn their own past words back on them; (6) close on a sting - a question, a Hindi idiom, or naming who is harmed. Markers: pehle baat ye samjho, aap mujhe batao, mere bhai, guess karlo. Pre-emptive neutrality shield (main kisi political party ki baat nahi karunga). Speaks as hum, not main. Signature rhythm: long build-up then a one-word line - Nahi. Zero! Sannata. Reproduce that rhythm. NOTE: beats 1 and 5 appear in losing reels too - they are voice, not cause. What separates a winner is F-01 (a named living villain) and F-02 (a grievance that touches the viewer).', 'Never invent a they-said-the-opposite moment. If no real quote or record exists, say so and drop that beat rather than fabricating one.')
on conflict (id) do update set
  pillars = excluded.pillars,
  hook_formula = excluded.hook_formula,
  voice_notes = excluded.voice_notes,
  banned_claims = excluded.banned_claims,
  updated_at = now();

