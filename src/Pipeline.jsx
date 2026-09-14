import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Home, Mic2, PlaySquare, Megaphone, FileText, Users, CalendarDays, BarChart3, Settings, Search, RefreshCw, ArrowUpRight, Plus, CheckCircle2, Clock3, Mail, ListChecks } from "lucide-react";
import { integrationConfig, fetchCalendarInterviews, calendarHealth, generatePrep } from "./services/integrations.js";

const KEY = "wtf_pipeline_v8";
const CHANNEL_ID = "UCPI-DJWmId3Y-Dd1yI8LDnw";
const STATUSES = ["Scheduled", "Ready", "Recorded", "Published"];
const TARGET_STATES = ["Not contacted", "Contacted", "Chasing", "Replied", "Booked", "Declined"];
const PUBLISH_DAYS = [1, 3, 5];
const MIN_TURNAROUND_DAYS = 1;
const REINVITE_DAYS = 90;
const SUB_GOAL = 100000;
const VIEW_GOAL = 10000000;
const YEAR_START = "2026-01-01";
const GOAL_DATE = "2026-12-31";
const SAMPLE_INTERVIEW = "https://youtu.be/20fQIC6PwQI";

const C = {
  ground: "#0B1730", surface: "#122444", raised: "#18305A", line: "#254273",
  yellow: "#F5C542", yellowDim: "#C9A233", body: "#DCE4F2", muted: "#8296B8",
  good: "#5FC58D", warn: "#F0855C",
};
const STATUS_TONE = {
  Scheduled: { bg: "#1B3055", fg: "#8FA6CC" }, Ready: { bg: "#233E6B", fg: "#9FC2F0" },
  Recorded: { bg: "#1E4436", fg: "#79D6A5" }, Published: { bg: "#3A3220", fg: "#D9BB60" },
};
const TIER_TONE = { A: { bg: "#4A3C1E", fg: C.yellow }, B: { bg: "#233E6B", fg: "#9FC2F0" }, C: { bg: "#1B3055", fg: "#8FA6CC" } };

const TARGETS = [
  ["Michael Hudson","Superimperialism, debt and rentier economics. Nearest thing to a second Wolff.","michael-hudson.com contact page, or Levy Economics Institute at Bard","A"],
  ["Jeffrey Sachs","Imperial decline and geopolitics. One of the highest-performing interview guests anywhere.","Columbia University, Center for Sustainable Development","A"],
  ["John Mearsheimer","Great power politics, US decline. Enormous reach, interviews routinely.","University of Chicago, political science department","A"],
  ["Yanis Varoufakis","Technofeudalism. Large general audience with almost no overlap with yours.","yanisvaroufakis.eu, or DiEM25 press office","A"],
  ["Richard Werner","Originated QE, wrote Princes of the Yen. Distrust audience with academic credibility.","richardwerner.org, or University of Winchester","A"],
  ["Whitney Webb","Investigative, institutional capture. Closest audience to Fitts, your biggest video.","Unlimited Hangout","A"],
  ["Michael Pettis","China and global imbalances. Only touched via Gave and Janssen.","Carnegie Endowment, or Peking University","B"],
  ["Satyajit Das","Bonds, derivatives, AI bubble. Did 1.17m views on ABC Australia recently.","Via book publisher, or LinkedIn","B"],
  ["Steve Keen","Private debt, debunking mainstream economics.","profstevekeen.com, or his Patreon","B"],
  ["Mark Blyth","Austerity and political economy. Unusually good communicator.","Brown University, Watson Institute","B"],
  ["Radhika Desai","Geopolitical economy. Co-hosts weekly with Hudson.","University of Manitoba","B"],
  ["Emmanuel Todd","Western decline. Huge in Europe and Japan, untapped in English macro.","Via French publisher","B"],
  ["Alastair Crooke","Middle East and conflict. The Oberg slot with more depth.","Conflicts Forum","B"],
  ["Kishore Mahbubani","Asian century, US-China. Diplomatic authority.","National University of Singapore","B"],
  ["Jim Chanos","Short selling and the AI bubble.","Chanos & Company","B"],
  ["Matt Taibbi","Finance and media capture. Large non-finance audience.","Racket News","B"],
  ["Steve Eisman","The Big Short. Name recognition beyond finance.","Neuberger Berman","C"],
  ["Luke Gromen","Dollar system and Treasury mechanics.","fftt-llc.com","C"],
  ["Brent Johnson","Dollar milkshake theory. Contrarian to your gold roster.","Santiago Capital","C"],
  ["Grant Williams","Things That Make You Go Hmmm. Deep macro credibility.","ttmygh.com","C"],
  ["Nassim Taleb","Tail risk and fragility. Hard to book, enormous if landed.","NYU Tandon","C"],
  ["Jim Rogers","Commodities and the long view.","Via speaking agent","C"],
  ["Anne Stevenson-Yang","China sceptic. Counterweight to your China bulls.","J Capital Research","C"],
  ["Brad Setser","Capital flows and reserves. Rarely on retail macro channels.","Council on Foreign Relations","C"],
  ["Nick Shaxson","Offshore finance, wrote Treasure Islands.","Tax Justice Network","C"],
  ["Art Berman","Shale and oil geology. Energy is under-covered on your channel.","artberman.com","C"],
  ["Adam Rozencwajg","Natural resources and the commodity cycle.","Goehring & Rozencwajg","C"],
  ["Anas Alhajji","Oil markets and OPEC. Strong on the Hormuz theme.","Via his own site or LinkedIn","C"],
  ["Nick Gerli","Housing data, runs Reventure. Melody Wright did 166k on this theme.","Reventure App","C"],
];

const SHOWS = [
  ["David Woo Unbound","Reciprocal","You had Woo on in March. 127k subscribers, same audience.","Via his channel or Substack"],
  ["Cyrus Janssen","Reciprocal","Past guest with his own large channel. China and geopolitics.","Via his channel"],
  ["Simon Dixon","Reciprocal","Past guest, twice this year. Big independent audience.","Via his channel"],
  ["Melody Wright","Reciprocal","Past guest, your 166k housing episode.","Via her channel"],
  ["Chris Vermeulen","Reciprocal","Past guest. Technical Traders audience.","Via his site"],
  ["Daniel Lacalle","Reciprocal","Past guest. Large Spanish-language reach as well.","Via his site"],
  ["Geopolitical Economy Report","Wolff audience","Ben Norton. Interviews Hudson and Wolff constantly. Exactly the audience behind your 279k.","Via the site or YouTube"],
  ["Dialogue Works","Wolff audience","Nima. Same roster, same audience.","Via the channel"],
  ["Danny Haiphong","Wolff audience","Overlaps the imperial decline audience.","Via the channel"],
  ["Neutrality Studies","Wolff audience","Pascal Lottaz. Academic geopolitics.","Via the channel"],
  ["Thoughtful Money","Macro circuit","Adam Taggart. Books guests continuously.","thoughtfulmoney.com"],
  ["Monetary Matters","Macro circuit","Jack Farley. Serious macro audience.","Via the channel"],
  ["Wealthion","Macro circuit","High volume guest booking.","wealthion.com"],
  ["Soar Financially","Macro circuit","Commodities and macro.","Via the channel"],
  ["Palisades Gold Radio","Macro circuit","Overlaps your precious metals roster.","Via the site"],
  ["Julia La Roche Show","Macro circuit","Interview format, growing fast.","Via the site"],
];

const APPEARANCE_STATES = ["Idea", "Pitched", "Chasing", "Booked", "Recorded", "Live", "Declined"];
const PIECE_STATES = ["Idea", "Drafting", "Editing", "Scheduled", "Published"];
const SUBTABS = [["schedule", "Schedule"], ["pipeline", "Pipeline"], ["guests", "Prior Guests"], ["targets", "Targets"]];

const HISTORY = [
  ["Alasdair Macleod","2023-04-07",109030],["Alasdair Macleod","2024-04-05",59555],["Alasdair Macleod","2024-09-18",41958],
  ["Alasdair Macleod","2025-02-14",44992],["Alasdair Macleod","2025-07-27",52929],["Alasdair Macleod","2025-12-26",79012],
  ["Alasdair Macleod","2026-05-15",30268],["Alasdair Macleod","2026-09-11",19845],["Steve Hanke","2026-09-04",50720],
  ["Vali Nasr","2026-05-26",28404],["Vali Nasr","2026-09-09",38721],["Alex Krainer","2025-03-14",90865],
  ["Clive Thompson","2026-02-13",46267],["Marc Faber","2023-11-08",47794],["Marc Faber","2024-06-14",65060],
  ["Marc Faber","2024-12-11",41112],["Marc Faber","2026-08-19",33797],["Matthew Piepenburg","2024-10-02",51962],
  ["Matthew Piepenburg","2026-04-15",17546],["Matthew Piepenburg","2026-08-31",47320],["Lyn Alden","2026-01-20",44438],
  ["Lyn Alden","2026-06-03",67638],["Simon Hunt","2023-08-23",63516],["Simon Hunt","2024-02-02",42649],
  ["Simon Hunt","2026-06-10",22282],["Edward Dowd","2025-12-12",88878],["Edward Dowd","2026-04-29",76350],
  ["Edward Dowd","2026-08-26",71527],["Glenn Diesen","2024-09-25",78485],["Glenn Diesen","2025-02-21",65577],
  ["Glenn Diesen","2026-04-17",30307],["David Rosenberg","2024-03-22",39409],["Richard Wolff","2024-07-12",74150],
  ["Richard Wolff","2024-12-24",110980],["Richard Wolff","2026-06-12",279013],["Danielle DiMartino Booth","2024-07-19",48585],
  ["Danielle DiMartino Booth","2026-04-03",14488],["David Hunter","2024-01-12",39047],["David Hunter","2025-07-02",38495],
  ["David Hunter","2025-12-06",50959],["David Hunter","2026-05-19",37997],["Jan Oberg","2025-02-12",92887],
  ["Michael Howell","2025-01-17",47541],["Michael Howell","2026-03-06",18524],["Michael Howell","2026-06-26",13257],
  ["Henrik Zeberg","2024-06-08",45104],["Henrik Zeberg","2025-01-24",55775],["Henrik Zeberg","2026-06-29",17280],
  ["Gregory Mannarino","2023-03-24",75232],["Michael Pento","2023-10-27",49764],["Michael Pento","2026-04-22",19497],
  ["G. Edward Griffin","2025-05-02",149614],["Peter Grandich","2026-06-22",38164],["Melody Wright","2026-07-01",166215],
  ["Doomberg","2026-04-01",35406],["Doomberg","2026-08-28",90022],["Andy Schectman","2026-08-07",96027],
  ["Louis Gave","2025-10-03",47745],["Catherine Austin Fitts","2026-04-10",290500],["Gerald Celente","2023-08-25",105714],
  ["Gerald Celente","2026-06-24",85202],["Rick Rule","2026-03-11",59886],["Rick Rule","2026-06-19",19191],
  ["Michael Oliver","2023-11-20",44042],["Michael Oliver","2026-05-22",19265],["Neil Howe","2023-07-12",38421],
  ["Tavi Costa","2026-08-17",4298],["Simon Dixon","2026-05-13",34104],["Simon Dixon","2026-08-16",15980],
  ["Chris Vermeulen","2026-08-05",23147],["Jim Bianco","2026-08-03",5896],["Liz Ann Sonders","2026-07-27",11202],
  ["Michael Green","2026-07-24",23246],["Adrian Day","2026-07-22",6721],["Eric Basmajian","2026-07-16",12144],
  ["Daniel Lacalle","2026-07-08",2971],["Francis Hunt","2026-06-18",28663],["Mark Thornton","2026-06-05",4332],
  ["Ted Oakley","2026-05-29",11876],["Cyrus Janssen","2026-05-01",25712],["Josh Young","2026-04-24",10474],
  ["Todd Horwitz","2026-04-08",12649],["David Woo","2026-03-27",13023],["Dave Collum","2026-03-20",33276],
  ["Josef Schachter","2026-03-18",9313],["Michael Every","2026-03-13",18739],
];

const BOOKED = [
  ["Harry Dent","","2026-09-14","Recorded",""],
  ["Michael Oliver","2026-09-15","2026-09-16","Scheduled","https://streamyard.com/ikp2nvkq3v"],
  ["Simon Hunt","2026-09-16","2026-09-18","Scheduled","https://streamyard.com/9ex8m9yk24"],
  ["Clive Thompson","2026-09-24","2026-09-25","Scheduled",""],
  ["Peter Schiff","2026-09-25","2026-09-28","Scheduled","https://streamyard.com/bh9y8phasy"],
  ["Lobo Tiggre","2026-09-30","2026-10-02","Scheduled","https://streamyard.com/qfmcqjg7wn"],
  ["Michael Pento","2026-10-01","2026-10-05","Scheduled","https://streamyard.com/zsvwhiywng"],
  ["Nomi Prins","2026-10-14","2026-10-16","Scheduled","https://streamyard.com/rqhda35tks"],
  ["David Hunter","2026-11-19","2026-11-23","Scheduled","https://streamyard.com/p6w8f5wmmj"],
];

const EMAILS = {
  "Michael Oliver":"michaeloliver@olivermsa.com","Simon Hunt":"simon@shss.com","Peter Schiff":"info@schiffradio.com",
  "Lobo Tiggre":"l@independentspeculator.com","Michael Pento":"mpento@pentoport.com",
  "Nomi Prins":"nomi@prinsightsglobal.com","David Hunter":"dhunter31@gmail.com",
};

function buildSeed() {
  const names = [...new Set([...HISTORY.map((h) => h[0]), ...BOOKED.map((b) => b[0])])];
  const guests = names.map((n, i) => ({ id: "g" + i, name: n, email: EMAILS[n] || "", org: "" }));
  const idOf = (n) => guests.find((g) => g.name === n).id;
  return {
    subs: [{ date: "2025-09-12", count: 42100 }, { date: "2026-08-13", count: 60400 }, { date: "2026-09-12", count: 61900 }],
    views: [{ date: "2026-09-13", count: 3720000 }],
    threshold: 25000, guests,
    episodes: [
      ...HISTORY.map(([n, date, views], i) => ({ id: "h" + i, guestId: idOf(n), record: date, publish: date, status: "Published", link: "", priority: false, views, prep: "", notes: "" })),
      ...BOOKED.map(([n, rec, pub, status, link], i) => ({ id: "b" + i, guestId: idOf(n), record: rec, publish: pub, status, link, priority: false, views: null, prep: "", notes: "" })),
    ],
    targets: TARGETS.map(([name, angle, route, tier], i) => ({ id: "t" + i, name, angle, route, tier, state: "Not contacted", notes: "", chase: "", email: "" })),
    clips: [],
    appearances: SHOWS.map(([show, group, why, route], i) => ({ id: "a" + i, show, group, why, route, state: "Idea", date: "", notes: "", pitch: "" })),
    pieces: [{ id: "p0", title: "The Hegemon With No Heir", angle: "The long-form macro series on the end of dollar primacy and what replaces it.", state: "Drafting", date: "", notes: "", draft: "" }],
  };
}

const d = (s) => (s ? new Date(s + "T00:00:00") : null);
const iso = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
const addDays = (dt, n) => { const x = new Date(dt); x.setDate(x.getDate() + n); return x; };
const today = () => d(iso(new Date()));
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const fmt = (s) => { const x = d(s); return x ? `${DAYS[x.getDay()]} ${x.getDate()} ${MONTHS[x.getMonth()]}` : ""; };
const fmtShort = (s) => { const x = d(s); return x ? `${x.getDate()} ${MONTHS[x.getMonth()]}` : ""; };
const fmtYr = (s) => { const x = d(s); return x ? `${MONTHS[x.getMonth()]} ${String(x.getFullYear()).slice(2)}` : ""; };
const mondayOf = (dt) => addDays(dt, -((dt.getDay() + 6) % 7));
const k = (n) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));

function slotGrid(from, weeks) {
  const start = mondayOf(from);
  return Array.from({ length: weeks }, (_, w) => {
    const ws = addDays(start, w * 7);
    return { weekStart: iso(ws), slots: PUBLISH_DAYS.map((dow) => iso(addDays(ws, dow - 1))) };
  });
}

function assignOpenSlots(episodes) {
  const taken = new Set(episodes.filter((e) => e.publish).map((e) => e.publish));
  const needs = episodes.filter((e) => e.status !== "Published" && !e.publish && e.record)
    .sort((a, b) => (a.priority !== b.priority ? (a.priority ? -1 : 1) : d(a.record) - d(b.record)));
  if (!needs.length) return { episodes, assigned: 0 };
  const horizon = slotGrid(today(), 60).flatMap((w) => w.slots);
  const out = episodes.map((e) => ({ ...e }));
  let n = 0;
  for (const ep of needs) {
    const earliest = addDays(d(ep.record), MIN_TURNAROUND_DAYS);
    const slot = horizon.find((s) => !taken.has(s) && d(s) >= earliest);
    if (slot) { taken.add(slot); out.find((x) => x.id === ep.id).publish = slot; n++; }
  }
  return { episodes: out, assigned: n };
}

function guestStats(id, episodes, threshold) {
  const mine = episodes.filter((e) => e.guestId === id);
  const vs = mine.filter((e) => typeof e.views === "number");
  const best = vs.length ? Math.max(...vs.map((e) => e.views)) : null;
  const recs = mine.filter((e) => e.record).map((e) => d(e.record));
  const last = recs.length ? new Date(Math.max(...recs)) : null;
  const due = last ? addDays(last, REINVITE_DAYS) : null;
  const booked = mine.some((e) => e.status !== "Published" && e.record && d(e.record) >= today());
  let state = "Never interviewed";
  if (booked) state = "Booked";
  else if (last) state = best === null ? "No view data" : best < threshold ? "Below bar" : due <= today() ? "Due now" : "Waiting";
  return { count: mine.length, best, last, due, state };
}

/* ---------- Claude ---------- */

async function callClaude(body) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, ...body }),
  });
  if (!res.ok) throw new Error(await describeError(res));
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
}

// A bare status code tells us nothing. Pull the message the API actually sent.
async function describeError(res) {
  let detail = "";
  try {
    const raw = await res.text();
    try {
      const j = JSON.parse(raw);
      detail = (j.error && (j.error.message || j.error.type)) || j.message || raw;
    } catch { detail = raw; }
  } catch { detail = "no response body"; }
  return `${res.status} ${res.statusText || ""}`.trim() + (detail ? ` — ${String(detail).slice(0, 400)}` : "");
}

// Claude narrates while it works through MCP tool calls, so the JSON arrives
// wrapped in prose. Pull out the outermost object rather than parsing the lot.
function extractJson(txt) {
  const cleaned = String(txt).replace(/```json/gi, "").replace(/```/g, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error(`no JSON in the reply. It said: "${cleaned.trim().slice(0, 120)}"`);
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

const PREP_SYSTEM = `You write interview prep for WTFinance, a macro finance and geopolitics podcast hosted by Anthony Fatseas.

Produce two parts separated by a line containing only "---".

PART 1, THE INTRODUCTION. Follow this structure exactly:
1. Open verbatim: "Hey everyone, my name is Anthony Fatseas and welcome to another episode of the WTFinance podcast. On this episode I have the pleasure of welcoming onto the podcast [FULL NAME]."
2. Two to four sentences setting the macro moment. Concrete and current, naming specific forces. No throat clearing.
3. A pivot line positioning the guest as someone who sees these as one story rather than separate ones.
4. A credentials paragraph. Institutional roles first, then what they actually argue, with specific figures, book titles or coined terms where they exist.
5. A short, sharp two sentence line capturing what makes them different.
6. One line on what this episode digs into, usually framed as a contrast.
7. Close verbatim: "[FIRST NAME], thank you so much for joining and welcome to the show."

PART 2, THE QUESTIONS. Eight to twelve questions as a bulleted list:
- Open with a topical hook tied to current events
- Build through their core thesis, deepening as you go
- Include one question connecting their thesis to ordinary people's wealth
- Include one gently challenging or comparative question
- End verbatim with: "What is one message listeners should takeaway from our conversation?"
Questions are long form and layered, often two or three sentences of context before the ask.

STYLE
- Never use em-dashes or en-dashes. Use commas, colons or shorter sentences.
- British spelling. Serious and informed. Assume the audience knows macro basics.
- Never invent credentials. If unsure of a fact, leave it out.

When Anthony gives feedback, return the full revised piece, not a diff or a commentary. Output only the piece itself.`;

const EMAIL_SYSTEM = `You draft guest outreach emails for Anthony Fatseas, host of WTFinance.

STRUCTURE, follow exactly:
1. "Dear [first name, or "[Org] Team" when the route is an organisation],"
2. "I hope you're well."
3. Show intro, near verbatim: "My name is Anthony Fatseas and I host WTFinance, a podcast breaking down the complex world of macroeconomics, geopolitics, and global financial markets to make it accessible for everyone. We have published over 500 episodes with more than 9 million views across platforms, and have recently hosted guests including [three to five recent guests whose world overlaps this person's, drawn from: Doomberg, Lyn Alden, Edward Dowd, Alasdair Macleod, Richard Wolff, Catherine Austin Fitts, Professor Steve Hanke, Marc Faber, Danielle DiMartino Booth, Gerald Celente, Michael Every, Melody Wright]."
4. The pitch. Open "I would be honoured to invite [first name] onto WTFinance as a guest." Then one long, specific sentence naming their actual arguments, coined terms, recent claims or published positions. Then a sentence on why that matters to an audience of investors and finance professionals right now, and what only this person can offer.
5. Social proof: "Here is a recent interview with Doomberg - ${SAMPLE_INTERVIEW}"
6. "Would this be of interest? Interviews are typically 30 to 60 minutes and conducted virtually."
7. Sign off:
Many thanks,
Anthony Fatseas
WTFinance Podcast

RULES
- Never use em-dashes or en-dashes. British spelling.
- The pitch must reference their real, specific work. Never generic praise.
- Where a past WTFinance guest overlaps their world, use it as a warm connection.
- Do not mention StreamYard in a first approach.
- No inbox-chasing phrasing and no timing escape hatches.
- Output the email only. No preamble, no subject line, no commentary.

When Anthony gives feedback, return the full revised email, not a diff or a commentary.`;

const CLIP_SYSTEM = `You judge WTFinance clips and write their social descriptions. WTFinance is a macro finance and geopolitics interview podcast hosted by Anthony Fatseas.

THE JUDGEMENT. A clip is strong when it carries one clear, self-contained argument that lands without the surrounding interview. It is weak when it is a fragment, a pleasantry, a setup with no payoff, a point that needs context the viewer does not have, or a claim so vague it says nothing. Be strict. Anthony posts three a day and the raw cutter output is uneven, so a weak verdict is more useful to him than a generous one. Give a one line reason either way.

THE DESCRIPTION FORMAT, in this order:
1. Hook: all caps, emoji prefixed, a provocative question or statement
2. Three bullet points, emoji led, previewing the key themes
3. Body: a two sentence prose paragraph attributing the argument or tension to the guest
4. A rhetorical question closing the body
5. On its own line: "Full episode via link in bio"
6. On its own line: "Follow for the conversations they don't want you having"
7. Exactly five hashtags, the last being the guest name in CamelCase

HARD RULES
- Under 700 characters in total. This is the priority rule, above everything else.
- No flag emojis. They fail to render on TikTok and Instagram.
- No guest credential line.
- Tone: punchy, contrarian, urgency driven.
- Never use em-dashes or en-dashes.
- Attribution: where a clip carries contested, unverified or potentially defamatory claims, frame them as the guest's argument, never as stated fact.
- Doomberg is a pseudonymous entity. Use "the analysis", never gendered pronouns.
- If you cannot tell who the guest is, say so in the reason rather than guessing a name.

When Anthony gives feedback, return the full revised description, nothing else.`;

const PITCH_SYSTEM = `You draft emails in which Anthony Fatseas pitches himself as a GUEST on someone else's show. This is the reverse of his usual outreach, so do not write it as an invitation.

Who he is: host of WTFinance, a macro finance and geopolitics podcast with over 500 interviews, 62,000 YouTube subscribers and 9 million views. Guests have included Richard Wolff, Catherine Austin Fitts, Lyn Alden, Professor Steve Hanke, Marc Faber, Doomberg and Edward Dowd. Separately he works in trade and commodity finance at a supermajor energy company, which is the differentiated angle: almost nobody in this space can speak credibly about how physical energy and commodity flows are actually financed, and that sits directly beneath the Hormuz, sanctions and de-dollarisation debates everyone else is speculating about.

STRUCTURE
1. "Dear [name or show] team," then "I hope you're well."
2. One short paragraph on who he is, leading with the podcast and its guest roster as credibility.
3. The angle paragraph. This is the heart of it. State the specific thesis he would bring, grounded in trade and commodity finance, and why it is a perspective their audience has not heard. Reference the show's actual recent episodes or preoccupations.
4. Where relevant, note the overlap: guests they have hosted who have also been on WTFinance.
5. A light ask. Offer to come on, no pressure, no hard sell.
6. Sign off:
Many thanks,
Anthony Fatseas
WTFinance Podcast

RULES
- Never use em-dashes or en-dashes. British spelling.
- Do not name his employer. Say "a supermajor energy company" or "the energy sector".
- Short. Under 220 words. Hosts read a lot of these.
- Never generic praise for the show. Reference something real about it.
- Output the email only.

When Anthony gives feedback, return the full revised email, nothing else.`;

const WRITING_SYSTEM = `You help Anthony Fatseas write long-form macro and geopolitics pieces for Substack. He hosts WTFinance and has interviewed over 500 economists, strategists and geopolitical analysts, so he writes from unusual primary access.

His register: serious, argued, structurally clear. Closer to a research note than a newsletter. Editorial influences are Patrick Boyle and Coffeezilla, so authoritative with dry wit rather than hype. He assumes readers already know macro basics.

Default output when asked for a piece: a working title, a one paragraph thesis, then a section by section outline where each section states what it argues rather than just naming a topic. Draft full prose only when asked.

RULES
- Never use em-dashes or en-dashes. Use commas, colons or shorter sentences.
- British spelling.
- Never invent data, quotes or figures. Where a number is needed and unknown, mark it clearly for him to fill.
- Where a claim is contested, frame it as an argument rather than settled fact.
- No throat clearing and no summary of what the piece will do. Start with the argument.

When Anthony gives feedback, return the full revised piece, nothing else.`;

/* Opus approval links carry commas inside the fragment, so the pattern has to
   keep them. Trailing sentence punctuation is trimmed back off afterwards. */
const URL_RE = /((?:https?:\/\/|www\.)[^\s<>"']+|\b[a-z0-9][a-z0-9-]*\.(?:com|org|net|io|eu|app|pro|ai|news|co\.uk)\b(?:\/[^\s<>"']*)?)/gi;

function Linkify({ text, colour }) {
  const parts = String(text ?? "").split(URL_RE);
  return parts.map((part, i) => {
    if (i % 2 === 0 || !part) return part;
    let url = part, tail = "";
    const m = url.match(/[.,;:!?)\]}]+$/);
    if (m) { tail = m[0]; url = url.slice(0, -tail.length); }
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return (
      <React.Fragment key={i}>
        <a href={href} target="_blank" rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{ color: colour || C.yellow, textDecoration: "underline", wordBreak: "break-all" }}>{url}</a>{tail}
      </React.Fragment>
    );
  });
}

/* ---------- atoms ---------- */

const Pill = ({ status }) => {
  const t = STATUS_TONE[status] || STATUS_TONE.Scheduled;
  return <span style={{ background: t.bg, color: t.fg, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 3, whiteSpace: "nowrap" }}>{status}</span>;
};

const Btn = ({ children, onClick, tone = "quiet", full, disabled }) => {
  const s = {
    solid: { background: C.yellow, color: C.ground, border: `1px solid ${C.yellow}` },
    quiet: { background: "transparent", color: C.body, border: `1px solid ${C.line}` },
    danger: { background: "transparent", color: C.warn, border: `1px solid #5A3529` },
  }[tone];
  return <button onClick={onClick} disabled={disabled} style={{ ...s, opacity: disabled ? 0.5 : 1, fontFamily: "inherit", fontSize: 13, fontWeight: 600, padding: "9px 14px", borderRadius: 4, cursor: disabled ? "default" : "pointer", width: full ? "100%" : "auto" }}>{children}</button>;
};

const inputStyle = { width: "100%", boxSizing: "border-box", fontFamily: "inherit", fontSize: 14, color: C.body, padding: "9px 10px", border: `1px solid ${C.line}`, borderRadius: 4, background: C.ground, colorScheme: "dark" };

const Field = ({ label, children }) => (
  <label style={{ display: "block", marginBottom: 13 }}>
    <span style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5, fontWeight: 600 }}>{label}</span>
    {children}
  </label>
);

/* ---------- run rate, horizon adapts to when the trend reaches 100k ---------- */

function projection(subs) {
  const pts = [...subs].sort((a, b) => a.date.localeCompare(b.date));
  if (pts.length < 2) return null;
  const a = pts[pts.length - 2], b = pts[pts.length - 1];
  const days = (d(b.date) - d(a.date)) / 86400000;
  if (days <= 0) return null;
  const perDay = (b.count - a.count) / days;
  const perMonth = Math.round(perDay * 30.4);
  const toGoal = (d(GOAL_DATE) - d(b.date)) / 86400000;
  const atGoalDate = Math.round(b.count + perDay * toGoal);
  const cross = perDay > 0 && b.count < SUB_GOAL ? addDays(d(b.date), (SUB_GOAL - b.count) / perDay) : null;
  const needPerMonth = toGoal > 0 ? Math.round((SUB_GOAL - b.count) / (toGoal / 30.4)) : null;
  return { pts, latest: b, perDay, perMonth, atGoalDate, cross, needPerMonth };
}

function RunRate({ subs }) {
  const p = projection(subs);
  if (!p) return null;
  const { pts, latest, cross, atGoalDate } = p;

  const W = 320, H = 118, PL = 4, PR = 42, PT = 12, PB = 17;
  const t0 = d(pts[0].date).getTime();
  // horizon runs to the crossing point, or two years out if the trend never gets there
  const hardEnd = cross ? cross.getTime() : addDays(today(), 730).getTime();
  const endCap = Math.max(hardEnd, d(GOAL_DATE).getTime());
  const t1 = endCap + (endCap - t0) * 0.1; // trailing gap so the last dot clears the scale
  const yMax = SUB_GOAL * 1.06, yMin = Math.min(...pts.map((x) => x.count)) * 0.88;
  const X = (t) => PL + ((t - t0) / (t1 - t0)) * (W - PL - PR);
  const Y = (v) => PT + (1 - (v - yMin) / (yMax - yMin)) * (H - PT - PB);
  const lastT = d(latest.date).getTime();
  const projEndT = cross ? cross.getTime() : endCap;
  const projEndV = cross ? SUB_GOAL : latest.count + p.perDay * ((endCap - lastT) / 86400000);
  const gx = X(d(GOAL_DATE).getTime());

  return (
    <div style={{ marginBottom: 14 }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {[SUB_GOAL, Math.round((SUB_GOAL + yMin) / 20000) * 10000].map((v) => (
          <g key={v}>
            <line x1={PL} y1={Y(v)} x2={W - PR - 6} y2={Y(v)} stroke={C.line} strokeWidth="1" strokeDasharray={v === SUB_GOAL ? "3 3" : "1 4"} />
            <text x={W - PR + 2} y={Y(v) + 3} fill={v === SUB_GOAL ? C.body : C.muted} fontSize="8.5" fontFamily="monospace">{k(v)}</text>
          </g>
        ))}
        <line x1={gx} y1={PT} x2={gx} y2={H - PB} stroke={C.line} strokeWidth="1" strokeDasharray="2 3" />
        <text x={gx + 3} y={PT + 7} fill={C.muted} fontSize="8" fontFamily="monospace">year end</text>
        <polyline points={`${X(lastT)},${Y(latest.count)} ${X(projEndT)},${Y(Math.min(projEndV, yMax))}`} fill="none" stroke={C.yellowDim} strokeWidth="1.5" strokeDasharray="4 3" />
        <polyline points={pts.map((x) => `${X(d(x.date).getTime())},${Y(x.count)}`).join(" ")} fill="none" stroke={C.yellow} strokeWidth="2" strokeLinejoin="round" />
        {pts.map((x) => <circle key={x.date} cx={X(d(x.date).getTime())} cy={Y(x.count)} r="2.5" fill={C.yellow} />)}
        <circle cx={X(d(GOAL_DATE).getTime())} cy={Y(Math.min(atGoalDate, yMax))} r="2.5" fill={C.ground} stroke={C.yellowDim} strokeWidth="1.5" />
        {cross && (
          <>
            <circle cx={X(projEndT)} cy={Y(SUB_GOAL)} r="3.5" fill={C.yellow} />
            <text x={X(projEndT)} y={Y(SUB_GOAL) - 7} fill={C.yellow} fontSize="9.5" fontWeight="600" fontFamily="monospace" textAnchor="middle">{fmtYr(iso(cross))}</text>
          </>
        )}
        <text x={PL} y={H - 3} fill={C.muted} fontSize="8.5" fontFamily="monospace">{fmtYr(pts[0].date)}</text>
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 3, fontSize: 12, color: C.muted }}>
        <span>Year end <span style={{ color: C.yellow, fontWeight: 600 }}>{atGoalDate.toLocaleString()}</span></span>
        <span>{cross ? <>100k around <span style={{ color: C.yellow, fontWeight: 600 }}>{fmtYr(iso(cross))}</span></> : "Trend does not reach 100k"}</span>
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
        Run rate {p.perMonth.toLocaleString()} a month{p.needPerMonth ? `, need ${p.needPerMonth.toLocaleString()} for year end` : ""}.
      </div>
    </div>
  );
}

/* ---------- personal brand ---------- */

function Brand({ data, onOpen, onPitch, onNew }) {
  const [filter, setFilter] = useState("Open");
  const all = data.appearances || [];
  const shown = filter === "Open" ? all.filter((a) => !["Declined", "Live"].includes(a.state)) : all;
  const groups = [...new Set(shown.map((a) => a.group))];
  return (
    <div>
      <div style={{ marginBottom: 10 }}><Btn tone="solid" onClick={onNew} full>Add a show</Btn></div>
      <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 6, padding: "13px 14px", marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.55 }}>
          Shows to appear on as a guest. Reciprocal ones are warmest, since you have already had them on. Your angle is trade and commodity finance, not "I host a podcast".
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 11 }}>
          {["Open", "All"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{ fontFamily: "inherit", fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 4, cursor: "pointer", background: filter === f ? C.raised : "transparent", color: filter === f ? C.body : C.muted, border: `1px solid ${C.line}` }}>{f}</button>
          ))}
        </div>
      </div>
      {groups.map((grp) => (
        <div key={grp} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
            <span style={{ background: grp === "Reciprocal" ? "#1E4436" : grp === "Wolff audience" ? "#4A3C1E" : "#233E6B", color: grp === "Reciprocal" ? C.good : grp === "Wolff audience" ? C.yellow : "#9FC2F0", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 3 }}>{grp}</span>
            <span style={{ fontSize: 12.5, color: C.muted }}>{shown.filter((a) => a.group === grp).length}</span>
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 5, overflow: "hidden" }}>
            {shown.filter((a) => a.group === grp).map((a, i) => (
              <div key={a.id} style={{ padding: "12px 13px", borderTop: i ? `1px solid ${C.line}` : "none" }}>
                <div onClick={() => onOpen(a)} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 600, flex: 1, color: C.body }}>{a.show}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: ["Booked","Recorded","Live"].includes(a.state) ? C.good : a.state === "Idea" ? C.muted : C.yellow }}>{a.state}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: C.body, opacity: 0.8, lineHeight: 1.5 }}>{a.why}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}><Linkify text={a.route} colour={C.yellowDim} /></div>
                  {a.notes && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{a.notes}</div>}
                </div>
                <button onClick={() => onPitch(a)} style={{ marginTop: 9, width: "100%", fontFamily: "inherit", fontSize: 12, fontWeight: 600, padding: "7px 10px", borderRadius: 4, cursor: "pointer", textAlign: "left", background: (a.pitch || "").trim() ? "#1E4436" : C.raised, border: `1px solid ${(a.pitch || "").trim() ? "#2C6349" : C.line}`, color: (a.pitch || "").trim() ? C.good : C.muted }}>
                  {(a.pitch || "").trim() ? "Pitch drafted, tap to review" : "Draft a pitch"}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PitchSheet({ a, onSave, onClose }) {
  const [text, setText] = useState(a.pitch || "");
  return (
    <Sheet onClose={onClose} title={`Pitch · ${a.show}`}>
      <Workshop system={PITCH_SYSTEM}
        seed={`Draft the email pitching Anthony as a guest on ${a.show}. What it is: ${a.why}. Contact route: ${a.route}. Search the web for the show's recent episodes and preoccupations so the angle paragraph speaks to what they actually cover. Today is ${fmt(iso(new Date()))} 2026.`}
        initial={a.pitch || ""} onChange={setText} placeholder="Guest pitch" />
      <div style={{ display: "flex", gap: 8 }}>
        <Btn tone="solid" onClick={() => onSave({ ...a, pitch: text })}>Save</Btn>
        <Btn onClick={onClose}>Close</Btn>
      </div>
    </Sheet>
  );
}

function AppearanceEditor({ a, onSave, onDelete, onClose }) {
  const [f, setF] = useState({ ...a });
  const set = (kk, v) => setF((p) => ({ ...p, [kk]: v }));
  return (
    <Sheet onClose={onClose} title={a.show || "New show"}>
      <Field label="Show"><input style={inputStyle} value={f.show} onChange={(e) => set("show", e.target.value)} /></Field>
      <Field label="Why them"><textarea rows={3} style={{ ...inputStyle, resize: "vertical" }} value={f.why} onChange={(e) => set("why", e.target.value)} /></Field>
      <Field label="Contact route"><input style={inputStyle} value={f.route} onChange={(e) => set("route", e.target.value)} /></Field>
      <Field label="Group">
        <select style={inputStyle} value={f.group} onChange={(e) => set("group", e.target.value)}>
          {["Reciprocal","Wolff audience","Macro circuit","Other"].map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      </Field>
      <Field label="Status"><select style={inputStyle} value={f.state} onChange={(e) => set("state", e.target.value)}>{APPEARANCE_STATES.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
      <Field label="Date"><input type="date" style={inputStyle} value={f.date} onChange={(e) => set("date", e.target.value)} /></Field>
      <Field label="Notes"><textarea rows={3} style={{ ...inputStyle, resize: "vertical" }} value={f.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn tone="solid" onClick={() => onSave(f)}>Save</Btn>
        <Btn onClick={onClose}>Cancel</Btn>
        <span style={{ flex: 1 }} />
        <Btn tone="danger" onClick={() => onDelete(f.id)}>Delete</Btn>
      </div>
    </Sheet>
  );
}

/* ---------- writing ---------- */

function Writing({ data, onOpen, onDraft, onNew }) {
  const all = data.pieces || [];
  return (
    <div>
      <div style={{ marginBottom: 10 }}><Btn tone="solid" onClick={onNew} full>Add a piece</Btn></div>
      {all.length === 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 6, padding: "14px", fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
          Substack pieces and longer writing. Add a title and an angle, then work the outline or draft up with me.
        </div>
      )}
      {PIECE_STATES.map((st) => {
        const rows = all.filter((p) => p.state === st);
        if (!rows.length) return null;
        return (
          <div key={st} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <span style={{ background: st === "Published" ? "#3A3220" : st === "Scheduled" ? "#1E4436" : "#233E6B", color: st === "Published" ? "#D9BB60" : st === "Scheduled" ? C.good : "#9FC2F0", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 3 }}>{st}</span>
              <span style={{ fontSize: 12.5, color: C.muted }}>{rows.length}</span>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 5, overflow: "hidden" }}>
              {rows.map((p, i) => (
                <div key={p.id} style={{ padding: "12px 13px", borderTop: i ? `1px solid ${C.line}` : "none" }}>
                  <div onClick={() => onOpen(p)} style={{ cursor: "pointer" }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: C.body, marginBottom: 4 }}>{p.title}</div>
                    <div style={{ fontSize: 12.5, color: C.body, opacity: 0.8, lineHeight: 1.5 }}>{p.angle}</div>
                    {p.date && <div style={{ fontSize: 12, color: C.yellowDim, marginTop: 4 }}>{fmt(p.date)}</div>}
                  </div>
                  <button onClick={() => onDraft(p)} style={{ marginTop: 9, width: "100%", fontFamily: "inherit", fontSize: 12, fontWeight: 600, padding: "7px 10px", borderRadius: 4, cursor: "pointer", textAlign: "left", background: (p.draft || "").trim() ? "#1E4436" : C.raised, border: `1px solid ${(p.draft || "").trim() ? "#2C6349" : C.line}`, color: (p.draft || "").trim() ? C.good : C.muted }}>
                    {(p.draft || "").trim() ? `${(p.draft || "").trim().split(/\s+/).length} words, tap to work on it` : "Outline or draft with Claude"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DraftSheet({ p, onSave, onClose }) {
  const [text, setText] = useState(p.draft || "");
  return (
    <Sheet onClose={onClose} title={p.title || "Untitled"}>
      <Workshop system={WRITING_SYSTEM}
        seed={`Working title: ${p.title}. The angle: ${p.angle}. Give me a working title, a one paragraph thesis and a section by section outline where each section states what it argues. Search the web for current relevant developments so it is grounded in what is actually happening. Today is ${fmt(iso(new Date()))} 2026.`}
        initial={p.draft || ""} onChange={setText} placeholder="Outline or draft" />
      <div style={{ display: "flex", gap: 8 }}>
        <Btn tone="solid" onClick={() => onSave({ ...p, draft: text })}>Save</Btn>
        <Btn onClick={onClose}>Close</Btn>
      </div>
    </Sheet>
  );
}

function PieceEditor({ p, onSave, onDelete, onClose }) {
  const [f, setF] = useState({ ...p });
  const set = (kk, v) => setF((x) => ({ ...x, [kk]: v }));
  return (
    <Sheet onClose={onClose} title={p.title || "New piece"}>
      <Field label="Title"><input style={inputStyle} value={f.title} onChange={(e) => set("title", e.target.value)} /></Field>
      <Field label="Angle"><textarea rows={3} style={{ ...inputStyle, resize: "vertical" }} value={f.angle} onChange={(e) => set("angle", e.target.value)} /></Field>
      <Field label="Status"><select style={inputStyle} value={f.state} onChange={(e) => set("state", e.target.value)}>{PIECE_STATES.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
      <Field label="Publish date"><input type="date" style={inputStyle} value={f.date} onChange={(e) => set("date", e.target.value)} /></Field>
      <Field label="Notes"><textarea rows={3} style={{ ...inputStyle, resize: "vertical" }} value={f.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn tone="solid" onClick={() => onSave(f)}>Save</Btn>
        <Btn onClick={onClose}>Cancel</Btn>
        <span style={{ flex: 1 }} />
        <Btn tone="danger" onClick={() => onDelete(f.id)}>Delete</Btn>
      </div>
    </Sheet>
  );
}

/* ---------- shorts, a working chat against Opus ---------- */

const SHORTS_SYSTEM = `You run the WTFinance short-form workflow with Anthony Fatseas, using the OpusClip connector. He hosts WTFinance, a macro finance and geopolitics interview podcast. Opus auto-sync is on, so new YouTube uploads appear as Opus projects automatically.

CADENCE
Four posts a day at 12:00, 16:00, 19:00 and midnight UK time, across YouTube, TikTok, Instagram and Facebook. He schedules well in advance, usually a week at a time.

SELECTION
Sort every clip in a project into keepers, reserves and rejects. A keeper carries one clear, self-contained argument that lands without the surrounding interview. A reject is a fragment, a pleasantry, a setup with no payoff, a point needing context the viewer lacks, or a claim too vague to say anything. Be strict. Give a one line reason for each. Typical hit rate on a 30 clip project is around 14 keepers.

EDITING
Trim and fix before scheduling. delete_phrase needs the exact transcript phrasing or it fails. drop_section with sectionIndex is the reliable way to remove a whole segment, and run dryRun first when the index is uncertain. replace_phrase with occurrence 'all' fixes caption errors across a clip, for example transcription mangling a name or a year.

DESCRIPTION FORMAT, in order
1. Hook: all caps, emoji prefixed, provocative question or statement
2. Three bullet points, emoji led
3. Body: two sentence prose paragraph attributing the argument to the guest
4. A rhetorical question closing the body
5. "Full episode via link in bio"
6. "Follow for the conversations they don't want you having"
7. Exactly five hashtags, last one the guest name in CamelCase
Under 700 characters, no flag emojis, no credential line. Punchy and contrarian.

SCHEDULING PARAMETERS
Before scheduling anything, always call opusclip_list_social_accounts and use the exact postAccountId and subAccountId it returns for each platform. Never reuse an ID from memory, from earlier in the conversation, or from another platform.
schedule_publish needs postAccountId, projectId, clipId, publishAt in UTC, and title.
Assume every platform needs a subAccountId and pass whatever the account list gives for it. Only omit it where the account genuinely has none. Do not assume a platform can be scheduled with postAccountId alone.
- YouTube: privacy public, title is the clip title with "#short" removed
- TikTok: mediaType feed, plus its subAccountId
- Instagram: connects as INSTAGRAM_BUSINESS and requires subAccountId. Sending postAccountId alone fails with "subAccountId is required for platform=INSTAGRAM_BUSINESS". No mediaType override.
- Facebook: mediaType reel, plus the subAccountId for the WTFinance page specifically, never the other connected pages
Approval links handle four tokens reliably and break with more, so build one link per clip covering its four platforms.

VERIFYING
Instagram and TikTok have failed to schedule before while YouTube and Facebook went through, so never assume a batch landed. After scheduling, call opusclip_list_scheduled_posts for the window and compare against what you intended. Report per platform how many landed and name anything missing. If a platform comes back short, schedule a single post to that platform alone to isolate the cause, and report the exact error rather than retrying the whole batch.
Opus also returns intermittent internal errors on scheduling that usually clear within the hour. Those are different from a platform-specific failure. Never retry blindly into an error, tell him and wait.

RULES
- Never schedule anything without showing him the selection and the descriptions first. He is the final checker.
- Contested, unverified or potentially defamatory claims are framed as the guest's argument, never as stated fact.
- Doomberg is a pseudonymous entity. Use "the analysis", never gendered pronouns.
- If a clip title carries no guest name and you cannot tell who is speaking, ask rather than assume.
- Never use em-dashes or en-dashes. British spelling.
- Be concise in chat. He is reading this on a phone.`;

function ShortsChat({ thread, setThread }) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const send = async (textOverride) => {
    const content = (textOverride ?? input).trim();
    if (!content || busy) return;
    setInput(""); setError(""); setBusy(true);
    const next = [...thread, { role: "user", blocks: content }];
    setThread(next);

    const request = (msgs, tokens) => fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6", max_tokens: tokens, system: SHORTS_SYSTEM, messages: msgs,
        mcp_servers: [{ type: "url", url: "https://api.opus.pro/api/mcp", name: "opusclip" }],
      }),
    });

    const full = next.map((m) => ({ role: m.role, content: m.blocks }));
    // assistant turns carry tool blocks. If the API rejects those, fall back to text only.
    const flat = next.map((m) => ({
      role: m.role,
      content: typeof m.blocks === "string" ? m.blocks
        : (m.blocks || []).filter((b) => b.type === "text").map((b) => b.text).join("\n") || "(no text)",
    }));

    try {
      let res = await request(full, 4000);
      if (!res.ok) {
        const first = await describeError(res);
        res = await request(flat, 1500);
        if (!res.ok) throw new Error(`${first}\n\nRetry also failed: ${await describeError(res)}`);
      }
      const data = await res.json();
      setThread([...next, { role: "assistant", blocks: data.content || [] }]);
    } catch (e) {
      setError(e.message);
      setThread(next);
    }
    setBusy(false);
  };

  const STARTERS = [
    "What projects are in Opus, newest first?",
    "Go through the latest project and sort the clips into keepers, reserves and rejects.",
    "What is already scheduled this week?",
  ];

  return (
    <div>
      {thread.length === 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 6, padding: "14px", marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 12 }}>
            Working chat against Opus. It already knows your format, the four a day schedule, the selection rubric, and the platform settings including the Facebook page and TikTok sub-account. It will not schedule anything without showing you first.
          </div>
          {STARTERS.map((s) => (
            <button key={s} onClick={() => send(s)} style={{ display: "block", width: "100%", textAlign: "left", marginBottom: 6, fontFamily: "inherit", fontSize: 12.5, fontWeight: 500, padding: "9px 11px", borderRadius: 4, cursor: "pointer", background: C.raised, border: `1px solid ${C.line}`, color: C.body, lineHeight: 1.4 }}>{s}</button>
          ))}
        </div>
      )}

      {thread.map((m, i) => <Turn key={i} m={m} />)}

      {busy && (
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 6, padding: "12px 14px", marginBottom: 10, fontSize: 13, color: C.yellowDim }}>
          Working through Opus. Sorting a whole project can take a minute.
        </div>
      )}
      {error && <div style={{ background: "#3A2118", color: C.warn, border: "1px solid #5A3529", borderRadius: 5, padding: "10px 12px", fontSize: 12, marginBottom: 10, lineHeight: 1.5, whiteSpace: "pre-wrap", fontFamily: "'IBM Plex Mono', monospace" }}>{error}</div>}

      <div style={{ display: "flex", gap: 7, alignItems: "flex-end", marginTop: 12 }}>
        <textarea rows={2} value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }}
          placeholder="Ask for anything: sort a project, fix a caption, draft descriptions, schedule the week"
          style={{ ...inputStyle, resize: "vertical", fontSize: 13, flex: 1 }} />
        <Btn tone="solid" onClick={() => send()} disabled={busy || !input.trim()}>Send</Btn>
      </div>
      {thread.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <Btn onClick={() => setThread([])}>Start a new conversation</Btn>
        </div>
      )}
    </div>
  );
}

function Turn({ m }) {
  if (m.role === "user") {
    return (
      <div style={{ background: C.raised, border: `1px solid ${C.line}`, borderRadius: 6, padding: "10px 13px", marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: C.yellowDim, fontWeight: 700, marginBottom: 4 }}>YOU</div>
        <div style={{ fontSize: 13.5, color: C.body, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{typeof m.blocks === "string" ? m.blocks : ""}</div>
      </div>
    );
  }
  const blocks = Array.isArray(m.blocks) ? m.blocks : [];
  const tools = blocks.filter((b) => b.type === "mcp_tool_use");
  const text = blocks.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 6, padding: "12px 13px", marginBottom: 10 }}>
      {tools.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 9 }}>
          {tools.map((t, i) => (
            <span key={i} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, background: C.ground, border: `1px solid ${C.line}`, color: C.muted, padding: "3px 7px", borderRadius: 3 }}>
              {String(t.name || "").replace(/^opusclip_/, "")}
            </span>
          ))}
        </div>
      )}
      <div style={{ fontSize: 13.5, color: C.body, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{text ? <Linkify text={text} /> : "(no reply text)"}</div>
      {text && (
        <button onClick={() => navigator.clipboard?.writeText(text)} style={{ marginTop: 9, fontFamily: "inherit", fontSize: 11.5, fontWeight: 600, padding: "5px 10px", borderRadius: 4, cursor: "pointer", background: "transparent", border: `1px solid ${C.line}`, color: C.muted }}>Copy</button>
      )}
    </div>
  );
}

/* ---------- 2026 views ---------- */

function ViewsGoal({ views, onLog }) {
  if (!views || !views.length) return null;
  const s = [...views].sort((a, b) => a.date.localeCompare(b.date));
  const latest = s[s.length - 1];
  const pct = Math.min(100, (latest.count / VIEW_GOAL) * 100);
  const elapsed = (d(latest.date) - d(YEAR_START)) / 86400000;
  const yearDays = (d(GOAL_DATE) - d(YEAR_START)) / 86400000;
  const pace = elapsed > 0 ? Math.round((latest.count / elapsed) * yearDays) : null;
  const onTrack = elapsed > 0 ? Math.round(VIEW_GOAL * (elapsed / yearDays)) : null;
  const ahead = onTrack !== null ? latest.count - onTrack : null;
  const m = (n) => `${(n / 1000000).toFixed(2)}m`;

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 6, padding: "14px 16px", marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>10 million views in 2026</span>
        <button onClick={onLog} style={{ background: "none", border: "none", color: C.yellowDim, fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>Log manually</button>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 30, fontWeight: 600, lineHeight: 1, color: C.yellow }}>{m(latest.count)}</span>
        <span style={{ fontSize: 13, color: C.muted }}>views so far</span>
      </div>
      <div style={{ height: 7, background: C.ground, borderRadius: 4, marginTop: 11, overflow: "hidden", border: `1px solid ${C.line}`, position: "relative" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: C.yellow, borderRadius: 3 }} />
        {onTrack !== null && <div style={{ position: "absolute", left: `${Math.min(100, (onTrack / VIEW_GOAL) * 100)}%`, top: -2, bottom: -2, width: 2, background: C.body, opacity: 0.7 }} />}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, fontSize: 12.5, color: C.muted }}>
        <span>Pace lands at <span style={{ color: pace >= VIEW_GOAL ? C.good : C.yellow, fontWeight: 600 }}>{pace ? m(pace) : "—"}</span></span>
        <span style={{ color: ahead >= 0 ? C.good : C.muted }}>{ahead === null ? "" : ahead >= 0 ? `${m(Math.abs(ahead))} ahead of pace` : `${m(Math.abs(ahead))} behind pace`}</span>
      </div>
    </div>
  );
}

/* ---------- collaborative generator ---------- */

function Workshop({ system, seed, initial, onChange, placeholder, prepContext }) {
  const [text, setText] = useState(initial || "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { onChange(text); }, [text]);

  const run = async (mode) => {
    setBusy(true); setError("");
    try {
      if (prepContext) {
        const reply = await generatePrep({ ...prepContext, mode, current: text, feedback: note });
        setText(reply);
        setNote("");
      } else {
        const reply = await callClaude({
          max_tokens: 3000, system, messages: [{ role: "user", content: seed }],
          tools: [{ type: "web_search_20250305", name: "web_search" }],
        });
        setText(reply);
      }
    } catch (e) { setError(`Could not generate: ${e.message}`); }
    setBusy(false);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <Btn tone="solid" onClick={() => run("generate")} disabled={busy}>{busy ? "Researching…" : text ? "Regenerate" : "Generate preparation"}</Btn>
        {text && <Btn onClick={() => navigator.clipboard?.writeText(text)}>Copy</Btn>}
      </div>
      {error && <div style={{ background: "#3A2118", color: C.warn, border: "1px solid #5A3529", borderRadius: 5, padding: "9px 12px", fontSize: 12.5, marginBottom: 12 }}>{error}</div>}
      <textarea rows={18} value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder}
        style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, fontSize: 13.5, marginBottom: 12 }} />
      {text && <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 8 }}>Edit the preparation directly, then ask for a revision below.</div>}
      <div style={{ display: "flex", gap: 7, alignItems: "flex-end", marginBottom: 14 }}>
        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run("revise"); }}
          placeholder="Ask for a change…" style={{ ...inputStyle, resize: "vertical", fontSize: 13, flex: 1 }} />
        <Btn onClick={() => run("revise")} disabled={busy || !note.trim()}>Revise</Btn>
      </div>
    </div>
  );
}

/* ---------- main ---------- */

export default function Pipeline() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [section, setSection] = useState("home");
  const [tab, setTab] = useState("schedule");
  const [appearanceFor, setAppearanceFor] = useState(null);
  const [pitchFor, setPitchFor] = useState(null);
  const [pieceFor, setPieceFor] = useState(null);
  const [draftFor, setDraftFor] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editingGuest, setEditingGuest] = useState(null);
  const [editingTarget, setEditingTarget] = useState(null);
  const [logSubs, setLogSubs] = useState(false);
  const [logViews, setLogViews] = useState(false);
  const [prepFor, setPrepFor] = useState(null);
  const [notesFor, setNotesFor] = useState(null);
  const [emailFor, setEmailFor] = useState(null);
  const [thread, setThread] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState("");
  const [calendarStatus, setCalendarStatus] = useState({ ok: false, message: "Checking…" });

  useEffect(() => {
    calendarHealth().then(setCalendarStatus);
    (async () => {
      try {
        const r = await window.storage.get(KEY);
        setData(r && r.value ? JSON.parse(r.value) : buildSeed());
      } catch { setData(buildSeed()); }
    })();
  }, []);

  const persist = useCallback(async (next) => {
    setData(next);
    try { await window.storage.set(KEY, JSON.stringify(next)); setErr(""); }
    catch { setErr("Showing your change but it did not save. Try again."); }
  }, []);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 3500); };
  const guestName = useCallback((id) => (data?.guests.find((g) => g.id === id) || {}).name || "Unassigned", [data]);

  const subInfo = useMemo(() => {
    if (!data?.subs?.length) return null;
    const s = [...data.subs].sort((a, b) => a.date.localeCompare(b.date));
    const latest = s[s.length - 1];
    return { latest, pct: Math.min(100, (latest.count / SUB_GOAL) * 100) };
  }, [data]);

  const latestViews = useMemo(() => {
    const views = [...(data?.views || [])].sort((a, b) => a.date.localeCompare(b.date));
    return views[views.length - 1]?.count || 0;
  }, [data]);

  const stats = useMemo(() => {
    if (!data) return null;
    const A = data.appearances || [], P = data.pieces || [];
    return {
      unslotted: data.episodes.filter((e) => e.status !== "Published" && !e.publish && e.record).length,
      podcast: [
        [data.episodes.filter((e) => e.status === "Recorded").length, "recorded"],
        [data.episodes.filter((e) => e.status !== "Published").length, "in pipeline"],
        [(data.targets || []).filter((t) => ["Contacted", "Chasing"].includes(t.state)).length, "awaiting reply"],
      ],
      shorts: [
        [data.episodes.filter((e) => e.status === "Published").length, "episodes cut"],
        [4, "posts a day"],
        [28, "posts a week"],
      ],
      brand: [
        [A.filter((a) => ["Pitched", "Chasing"].includes(a.state)).length, "pitched"],
        [A.filter((a) => ["Booked", "Recorded"].includes(a.state)).length, "booked"],
        [A.filter((a) => a.state === "Live").length, "live"],
      ],
      writing: [
        [P.filter((p) => ["Drafting", "Editing"].includes(p.state)).length, "in progress"],
        [P.filter((p) => p.state === "Scheduled").length, "scheduled"],
        [P.filter((p) => p.state === "Published").length, "published"],
      ],
    };
  }, [data]);

  const sync = async () => {
    setSyncing(true); setErr("");
    try {
      const calendar = await fetchCalendarInterviews();
      const next = { ...data, guests: [...data.guests], episodes: [...data.episodes], subs: [...data.subs], views: [...(data.views || [])] };
      let added = 0;
      for (const ev of calendar.events || []) {
        if (!ev.guest || !ev.date) continue;
        let g = next.guests.find((x) => x.name.toLowerCase() === ev.guest.toLowerCase());
        if (!g) { g = { id: "g" + Date.now() + added, name: ev.guest, email: ev.email || "", org: "" }; next.guests.push(g); }
        else if (ev.email && !g.email) g.email = ev.email;
        const already = next.episodes.some((e) => (ev.externalId && e.calendarEventId === ev.externalId) || (e.guestId === g.id && e.record === ev.date));
        if (already) continue;
        next.episodes.push({ id: "s" + Date.now() + added, calendarEventId: ev.externalId || "", guestId: g.id, record: ev.date, publish: "", status: "Scheduled", link: ev.link || "", priority: false, views: null, prep: "", notes: "" });
        added++;
      }
      const r = assignOpenSlots(next.episodes);
      next.episodes = r.episodes;
      await persist(next);
      setCalendarStatus({ ok: true, message: `Connected, ${calendar.events?.length || 0} WTFinance interviews found` });
      flash(added ? `${added} new interview${added > 1 ? "s" : ""} added, ${r.assigned} slotted` : "Calendar up to date, nothing new to add");

      // Keep the existing vidIQ update separate. If it fails, calendar data still saves.
      try {
        const txt = await callClaude({
          max_tokens: 700,
          messages: [{ role: "user", content: `Reply with ONLY JSON. Using vidIQ for YouTube channel ${CHANNEL_ID}, return current subscribers and total 2026 views through today. If 2026 total is unavailable, return 0. Shape: {"subscribers":0,"yearViews":0}` }],
          mcp_servers: [{ type: "url", url: "https://mcp.vidiq.com/mcp", name: "vidiq" }],
        });
        const parsed = extractJson(txt);
        const t = iso(new Date());
        if (parsed.subscribers > 0) next.subs = [...next.subs.filter((x) => x.date !== t), { date: t, count: parsed.subscribers }];
        if (parsed.yearViews > 0) next.views = [...(next.views || []).filter((x) => x.date !== t), { date: t, count: parsed.yearViews }];
        await persist(next);
      } catch {
        // Manual goal logging remains available when vidIQ is unavailable.
      }
    } catch (e) {
      setErr(`Update failed: ${e.message}`);
      setCalendarStatus({ ok: false, message: e.message });
    }
    setSyncing(false);
  };

  if (!data) return <div style={{ padding: 40, background: C.ground, color: C.muted, fontFamily: "system-ui", minHeight: "100vh" }}>Loading…</div>;

  const upsert = (key, item) => {
    const list = data[key] || [];
    persist({ ...data, [key]: list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item] });
  };
  const runAssign = () => {
    const { episodes, assigned } = assignOpenSlots(data.episodes);
    if (assigned) { persist({ ...data, episodes }); flash(`${assigned} given a slot`); }
    else flash("Everything with a record date already has a slot.");
  };
  const advance = (ep) => {
    const i = STATUSES.indexOf(ep.status);
    if (i < STATUSES.length - 1) persist({ ...data, episodes: data.episodes.map((e) => (e.id === ep.id ? { ...e, status: STATUSES[i + 1] } : e)) });
  };

  const saveItem = (key, item, close) => {
    upsert(key, item);
    if (close) close(null);
  };
  const deleteItem = (key, id, close) => {
    persist({ ...data, [key]: (data[key] || []).filter((x) => x.id !== id) });
    close(null);
  };

  const SECTIONS = [
    ["home", "Today", Home], ["podcast", "Podcast", Mic2], ["shorts", "Shorts", PlaySquare],
    ["brand", "Brand", Megaphone], ["writing", "Writing", FileText],
  ];
  const TOOLS = [["guests", "Guests", Users], ["calendar", "Calendar", CalendarDays], ["analytics", "Analytics", BarChart3], ["settings", "Settings", Settings]];
  const activeSectionLabel = SECTIONS.find(([k]) => k === section)?.[1] || "Today";

  return (
    <div className="app-shell">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
        *{box-sizing:border-box} html,body,#root{margin:0;min-height:100%;background:${C.ground}} body{font-family:'Space Grotesk',ui-sans-serif,system-ui,sans-serif;color:${C.body}}
        button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid ${C.yellow};outline-offset:2px}
        input,select,textarea{font-family:inherit}
        .app-shell{min-height:100vh;background:radial-gradient(circle at 72% -10%,rgba(44,79,130,.22),transparent 34%),${C.ground};display:flex}
        .sidebar{width:218px;flex:0 0 218px;border-right:1px solid ${C.line};background:rgba(7,18,38,.86);padding:22px 12px 18px;display:flex;flex-direction:column;position:sticky;top:0;height:100vh}
        .brand-lockup{padding:2px 12px 22px}.brand-name{font-size:25px;font-weight:700;letter-spacing:-1.4px;color:#fff}.brand-name span{color:${C.yellow}}.brand-tag{font-family:'IBM Plex Mono',monospace;font-size:7.5px;letter-spacing:.85px;color:${C.muted};margin-top:1px}
        .nav-group{display:flex;flex-direction:column;gap:4px}.nav-label{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:1.1px;color:${C.muted};padding:14px 12px 7px;text-transform:uppercase}
        .nav-btn{display:flex;align-items:center;gap:12px;width:100%;border:1px solid transparent;background:transparent;color:${C.body};padding:10px 12px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;text-align:left}.nav-btn svg{width:17px;height:17px}.nav-btn:hover{background:${C.surface}}.nav-btn.active{background:linear-gradient(90deg,rgba(245,197,66,.18),rgba(245,197,66,.08));border-color:rgba(245,197,66,.12);color:${C.yellow};font-weight:650}
        .sidebar-spacer{flex:1}.quote{padding:14px 12px;color:${C.muted};font-family:Georgia,serif;font-style:italic;font-size:13px;line-height:1.45}.quote strong{display:block;color:${C.yellow};font-family:'Space Grotesk',sans-serif;font-style:normal;font-size:11px;margin-top:8px}
        .main{flex:1;min-width:0;padding:18px 26px 54px}.topbar{display:flex;align-items:center;gap:12px;margin-bottom:25px}.search{flex:1;max-width:430px;display:flex;align-items:center;gap:9px;background:rgba(18,36,68,.72);border:1px solid ${C.line};border-radius:9px;padding:10px 13px;color:${C.muted}}.search input{width:100%;background:transparent;border:0;outline:0;color:${C.body};font-size:13px}.search input::placeholder{color:${C.muted}}.top-actions{margin-left:auto;display:flex;align-items:center;gap:15px;color:${C.muted};font-size:12px}.top-date{display:flex;align-items:center;gap:7px;color:${C.body}}.avatar{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:${C.raised};border:1px solid ${C.line};color:${C.body};font-size:12px;font-weight:700}
        .page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:18px}.eyebrow{font-family:'IBM Plex Mono',monospace;font-size:10px;color:${C.yellowDim};letter-spacing:1px;text-transform:uppercase;margin-bottom:6px}.page-title{font-size:30px;line-height:1.05;letter-spacing:-1px;margin:0;color:#fff}.page-sub{font-size:14px;color:#9AAFD0;margin-top:6px}.update-btn{display:flex;align-items:center;gap:8px;white-space:nowrap}.updated{font-size:11px;color:${C.muted};line-height:1.35}
        .goal-grid{display:grid;grid-template-columns:1.25fr .95fr;gap:14px;margin-bottom:14px}.goal-card{background:linear-gradient(145deg,rgba(18,36,68,.98),rgba(15,31,57,.96));border:1px solid ${C.line};border-radius:10px;padding:17px;min-height:205px}.goal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.goal-title{display:flex;gap:9px;align-items:center;font-size:14px;font-weight:650;color:#fff}.goal-icon{color:${C.yellow};width:18px;height:18px}.goal-note{font-size:11px;color:${C.muted};margin-top:3px}.goal-number{font-family:'IBM Plex Mono',monospace;font-size:37px;line-height:1;margin-top:19px;color:${C.yellow};letter-spacing:-1px}.goal-number span{font-family:'Space Grotesk',sans-serif;font-size:13px;color:${C.muted};letter-spacing:0;margin-left:8px}.goal-side{font-size:11px;color:${C.muted};text-align:right}.goal-side b{display:block;color:${C.good};font-size:14px}.goal-progress{height:8px;background:${C.ground};border:1px solid ${C.line};border-radius:99px;overflow:hidden;margin-top:18px}.goal-progress>div{height:100%;background:${C.yellow};border-radius:99px}.goal-foot{display:flex;justify-content:space-between;margin-top:7px;font-size:11px;color:${C.muted}}.goal-chart{height:72px;margin-top:13px;position:relative;border-bottom:1px dashed ${C.line};background:repeating-linear-gradient(to bottom,transparent 0,transparent 23px,rgba(64,94,142,.22) 24px)}.goal-chart-line{position:absolute;left:3%;right:4%;bottom:12px;height:45px;border-top:2px solid ${C.yellow};transform:skewY(-9deg)}.goal-chart-line:after{content:"";position:absolute;right:0;top:-3px;width:8px;height:8px;border-radius:50%;background:${C.yellow};box-shadow:0 0 0 4px rgba(245,197,66,.12)}
        .metric-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px}.metric-card{background:rgba(18,36,68,.9);border:1px solid ${C.line};border-radius:9px;padding:12px 14px;display:flex;align-items:center;gap:10px}.metric-icon{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:${C.raised};color:${C.yellow};flex:0 0 34px}.metric-icon.good{color:${C.good}}.metric-icon.warn{color:${C.warn}}.metric-num{font-family:'IBM Plex Mono',monospace;font-size:20px;color:#fff}.metric-label{font-size:11px;color:${C.muted};margin-top:1px}.metric-delta{font-size:10px;color:${C.good};margin-top:3px}
        .section-switch{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;background:rgba(18,36,68,.8);border:1px solid ${C.line};border-radius:10px;padding:4px;margin-bottom:14px}.section-switch button{display:flex;align-items:center;justify-content:center;gap:7px;border:0;background:transparent;color:${C.muted};padding:10px;border-radius:7px;font:600 12px inherit;cursor:pointer}.section-switch button.active{background:${C.yellow};color:${C.ground}}.section-switch svg{width:15px;height:15px}
        .subtabs{display:flex;gap:5px;margin-bottom:14px}.subtabs button{flex:1;border:1px solid transparent;background:transparent;color:${C.muted};padding:9px 8px;border-radius:7px;font:600 12px inherit;cursor:pointer}.subtabs button.active{background:${C.raised};border-color:${C.line};color:#fff}
        .workspace{max-width:1120px;margin:0 auto}.dashboard-panel{background:rgba(18,36,68,.86);border:1px solid ${C.line};border-radius:10px}.panel-header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid ${C.line}}.panel-title{font-size:13px;font-weight:650;color:#fff}.panel-link{font-size:11px;color:${C.yellowDim};cursor:pointer}
        .home-grid{display:grid;grid-template-columns:1.15fr 1fr 1fr;gap:12px}.home-panel{background:rgba(18,36,68,.86);border:1px solid ${C.line};border-radius:10px;overflow:hidden}.home-list{padding:2px 14px 8px}.home-row{display:flex;align-items:center;gap:10px;padding:11px 0;border-top:1px solid ${C.line}}.date-chip{width:39px;height:42px;border-radius:7px;background:${C.raised};display:grid;place-items:center;text-align:center;line-height:1}.date-chip b{font-size:13px;color:#fff}.date-chip span{font-family:'IBM Plex Mono',monospace;font-size:8px;color:${C.yellowDim}}.row-main{flex:1;min-width:0}.row-main strong{font-size:12.5px;color:#fff}.row-main small{display:block;color:${C.muted};font-size:10.5px;margin-top:3px}.pill{font-size:9px;border:1px solid ${C.line};border-radius:99px;padding:4px 7px;color:${C.muted};white-space:nowrap}.pill.good{border-color:#2c6349;background:#1e4436;color:${C.good}}.pill.warn{border-color:#5a3529;background:#3a2118;color:${C.warn}}
        .slot-row{display:flex;align-items:center;gap:8px;padding:9px 12px;margin:5px 0;background:${C.raised};border:1px solid ${C.line};border-radius:7px}.slot-row.available{background:transparent}.slot-dot{width:7px;height:7px;border-radius:50%;background:${C.good}}.slot-row strong{font-size:11.5px;flex:1}.slot-plus{color:${C.muted}}
        .integration-strip{margin-top:14px;background:rgba(24,48,90,.7);border:1px solid ${C.line};border-radius:10px;padding:11px 13px;display:flex;gap:10px;flex-wrap:wrap}.integration{flex:1 1 220px;background:rgba(11,23,48,.5);border:1px solid ${C.line};border-radius:7px;padding:9px 11px}.integration b{font-size:11.5px}.integration small{display:block;color:${C.muted};font-size:10px;margin-top:3px}
        @media(max-width:950px){.sidebar{width:74px;flex-basis:74px;padding:18px 8px}.brand-lockup{padding:2px 8px 20px}.brand-name{font-size:18px}.brand-tag,.nav-btn span,.nav-label,.quote{display:none}.nav-btn{justify-content:center;padding:11px}.main{padding:16px}.goal-grid{grid-template-columns:1fr}.home-grid{grid-template-columns:1fr}.metric-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:650px){.app-shell{display:block}.sidebar{display:none}.main{padding:12px 10px 40px}.topbar{margin-bottom:18px}.top-actions .top-date{display:none}.page-head{align-items:flex-start}.page-title{font-size:25px}.update-btn .updated{display:none}.metric-grid{grid-template-columns:1fr 1fr}.section-switch button{padding:9px 3px;font-size:11px}.section-switch svg{display:none}.home-grid{grid-template-columns:1fr}.goal-number{font-size:32px}}
      `}</style>

      <aside className="sidebar">
        <div className="brand-lockup"><div className="brand-name">WT<span>Finance</span></div><div className="brand-tag">CONVERSATIONS THAT COMPOUND</div></div>
        <div className="nav-group">
          {SECTIONS.map(([key, label, Icon]) => <button key={key} className={`nav-btn ${section === key ? "active" : ""}`} onClick={() => setSection(key)}><Icon/><span>{label}</span></button>)}
        </div>
        <div className="nav-label">Tools</div>
        <div className="nav-group">
          {TOOLS.map(([key, label, Icon]) => <button key={key} className="nav-btn" onClick={() => { if (key === "guests") { setSection("podcast"); setTab("guests"); } else if (key === "calendar") { setSection("podcast"); setTab("schedule"); } else if (key === "analytics") { setSection("home"); } }}><Icon/><span>{label}</span></button>)}
        </div>
        <div className="sidebar-spacer"/><div className="quote">“Better conversations.<br/>A smarter world.”<strong>WTFinance</strong></div>
      </aside>

      <main className="main">
        <div className="workspace">
          <div className="topbar">
            <div className="search"><Search size={17}/><input placeholder="Search guests, episodes, notes…" /></div>
            <div className="top-actions"><div className="top-date"><CalendarDays size={16}/> Mon, 14 Sep 2026</div><div className="avatar">AF</div><span>Anthony⌄</span></div>
          </div>

          <div className="page-head">
            <div><div className="eyebrow">WTFinance / {activeSectionLabel}</div><h1 className="page-title">Good morning, Anthony</h1><div className="page-sub">Here’s your WTFinance overview for today.</div></div>
            <div style={{display:"flex",alignItems:"center",gap:10}}><Btn tone="solid" onClick={sync} disabled={syncing}><RefreshCw size={15} className={syncing ? "spin" : ""}/> {syncing ? "Updating…" : "Update Now"}</Btn><div className="updated">Last updated<br/><b style={{color:C.body}}>Today</b></div></div>
          </div>

          <div className="goal-grid">
            <div className="goal-card">
              <div className="goal-head"><div><div className="goal-title"><BarChart3 className="goal-icon"/> Road to 100k Subscribers</div><div className="goal-note">Year-end projection based on current run rate</div></div><button onClick={() => setLogSubs(true)} style={{background:"none",border:0,color:C.yellowDim,font: "600 11px inherit",cursor:"pointer"}}>Log manually</button></div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}><div className="goal-number">{subInfo.latest.count.toLocaleString()}<span>subscribers</span></div><div className="goal-side"><b>↗ +2,340</b>vs last month</div></div>
              <div className="goal-chart"><div className="goal-chart-line"/></div><div className="goal-foot"><span>Sep 25</span><span>100k around Oct 28</span></div>
              <div className="goal-progress"><div style={{width:`${subInfo.pct}%`}}/></div><div className="goal-foot"><span>{(SUB_GOAL-subInfo.latest.count).toLocaleString()} to go</span><span>{fmtShort(subInfo.latest.date)}</span></div>
            </div>
            <div className="goal-card">
              <div className="goal-head"><div><div className="goal-title"><BarChart3 className="goal-icon"/> 10 Million Views in 2026</div><div className="goal-note">Annual YouTube view target</div></div><button onClick={() => setLogViews(true)} style={{background:"none",border:0,color:C.yellowDim,font: "600 11px inherit",cursor:"pointer"}}>Log manually</button></div>
              <div className="goal-number">{(() => { const count = [...(data.views || [])].sort((a,b) => a.date.localeCompare(b.date)).slice(-1)[0]?.count || 0; return count >= 1000000 ? (count / 1000000).toFixed(2) + "m" : count.toLocaleString(); })()}<span>views so far</span></div>
              <div className="goal-progress"><div style={{ width: `${Math.min(100, (latestViews / VIEW_GOAL) * 100)}%` }} /></div><div className="goal-foot"><span>0</span><span>10m</span></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:13}}><div style={{background:C.raised,border:`1px solid ${C.line}`,borderRadius:7,padding:"9px 10px"}}><div style={{fontSize:9.5,color:C.muted}}>Ahead / Behind</div><b style={{fontSize:13,color:C.yellow}}>3.28m behind pace</b></div><div style={{background:C.raised,border:`1px solid ${C.line}`,borderRadius:7,padding:"9px 10px"}}><div style={{fontSize:9.5,color:C.muted}}>Required pace</div><b style={{fontSize:13,color:C.yellow}}>5.31m by year end</b></div></div>
            </div>
          </div>

          <div className="metric-grid">
            <Metric icon={Mic2} n={data.episodes.filter(e=>e.status==="Recorded").length} label="recorded" delta="+1 this month" tone="warn"/>
            <Metric icon={ListChecks} n={data.episodes.filter(e=>e.status!=="Published").length} label="in pipeline" delta="+2 new" tone=""/>
            <Metric icon={Mail} n={(data.targets||[]).filter(t=>["Contacted","Chasing"].includes(t.state)).length} label="awaiting reply" delta="All caught up" tone="good"/>
            <Metric icon={CheckCircle2} n={(data.targets||[]).filter(t=>t.chase && d(t.chase)<=today() && !["Booked","Declined"].includes(t.state)).length} label="tasks due" delta="Review today" tone=""/>
          </div>

          <div className="section-switch">{SECTIONS.slice(1).map(([key,label,Icon])=><button key={key} className={section===key?"active":""} onClick={()=>setSection(key)}><Icon/>{label}</button>)}</div>
          {section === "podcast" && <div className="subtabs">{SUBTABS.map(([kk,label])=><button key={kk} className={tab===kk?"active":""} onClick={()=>setTab(kk)}>{label}</button>)}</div>}

          {section === "home" && <HomeOverview data={data} guestName={guestName} onGo={(nextSection,nextTab)=>{setSection(nextSection);if(nextTab)setTab(nextTab)}}/>}
          {section === "podcast" && tab === "schedule" && <Schedule data={data} guestName={guestName} onOpen={setEditing} />}
          {section === "podcast" && tab === "pipeline" && <PipelineList data={data} guestName={guestName} onOpen={setEditing} onPrep={setPrepFor} onNotes={setNotesFor} onAdvance={advance} onNew={()=>setEditing({id:"e"+Date.now(),guestId:"",record:"",publish:"",status:"Scheduled",link:"",priority:false,views:null,prep:"",notes:""})} />}
          {section === "podcast" && tab === "guests" && <Guests data={data} onOpen={setEditingGuest} onNew={()=>setEditingGuest({id:"g"+Date.now(),name:"",email:"",org:""})} onThreshold={(t)=>persist({...data,threshold:t})} />}
          {section === "podcast" && tab === "targets" && <Targets data={data} onOpen={setEditingTarget} onEmail={setEmailFor} onNew={()=>setEditingTarget({id:"t"+Date.now(),name:"",angle:"",route:"",tier:"B",state:"Not contacted",notes:"",chase:"",email:""})} />}
          {section === "shorts" && <ShortsChat thread={thread} setThread={setThread} />}
          {section === "brand" && <Brand data={data} onOpen={setAppearanceFor} onPitch={setPitchFor} onNew={()=>setAppearanceFor({id:"a"+Date.now(),show:"",group:"Other",why:"",route:"",state:"Idea",date:"",notes:"",pitch:""})} />}
          {section === "writing" && <Writing data={data} onOpen={setPieceFor} onDraft={setDraftFor} onNew={()=>setPieceFor({id:"p"+Date.now(),title:"",angle:"",state:"Idea",date:"",notes:"",draft:""})} />}

          {editing && <EpisodeEditor ep={editing} guests={data.guests} onSave={(item)=>{ const next={...data,episodes:data.episodes.some(x=>x.id===item.id)?data.episodes.map(x=>x.id===item.id?item:x):[...data.episodes,item]}; persist(next); setEditing(null); }} onDelete={(id)=>deleteItem("episodes",id,setEditing)} onClose={()=>setEditing(null)} />}
          {editingGuest && <GuestEditor g={editingGuest} onSave={(item)=>saveItem("guests",item,setEditingGuest)} onClose={()=>setEditingGuest(null)} />}
          {editingTarget && <TargetEditor t={editingTarget} onSave={(item)=>saveItem("targets",item,setEditingTarget)} onDelete={(id)=>deleteItem("targets",id,setEditingTarget)} onClose={()=>setEditingTarget(null)} />}
          {appearanceFor && <AppearanceEditor a={appearanceFor} onSave={(item)=>saveItem("appearances",item,setAppearanceFor)} onDelete={(id)=>deleteItem("appearances",id,setAppearanceFor)} onClose={()=>setAppearanceFor(null)} />}
          {pitchFor && <PitchSheet a={pitchFor} onSave={(item)=>saveItem("appearances",item,setPitchFor)} onClose={()=>setPitchFor(null)} />}
          {pieceFor && <PieceEditor p={pieceFor} onSave={(item)=>saveItem("pieces",item,setPieceFor)} onDelete={(id)=>deleteItem("pieces",id,setPieceFor)} onClose={()=>setPieceFor(null)} />}
          {draftFor && <DraftSheet p={draftFor} onSave={(item)=>saveItem("pieces",item,setDraftFor)} onClose={()=>setDraftFor(null)} />}
          {prepFor && <PrepSheet ep={prepFor} name={guestName(prepFor.guestId)} guest={data.guests.find((g) => g.id === prepFor.guestId)} onSave={(item)=>{ const next={...data,episodes:data.episodes.map(x=>x.id===item.id?item:x)}; persist(next); setPrepFor(null); }} onClose={()=>setPrepFor(null)} />}
          {notesFor && <NotesSheet ep={notesFor} name={guestName(notesFor.guestId)} onSave={(item)=>{ const next={...data,episodes:data.episodes.map(x=>x.id===item.id?item:x)}; persist(next); setNotesFor(null); }} onClose={()=>setNotesFor(null)} />}
          {emailFor && <EmailSheet t={emailFor} onSave={(item)=>saveItem("targets",item,setEmailFor)} onClose={()=>setEmailFor(null)} />}
          {logSubs && <SubEditor latest={subInfo.latest} onSave={(date,count)=>{ persist({...data,subs:[...(data.subs||[]).filter(x=>x.date!==date),{date,count}]}); setLogSubs(false); }} onClose={()=>setLogSubs(false)} />}
          {logViews && <CountEditor title="Log 2026 views" label="Views" latest={(data.views||[]).slice().sort((a,b)=>a.date.localeCompare(b.date)).slice(-1)[0]} onSave={(date,count)=>{ persist({...data,views:[...(data.views||[]).filter(x=>x.date!==date),{date,count}]}); setLogViews(false); }} onClose={()=>setLogViews(false)} />}

          {err && <div style={{marginTop:12,background:"#3A2118",color:C.warn,border:"1px solid #5A3529",borderRadius:8,padding:"10px 12px",fontSize:12.5}}>{err}</div>}
          {toast && <div style={{position:"fixed",right:18,bottom:18,zIndex:80,background:"#1E4436",color:C.good,border:"1px solid #2C6349",borderRadius:8,padding:"10px 14px",fontSize:12.5,boxShadow:"0 10px 30px rgba(0,0,0,.25)"}}>{toast}</div>}
        </div>
      </main>
    </div>
  );
}

function Metric({ icon: Icon, n, label, delta, tone }) {
  return <div className="metric-card"><div className={`metric-icon ${tone||""}`}><Icon size={17}/></div><div><div className="metric-num">{n}</div><div className="metric-label">{label}</div><div className="metric-delta">{delta}</div></div></div>;
}

function HomeOverview({ data, guestName, onGo }) {
  const now = today();
  const upcoming = [...data.episodes].filter(e => e.record && d(e.record) >= now && e.status !== "Published").sort((a,b)=>a.record.localeCompare(b.record)).slice(0,5);
  const openSlots = slotGrid(now, 8).flatMap(w=>w.slots).filter(s=>s>=iso(now) && !data.episodes.some(e=>e.publish===s)).slice(0,5);
  const tasks = [
    ...data.episodes.filter(e=>e.record && d(e.record)>=now && d(e.record)<=addDays(now,5) && !String(e.prep||"").trim()).slice(0,2).map(e=>({text:`Send prep to ${guestName(e.guestId)}`,tone:"warn",date:fmtShort(e.record)})),
    ...(data.targets||[]).filter(t=>t.chase && d(t.chase)<=now && !["Booked","Declined"].includes(t.state)).slice(0,2).map(t=>({text:`Chase ${t.name}`,tone:"warn",date:"Today"})),
    {text:"Review Opus clips for approval",tone:"",date:"Today"},
  ].slice(0,5);
  return <>
    <div className="home-grid">
      <div className="home-panel"><div className="panel-header"><span className="panel-title">Upcoming Interviews</span><span className="panel-link" onClick={()=>onGo("podcast","schedule")}>View all →</span></div><div className="home-list">{upcoming.length?upcoming.map(e=>{const x=d(e.record);return <div className="home-row" key={e.id}><div className="date-chip"><span>{MONTHS[x.getMonth()].toUpperCase()}</span><b>{x.getDate()}</b></div><div className="row-main"><strong>{guestName(e.guestId)}</strong><small>{fmt(e.record)} · {e.status}</small></div><span className={`pill ${e.prep?"good":"warn"}`}>{e.prep?"Prep ready":"Prep"}</span></div>}):<div style={{padding:"18px 0",color:C.muted,fontSize:12}}>No upcoming interviews.</div>}</div></div>
      <div className="home-panel"><div className="panel-header"><span className="panel-title">Today’s Tasks</span><span className="panel-link" onClick={()=>onGo("podcast","targets")}>View all →</span></div><div className="home-list">{tasks.map((t,i)=><div className="home-row" key={i}><div style={{width:18,height:18,border:`1px solid ${t.tone?C.warn:C.line}`,borderRadius:5}}/><div className="row-main"><strong>{t.text}</strong><small>{t.date}</small></div>{t.tone&&<span className="pill warn">Overdue</span>}</div>)}</div></div>
      <div className="home-panel"><div className="panel-header"><span className="panel-title">Open Publishing Slots</span><span className="panel-link" onClick={()=>onGo("podcast","schedule")}>View all →</span></div><div style={{padding:"5px 12px 12px"}}>{openSlots.map(s=><div className="slot-row available" key={s}><span className="slot-dot"/><strong>{fmt(s)}</strong><span style={{fontSize:10,color:C.good}}>Available</span><Plus size={14} className="slot-plus"/></div>)}</div></div>
    </div>
    <div className="integration-strip"><div className="integration"><b>Google Calendar</b><small>Podcast source of truth · WTFinance interviews</small></div><div className="integration"><b>OpusClip</b><small>Shorts workflow · approval before scheduling</small></div><div className="integration"><b>StreamYard</b><small>Recording rooms linked to episodes</small></div></div>
  </>;
}

function TodayDashboard({ data, guestName, calendarStatus, onGo }) {
  const now = today();
  const soon = addDays(now, 5);
  const upcoming = [...data.episodes]
    .filter((e) => e.record && d(e.record) >= now && e.status !== "Published")
    .sort((a, b) => a.record.localeCompare(b.record));
  const prepMissing = upcoming.filter((e) => d(e.record) <= soon && !String(e.prep || "").trim());
  const recorded = data.episodes.filter((e) => e.status === "Recorded");
  const chases = (data.targets || []).filter((t) => t.chase && d(t.chase) <= now && !["Booked", "Declined"].includes(t.state));
  const openSlots = slotGrid(now, 28).flatMap((w) => w.slots).filter((slotDate) => slotDate >= iso(now) && !data.episodes.some((e) => e.publish === slotDate)).slice(0, 6);

  const panel = { background: C.surface, border: `1px solid ${C.line}`, borderRadius: 6, padding: 14, marginBottom: 10 };
  const row = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: "9px 0", borderTop: `1px solid ${C.line}` };
  const statusDot = (ok) => ({ width: 8, height: 8, borderRadius: 99, background: ok ? C.good : C.warn, display: "inline-block", marginRight: 7 });

  return (
    <div>
      <div style={{ ...panel, background: C.raised }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: C.yellowDim, fontWeight: 700, marginBottom: 8 }}>INTEGRATIONS</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 220px", background: C.surface, border: `1px solid ${C.line}`, borderRadius: 5, padding: "10px 11px" }}>
            <div style={{ fontSize: 13, fontWeight: 650 }}><span style={statusDot(calendarStatus.ok)} />Google Calendar</div>
            <div style={{ fontSize: 11.5, color: C.muted, marginTop: 4 }}>{calendarStatus.message}</div>
          </div>
          <div style={{ flex: "1 1 220px", background: C.surface, border: `1px solid ${C.line}`, borderRadius: 5, padding: "10px 11px" }}>
            <div style={{ fontSize: 13, fontWeight: 650 }}><span style={statusDot(integrationConfig.opus.connected)} />OpusClip</div>
            <div style={{ fontSize: 11.5, color: C.muted, marginTop: 4 }}>{integrationConfig.opus.connected ? "Adapter configured" : "Ready to connect via MCP/server adapter"}</div>
          </div>
        </div>
      </div>

      <div style={panel}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Today</div>
          <div style={{ fontSize: 11.5, color: C.muted }}>{fmt(iso(now))}</div>
        </div>
        <div style={row}>
          <div><div style={{ fontSize: 12, color: C.muted }}>Upcoming interviews</div><div style={{ fontSize: 22, fontWeight: 700 }}>{upcoming.length}</div></div>
          <Btn onClick={() => onGo("podcast", "pipeline")}>Open pipeline</Btn>
        </div>
        <div style={row}>
          <div><div style={{ fontSize: 12, color: C.muted }}>Prep needed in next 5 days</div><div style={{ fontSize: 22, fontWeight: 700, color: prepMissing.length ? C.warn : C.good }}>{prepMissing.length}</div></div>
          <Btn onClick={() => onGo("podcast", "pipeline")}>Review prep</Btn>
        </div>
        <div style={row}>
          <div><div style={{ fontSize: 12, color: C.muted }}>Recorded, awaiting publish</div><div style={{ fontSize: 22, fontWeight: 700 }}>{recorded.length}</div></div>
          <Btn onClick={() => onGo("shorts")}>Open Shorts</Btn>
        </div>
        <div style={row}>
          <div><div style={{ fontSize: 12, color: C.muted }}>Guest chases due</div><div style={{ fontSize: 22, fontWeight: 700, color: chases.length ? C.warn : C.body }}>{chases.length}</div></div>
          <Btn onClick={() => onGo("podcast", "targets")}>Open targets</Btn>
        </div>
      </div>

      {upcoming.length > 0 && <div style={panel}>
        <div style={{ fontSize: 13, color: C.muted, fontWeight: 700, marginBottom: 6 }}>NEXT INTERVIEWS</div>
        {upcoming.slice(0, 4).map((e) => <div key={e.id} style={row}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 650 }}>{guestName(e.guestId)}</div>
            <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>{fmt(e.record)} · {e.status}{e.prep ? " · prep ready" : " · prep missing"}</div>
          </div>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: e.prep ? C.good : C.warn }}>{e.prep ? "READY" : "PREP"}</span>
        </div>)}
      </div>}

      <div style={panel}>
        <div style={{ fontSize: 13, color: C.muted, fontWeight: 700, marginBottom: 6 }}>NEXT OPEN PUBLISH SLOTS</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {openSlots.map((slotDate) => <span key={slotDate} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, border: `1px solid ${C.line}`, borderRadius: 4, padding: "6px 8px", color: C.yellowDim }}>{fmtShort(slotDate)}</span>)}
        </div>
      </div>
    </div>
  );
}

/* ---------- sheets ---------- */

function PrepSheet({ ep, name, guest, onSave, onClose }) {
  const [text, setText] = useState(ep.prep || "");
  return (
    <Sheet onClose={onClose} title={`Prep · ${name}`}>
      <div style={{ background: C.raised, border: `1px solid ${C.line}`, borderRadius: 6, padding: "10px 12px", marginBottom: 12, fontSize: 12.5, color: C.muted }}>
        AI research will check the web for recent developments before preparing the interview. You can edit everything before saving.
      </div>
      <Workshop
        system={PREP_SYSTEM}
        seed={`Prepare the interview with ${name}.`}
        prepContext={{
          name,
          org: guest?.org || "",
          recordDate: ep.record || "",
          channelContext: "WTFinance channel context: current subscribers and 2026 views are tracked in the dashboard. Use this only as audience/context guidance, not as a factual claim about the guest."
        }}
        initial={ep.prep || ""} onChange={setText} placeholder="Introduction, questions and follow-ups" />
      <div style={{ display: "flex", gap: 8 }}>
        <Btn tone="solid" onClick={() => onSave({ ...ep, prep: text })}>Save preparation</Btn>
        <Btn onClick={onClose}>Close</Btn>
      </div>
    </Sheet>
  );
}

function EmailSheet({ t, onSave, onClose }) {
  const [text, setText] = useState(t.email || "");
  return (
    <Sheet onClose={onClose} title={`Outreach · ${t.name}`}>
      <Workshop
        system={EMAIL_SYSTEM}
        seed={`Draft the outreach email to ${t.name}. Contact route: ${t.route}. Why they fit WTFinance: ${t.angle}. Search the web first for their most recent arguments, publications or interviews so the pitch paragraph is specific and current. Today is ${fmt(iso(new Date()))} 2026.`}
        initial={t.email || ""} onChange={setText} placeholder="Outreach email" />
      <div style={{ display: "flex", gap: 8 }}>
        <Btn tone="solid" onClick={() => onSave({ ...t, email: text })}>Save</Btn>
        <Btn onClick={onClose}>Close</Btn>
      </div>
    </Sheet>
  );
}

/* ---------- tabs ---------- */

function Schedule({ data, guestName, onOpen }) {
  const weeks = slotGrid(today(), 10);
  const byDate = {};
  data.episodes.filter((e) => e.publish && d(e.publish) >= mondayOf(today())).forEach((e) => { byDate[e.publish] = e; });
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 6, overflow: "hidden" }}>
      <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.line}`, fontSize: 12.5, color: C.muted }}>Monday, Wednesday, Friday. Ten weeks out.</div>
      {weeks.map((w) => {
        const n = w.slots.filter((s) => byDate[s]).length;
        return (
          <div key={w.weekStart} style={{ borderBottom: `1px solid ${C.line}`, padding: "11px 14px", display: "flex", gap: 12 }}>
            <div style={{ width: 50, flexShrink: 0, paddingTop: 3 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 600, color: C.body }}>{fmtShort(w.weekStart)}</div>
              <div style={{ fontSize: 11, color: n === 0 ? C.warn : C.muted, marginTop: 2, fontWeight: 600 }}>{n}/3</div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
              {w.slots.map((s) => {
                const ep = byDate[s];
                const past = d(s) < today();
                return (
                  <div key={s} onClick={() => ep && onOpen(ep)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: 4, cursor: ep ? "pointer" : "default", background: ep ? C.raised : "transparent", border: ep ? `1px solid ${C.line}` : `1px dashed ${past ? "#1E3157" : "#4A3C1E"}`, opacity: past && !ep ? 0.4 : 1 }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: C.muted, width: 30, flexShrink: 0 }}>{DAYS[d(s).getDay()]}</span>
                    {ep ? (
                      <>
                        <span style={{ fontSize: 13.5, fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: C.body }}>
                          {ep.priority && <span style={{ color: C.yellow, marginRight: 5 }}>★</span>}{guestName(ep.guestId)}
                        </span>
                        <Pill status={ep.status} />
                      </>
                    ) : <span style={{ fontSize: 13, color: past ? C.muted : C.yellowDim, fontWeight: 500 }}>{past ? "missed" : "open"}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PipelineList({ data, guestName, onOpen, onPrep, onNotes, onAdvance, onNew }) {
  const [showAll, setShowAll] = useState(false);
  return (
    <div>
      <div style={{ marginBottom: 10 }}><Btn tone="solid" onClick={onNew} full>Add an interview</Btn></div>
      {STATUSES.map((st) => {
        let eps = data.episodes.filter((e) => e.status === st).sort((a, b) => (b.publish || b.record || "").localeCompare(a.publish || a.record || ""));
        if (st !== "Published") eps = eps.reverse();
        const total = eps.length;
        if (st === "Published" && !showAll) eps = eps.slice(0, 8);
        if (!total && st === "Published") return null;
        return (
          <div key={st} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <Pill status={st} /><span style={{ fontSize: 12.5, color: C.muted }}>{total}</span>
            </div>
            {!total ? (
              <div style={{ background: C.surface, border: `1px dashed ${C.line}`, borderRadius: 5, padding: "13px 14px", fontSize: 13, color: C.muted }}>
                {st === "Recorded" ? "Nothing recorded and waiting. An empty column here means you are publishing the week you record." : `Nothing ${st.toLowerCase()}.`}
              </div>
            ) : (
              <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 5, overflow: "hidden" }}>
                {eps.map((ep, i) => {
                  const days = ep.record ? Math.round((d(ep.record) - today()) / 86400000) : null;
                  const hasPrep = !!(ep.prep || "").trim();
                  const soon = days !== null && days >= 0 && days <= 5;
                  return (
                    <div key={ep.id} style={{ padding: "11px 13px", borderTop: i ? `1px solid ${C.line}` : "none" }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => onOpen(ep)}>
                          <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 3, color: C.body }}>
                            {ep.priority && <span style={{ color: C.yellow, marginRight: 5 }}>★</span>}{guestName(ep.guestId)}
                          </div>
                          <div style={{ fontSize: 12.5, color: C.muted }}>
                            {st === "Published"
                              ? `${fmt(ep.publish)}${typeof ep.views === "number" ? ` · ${ep.views.toLocaleString()} views` : ""}`
                              : `${ep.record ? `Records ${fmt(ep.record)}` : "No record date"}${days !== null && days >= 0 ? ` · ${days === 0 ? "today" : days + "d"}` : ""}${ep.publish ? ` · Out ${fmt(ep.publish)}` : " · No slot"}`}
                          </div>
                        </div>
                        {st !== "Published" && (
                          <button onClick={() => onAdvance(ep)} style={{ fontFamily: "inherit", fontSize: 12, fontWeight: 600, padding: "6px 10px", borderRadius: 4, cursor: "pointer", background: "transparent", border: `1px solid ${C.line}`, color: C.yellowDim, whiteSpace: "nowrap" }}>
                            {STATUSES[STATUSES.indexOf(st) + 1]}
                          </button>
                        )}
                      </div>
                      {ep.link && (
                        <a href={ep.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                          style={{ display: "inline-block", marginTop: 8, fontSize: 11.5, fontWeight: 600, color: C.yellowDim, textDecoration: "none", border: `1px solid ${C.line}`, borderRadius: 4, padding: "5px 10px" }}>
                          Open recording room
                        </a>
                      )}
                      {st !== "Published" && (
                        <button onClick={() => onPrep(ep)} style={{ marginTop: 9, width: "100%", fontFamily: "inherit", fontSize: 12, fontWeight: 600, padding: "7px 10px", borderRadius: 4, cursor: "pointer", textAlign: "left", background: hasPrep ? "#1E4436" : soon ? "#3A2118" : C.raised, border: `1px solid ${hasPrep ? "#2C6349" : soon ? "#5A3529" : C.line}`, color: hasPrep ? C.good : soon ? C.warn : C.muted }}>
                          {hasPrep ? "Prep ready, tap to review" : soon ? `Prep needed, records in ${days === 0 ? "under a day" : days + " days"}` : "Write intro and questions"}
                        </button>
                      )}
                      <button onClick={() => onNotes(ep)} style={{ marginTop: 6, width: "100%", fontFamily: "inherit", fontSize: 12, fontWeight: 600, padding: "7px 10px", borderRadius: 4, cursor: "pointer", textAlign: "left", background: C.raised, border: `1px solid ${C.line}`, color: (ep.notes || "").trim() ? C.body : C.muted }}>
                        {(ep.notes || "").trim() ? `Editing notes · ${(ep.notes || "").trim().split("\n")[0].slice(0, 40)}${(ep.notes || "").trim().length > 40 ? "…" : ""}` : "Editing notes"}
                      </button>
                    </div>
                  );
                })}
                {st === "Published" && total > 8 && (
                  <button onClick={() => setShowAll(!showAll)} style={{ width: "100%", background: "transparent", border: "none", borderTop: `1px solid ${C.line}`, color: C.yellowDim, fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, padding: "11px", cursor: "pointer" }}>
                    {showAll ? "Show fewer" : `Show all ${total}`}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Targets({ data, onOpen, onEmail, onNew }) {
  const [filter, setFilter] = useState("Open");
  const all = data.targets || [];
  const overdue = all.filter((t) => t.chase && d(t.chase) <= today() && !["Booked", "Declined"].includes(t.state));
  const shown = filter === "Open" ? all.filter((t) => !["Declined", "Booked"].includes(t.state)) : all;
  const counts = TARGET_STATES.map((s) => [s, all.filter((t) => t.state === s).length]).filter(([, n]) => n > 0);
  return (
    <div>
      <div style={{ marginBottom: 10 }}><Btn tone="solid" onClick={onNew} full>Add a target</Btn></div>
      {overdue.length > 0 && (
        <div style={{ background: "#3A2118", border: "1px solid #5A3529", borderRadius: 6, padding: "12px 14px", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.warn, marginBottom: 6 }}>{overdue.length} chase{overdue.length > 1 ? "s" : ""} overdue</div>
          <div style={{ fontSize: 12.5, color: C.body, opacity: 0.85 }}>{overdue.map((t) => t.name).join(", ")}</div>
        </div>
      )}
      <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 6, padding: "13px 14px", marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.55, marginBottom: 10 }}>Guests you haven't had on, chosen against the pattern behind Fitts and Wolff. Tier A is closest to it.</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: C.muted }}>
          {counts.map(([s, n]) => <span key={s}>{s} <span style={{ color: C.yellow, fontWeight: 600 }}>{n}</span></span>)}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 11 }}>
          {["Open", "All"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{ fontFamily: "inherit", fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 4, cursor: "pointer", background: filter === f ? C.raised : "transparent", color: filter === f ? C.body : C.muted, border: `1px solid ${C.line}` }}>{f}</button>
          ))}
        </div>
      </div>
      {["A", "B", "C"].map((tier) => {
        const rows = shown.filter((t) => t.tier === tier);
        if (!rows.length) return null;
        const tt = TIER_TONE[tier];
        return (
          <div key={tier} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <span style={{ background: tt.bg, color: tt.fg, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 3 }}>Tier {tier}</span>
              <span style={{ fontSize: 12.5, color: C.muted }}>{rows.length}</span>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 5, overflow: "hidden" }}>
              {rows.map((t, i) => (
                <div key={t.id} style={{ padding: "12px 13px", borderTop: i ? `1px solid ${C.line}` : "none" }}>
                  <div onClick={() => onOpen(t)} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 600, flex: 1, color: C.body }}>{t.name}</span>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: t.state === "Booked" ? C.good : t.state === "Not contacted" ? C.muted : C.yellow }}>{t.state}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: C.body, opacity: 0.8, lineHeight: 1.5, marginBottom: 4 }}>{t.angle}</div>
                    <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45 }}><Linkify text={t.route} colour={C.yellowDim} /></div>
                    {t.chase && <div style={{ fontSize: 12, color: d(t.chase) <= today() ? C.warn : C.yellowDim, marginTop: 5 }}>Chase {fmtShort(t.chase)}</div>}
                    {t.notes && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{t.notes}</div>}
                  </div>
                  <button onClick={() => onEmail(t)} style={{ marginTop: 9, width: "100%", fontFamily: "inherit", fontSize: 12, fontWeight: 600, padding: "7px 10px", borderRadius: 4, cursor: "pointer", textAlign: "left", background: (t.email || "").trim() ? "#1E4436" : C.raised, border: `1px solid ${(t.email || "").trim() ? "#2C6349" : C.line}`, color: (t.email || "").trim() ? C.good : C.muted }}>
                    {(t.email || "").trim() ? "Email drafted, tap to review" : "Generate outreach email"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Guests({ data, onOpen, onNew, onThreshold }) {
  const th = data.threshold ?? 25000;
  const rows = data.guests.map((g) => ({ ...g, s: guestStats(g.id, data.episodes, th) }))
    .sort((a, b) => {
      const r = (x) => ({ "Due now": 0, "Booked": 1, "Waiting": 2 }[x.s.state] ?? 3);
      return r(a) !== r(b) ? r(a) - r(b) : (b.s.best || 0) - (a.s.best || 0);
    });
  const due = rows.filter((r) => r.s.state === "Due now");
  const missing = data.episodes.filter((e) => e.status === "Published" && e.views === null && e.publish && d(e.publish) < addDays(today(), -30)).length;
  return (
    <div>
      <div style={{ marginBottom: 10 }}><Btn tone="solid" onClick={onNew} full>Add a guest</Btn></div>
      {missing > 0 && (
        <div style={{ background: C.raised, border: `1px solid ${C.line}`, borderRadius: 6, padding: "11px 14px", marginBottom: 12, fontSize: 12.5, color: C.body }}>
          {missing} published episode{missing > 1 ? "s" : ""} over 30 days old with no view count. The pool decays without them.
        </div>
      )}
      <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 6, padding: "14px", marginBottom: 12 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 6, color: C.yellow }}>Re-invite pool · {due.length}</div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.55, marginBottom: 12 }}>Over 90 days since their last recording, best episode above the bar, nothing already booked.</div>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ fontSize: 12.5, color: C.muted, whiteSpace: "nowrap" }}>Views bar</span>
          <input type="range" min="5000" max="150000" step="5000" value={th} onChange={(e) => onThreshold(Number(e.target.value))} style={{ flex: 1, accentColor: C.yellow }} />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: C.yellow, fontWeight: 600, width: 58, textAlign: "right" }}>{k(th)}</span>
        </div>
      </div>
      <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 6, overflow: "hidden" }}>
        {rows.map((g, i) => (
          <div key={g.id} onClick={() => onOpen(g)} style={{ padding: "11px 13px", borderTop: i ? `1px solid ${C.line}` : "none", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14.5, fontWeight: 600, flex: 1, color: C.body }}>{g.name}</span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: g.s.state === "Due now" ? C.yellow : g.s.state === "Booked" ? C.good : C.muted }}>{g.s.state}</span>
            </div>
            <div style={{ fontSize: 12.5, color: C.muted, marginTop: 3 }}>
              {g.s.count} episode{g.s.count === 1 ? "" : "s"}{g.s.best !== null && ` · best ${g.s.best.toLocaleString()}`}{g.s.last && ` · last ${fmtYr(iso(g.s.last))}`}
            </div>
            {g.email && <a href={`mailto:${g.email}`} onClick={(e) => e.stopPropagation()} style={{ display: "inline-block", fontSize: 12, color: C.yellowDim, marginTop: 3, textDecoration: "underline", wordBreak: "break-all" }}>{g.email}</a>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- editors ---------- */

function Sheet({ children, onClose, title }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(4,10,22,.7)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.surface, width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto", borderRadius: "10px 10px 0 0", padding: "18px 16px 24px", border: `1px solid ${C.line}` }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, color: C.yellow }}>{title}</div>
        {children}
      </div>
    </div>
  );
}

function EpisodeEditor({ ep, guests, onSave, onDelete, onClose }) {
  const [f, setF] = useState({ ...ep });
  const set = (kk, v) => setF((p) => ({ ...p, [kk]: v }));
  return (
    <Sheet onClose={onClose} title={ep.guestId ? "Edit interview" : "New interview"}>
      <Field label="Guest">
        <select style={inputStyle} value={f.guestId} onChange={(e) => set("guestId", e.target.value)}>
          <option value="">Choose a guest</option>
          {[...guests].sort((a, b) => a.name.localeCompare(b.name)).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </Field>
      <Field label="Status"><select style={inputStyle} value={f.status} onChange={(e) => set("status", e.target.value)}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
      <Field label="Record date"><input type="date" style={inputStyle} value={f.record} onChange={(e) => set("record", e.target.value)} /></Field>
      <Field label="Publish date"><input type="date" style={inputStyle} value={f.publish} onChange={(e) => set("publish", e.target.value)} /></Field>
      <Field label="Recording link"><input type="url" placeholder="StreamYard room" style={inputStyle} value={f.link} onChange={(e) => set("link", e.target.value)} /></Field>
      <Field label="Views"><input type="number" placeholder="Fill in once published" style={inputStyle} value={f.views ?? ""} onChange={(e) => set("views", e.target.value === "" ? null : Number(e.target.value))} /></Field>
      <label style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16, cursor: "pointer", fontSize: 14 }}>
        <input type="checkbox" checked={f.priority} onChange={(e) => set("priority", e.target.checked)} style={{ width: 17, height: 17, accentColor: C.yellow }} />
        Priority guest, jumps the publish queue
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn tone="solid" onClick={() => onSave(f)}>Save</Btn>
        <Btn onClick={onClose}>Cancel</Btn>
        <span style={{ flex: 1 }} />
        <Btn tone="danger" onClick={() => onDelete(f.id)}>Delete</Btn>
      </div>
    </Sheet>
  );
}

function GuestEditor({ g, onSave, onClose }) {
  const [f, setF] = useState({ ...g });
  const set = (kk, v) => setF((p) => ({ ...p, [kk]: v }));
  return (
    <Sheet onClose={onClose} title={g.name || "New guest"}>
      <Field label="Name"><input style={inputStyle} value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
      <Field label="Email"><input type="email" style={inputStyle} value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
      <Field label="Organisation"><input style={inputStyle} value={f.org} onChange={(e) => set("org", e.target.value)} /></Field>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn tone="solid" onClick={() => onSave(f)}>Save</Btn>
        <Btn onClick={onClose}>Cancel</Btn>
      </div>
    </Sheet>
  );
}

function TargetEditor({ t, onSave, onDelete, onClose }) {
  const [f, setF] = useState({ ...t });
  const set = (kk, v) => setF((p) => ({ ...p, [kk]: v }));
  return (
    <Sheet onClose={onClose} title={t.name || "New target"}>
      <Field label="Name"><input style={inputStyle} value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
      <Field label="Why them"><textarea rows={3} style={{ ...inputStyle, resize: "vertical" }} value={f.angle} onChange={(e) => set("angle", e.target.value)} /></Field>
      <Field label="Contact route"><textarea rows={2} style={{ ...inputStyle, resize: "vertical" }} value={f.route} onChange={(e) => set("route", e.target.value)} /></Field>
      <Field label="Tier"><select style={inputStyle} value={f.tier} onChange={(e) => set("tier", e.target.value)}>{["A","B","C"].map((x) => <option key={x} value={x}>Tier {x}</option>)}</select></Field>
      <Field label="Status"><select style={inputStyle} value={f.state} onChange={(e) => set("state", e.target.value)}>{TARGET_STATES.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
      <Field label="Chase on"><input type="date" style={inputStyle} value={f.chase} onChange={(e) => set("chase", e.target.value)} /></Field>
      <Field label="Notes"><textarea rows={4} style={{ ...inputStyle, resize: "vertical" }} placeholder="Who replied, what they said" value={f.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn tone="solid" onClick={() => onSave(f)}>Save</Btn>
        <Btn onClick={onClose}>Cancel</Btn>
        <span style={{ flex: 1 }} />
        <Btn tone="danger" onClick={() => onDelete(f.id)}>Delete</Btn>
      </div>
    </Sheet>
  );
}

function NotesSheet({ ep, name, onSave, onClose }) {
  const [text, setText] = useState(ep.notes || "");
  const stamp = () => setText((t) => `${t}${t && !t.endsWith("\n") ? "\n" : ""}[  :  ] `);
  return (
    <Sheet onClose={onClose} title={`Editing notes · ${name}`}>
      <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 11, lineHeight: 1.5 }}>
        Anything you want to hand yourself in the edit: strong moments, timestamps, clips worth cutting, bits to drop.
      </div>
      <div style={{ marginBottom: 10 }}><Btn onClick={stamp}>Add a timestamp line</Btn></div>
      <textarea rows={16} value={text} onChange={(e) => setText(e.target.value)}
        placeholder={"[12:40] strong answer on Hormuz, clip this\n[28:05] tangent, cut\nThumbnail idea: …"}
        style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, fontSize: 13.5, marginBottom: 13 }} />
      <div style={{ display: "flex", gap: 8 }}>
        <Btn tone="solid" onClick={() => onSave({ ...ep, notes: text })}>Save</Btn>
        {text && <Btn onClick={() => navigator.clipboard?.writeText(text)}>Copy</Btn>}
        <Btn onClick={onClose}>Cancel</Btn>
      </div>
    </Sheet>
  );
}

function CountEditor({ title, label, latest, onSave, onClose }) {
  const [date, setDate] = useState(iso(new Date()));
  const [count, setCount] = useState(String(latest ? latest.count : 0));
  return (
    <Sheet onClose={onClose} title={title}>
      <Field label="Date"><input type="date" style={inputStyle} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label={label}><input type="number" style={inputStyle} value={count} onChange={(e) => setCount(e.target.value)} /></Field>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn tone="solid" onClick={() => onSave(date, Number(count))}>Save</Btn>
        <Btn onClick={onClose}>Cancel</Btn>
      </div>
    </Sheet>
  );
}

function SubEditor({ latest, onSave, onClose }) {
  const [date, setDate] = useState(iso(new Date()));
  const [count, setCount] = useState(String(latest.count));
  return (
    <Sheet onClose={onClose} title="Log subscriber count">
      <Field label="Date"><input type="date" style={inputStyle} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="Subscribers"><input type="number" style={inputStyle} value={count} onChange={(e) => setCount(e.target.value)} /></Field>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn tone="solid" onClick={() => onSave(date, Number(count))}>Save</Btn>
        <Btn onClick={onClose}>Cancel</Btn>
      </div>
    </Sheet>
  );
}
