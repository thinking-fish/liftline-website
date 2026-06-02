/* global React, QRCode */
const { useState, useEffect, useRef, useMemo } = React;

/* ────────────────────────────────────────────────────────────────
   LIFTLINE — kiosk screens for a wall-mounted lift display.
   Designed for iPad portrait (1080 × 1440 in this canvas; scales
   linearly to native iPad portrait resolutions).
   ──────────────────────────────────────────────────────────────── */

const BUILDING_NAME = "Avantgarde Place";
const BUILDING_AREA = "Bermondsey, London SE1";
const BUILDING_LOGO = "assets/avantgarde-logo.jpeg";

/* ─── Live clock hook ─────────────────────────────────────────── */
function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const fmtTime = d =>
  d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
const fmtDate = d =>
  d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

/* ─── Persistent chrome ───────────────────────────────────────── */
function Header() {
  const now = useClock();
  return (
    <header className="ll-header">
      <div className="ll-header__brand">
        <LiftLineMark />
        <div className="ll-header__wordmark">LiftLine</div>
        <div className="ll-header__sep" />
        <div className="ll-header__building">{BUILDING_NAME}</div>
      </div>
      <div className="ll-header__time">
        <div className="ll-header__clock">{fmtTime(now)}</div>
        <div className="ll-header__date">{fmtDate(now)}</div>
      </div>
    </header>
  );
}

/* Original mark inspired by the supplied LiftLine logo: ascending bars.
   Not a copy — built from scratch. */
function LiftLineMark() {
  return (
    <svg className="ll-mark" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="llg" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#1e63b8" />
          <stop offset="1" stopColor="#3ee0d6" />
        </linearGradient>
      </defs>
      <rect x="6"  y="34" width="11" height="24" rx="3" fill="url(#llg)" opacity=".55" />
      <rect x="20" y="22" width="11" height="36" rx="3" fill="url(#llg)" opacity=".8"  />
      <rect x="34" y="12" width="11" height="46" rx="3" fill="url(#llg)" />
      <rect x="48" y="4"  width="11" height="54" rx="3" fill="url(#llg)" opacity=".9"  />
    </svg>
  );
}

function Ticker({ items }) {
  // Duplicate for seamless loop
  const loop = [...items, ...items];
  return (
    <footer className="ll-ticker" aria-label="GB News headlines">
      <div className="ll-ticker__source">NEWS</div>
      <div className="ll-ticker__viewport">
        <div className="ll-ticker__track">
          {loop.map((text, i) => (
            <span className="ll-ticker__item" key={i}>
              <span className="ll-ticker__text">{text}</span>
              <span className="ll-ticker__dot" aria-hidden="true">•</span>
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}

const DEFAULT_TICKER = [
  "Chancellor signals tax review ahead of autumn Budget as growth forecast revised up",
  "Bank of England holds base rate at 4.25% after inflation eases to 2.1%",
  "Met Office issues yellow wind warning for south-east England this weekend",
  "NHS announces expansion of community pharmacy services across England",
  "England name squad for summer Test series against India at Lord's",
  "Energy regulator confirms price cap will fall again from July",
  "Heathrow reports record passenger numbers as half-term travel peaks",
];

/* ─── Screen wrapper ──────────────────────────────────────────── */
function Screen({ children, theme = "dark", label, name }) {
  return (
    <div
      className={`ll-screen ll-screen--${theme}`}
      data-screen-label={label}
    >
      <Header />
      <main className={`ll-body ll-body--${name}`}>{children}</main>
      <Ticker items={DEFAULT_TICKER} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   1. WEATHER
   ══════════════════════════════════════════════════════════════ */
const WEATHER = {
  now: { temp: 14, cond: "Partly cloudy", icon: "partcloud", hi: 16, lo: 9, feels: 12, rain: 20, wind: 11 },
  forecast: [
    { day: "Sat", hi: 17, lo: 10, icon: "sun" },
    { day: "Sun", hi: 15, lo: 11, icon: "partcloud" },
    { day: "Mon", hi: 13, lo:  9, icon: "rain" },
    { day: "Tue", hi: 12, lo:  8, icon: "rain" },
    { day: "Wed", hi: 14, lo:  9, icon: "partcloud" },
    { day: "Thu", hi: 16, lo: 10, icon: "sun" },
    { day: "Fri", hi: 17, lo: 11, icon: "sun" },
  ],
};

function WxIcon({ kind, size = 1 }) {
  const s = { transform: `scale(${size})`, transformOrigin: "center" };
  const stroke = "currentColor";
  if (kind === "sun")
    return (
      <svg viewBox="0 0 100 100" className="wx-icon" style={s}>
        <circle cx="50" cy="50" r="18" fill="#FFC857" />
        {[...Array(8)].map((_, i) => {
          const a = (i * Math.PI) / 4;
          const x1 = 50 + Math.cos(a) * 28, y1 = 50 + Math.sin(a) * 28;
          const x2 = 50 + Math.cos(a) * 40, y2 = 50 + Math.sin(a) * 40;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFC857" strokeWidth="5" strokeLinecap="round" />;
        })}
      </svg>
    );
  if (kind === "partcloud")
    return (
      <svg viewBox="0 0 100 100" className="wx-icon" style={s}>
        <circle cx="38" cy="38" r="14" fill="#FFC857" />
        <path d="M30 70 Q22 70 22 60 Q22 50 34 50 Q38 38 52 38 Q66 38 70 52 Q82 52 82 64 Q82 76 70 76 H32 Q30 76 30 70 Z" fill="#E6EEF7"/>
      </svg>
    );
  if (kind === "rain")
    return (
      <svg viewBox="0 0 100 100" className="wx-icon" style={s}>
        <path d="M22 50 Q22 36 38 36 Q42 24 56 24 Q74 24 76 42 Q88 42 88 54 Q88 64 76 64 H30 Q22 64 22 54 Z" fill="#B6C7DC"/>
        <line x1="34" y1="70" x2="30" y2="86" stroke="#5BB3E8" strokeWidth="4" strokeLinecap="round"/>
        <line x1="50" y1="70" x2="46" y2="86" stroke="#5BB3E8" strokeWidth="4" strokeLinecap="round"/>
        <line x1="66" y1="70" x2="62" y2="86" stroke="#5BB3E8" strokeWidth="4" strokeLinecap="round"/>
      </svg>
    );
  return null;
}

function WeatherScreen() {
  return (
    <Screen name="weather" label="01 Weather">
      <div className="wx-now">
        <div className="wx-now__left">
          <div className="wx-now__location">London · Bermondsey</div>
          <div className="wx-now__temp">
            <span className="wx-now__num">{WEATHER.now.temp}</span>
            <span className="wx-now__deg">°C</span>
          </div>
          <div className="wx-now__cond">{WEATHER.now.cond}</div>
          <div className="wx-now__meta">
            <span><b>{WEATHER.now.hi}°</b> high</span>
            <span className="wx-now__dot">·</span>
            <span><b>{WEATHER.now.lo}°</b> low</span>
            <span className="wx-now__dot">·</span>
            <span>Feels {WEATHER.now.feels}°</span>
          </div>
        </div>
        <div className="wx-now__icon">
          <WxIcon kind={WEATHER.now.icon} size={1} />
        </div>
      </div>

      <div className="wx-strip">
        <div className="wx-strip__cell">
          <div className="wx-strip__lbl">Rain</div>
          <div className="wx-strip__val">{WEATHER.now.rain}<span>%</span></div>
        </div>
        <div className="wx-strip__cell">
          <div className="wx-strip__lbl">Wind</div>
          <div className="wx-strip__val">{WEATHER.now.wind}<span> mph</span></div>
        </div>
        <div className="wx-strip__cell">
          <div className="wx-strip__lbl">UV</div>
          <div className="wx-strip__val">3<span> mod</span></div>
        </div>
        <div className="wx-strip__cell">
          <div className="wx-strip__lbl">Sunset</div>
          <div className="wx-strip__val">20:14</div>
        </div>
      </div>

      <div className="wx-forecast">
        <div className="wx-forecast__title">7-day forecast</div>
        <div className="wx-forecast__row">
          {WEATHER.forecast.map(d => (
            <div className="wx-day" key={d.day}>
              <div className="wx-day__name">{d.day}</div>
              <div className="wx-day__icon"><WxIcon kind={d.icon} /></div>
              <div className="wx-day__hi">{d.hi}°</div>
              <div className="wx-day__lo">{d.lo}°</div>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}

/* ════════════════════════════════════════════════════════════════
   2. TUBE STATUS — original layout, factual line names + colours.
   ══════════════════════════════════════════════════════════════ */
const LINES = [
  { name: "Bakerloo",         color: "#A65A2A", text: "white", status: "good"    },
  { name: "Central",          color: "#D7361E", text: "white", status: "good"    },
  { name: "Circle",           color: "#F2CB3F", text: "#1a1a1a", status: "delays", note: "Minor delays westbound between Edgware Road and Hammersmith." },
  { name: "District",         color: "#1E7F3E", text: "white", status: "good"    },
  { name: "Hammersmith & City", color: "#E89AB1", text: "#1a1a1a", status: "good" },
  { name: "Jubilee",          color: "#7C868D", text: "white", status: "good"    },
  { name: "Metropolitan",     color: "#7E2B4E", text: "white", status: "part",   note: "Part closure: no service Aldgate ↔ Baker Street until 05:30 Mon." },
  { name: "Northern",         color: "#111111", text: "white", status: "delays", note: "Severe delays on the Bank branch — signal failure at Moorgate." },
  { name: "Piccadilly",       color: "#1F3D8C", text: "white", status: "good"    },
  { name: "Victoria",         color: "#1AA4E1", text: "white", status: "good"    },
  { name: "Waterloo & City",  color: "#80C2BB", text: "#1a1a1a", status: "good"  },
  { name: "Elizabeth",        color: "#6F4A9A", text: "white", status: "good"    },
];

const STATUS_LABEL = {
  good:   { label: "Good service",       tone: "good"   },
  delays: { label: "Minor delays",       tone: "warn"   },
  severe: { label: "Severe delays",      tone: "bad"    },
  part:   { label: "Part closure",       tone: "warn"   },
  suspended: { label: "Suspended",       tone: "bad"    },
};

function TubeScreen() {
  const disrupted = LINES.filter(l => l.status !== "good");
  const goodCount = LINES.length - disrupted.length;
  return (
    <Screen name="tube" label="02 Tube status">
      <div className="tube-head">
        <div className="tube-head__title">Tube line status</div>
        <div className="tube-head__sub">Live · refreshed every minute</div>
      </div>

      <div className="tube-list">
        {disrupted.map(l => {
          const s = STATUS_LABEL[l.status];
          return (
            <div className="tube-row tube-row--disrupted" key={l.name}>
              <div className="tube-row__bar" style={{ background: l.color, color: l.text }}>
                {l.name}
              </div>
              <div className="tube-row__body">
                <div className={`tube-row__status tube-row__status--${s.tone}`}>{s.label}</div>
                {l.note && <div className="tube-row__note">{l.note}</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="tube-good">
        <div className="tube-good__dot" />
        <div className="tube-good__text">
          <div className="tube-good__big">Good service on all other lines</div>
          <div className="tube-good__small">{goodCount} lines running normally — Bakerloo, Central, District, Hammersmith &amp; City, Jubilee, Piccadilly, Victoria, Waterloo &amp; City, Elizabeth</div>
        </div>
      </div>
    </Screen>
  );
}

/* ════════════════════════════════════════════════════════════════
   3. NOTICE BOARDS
   ══════════════════════════════════════════════════════════════ */
function NoticeManager() {
  return (
    <Screen name="notice" label="03 Notice · Estate Manager">
      <div className="notice">
        <div className="notice__kicker">
          <span className="notice__chip notice__chip--info">Estate Manager</span>
        </div>
        <h1 className="notice__title">Communal garden re-opens this weekend</h1>
        <div className="notice__body">
          <p>
            The east lawn is back in use from <b>Saturday 24 May</b> after spring re-turfing.
            Furniture has been refreshed and the new benches by the fountain are now in place.
          </p>
          <p>
            The BBQ area remains closed for one more week while the paving is finished.
            Please keep dogs on a lead until the new turf has fully settled.
          </p>
          <p className="notice__sign">— Priya Shah, Estate Manager</p>
        </div>
      </div>
    </Screen>
  );
}

function NoticeMaintenance() {
  return (
    <Screen name="notice" label="04 Notice · Maintenance">
      <div className="notice">
        <div className="notice__kicker">
          <span className="notice__chip notice__chip--warn">Scheduled maintenance</span>
        </div>
        <h1 className="notice__title">Hot water off · Tuesday 27 May</h1>
        <div className="notice__body">
          <p>
            Annual boiler service across all floors between <b>09:00 and 16:00</b>.
            Cold water remains available throughout the day.
          </p>
          <p>
            Engineers will be on site from floors 1 to 12. Hot water will be restored
            and the system flushed by late afternoon.
          </p>
          <p>
            For any questions, please contact the concierge desk on the ground floor.
          </p>
        </div>
      </div>
    </Screen>
  );
}

function NoticeSafety() {
  return (
    <Screen name="notice" label="07 Notice · Safety">
      <div className="notice">
        <div className="notice__kicker">
          <span className="notice__chip notice__chip--safety">Safety notice</span>
        </div>
        <h1 className="notice__title">In the event of a fire</h1>
        <div className="notice__body">
          <p>
            <b>Stay in your flat</b> unless your home is directly affected by smoke or heat.
            The building is designed to contain a fire to its flat of origin.
          </p>
          <p>
            <b>Call 999</b> and tell them the address and the floor number.
          </p>
          <p>
            <b>Do not use the lift.</b> If you must leave, use the nearest staircase
            and close doors behind you as you go.
          </p>
          <p>
            <b>Assemble</b> at the corner of Tanner Street and Bermondsey Street,
            away from the building entrance.
          </p>
        </div>
      </div>
    </Screen>
  );
}

/* ════════════════════════════════════════════════════════════════
   4. WIFI — with QR codes
   ══════════════════════════════════════════════════════════════ */
function QR({ value, size = 320 }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&qzone=1&color=0B1929&bgcolor=FFFFFF&data=${encodeURIComponent(value)}`;
  return (
    <div className="qr" style={{ width: size, height: size }}>
      <img src={url} width={size} height={size} alt="QR code" style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}

function WifiScreen() {
  // Standard WIFI: payload — phone camera recognises this
  const payload = "WIFI:T:WPA;S:Avantgarde Tower;P:see-concierge;H:false;;";
  return (
    <Screen name="wifi" label="06 Wi-Fi">
      <div className="wifi wifi--single">
        <div className="wifi__kicker">
          <span className="notice__chip notice__chip--info">Building update</span>
        </div>
        <h1 className="wifi__title">New residents Wi-Fi</h1>
        <p className="wifi__lede">
          Scan the QR code to access Wi-Fi in many of the estate's communal areas, now including the lifts.
        </p>

        <div className="wifi__single">
          <QR value={payload} size={500} />
          <dl className="wifi__details wifi__details--single">
            <div><dt>Network</dt><dd>Avantgarde Tower</dd></div>
            <div><dt>Password</dt><dd>From concierge</dd></div>
            <div><dt>Security</dt><dd>WPA2</dd></div>
          </dl>
        </div>
      </div>
    </Screen>
  );
}

/* ════════════════════════════════════════════════════════════════
   5. DEPARTURES — Shoreditch High Street (nearest Overground)
   ══════════════════════════════════════════════════════════════ */
const DEPARTURES = {
  station: "Shoreditch High Street",
  line: "Windrush line · Overground",
  lineColor: "#EE7C0E",
  rows: [
    { dest: "Highbury & Islington", platform: "1", calls: "Hoxton · Haggerston · Dalston Junction · Canonbury", mins: 2, status: "On time"  },
    { dest: "New Cross",            platform: "2", calls: "Whitechapel · Shadwell · Wapping · Rotherhithe · Surrey Quays",        mins: 4, status: "On time"  },
    { dest: "Highbury & Islington", platform: "1", calls: "Hoxton · Haggerston · Dalston Junction · Canonbury", mins: 8, status: "On time"  },
    { dest: "Clapham Junction",     platform: "2", calls: "Whitechapel · Canada Water · Surrey Quays · Peckham Rye · Denmark Hill",mins: 11, status: "+2 min" },
    { dest: "Crystal Palace",       platform: "2", calls: "Canada Water · Surrey Quays · New Cross Gate · Forest Hill",            mins: 14, status: "On time"  },
    { dest: "Highbury & Islington", platform: "1", calls: "Hoxton · Haggerston · Dalston Junction · Canonbury", mins: 17, status: "On time"  },
  ],
};

function DeparturesScreen() {
  return (
    <Screen name="dep" label="06 Departures">
      <div className="dep">
        <div className="dep__head">
          <div className="dep__station-wrap">
            <div className="dep__kicker">Nearest station · 4 min walk</div>
            <div className="dep__station">{DEPARTURES.station}</div>
            <div className="dep__line">
              <span className="dep__line-swatch" style={{ background: DEPARTURES.lineColor }} />
              {DEPARTURES.line}
            </div>
          </div>
          <div className="dep__legend">
            <div className="dep__legend-h">Live departures</div>
            <div className="dep__legend-s">Updated every 30 s</div>
          </div>
        </div>

        <div className="dep__board">
          <div className="dep__board-head">
            <div>When</div>
            <div>Destination</div>
            <div>Plat.</div>
            <div>Status</div>
          </div>
          {DEPARTURES.rows.map((r, i) => (
            <div className={`dep__row ${i === 0 ? "dep__row--next" : ""}`} key={i}>
              <div className="dep__when">
                <span className="dep__mins">{r.mins}</span>
                <span className="dep__min">min</span>
              </div>
              <div className="dep__dest">
                <div className="dep__dest-name">{r.dest}</div>
                <div className="dep__dest-calls">via {r.calls}</div>
              </div>
              <div className="dep__plat">{r.platform}</div>
              <div className={`dep__status ${r.status === "On time" ? "is-good" : "is-warn"}`}>
                {r.status}
              </div>
            </div>
          ))}
        </div>

        <div className="dep__foot">
          Walking route from {BUILDING_NAME}: <b>Tanner Street → Bermondsey Street → Shoreditch High Street</b>
        </div>
      </div>
    </Screen>
  );
}

/* ════════════════════════════════════════════════════════════════
   NEWS — GB News headline + secondary stories
   ══════════════════════════════════════════════════════════════ */
const NEWS = {
  lead: {
    kicker: "Politics",
    headline: "Chancellor signals tax review ahead of autumn Budget",
    standfirst: "Growth forecast revised up as the Treasury weighs changes to allowances, with a full statement expected in October.",
    time: "08:42",
    image: "assets/news-lead.jpg",
  },
  stories: [
    { kicker: "Economy",  title: "Bank of England holds base rate at 4.25% after inflation eases to 2.1%", time: "07:55" },
    { kicker: "Weather",  title: "Met Office issues yellow wind warning for south-east England this weekend", time: "07:30" },
    { kicker: "Health",   title: "NHS announces expansion of community pharmacy services across England", time: "06:48" },
    { kicker: "Sport",    title: "England name squad for summer Test series against India at Lord's", time: "06:15" },
  ],
};

function NewsScreen() {
  return (
    <Screen name="news" label="01 News">
      <div className="news">
        <div className="news__masthead">
          <span className="news__source">News</span>
          <span className="news__live">Headlines · updated continuously</span>
        </div>

        <div className="news__lead">
          <div className="news__photo">
            {NEWS.lead.image
              ? <img className="news__photo-img" src={NEWS.lead.image} alt={NEWS.lead.headline} />
              : <React.Fragment>
                  <div className="news__photo-stripes"></div>
                  <div className="news__photo-lbl">News feed image</div>
                </React.Fragment>}
          </div>
          <div className="news__lead-body">
            <span className="news__kicker">{NEWS.lead.kicker}</span>
            <h1 className="news__headline">{NEWS.lead.headline}</h1>
            <p className="news__standfirst">{NEWS.lead.standfirst}</p>
            <div className="news__meta">News · {NEWS.lead.time}</div>
          </div>
        </div>

        <div className="news__list">
          {NEWS.stories.map((s, i) => (
            <div className="news__item" key={i}>
              <span className="news__item-kicker">{s.kicker}</span>
              <div className="news__item-title">{s.title}</div>
              <div className="news__item-time">{s.time}</div>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}

/* ════════════════════════════════════════════════════════════════
   ROTATING LOOP — auto-advances through the screens
   ══════════════════════════════════════════════════════════════ */
const LOOP = [
  { name: "News",        comp: NewsScreen,       seconds: 16 },
  { name: "Weather",     comp: WeatherScreen,    seconds: 12 },
  { name: "Tube status", comp: TubeScreen,       seconds: 14 },
  { name: "Departures",  comp: DeparturesScreen, seconds: 14 },
  { name: "Estate news", comp: NoticeManager,    seconds: 12 },
  { name: "Maintenance", comp: NoticeMaintenance,seconds: 12 },
  { name: "Wi-Fi",       comp: WifiScreen,       seconds: 14 },
  { name: "Safety",      comp: NoticeSafety,     seconds: 12 },
];

function LiveLoopScreen() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const dur = LOOP[i].seconds * 1000;
    const id = setTimeout(() => setI((i + 1) % LOOP.length), dur);
    return () => clearTimeout(id);
  }, [i]);

  const Cur = LOOP[i].comp;
  return (
    <div className="ll-loop">
      <Cur />
    </div>
  );
}

/* Expose for the host app */
Object.assign(window, {
  NewsScreen, WeatherScreen, TubeScreen, DeparturesScreen, NoticeManager, NoticeMaintenance,
  NoticeSafety, WifiScreen, LiveLoopScreen,
});
