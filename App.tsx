import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { BarChart3, Coins, History, Keyboard, Moon, RotateCw, Sparkles, Sun } from 'lucide-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

type FlipResult = 'Heads' | 'Tails';

type FlipEntry = {
  id: number;
  result: FlipResult;
  timestamp: number;
};

const HISTORY_KEY = 'flip-history';
const THEME_KEY = 'flip-theme';

function readHistory(): FlipEntry[] {
  try {
    const stored = window.localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is FlipEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        (entry as FlipEntry).result !== undefined &&
        ((entry as FlipEntry).result === 'Heads' || (entry as FlipEntry).result === 'Tails') &&
        typeof (entry as FlipEntry).timestamp === 'number',
    );
  } catch {
    return [];
  }
}

function formatFlipTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(timestamp);
}

function Home() {
  const [history, setHistory] = useState<FlipEntry[]>(readHistory);
  const [currentResult, setCurrentResult] = useState<FlipResult>('Heads');
  const [isFlipping, setIsFlipping] = useState(false);
  const [isDark, setIsDark] = useState(() => window.localStorage.getItem(THEME_KEY) === 'dark');
  const coinRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => {
    const heads = history.filter((entry) => entry.result === 'Heads').length;
    const tails = history.length - heads;
    return {
      heads,
      tails,
      total: history.length,
      headsPercent: history.length ? Math.round((heads / history.length) * 100) : 0,
      tailsPercent: history.length ? Math.round((tails / history.length) * 100) : 0,
    };
  }, [history]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    window.localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.key === ' ' || event.key === 'Enter') && !isFlipping) {
        const target = event.target as HTMLElement | null;
        if (target?.tagName === 'BUTTON' || target?.tagName === 'INPUT' || target?.isContentEditable) return;
        event.preventDefault();
        flipCoin();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFlipping]);

  const flipCoin = () => {
    if (isFlipping) return;
    const result: FlipResult = Math.random() < 0.5 ? 'Heads' : 'Tails';
    const startRotation = currentResult === 'Heads' ? 0 : 180;
    const landingRotation = result === currentResult ? startRotation + 1440 : startRotation + 1620;

    setIsFlipping(true);

    const coin = coinRef.current;
    coin?.getAnimations().forEach((animation) => animation.cancel());
    coin?.animate(
      [
        { transform: `rotateX(${startRotation}deg)` },
        { transform: `rotateX(${startRotation + (landingRotation - startRotation) * 0.35}deg)`, offset: 0.35 },
        { transform: `rotateX(${startRotation + (landingRotation - startRotation) * 0.72}deg)`, offset: 0.72 },
        { transform: `rotateX(${landingRotation}deg)` },
      ],
      {
        duration: 980,
        easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
        fill: 'forwards',
      },
    );

    window.setTimeout(() => {
      setCurrentResult(result);
      setHistory((previous) => [
        { id: Date.now(), result, timestamp: Date.now() },
        ...previous,
      ]);
      setIsFlipping(false);
    }, 980);
  };

  const resetHistory = () => {
    if (history.length === 0) return;
    if (window.confirm('Clear your flip history?')) {
      setHistory([]);
    }
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" data-testid="link-home" aria-label="Flip home">
          <span className="brand-mark">f</span>
          <span className="brand-word">flip.</span>
        </a>
        <div className="header-actions">
          <div className="kbd-chip" aria-label="Keyboard shortcut">
            <Keyboard size={13} aria-hidden="true" />
            <span className="kbd-key">space</span>
            to flip
          </div>
          <button
            className="theme-button"
            type="button"
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            data-testid="button-toggle-theme"
            onClick={() => setIsDark((value) => !value)}
          >
            {isDark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow"><Sparkles size={13} aria-hidden="true" /> a tiny decision ritual</p>
          <h1 id="page-title">Let the coin<br /><em>make the call.</em></h1>
          <p className="intro-copy">
            No overthinking. One clean flip, a little suspense, and an answer you can actually move with.
          </p>
        </section>

        <div className="main-grid">
          <section className="flip-card" aria-labelledby="flip-card-title">
            <div className="card-topline">
              <span id="flip-card-title"><span className="live-dot" /> coin is ready</span>
              <span>{String(counts.total).padStart(2, '0')} flips logged</span>
            </div>

            <div className={`coin-stage${isFlipping ? ' is-busy' : ''}`} aria-live="polite">
              <div className="orbit" aria-hidden="true" />
              <div className="coin-shadow" aria-hidden="true" />
              <div
                ref={coinRef}
                className="coin"
                data-testid="display-coin"
                style={{
                  transform: `rotateX(${currentResult === 'Heads' ? 0 : 180}deg)`,
                  transformStyle: 'preserve-3d',
                  willChange: 'transform',
                  background: 'hsl(var(--sidebar-primary))',
                  backgroundImage: 'none',
                  boxShadow: 'none',
                  border: '2px solid hsl(var(--primary))',
                }}
              >
                <div
                  className="coin-face"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'hsl(var(--sidebar-primary))',
                    backgroundImage: 'none',
                    boxShadow: 'none',
                    border: 'none',
                    backfaceVisibility: 'hidden',
                    transform: 'translateZ(1px)',
                  }}
                >
                  <span className="coin-letter">H</span>
                  <span className="coin-caption">your answer</span>
                </div>
                <div
                  className="coin-face"
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'hsl(var(--sidebar-primary))',
                    backgroundImage: 'none',
                    boxShadow: 'none',
                    border: 'none',
                    backfaceVisibility: 'hidden',
                    transform: 'rotateX(180deg) translateZ(1px)',
                  }}
                >
                  <span className="coin-letter">T</span>
                  <span className="coin-caption">your answer</span>
                </div>
              </div>
            </div>

            <div className="result-label" data-testid="text-current-result" aria-live="polite">
              <small>{isFlipping ? 'deciding now' : 'current result'}</small>
              {isFlipping ? 'In the air' : currentResult}
            </div>

            <button
              className="flip-button"
              type="button"
              onClick={flipCoin}
              disabled={isFlipping}
              data-testid="button-flip-coin"
              style={{
                background: 'hsl(var(--primary))',
                backgroundImage: 'none',
                boxShadow: 'none',
                border: '1px solid hsl(var(--primary))',
              }}
            >
              <RotateCw size={20} aria-hidden="true" />
              {isFlipping ? 'Tossing…' : 'Flip the coin'}
            </button>
          </section>

          <aside className="side-column">
            <section className="panel stats-panel" aria-labelledby="stats-title">
              <div className="panel-heading">
                <h2 id="stats-title">The tally</h2>
                <BarChart3 size={17} aria-hidden="true" />
              </div>
              <div className="stat-grid">
                <div className="stat stat-heads" data-testid="stat-heads">
                  <span className="stat-label">Heads</span>
                  <strong className="stat-value">{counts.heads}</strong>
                  <span className="stat-percent">{counts.headsPercent}% of flips</span>
                </div>
                <div className="stat stat-tails" data-testid="stat-tails">
                  <span className="stat-label">Tails</span>
                  <strong className="stat-value">{counts.tails}</strong>
                  <span className="stat-percent">{counts.tailsPercent}% of flips</span>
                </div>
              </div>
            </section>

            <section className="panel history-panel" aria-labelledby="history-title">
              <div className="panel-heading">
                <div>
                  <h2 id="history-title">Recent flips</h2>
                  <span>{counts.total ? `${counts.total} total` : 'nothing yet'}</span>
                </div>
                <button
                  className="reset-button"
                  type="button"
                  onClick={resetHistory}
                  disabled={history.length === 0}
                  data-testid="button-reset-history"
                >
                  <RotateCw size={12} aria-hidden="true" /> reset
                </button>
              </div>
              {history.length === 0 ? (
                <div className="empty-history" data-testid="empty-history">
                  <div>
                    <Coins size={24} aria-hidden="true" />
                    <p>Your next answer<br />will land here.</p>
                    <small>make a call above</small>
                  </div>
                </div>
              ) : (
                <ol className="history-list" data-testid="list-history">
                  {history.slice(0, 6).map((entry, index) => (
                    <li
                      className="history-item"
                      key={entry.id}
                      style={{ animationDelay: `${index * 55}ms` }}
                      data-testid={`row-history-${entry.id}`}
                    >
                      <span className="history-item-left">
                        <span className={`history-dot${entry.result === 'Tails' ? ' tails' : ''}`} aria-hidden="true" />
                        <span className="history-result">{entry.result}</span>
                      </span>
                      <span className="history-time">{formatFlipTime(entry.timestamp)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </aside>
        </div>

        <footer className="footer-note">
          <span><History size={12} aria-hidden="true" /> &nbsp;your flips stay in this browser</span>
          <span>{isFlipping ? 'trust the toss' : 'heads or tails — no in-between'}</span>
        </footer>
      </main>
    </div>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
