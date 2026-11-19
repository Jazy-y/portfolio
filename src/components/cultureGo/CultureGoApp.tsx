"use client";

/**
 * Interactive, front-end-only recreation of the CultureGo / Food Culture Guide
 * mobile app (React Native + Expo PFE), rebuilt from its source code and real
 * screenshots. Meals come live from TheMealDB like in the app; recognition,
 * translation and restaurant results are the app's demo outputs.
 */

import {
  ArrowLeft,
  Check,
  Image as ImageIcon,
  LogOut,
  Trash2,
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
import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import s from "./cultureGo.module.css";
import {
  COUNTRIES,
  CURRENCIES,
  PLANS,
  RESTAURANTS,
  SAMPLE_TRANSLATION,
  formatPrice,
  mealDetail,
  mealsByCountry,
  type CurrencyCode,
  type Meal,
  type MealDetail,
} from "./data";

type Tab = "home" | "explore" | "scan" | "translate" | "profile";
type View = { tab: Tab; meal?: Meal; restaurantsFor?: string };

/**
 * Horizontal scrolling for a row that only scrolls by touch otherwise: the
 * mouse wheel scrolls it sideways and it can be dragged with the mouse.
 * A drag doesn't trigger the click on the chip under the pointer.
 */
function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let startX = 0;
    let startLeft = 0;
    let dragging = false;
    let moved = false;
    // the row may be CSS-scaled (3D phone, 2D modal): convert screen px to content px
    const ratio = () => el.offsetWidth / Math.max(1, el.getBoundingClientRect().width);
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      e.preventDefault();
      el.scrollLeft = Math.min(max, Math.max(0, el.scrollLeft + e.deltaY));
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startLeft = el.scrollLeft;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = (e.clientX - startX) * ratio();
      if (Math.abs(dx) > 4) moved = true;
      if (moved) el.scrollLeft = startLeft - dx;
    };
    const onUp = () => {
      dragging = false;
    };
    const onClick = (e: MouseEvent) => {
      if (moved) {
        e.stopPropagation();
        e.preventDefault();
        moved = false;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("click", onClick, true);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("click", onClick, true);
    };
  }, []);
  return ref;
}

// ── App-wide state shared by the screens and sheets ─────────────────────────

type SheetKind = "name" | "info" | "picture" | "feedback" | "currency" | "translations" | "plans" | "password" | "logout";
type SavedTranslation = { date: string; lang: string; lines: string[] };
type SavedFood = { name: string; date: string; img: string };

type AppState = {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  fmt: (price: string) => string;
  name: string;
  setName: (n: string) => void;
  avatar: string | null;
  setAvatar: (url: string | null) => void;
  translations: SavedTranslation[];
  addTranslation: (t: SavedTranslation) => void;
  foods: SavedFood[];
  addFood: (f: SavedFood) => void;
  removeFood: (i: number) => void;
  openSheet: (k: SheetKind) => void;
  toast: (msg: string) => void;
  goTab: (t: Tab) => void;
  logout: () => void;
};

const AppContext = createContext<AppState | null>(null);
function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("CultureGo screens must be rendered inside CultureGoApp");
  return ctx;
}

const today = () => new Date().toLocaleDateString("en-US");

const SUSHI = "https://www.themealdb.com/images/media/meals/g046bb1663960946.jpg";
const LOGO = "/projects/food-culture-guide-logo.png";

export function CultureGoApp({ showSplash = true }: { showSplash?: boolean }) {
  const [stack, setStack] = useState<View[]>([{ tab: "home" }]);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [liked, setLiked] = useState<Meal[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>("TND");
  const [name, setName] = useState("guest.explorer");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [translations, setTranslations] = useState<SavedTranslation[]>([]);
  const [foods, setFoods] = useState<SavedFood[]>([]);
  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [loggedOut, setLoggedOut] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const toast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2600);
  };
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );
  const app: AppState = {
    currency,
    setCurrency,
    fmt: (p) => formatPrice(p, currency),
    name,
    setName,
    avatar,
    setAvatar,
    translations,
    addTranslation: (t) => setTranslations((l) => [t, ...l]),
    foods,
    addFood: (f) => setFoods((l) => [f, ...l]),
    removeFood: (i) => setFoods((l) => l.filter((_, j) => j !== i)),
    openSheet: setSheet,
    toast,
    goTab: (t) => {
      setSheet(null);
      goTab(t);
    },
    logout: () => {
      setSheet(null);
      setLoggedOut(true);
    },
  };

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
    <AppContext.Provider value={app}>
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
      {sheet && <Sheets kind={sheet} onClose={() => setSheet(null)} />}
      {loggedOut && <LoginScreen onGuest={() => setLoggedOut(false)} />}
      {toastMsg && (
        <div className={s.toast} role="status">
          {toastMsg}
        </div>
      )}
      <div className={s.glare} />
    </div>
    </AppContext.Provider>
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
  const chips = useDragScroll<HTMLDivElement>();
  const { fmt } = useApp();
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
      <div ref={chips} className={s.chips} role="tablist" aria-label="Countries">
        {COUNTRIES.map((c) => (
          <button
            key={c.label}
            role="tab"
            aria-selected={c.label === country.label}
            className={`${s.chip} ${c.label === country.label ? s.chipActive : ""}`}
            onClick={(e) => {
              setMeals(null);
              setCountry(c);
              // centre the chosen chip by scrolling only the row (scrollIntoView would also move the phone containers)
              const chip = e.currentTarget;
              const row = chips.current;
              row?.scrollTo({ left: chip.offsetLeft - row.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: "smooth" });
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
            <div className={s.cardImg} onClick={() => onOpen(m)} role="button" aria-label={`Open ${m.name}`}>
              {/* full 700 px photo: the 250 px preview looked blurry once stretched across the card */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.thumb} alt="" loading="lazy" decoding="async" className={s.cardPhoto} />
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
                <span className={s.price}>{fmt(m.price)}</span>
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
  const { fmt } = useApp();
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
          <span className={s.pricePill}>{fmt(meal.price)}</span>
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
  const { fmt } = useApp();
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
                <span className={s.price}>{fmt(m.price)}</span>
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
  const { addFood, toast } = useApp();
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
              <button
                className={`${s.primaryBtn} ${s.greenBtn}`}
                style={{ margin: 0, width: "100%", fontSize: 13 }}
                onClick={() => {
                  addFood({ name: "sushi", date: today(), img: SUSHI });
                  toast("Saved to your collection (see Profile)");
                  setPhase("idle");
                }}
              >
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
  const { addTranslation, toast } = useApp();
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
          <button
            onClick={() => {
              addTranslation({ date: today(), lang: lang.slice(0, 2).toUpperCase(), lines: out });
              toast("Translation saved (see Profile, Translations)");
            }}
            className={`${s.primaryBtn} ${s.greenBtn}`} style={{ margin: "12px 0 0", width: "100%", borderRadius: 999 }}>
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
  const { name, avatar, currency, translations, foods, removeFood, openSheet } = useApp();
  const quick: [ReactNode, string, string, SheetKind][] = [
    [<User key="u" size={20} color="#2bb3a3" />, "Profile Info", "#e0f6f3", "info"],
    [<MessageSquare key="m" size={20} color="#ff6b35" />, "Send Feedback", "#ffeee6", "feedback"],
    [<Wallet key="w" size={20} color="#8b5cf6" />, "Currency", "#efe9ff", "currency"],
    [<Languages key="l" size={20} color="#f59e0b" />, "Translations", "#fff4dd", "translations"],
  ];
  const settings: [ReactNode, string, SheetKind][] = [
    [<User key="a" size={18} color="#ff6b35" />, "Change Display Name", "name"],
    [<KeyRound key="b" size={18} color="#ff6b35" />, "Reset Password", "password"],
    [<ImageIcon key="c" size={18} color="#ff6b35" />, "Change Profile Picture", "picture"],
    [<Info key="d" size={18} color="#ff6b35" />, "Update Profile Information", "info"],
    [<Wallet key="e" size={18} color="#ff6b35" />, `App Currency (${currency})`, "currency"],
  ];
  return (
    <div style={{ paddingBottom: 16, background: "#fafafa", minHeight: "100%" }}>
      <div className={s.profileCard}>
        <div className={s.profileTop}>
          <button className={s.avatar} onClick={() => openSheet("picture")} aria-label="Change profile picture">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
            ) : (
              <User size={38} />
            )}
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 18, overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
            <div className={s.muted} style={{ fontSize: 13 }}>
              <Mail size={12} style={{ display: "inline", marginRight: 4 }} />
              explorer@culturego.app
            </div>
            <button className={s.pillBtn} onClick={() => openSheet("name")}>
              Edit Profile
            </button>
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
            <b>{translations.length}</b>Translations
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
        <button className={s.primaryBtn} style={{ margin: "14px 0 0", width: "100%" }} onClick={() => openSheet("plans")}>
          Upgrade Plan
        </button>
      </div>
      <h4 className={s.sectionTitle} style={{ margin: "16px 16px 8px" }}>
        Quick Actions
      </h4>
      <div className={s.profileCard} style={{ padding: "14px 6px", margin: "0 14px" }}>
        <div className={s.quick}>
          {quick.map(([icon, label, bg, kind]) => (
            <button key={label} onClick={() => openSheet(kind)} className={s.quickBtn}>
              <span className={s.quickIcon} style={{ background: bg }}>
                {icon}
              </span>
              {label}
            </button>
          ))}
        </div>
      </div>
      <h4 className={s.sectionTitle} style={{ margin: "16px 16px 8px" }}>
        Account Settings
      </h4>
      <div className={s.profileCard} style={{ margin: "0 14px" }}>
        {settings.map(([icon, label, kind]) => (
          <button key={label} className={s.settingRow} onClick={() => openSheet(kind)}>
            {icon}
            <span style={{ flex: 1 }}>{label}</span>
            <ChevronRight size={16} color="#bbb" />
          </button>
        ))}
        <button className={s.settingRow} style={{ color: "#e53935", borderBottom: 0 }} onClick={() => openSheet("logout")}>
          <LogOut size={18} />
          <span style={{ flex: 1 }}>Logout</span>
        </button>
      </div>
      <h4 className={s.sectionTitle} style={{ margin: "16px 16px 8px" }}>
        Saved Foods
      </h4>
      <div className={s.profileCard} style={{ margin: "0 14px", padding: 12 }}>
        {foods.length === 0 ? (
          <p className={s.muted}>Scan a dish and tap “Save to Collection”.</p>
        ) : (
          foods.map((f, i) => (
            <div key={`${f.name}-${i}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0" }}>
              <span style={{ width: 52, height: 52, borderRadius: 999, background: `url(${f.img}) center/cover`, flex: "none" }} />
              <span style={{ flex: 1 }}>
                <b style={{ display: "block" }}>{f.name}</b>
                <span className={s.muted} style={{ fontSize: 12 }}>
                  {f.date}
                </span>
              </span>
              <button className={s.trashBtn} onClick={() => removeFood(i)} aria-label={`Remove ${f.name}`}>
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>
      <h4 className={s.sectionTitle} style={{ margin: "16px 16px 8px" }}>
        Saved Translations
      </h4>
      <div className={s.profileCard} style={{ margin: "0 14px", padding: 12 }}>
        {translations.length === 0 ? (
          <p className={s.muted}>Translate a menu and tap “Save Translation”.</p>
        ) : (
          <button className={s.outlineBtn} onClick={() => openSheet("translations")}>
            Show {translations.length} translation{translations.length > 1 ? "s" : ""}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Bottom sheets opened from the profile ────────────────────────────────────

function SheetFrame({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className={s.sheetBackdrop} onClick={onClose}>
      <div className={s.sheet} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className={s.sheetHead}>
          <span>{title}</span>
          <button onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Sheets({ kind, onClose }: { kind: SheetKind; onClose: () => void }) {
  const app = useApp();
  const [text, setText] = useState(kind === "name" ? app.name : kind === "password" ? "explorer@culturego.app" : "");
  const [age, setAge] = useState("25");
  const [gender, setGender] = useState("Prefer not to say");
  const file = useRef<HTMLInputElement>(null);
  const done = (msg: string) => {
    app.toast(msg);
    onClose();
  };

  switch (kind) {
    case "name":
      return (
        <SheetFrame title="Change Display Name" onClose={onClose}>
          <label className={s.fieldLabel}>Display name</label>
          <input className={s.input} value={text} onChange={(e) => setText(e.target.value)} maxLength={24} autoFocus />
          <button
            className={s.primaryBtn}
            style={{ margin: "16px 0 0" }}
            disabled={text.trim().length < 3}
            onClick={() => {
              app.setName(text.trim());
              done("Display name updated");
            }}
          >
            Save
          </button>
        </SheetFrame>
      );
    case "info":
      return (
        <SheetFrame title="Update Profile Information" onClose={onClose}>
          <label className={s.fieldLabel}>Age: (Required)</label>
          <input className={s.input} type="number" min={1} max={120} value={age} onChange={(e) => setAge(e.target.value)} />
          <label className={s.fieldLabel}>Gender: (Required)</label>
          <select className={s.input} value={gender} onChange={(e) => setGender(e.target.value)}>
            <option>Female</option>
            <option>Male</option>
            <option>Prefer not to say</option>
          </select>
          <button className={s.primaryBtn} style={{ margin: "18px 0 0" }} disabled={!age} onClick={() => done("Profile information saved")}>
            Save Information
          </button>
        </SheetFrame>
      );
    case "picture":
      return (
        <SheetFrame title="Change Profile Picture" onClose={onClose}>
          <p className={s.muted}>Pick a photo from your device. In this demo it stays in your browser and is never uploaded.</p>
          <input
            ref={file}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (app.avatar) URL.revokeObjectURL(app.avatar);
              app.setAvatar(URL.createObjectURL(f));
              done("Profile picture updated");
            }}
          />
          <button className={s.primaryBtn} style={{ margin: "16px 0 0" }} onClick={() => file.current?.click()}>
            <ImageIcon size={17} /> Choose from gallery
          </button>
          {app.avatar && (
            <button
              className={s.outlineBtn}
              style={{ marginTop: 10 }}
              onClick={() => {
                URL.revokeObjectURL(app.avatar!);
                app.setAvatar(null);
                done("Profile picture removed");
              }}
            >
              Remove photo
            </button>
          )}
        </SheetFrame>
      );
    case "feedback":
      return (
        <SheetFrame title="Send Feedback" onClose={onClose}>
          <textarea className={s.input} rows={4} placeholder="Share your thoughts..." value={text} onChange={(e) => setText(e.target.value)} />
          <button className={s.primaryBtn} style={{ margin: "14px 0 0" }} disabled={!text.trim()} onClick={() => done("Thanks! (Demo: feedback isn't sent anywhere)")}>
            Submit
          </button>
        </SheetFrame>
      );
    case "currency":
      return (
        <SheetFrame title="Select Currency" onClose={onClose}>
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              className={`${s.currencyRow} ${app.currency === c.code ? s.currencyActive : ""}`}
              onClick={() => {
                app.setCurrency(c.code);
                done(`Prices are now shown in ${c.name}`);
              }}
            >
              <b className={s.currencySymbol}>{c.symbol}</b>
              <span style={{ flex: 1, textAlign: "left" }}>
                {c.name}
                <span className={s.muted} style={{ display: "block", fontSize: 12 }}>
                  {c.code}
                </span>
              </span>
              {app.currency === c.code && (
                <span className={s.checkDot}>
                  <Check size={13} strokeWidth={3} />
                </span>
              )}
            </button>
          ))}
        </SheetFrame>
      );
    case "translations":
      return (
        <SheetFrame title="Saved Translations" onClose={onClose}>
          {app.translations.length === 0 ? (
            <>
              <p className={s.muted}>No saved translations yet.</p>
              <button className={s.primaryBtn} style={{ margin: "14px 0 0" }} onClick={() => app.goTab("translate")}>
                <Languages size={17} /> Translate a menu
              </button>
            </>
          ) : (
            app.translations.map((t, i) => (
              <div key={i} className={s.infoCard} style={{ margin: "0 0 10px" }}>
                <div className={s.muted} style={{ fontSize: 12 }}>
                  {t.date}
                </div>
                <div style={{ color: "#ff6b35", fontWeight: 700, margin: "4px 0 6px" }}>Language: {t.lang}</div>
                {t.lines.map((l) => (
                  <div key={l} style={{ color: "#333" }}>
                    {l}
                  </div>
                ))}
              </div>
            ))
          )}
        </SheetFrame>
      );
    case "plans":
      return (
        <SheetFrame title="Upgrade Plan" onClose={onClose}>
          {PLANS.map((p) => (
            <div key={p.name} className={s.planCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <b style={{ fontSize: 17 }}>{p.name}</b>
                <span style={{ color: "#ff6b35", fontWeight: 700 }}>${p.price}/month</span>
              </div>
              <ul style={{ margin: "8px 0 0", display: "grid", gap: 3, fontSize: 13, color: "#555" }}>
                {p.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <button className={s.primaryBtn} style={{ margin: "12px 0 0", width: "100%" }} onClick={() => done("Demo: subscriptions and payments are disabled")}>
                Choose {p.name}
              </button>
            </div>
          ))}
        </SheetFrame>
      );
    case "password":
      return (
        <SheetFrame title="Reset Password" onClose={onClose}>
          <p className={s.muted}>We&apos;ll send a password reset link to this email address.</p>
          <input className={s.input} type="email" value={text} onChange={(e) => setText(e.target.value)} style={{ marginTop: 10 }} />
          <button className={s.primaryBtn} style={{ margin: "14px 0 0" }} disabled={!text.includes("@")} onClick={() => done("Demo: no email is sent")}>
            Send Reset Link
          </button>
        </SheetFrame>
      );
    case "logout":
      return (
        <SheetFrame title="Logout" onClose={onClose}>
          <p style={{ color: "#444" }}>Are you sure you want to log out?</p>
          <div className={s.twoBtns}>
            <button className={s.outlineBtn} onClick={onClose}>
              Cancel
            </button>
            <button className={s.primaryBtn} style={{ margin: 0, background: "#e53935" }} onClick={app.logout}>
              Logout
            </button>
          </div>
        </SheetFrame>
      );
  }
}

function LoginScreen({ onGuest }: { onGuest: () => void }) {
  const { toast } = useApp();
  return (
    <div className={s.login}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO} alt="" style={{ width: 96, height: 96, objectFit: "contain" }} />
      <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>Welcome back</h2>
      <p className={s.muted}>Sign in to continue exploring food cultures</p>
      <input className={s.input} placeholder="Email" style={{ marginTop: 22 }} />
      <input className={s.input} type="password" placeholder="Password" style={{ marginTop: 10 }} />
      <button className={s.primaryBtn} style={{ margin: "16px 0 0", width: "100%" }} onClick={() => toast("Demo: sign-in is disabled")}>
        Sign In
      </button>
      <button className={s.outlineBtn} style={{ marginTop: 10 }} onClick={onGuest}>
        Continue as guest
      </button>
    </div>
  );
}
