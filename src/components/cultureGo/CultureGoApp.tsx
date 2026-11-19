"use client";

/**
 * Interactive, front-end-only recreation of the CultureGo / Food Culture Guide
 * mobile app (React Native + Expo PFE), rebuilt from its source code and real
 * screenshots. Meals come live from TheMealDB like in the app; recognition,
 * translation and restaurant results are the app's demo outputs.
 */

import {
  ArrowLeft,
  BatteryFull,
  Signal,
  Wifi,
  Camera,
  ChevronDown,
  ChevronRight,
  Compass,
  Heart,
  Home,
  Info,
  KeyRound,
  Languages,
  Mail,
  MapPin,
  MessageSquare,
  Navigation,
  Save,
  ScanLine,
  Search,
  Share2,
  SlidersHorizontal,
  Star,
  User,
  Utensils,
  Wallet,
  X,
  Zap,
  Globe,
} from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import s from "./cultureGo.module.css";
import { COUNTRIES, RESTAURANTS, SAMPLE_TRANSLATION, mealDetail, mealsByCountry, type Meal, type MealDetail } from "./data";

type Tab = "home" | "explore" | "scan" | "translate" | "profile";
type View = { tab: Tab; meal?: Meal; restaurantsFor?: string };

const SUSHI = "https://www.themealdb.com/images/media/meals/g046bb1663960946.jpg";
const LOGO = "/projects/food-culture-guide-logo.png";

export function CultureGoApp({ showSplash = true }: { showSplash?: boolean }) {
  const [stack, setStack] = useState<View[]>([{ tab: "home" }]);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [liked, setLiked] = useState<Meal[]>([]);
  const view = stack[stack.length - 1];

  const push = (v: View) => {
    setDir("fwd");
    setStack((st) => [...st, v]);
  };
  const back = () => {
    setDir("back");
    setStack((st) => (st.length > 1 ? st.slice(0, -1) : st));
  };
  const goTab = (tab: Tab) => {
    setDir("fwd");
    setStack([{ tab }]);
  };
  const toggleLike = (m: Meal) =>
    setLiked((l) => (l.some((x) => x.id === m.id) ? l.filter((x) => x.id !== m.id) : [m, ...l]));
  const isLiked = (m: Meal) => liked.some((x) => x.id === m.id);

  const key = `${stack.length}-${view.tab}-${view.meal?.id ?? ""}-${view.restaurantsFor ?? ""}`;
  const anim = dir === "back" ? s.back : "";
  const full = Boolean(view.meal || view.restaurantsFor);

  let content: ReactNode;
  if (view.restaurantsFor) content = <Restaurants dish={view.restaurantsFor} onClose={back} />;
  else if (view.meal)
    content = (
      <Detail
        meal={view.meal}
        liked={isLiked(view.meal)}
        onLike={() => toggleLike(view.meal!)}
        onBack={back}
        onFind={(d) => push({ tab: view.tab, restaurantsFor: d })}
      />
    );
  else if (view.tab === "home")
    content = (
      <HomeScreen
        isLiked={isLiked}
        onLike={toggleLike}
        onOpen={(m) => push({ tab: "home", meal: m })}
        onFind={(d) => push({ tab: "home", restaurantsFor: d })}
        onProfile={() => goTab("profile")}
      />
    );
  else if (view.tab === "explore") content = <LikedScreen liked={liked} onOpen={(m) => push({ tab: "explore", meal: m })} onHome={() => goTab("home")} />;
  else if (view.tab === "scan") content = <ScanScreen />;
  else if (view.tab === "translate") content = <TranslateScreen />;
  else content = <ProfileScreen liked={liked.length} />;

  return (
    <div className={s.app}>
      <StatusBar />
      <div key={key} className={`${s.screen} ${full ? s.screenFull : ""} ${anim}`}>
        {content}
      </div>
      {!full && <TabBar tab={view.tab} onTab={goTab} />}
      {showSplash && (
        <div className={s.splash} aria-hidden>
          <div style={{ textAlign: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} alt="" />
            <div style={{ marginTop: 8, fontWeight: 700, fontSize: 20, color: "#ff6b35" }}>CultureGo</div>
          </div>
        </div>
      )}
      <div className={s.glare} />
    </div>
  );
}

function StatusBar() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => setTime(new Date().toTimeString().slice(0, 5));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className={s.statusBar}>
      <span>{time}</span>
      <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }} aria-hidden>
        <Signal size={13} strokeWidth={2.5} />
        <Wifi size={13} strokeWidth={2.5} />
        <BatteryFull size={16} strokeWidth={2} />
      </span>
    </div>
  );
}

function TabBar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const item = (t: Tab, icon: ReactNode, label: string) => (
    <button className={`${s.tab} ${tab === t ? s.tabActive : ""}`} onClick={() => onTab(t)} aria-label={label}>
      {icon}
      {tab === t && <span>{label}</span>}
    </button>
  );
  return (
    <nav className={s.tabBar} aria-label="App navigation">
      {item("home", <Home size={22} />, "Home")}
      {item("explore", <Compass size={22} />, "Explore")}
      <button className={s.fab} onClick={() => onTab("scan")} aria-label="Scan food">
        <Camera size={24} />
      </button>
      {item("translate", <Languages size={22} />, "Translate")}
      {item("profile", <User size={22} />, "Profile")}
    </nav>
  );
}

function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} fill={i < Math.round(value) ? "#f5b301" : "none"} color="#f5b301" />
      ))}
    </span>
  );
}

// ── Home ─────────────────────────────────────────────────────────────────────

function HomeScreen({
  isLiked,
  onLike,
  onOpen,
  onFind,
  onProfile,
}: {
  isLiked: (m: Meal) => boolean;
  onLike: (m: Meal) => void;
  onOpen: (m: Meal) => void;
  onFind: (dish: string) => void;
  onProfile: () => void;
}) {
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [meals, setMeals] = useState<Meal[] | null>(null);
  useEffect(() => {
    let alive = true;
    mealsByCountry(country.area).then((m) => alive && setMeals(m));
    return () => {
      alive = false;
    };
  }, [country]);

  return (
    <>
      <header className={s.homeHeader}>
        <div>
          <div className={s.welcome}>Welcome to</div>
          <div className={s.brand}>CultureGo</div>
        </div>
        <div className={s.headerRight}>
          <span className={s.tries}>3 tries left</span>
          <button className={s.avatarBtn} onClick={onProfile} aria-label="Profile">
            <User size={17} />
          </button>
        </div>
      </header>
      <div className={s.chips} role="tablist" aria-label="Countries">
        {COUNTRIES.map((c) => (
          <button
            key={c.label}
            role="tab"
            aria-selected={c.label === country.label}
            className={`${s.chip} ${c.label === country.label ? s.chipActive : ""}`}
            onClick={() => {
              setMeals(null);
              setCountry(c);
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className={s.list}>
        {!meals && [0, 1].map((i) => <div key={i} className={s.skeleton} />)}
        {meals?.map((m, i) => (
          <article key={m.id} className={s.card} style={{ animationDelay: `${Math.min(i, 4) * 60}ms` }}>
            <div className={s.cardImg} style={{ backgroundImage: `url(${m.thumb}/preview)` }} onClick={() => onOpen(m)} role="button" aria-label={`Open ${m.name}`}>
              <button
                className={s.heart}
                onClick={(e) => {
                  e.stopPropagation();
                  onLike(m);
                }}
                aria-label="Like"
              >
                <Heart size={18} fill={isLiked(m) ? "#ff6b35" : "none"} />
              </button>
            </div>
            <div className={s.cardBody}>
              <button className={s.cardTitle} onClick={() => onOpen(m)} style={{ textAlign: "left" }}>
                {m.name}
              </button>
              <button className={s.findBtn} onClick={() => onFind(m.name)}>
                <MapPin size={16} /> Find Nearby Restaurants
              </button>
              <div className={s.metaRow}>
                <span className={s.price}>{m.price}</span>
                <span className={s.rating}>
                  <Star size={15} fill="#f5b301" color="#f5b301" /> {m.rating} <small>({m.ratingCount})</small>
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

// ── Detail ───────────────────────────────────────────────────────────────────

function Detail({
  meal,
  liked,
  onLike,
  onBack,
  onFind,
}: {
  meal: Meal;
  liked: boolean;
  onLike: () => void;
  onBack: () => void;
  onFind: (dish: string) => void;
}) {
  const [d, setD] = useState<MealDetail | null>(null);
  useEffect(() => {
    let alive = true;
    mealDetail(meal).then((x) => alive && setD(x));
    return () => {
      alive = false;
    };
  }, [meal]);
  return (
    <>
      <div className={s.hero} style={{ backgroundImage: `url(${meal.thumb})` }}>
        <button className={s.roundBtn} style={{ left: 12 }} onClick={onBack} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <button className={s.roundBtn} style={{ right: 56 }} onClick={onLike} aria-label="Like">
          <Heart size={17} fill={liked ? "#fff" : "none"} />
        </button>
        <button className={s.roundBtn} style={{ right: 12 }} aria-label="Share">
          <Share2 size={17} />
        </button>
      </div>
      <div className={s.detailBody}>
        <div className={s.detailHead}>
          <h3 className={s.detailTitle}>{meal.name}</h3>
          <span className={s.pricePill}>{meal.price}</span>
        </div>
        <p className={s.muted} style={{ marginTop: 4 }}>
          {d ? [d.category, d.area].filter(Boolean).join(" · ") : "Loading…"}
        </p>
        <h4 className={s.sectionTitle}>Ingredients</h4>
        <ul className={s.bullets}>
          {(d?.ingredients ?? []).map((ing) => (
            <li key={ing}>• {ing}</li>
          ))}
        </ul>
        <button className={s.findBtn} style={{ marginTop: 16, padding: 12 }} onClick={() => onFind(meal.name)}>
          <Utensils size={16} /> Find Nearby Restaurants
        </button>
        <h4 className={s.sectionTitle}>Instructions</h4>
        <p style={{ whiteSpace: "pre-line", lineHeight: 1.55, color: "#444" }}>{d?.instructions}</p>
        <h4 className={s.sectionTitle}>Cultural insight</h4>
        <p style={{ lineHeight: 1.55, color: "#444" }}>
          {d?.area ? `A dish from ${d.area} cuisine. Save it to your collection and compare it with what you taste on your travels.` : ""}
        </p>
      </div>
    </>
  );
}

// ── Explore (liked meals) ─────────────────────────────────────────────────────

function LikedScreen({ liked, onOpen, onHome }: { liked: Meal[]; onOpen: (m: Meal) => void; onHome: () => void }) {
  return (
    <div style={{ padding: 18 }}>
      <h2 style={{ fontSize: 23, fontWeight: 700 }}>Liked Meals</h2>
      <p className={s.muted}>Your favorite dishes</p>
      {liked.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: 60, color: "#888" }}>
          <Heart size={46} color="#ffb59a" style={{ margin: "0 auto" }} />
          <p style={{ fontWeight: 600, marginTop: 12, color: "#555" }}>No liked meals yet</p>
          <p style={{ marginTop: 4 }}>Tap the heart on a dish to save it here.</p>
          <button className={s.primaryBtn} onClick={onHome}>
            Discover dishes
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {liked.map((m) => (
            <button key={m.id} className={s.card} style={{ display: "flex", gap: 12, alignItems: "center", padding: 8 }} onClick={() => onOpen(m)}>
              <span style={{ width: 70, height: 70, borderRadius: 12, background: `url(${m.thumb}/preview) center/cover`, flex: "none" }} />
              <span>
                <span className={s.cardTitle} style={{ display: "block", fontSize: 15 }}>
                  {m.name}
                </span>
                <span className={s.price}>{m.price}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Scan (food recognition) ──────────────────────────────────────────────────

function ScanScreen() {
  const [phase, setPhase] = useState<"idle" | "scanning" | "result">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const scan = () => {
    setPhase("scanning");
    timer.current = setTimeout(() => setPhase("result"), 1600);
  };
  const corner = (st: CSSProperties) => <span className={s.corner} style={st} />;
  return (
    <>
      <div className={s.orangeHeader}>
        <h2>📸 Food Recognition</h2>
        <p>Identify dishes and learn about their cultural background</p>
      </div>
      <div className={s.panel}>
        <b>🍴 10/10 Scans Left Today</b>
        <div className={s.bar}>
          <span style={{ width: "100%" }} />
        </div>
      </div>
      <div className={s.infoCard}>
        <div className={s.infoTitle}>
          <Info size={16} /> Food Recognition Service
        </div>
        This app uses advanced AI to identify food dishes from photos and provides cultural background information.
        <div style={{ fontWeight: 700, marginTop: 8, color: "#333" }}>📝 Tips for better results:</div>
        • Take clear, well-lit photos
        <br />• Center the dish in the frame
        <br />• Avoid glare and shadows
      </div>
      <div className={s.viewfinder} style={{ backgroundImage: phase === "idle" ? undefined : `url(${SUSHI})` }}>
        {corner({ top: 14, left: 14, borderRight: 0, borderBottom: 0, borderRadius: "10px 0 0 0" })}
        {corner({ top: 14, right: 14, borderLeft: 0, borderBottom: 0, borderRadius: "0 10px 0 0" })}
        {corner({ bottom: 14, left: 14, borderRight: 0, borderTop: 0, borderRadius: "0 0 0 10px" })}
        {corner({ bottom: 14, right: 14, borderLeft: 0, borderTop: 0, borderRadius: "0 0 10px 0" })}
        {phase === "idle" && (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#bbb", fontSize: 13 }}>Position food in frame</div>
        )}
        {phase === "scanning" && (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "rgba(0,0,0,.35)", color: "#fff", fontWeight: 600 }}>
            <ScanLine size={30} /> Analyzing with Clarifai…
          </div>
        )}
      </div>
      <button className={s.primaryBtn} onClick={scan} disabled={phase === "scanning"}>
        <Camera size={18} /> {phase === "idle" ? "Scan a sample dish" : "Scan again"}
      </button>
      {phase === "result" && (
        <div className={s.sheetBackdrop} onClick={() => setPhase("idle")}>
          <div className={s.sheet} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ width: 28 }} />
              <span className={s.sheetTitle}>Recognition Result</span>
              <button onClick={() => setPhase("idle")} aria-label="Close" style={{ background: "#eee", borderRadius: 999, width: 30, height: 30, display: "grid", placeItems: "center" }}>
                <X size={16} />
              </button>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 700, marginTop: 14 }}>sushi</h3>
            <div className={s.panel} style={{ margin: "10px 0 0" }}>
              <div className={s.confRow} style={{ marginTop: 0 }}>
                <span style={{ fontSize: 13 }}>Confidence:</span>
                <span className={s.confBar}>
                  <span style={{ width: "100%" }} />
                </span>
                <span className={s.pct}>100.0%</span>
              </div>
            </div>
            <h4 className={s.sectionTitle} style={{ color: "#ff6b35" }}>
              Alternative Matches
            </h4>
            {[
              ["wasabi", 98.5],
              ["nori", 95.3],
              ["rice", 92.9],
            ].map(([n, p]) => (
              <div key={n} className={s.confRow}>
                <span>{n}</span>
                <span className={s.confBar}>
                  <span style={{ width: `${p}%` }} />
                </span>
                <span className={s.pct}>{p}%</span>
              </div>
            ))}
            <h4 className={s.sectionTitle} style={{ color: "#ff6b35" }}>
              Description
            </h4>
            <p style={{ color: "#444" }}>This appears to be sushi, a Japanese dish, identified with 100% confidence.</p>
            <h4 className={s.sectionTitle} style={{ color: "#ff6b35" }}>
              Ingredients
            </h4>
            <div className={s.tags}>
              {["Rice", "Vinegar", "Nori", "Fish", "Vegetables"].map((t) => (
                <span key={t} className={s.tag}>
                  {t}
                </span>
              ))}
            </div>
            <div className={s.twoBtns}>
              <button className={`${s.primaryBtn} ${s.greenBtn}`} style={{ margin: 0, width: "100%", fontSize: 13 }}>
                <Save size={16} /> Save to Collection
              </button>
              <button className={s.primaryBtn} style={{ margin: 0, width: "100%", fontSize: 13 }} onClick={() => setPhase("idle")}>
                <Camera size={16} /> Take New Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Translate ────────────────────────────────────────────────────────────────

function TranslateScreen() {
  const [lang, setLang] = useState("French");
  const [out, setOut] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const run = () => {
    setBusy(true);
    setOut(null);
    setTimeout(() => {
      setOut(SAMPLE_TRANSLATION);
      setBusy(false);
    }, 1200);
  };
  return (
    <>
      <div className={s.orangeHeader}>
        <h2>📸 Snap & Translate Menus</h2>
        <p>Get instant dish translations in 12 languages</p>
      </div>
      <div className={s.panel}>
        <b>🍴 3/3 Translations Left Today</b>
        <div className={s.bar}>
          <span style={{ width: "100%" }} />
        </div>
      </div>
      <div className={s.infoCard}>
        <div className={s.infoTitle}>
          <Info size={16} /> Translation Services
        </div>
        OCR extracts the text from a photo of the menu, then free translation APIs translate it.
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <b style={{ color: "#333" }}>OCR Engine:</b>
          <span style={{ background: "#ff6b35", color: "#fff", borderRadius: 6, padding: "3px 8px", fontSize: 12 }}>OCR.space API</span>
        </div>
      </div>
      <div className={s.panel} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f5f5f7" }}>
        <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ background: "transparent", fontSize: 15, flex: 1 }} aria-label="Target language">
          {["French", "English", "Arabic", "Spanish", "Italian", "German"].map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <ChevronDown size={16} />
      </div>
      <button className={s.primaryBtn} onClick={run} disabled={busy}>
        <Languages size={18} /> {busy ? "Reading menu…" : "Translate sample menu"}
      </button>
      {out && (
        <div className={s.panel} style={{ lineHeight: 1.7, animation: "none" }}>
          {out.map((l) => (
            <div key={l}>{l}</div>
          ))}
          <button className={`${s.primaryBtn} ${s.greenBtn}`} style={{ margin: "12px 0 0", width: "100%", borderRadius: 999 }}>
            Save Translation
          </button>
        </div>
      )}
      <div className={s.infoCard} style={{ border: "1px solid #ff6b35", background: "#fff", marginBottom: 16 }}>
        <div className={s.infoTitle} style={{ letterSpacing: 1 }}>
          <Zap size={16} /> CURRENT PLAN
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#222" }}>BASIC (Limited)</div>
        <div style={{ marginTop: 8 }}>✓ 3 translations / day</div>
      </div>
    </>
  );
}

// ── Restaurants ──────────────────────────────────────────────────────────────

function Restaurants({ dish, onClose }: { dish: string; onClose: () => void }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "12px 16px" }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.3 }}>Restaurants serving {dish}</h3>
        <button onClick={onClose} aria-label="Close">
          <X size={22} />
        </button>
      </div>
      <div className={s.map}>
        <MapPin className={s.pin} style={{ left: "40%", top: "62%" }} size={34} fill="#3b82f6" color="#1d4ed8" />
        <MapPin className={s.pin} style={{ left: "76%", top: "48%" }} size={32} fill="#ef4444" color="#b91c1c" />
        <MapPin className={s.pin} style={{ left: "22%", top: "30%" }} size={26} fill="#ef4444" color="#b91c1c" />
        <span style={{ position: "absolute", right: 8, bottom: 4, fontSize: 9, color: "#777" }}>Map preview</span>
      </div>
      <div className={s.search}>
        <div className={s.searchBox}>
          <Search size={17} /> Search restaurants…
        </div>
        <span className={s.avatarBtn} style={{ background: "#ffe9e0", color: "#ff6b35", width: 38, height: 38 }}>
          <SlidersHorizontal size={17} />
        </span>
      </div>
      {RESTAURANTS.map((r) => (
        <div key={r.name} className={s.restCard}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <b style={{ fontSize: 16 }}>{r.name}</b>
            <span className={s.muted}>$$</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, fontSize: 13 }}>
            <Stars value={r.rating} /> <span className={s.muted}>({r.reviews})</span>
            <span style={{ color: "#16a34a", fontWeight: 600 }}>Open Now</span>
            <span className={s.badge} style={{ background: "#e0f2fe", color: "#0369a1" }}>
              Delivery
            </span>
          </div>
          <div className={s.muted} style={{ marginTop: 6 }}>
            {dish}
          </div>
          <div className={s.muted}>{r.address}</div>
          <div style={{ color: "#ff6b35", fontWeight: 700, marginTop: 4 }}>{r.distance}</div>
          <button className={s.findBtn} style={{ width: "auto", padding: "8px 14px" }}>
            <Navigation size={15} /> Directions
          </button>
        </div>
      ))}
    </>
  );
}

// ── Profile ──────────────────────────────────────────────────────────────────

function ProfileScreen({ liked }: { liked: number }) {
  const quick: [ReactNode, string, string][] = [
    [<User key="u" size={20} color="#2bb3a3" />, "Profile Info", "#e0f6f3"],
    [<MessageSquare key="m" size={20} color="#ff6b35" />, "Send Feedback", "#ffeee6"],
    [<Wallet key="w" size={20} color="#8b5cf6" />, "Currency", "#efe9ff"],
    [<Languages key="l" size={20} color="#f59e0b" />, "Translations", "#fff4dd"],
  ];
  return (
    <div style={{ paddingBottom: 16, background: "#fafafa", minHeight: "100%" }}>
      <div className={s.profileCard}>
        <div className={s.profileTop}>
          <div className={s.avatar}>
            <User size={38} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>guest.explorer</div>
            <div className={s.muted} style={{ fontSize: 13 }}>
              <Mail size={12} style={{ display: "inline", marginRight: 4 }} />
              explorer@culturego.app
            </div>
            <span style={{ display: "inline-block", marginTop: 8, background: "#fff", borderRadius: 999, padding: "4px 12px", fontSize: 13 }}>Edit Profile</span>
          </div>
        </div>
        <div className={s.stats}>
          <span>
            <b>0/3</b>Countries
          </span>
          <span>
            <b>{liked}</b>Liked
          </span>
          <span>
            <b>0</b>Translations
          </span>
        </div>
      </div>
      <div className={s.profileCard} style={{ padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 17 }}>
          <Star size={20} /> Free Plan
        </div>
        <div className={s.muted} style={{ marginTop: 8, display: "grid", gap: 4 }}>
          <span>
            <ScanLine size={14} style={{ display: "inline", marginRight: 6 }} />3 food scans remaining
          </span>
          <span>
            <Globe size={14} style={{ display: "inline", marginRight: 6 }} />
            Limited country access
          </span>
        </div>
        <button className={s.primaryBtn} style={{ margin: "14px 0 0", width: "100%" }}>
          Upgrade Plan
        </button>
      </div>
      <h4 className={s.sectionTitle} style={{ margin: "16px 16px 8px" }}>
        Quick Actions
      </h4>
      <div className={s.profileCard} style={{ padding: "14px 6px", margin: "0 14px" }}>
        <div className={s.quick}>
          {quick.map(([icon, label, bg]) => (
            <span key={label}>
              <span className={s.quickIcon} style={{ background: bg }}>
                {icon}
              </span>
              {label}
            </span>
          ))}
        </div>
      </div>
      <h4 className={s.sectionTitle} style={{ margin: "16px 16px 8px" }}>
        Account Settings
      </h4>
      <div className={s.profileCard} style={{ margin: "0 14px" }}>
        {[
          [<User key="a" size={18} color="#ff6b35" />, "Change Display Name"],
          [<KeyRound key="b" size={18} color="#ff6b35" />, "Reset Password"],
          [<Wallet key="c" size={18} color="#ff6b35" />, "App Currency (TND)"],
        ].map(([icon, label]) => (
          <div key={label as string} className={s.settingRow}>
            {icon}
            <span style={{ flex: 1 }}>{label}</span>
            <ChevronRight size={16} color="#bbb" />
          </div>
        ))}
      </div>
    </div>
  );
}
