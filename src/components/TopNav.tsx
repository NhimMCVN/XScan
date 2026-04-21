import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Search, LogOut, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  pathFromView,
  STREAMERS_SEARCH_FROM_HEADER_SESSION_KEY,
} from "@/src/utils/appNavigation";
import type { RootState } from "@/src/redux";
import { isStreamerRole } from "@/src/utils/userRole";
import { useDiscoverStreamersQuery } from "@/src/redux/queries/donate.api";
import type { StreamerProfile } from "@/src/redux/queries/donate.api";
import { useGetMyWalletQuery } from "@/src/redux/queries/wallet.api";
import { useGetProfileQuery } from "@/src/redux/queries/user.api";
import { absoluteApiUrl } from "@/src/utils/absoluteApiUrl";

const NAV_ITEMS = [
  { id: "MATCHES", label: "TRANG CHỦ" },
  { id: "STREAMERS", label: "STREAMERS" },
  { id: "STREAMER_CHALLENGES", label: "THỬ THÁCH" },
  { id: "BECOME_STREAMER", label: "TRỞ THÀNH STREAMER" },
] as const;

const AVATAR_FALLBACK = "https://placehold.co/100x100/1a1a1a/666666?text=X";

interface TopNavProps {
  currentView: string;
}

function streamerSearchLabel(p: StreamerProfile): string {
  return String(p.displayName || p.username || p._id || "").trim();
}

export function TopNav({ currentView }: TopNavProps) {
  const userRole = useSelector((s: RootState) => s.auth.user?.role);
  const navItems = useMemo(
    () =>
      NAV_ITEMS.filter(
        (item) => item.id !== "BECOME_STREAMER" || !isStreamerRole(userRole),
      ),
    [userRole],
  );

  const [searchDraft, setSearchDraft] = useState("");
  const deferredSearch = useDeferredValue(searchDraft.trim());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const discoverSkip = deferredSearch.length < 2;
  const { data: discoverRes, isFetching: discoverFetching } =
    useDiscoverStreamersQuery(
      { search: deferredSearch, page: 1, limit: 8 },
      { skip: discoverSkip },
    );

  const streamers = discoverRes?.data?.streamers ?? [];

  const { data: profileRes } = useGetProfileQuery();
  const profile = profileRes?.data;
  const avatarSrc =
    profile?.profilePicture && typeof profile.profilePicture === "string"
      ? absoluteApiUrl(profile.profilePicture)
      : AVATAR_FALLBACK;

  const { data: walletRes, isLoading: walletLoading } = useGetMyWalletQuery();
  const wallet = walletRes?.data;
  const balanceLabel = useMemo(() => {
    if (walletLoading && wallet == null) return "…";
    if (!wallet || typeof wallet.balanceVnd !== "number") return "—";
    const v = Number(wallet.balanceVnd);
    if (!Number.isFinite(v)) return "—";
    return `${v.toLocaleString("vi-VN")} VND`;
  }, [walletLoading, wallet]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (
        searchWrapRef.current &&
        !searchWrapRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [dropdownOpen]);

  const goStreamersWithSearch = (q: string) => {
    const t = q.trim();
    try {
      if (t)
        sessionStorage.setItem(STREAMERS_SEARCH_FROM_HEADER_SESSION_KEY, t);
      else sessionStorage.removeItem(STREAMERS_SEARCH_FROM_HEADER_SESSION_KEY);
    } catch {
      /* ignore */
    }
    setDropdownOpen(false);
    window.dispatchEvent(new CustomEvent("navigate", { detail: "STREAMERS" }));
  };

  return (
    <nav className="h-16 border-b border-outline-variant/10 bg-surface flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("navigate", { detail: "MATCHES" }),
            )
          }
        >
          <div className="w-8 h-8 bg-primary flex items-center justify-center rotate-45 group-hover:scale-110 transition-transform">
            <span className="text-on-primary font-bold text-xl -rotate-45">
              X
            </span>
          </div>
          <span
            className={cn(
              "font-display font-bold text-2xl tracking-tighter italic transition-colors text-primary",
            )}
          >
            XScan
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const active = currentView === item.id;
            return (
              <a
                key={item.id}
                href={pathFromView(item.id)}
                onClick={(e) => {
                  e.preventDefault();
                  window.dispatchEvent(
                    new CustomEvent("navigate", { detail: item.id }),
                  );
                }}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "font-bold px-1 text-xs tracking-widest uppercase transition-colors",
                  active ? "text-primary" : "text-outline hover:text-primary",
                )}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      </div>

      <div
        className="flex items-center gap-4 flex-1 max-w-md mx-8 relative"
        ref={searchWrapRef}
      >
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline pointer-events-none" />
          <Input
            placeholder="Tìm kiếm streamer"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onFocus={() => setDropdownOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                goStreamersWithSearch(searchDraft);
              }
            }}
            className="pl-10 bg-surface-container-highest border-none focus-visible:ring-primary/50 font-mono text-[10px] tracking-widest h-9"
            aria-autocomplete="list"
            aria-expanded={dropdownOpen}
          />
          <div className="absolute right-1 top-1 bottom-1 w-1 bg-primary/20 pointer-events-none" />
        </div>

        {dropdownOpen && !discoverSkip && (
          <div
            className="absolute left-0 right-0 top-full mt-1 z-60 max-h-72 overflow-y-auto rounded-md border border-outline-variant/20 bg-popover text-popover-foreground shadow-lg"
            role="listbox"
          >
            {discoverFetching && (
              <p className="px-3 py-2 text-[10px] font-mono uppercase text-outline">
                Đang tìm…
              </p>
            )}
            {!discoverFetching && streamers.length === 0 && (
              <p className="px-3 py-2 text-[10px] font-mono uppercase text-outline">
                Không có streamer khớp.
              </p>
            )}
            {streamers.map((p) => {
              const id = p._id != null ? String(p._id) : "";
              const label = streamerSearchLabel(p);
              const handle = p.username ? `@${p.username}` : "";
              const pic =
                typeof p.profilePicture === "string" && p.profilePicture
                  ? absoluteApiUrl(p.profilePicture)
                  : AVATAR_FALLBACK;
              if (!id) return null;
              return (
                <button
                  key={id}
                  type="button"
                  role="option"
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs hover:bg-accent/50"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => goStreamersWithSearch(label || handle || id)}
                >
                  <img
                    src={pic}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-sm object-cover border border-outline-variant/20"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold uppercase tracking-wide">
                      {label || "Streamer"}
                    </span>
                    {handle ? (
                      <span className="block truncate text-[10px] text-outline">
                        {handle}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
            {searchDraft.trim().length >= 2 && (
              <button
                type="button"
                className="w-full border-t border-outline-variant/15 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => goStreamersWithSearch(searchDraft)}
              >
                Xem tất cả kết quả →
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-highest/50 border border-outline-variant/10 min-w-0 max-w-[140px] sm:max-w-none">
          <Wallet className="w-4 h-4 text-primary shrink-0" />
          <span className="text-[10px] font-bold text-primary tracking-tight truncate">
            {balanceLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("navigate", { detail: "PROFILE" }),
            )
          }
          aria-label="Hồ sơ"
          aria-current={currentView === "PROFILE" ? "page" : undefined}
          className={cn(
            "w-10 h-10 border bg-surface-container-high p-0.5 transition-all cursor-pointer shrink-0",
            currentView === "PROFILE"
              ? "border-primary"
              : "border-outline-variant/30 hover:border-primary",
          )}
        >
          <div className="w-full h-full bg-surface-container overflow-hidden">
            <img
              src={avatarSrc}
              alt=""
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = AVATAR_FALLBACK;
              }}
            />
          </div>
        </button>
        <div className="h-8 w-px bg-outline-variant/20 mx-1 hidden sm:block" />
        <Button
          variant="ghost"
          size="icon"
          className="text-outline hover:text-destructive hover:bg-surface-container transition-colors shrink-0"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("navigate", { detail: "LOGOUT" }),
            )
          }
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </nav>
  );
}
