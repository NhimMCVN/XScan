import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  AlertCircle,
  Loader2,
  DollarSign,
  Zap,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Plus,
  Settings,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DepositHistoryDrawer } from "./DepositHistoryDrawer";
import { ProfileDashboardHeader } from "./ProfileDashboardHeader";
import { WalletQuickDepositPanel } from "./WalletQuickDepositPanel";
import { useGetProfileQuery } from "@/src/redux/queries/user.api";
import { useGetStreamerDonationsQuery } from "@/src/redux/queries/donate.api";
import type { DonationRecord } from "@/src/redux/queries/donate.api";
import {
  useGetMyStreamerChallengesQuery,
  type Challenge,
} from "@/src/redux/queries/challenges.api";
import {
  useGetTransactionHistoryQuery,
  unwrapTransactionHistory,
  type UnifiedTransactionItem,
} from "@/src/redux/queries/wallet.api";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const SIDEBAR_FETCH_LIMIT = 200;
const WITHDRAW_HISTORY_FETCH = 100;

function parseStreamerChallengesPayload(
  res: { success?: boolean; data?: unknown } | undefined,
): Challenge[] {
  if (!res?.data) return [];
  const inner = res.data;
  if (Array.isArray(inner)) return inner as Challenge[];
  if (typeof inner === "object") {
    const o = inner as Record<string, unknown>;
    const arr = o.data ?? o.items;
    if (Array.isArray(arr)) return arr as Challenge[];
  }
  return [];
}

function parseStreamerDonationsPayload(
  res: { success?: boolean; data?: unknown } | undefined,
): DonationRecord[] {
  if (res?.success === false) return [];
  if (!res?.data) return [];
  const inner = res.data;
  if (Array.isArray(inner)) return inner as DonationRecord[];
  if (typeof inner === "object") {
    const o = inner as Record<string, unknown>;
    const arr = o.data ?? o.items;
    if (Array.isArray(arr)) return arr as DonationRecord[];
  }
  return [];
}

/** Trạng thái UI — đồng bộ logic với StreamerChallengesView */
function normalizeChallengeStatus(raw?: string) {
  const u = (raw || "").toLowerCase().replace(/\s+/g, "_");
  if (
    u === "pending" ||
    u === "created" ||
    u === "open" ||
    u === "awaiting_streamer" ||
    u === "awaitingacceptance"
  )
    return "pending" as const;
  if (
    u === "accepted" ||
    u === "approved" ||
    u === "in_progress" ||
    u === "active" ||
    u === "ongoing"
  )
    return "accepted" as const;
  if (u === "completed" || u === "success") return "completed" as const;
  if (u === "rejected" || u === "cancelled" || u === "canceled")
    return "rejected" as const;
  if (u === "failed" || u === "failure") return "failed" as const;
  return "unknown" as const;
}

function donationCountsAsRevenue(d: DonationRecord): boolean {
  const s = String(d.status ?? "").toLowerCase();
  if (
    !s ||
    s === "completed" ||
    s === "success" ||
    s === "paid" ||
    s === "confirmed"
  )
    return true;
  return false;
}

function formatActivityTime(iso?: string) {
  if (!iso) return "—";
  const d = dayjs(iso);
  if (!d.isValid()) return String(iso);
  return d.format("DD/MM/YYYY HH:mm");
}

function txRowId(row: UnifiedTransactionItem): string {
  const id = row._id ?? row.id ?? row.reference ?? row.referenceCode;
  return id != null ? String(id) : "—";
}

/** BE có thể dùng type khác nhau cho rút / payout — lọc client tối đa 100 bản ghi gần nhất. */
function isWithdrawLikeTx(item: UnifiedTransactionItem): boolean {
  const t = String(item.type ?? "")
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (
    t.includes("withdraw") ||
    t.includes("payout") ||
    t === "cashout" ||
    t.includes("withdrawal")
  )
    return true;
  const desc = String(item.description ?? "").toLowerCase();
  return /rút tiền|withdraw|payout/.test(desc);
}

function assetPurchaseTitle(row: UnifiedTransactionItem): string {
  const d = row.detail;
  if (d && typeof d === "object") {
    const name = (d as Record<string, unknown>).name;
    if (typeof name === "string" && name.trim()) return name.trim();
    const title = (d as Record<string, unknown>).title;
    if (typeof title === "string" && title.trim()) return title.trim();
  }
  const ref = row.reference ?? row.referenceCode;
  if (typeof ref === "string" && ref.trim()) return ref.trim();
  if (typeof row.description === "string" && row.description.trim())
    return row.description.trim();
  return "Giao dịch";
}

function depositStatusBadgeClass(raw?: string) {
  const s = String(raw ?? "").toLowerCase();
  if (s === "completed" || s === "success" || s === "paid")
    return "bg-primary/10 text-primary";
  if (s === "pending" || s === "processing" || s === "accepted")
    return "bg-yellow-500/10 text-yellow-500";
  return "bg-destructive/10 text-destructive";
}

function depositStatusLabel(raw?: string) {
  const s = String(raw ?? "").toLowerCase();
  if (s === "completed" || s === "success" || s === "paid") return "THÀNH CÔNG";
  if (s === "pending" || s === "processing" || s === "accepted")
    return "ĐANG XỬ LÝ";
  if (s === "failed" || s === "failure") return "THẤT BẠI";
  if (s === "cancelled" || s === "canceled") return "ĐÃ HỦY";
  return raw ? String(raw).toUpperCase() : "—";
}

function challengeStatusBadgeClass(
  s: ReturnType<typeof normalizeChallengeStatus>,
) {
  if (s === "completed") return "bg-primary/10 text-primary";
  if (s === "pending" || s === "accepted")
    return "bg-yellow-500/10 text-yellow-500";
  if (s === "rejected" || s === "failed")
    return "bg-destructive/10 text-destructive";
  return "bg-outline/10 text-outline";
}

function challengeStatusTableLabel(
  s: ReturnType<typeof normalizeChallengeStatus>,
) {
  if (s === "completed") return "HOÀN THÀNH";
  if (s === "pending") return "CHỜ DUYỆT";
  if (s === "accepted") return "ĐANG LÀM";
  if (s === "rejected") return "TỪ CHỐI";
  if (s === "failed") return "THẤT BẠI";
  return "KHÁC";
}

function donorNameFromChallenge(c: Challenge): string {
  const donor = c.donor as
    | { displayName?: string; username?: string }
    | undefined;
  return String(donor?.displayName || donor?.username || "—").toUpperCase();
}

function donorNameFromDonation(d: DonationRecord): string {
  if (d.isAnonymous) return "ẨN DANH";
  const donor = d.donor as
    | { displayName?: string; username?: string }
    | undefined;
  return String(donor?.displayName || donor?.username || "—").toUpperCase();
}

function SocialIcon({ type }: { type: string }) {
  switch (type) {
    case "facebook":
      return <Facebook className="w-3 h-3 md:w-4 md:h-4" />;
    case "twitter":
      return <Twitter className="w-3 h-3 md:w-4 md:h-4" />;
    case "instagram":
      return <Instagram className="w-3 h-3 md:w-4 md:h-4" />;
    case "youtube":
      return <Youtube className="w-3 h-3 md:w-4 md:h-4" />;
    default:
      return null;
  }
}

export function StreamerDashboardView() {
  const { data: profileRes, isLoading: profileLoading } = useGetProfileQuery();
  const profile = profileRes?.success ? profileRes.data : undefined;

  const { data: donationsRes, isLoading: donationsLoading } =
    useGetStreamerDonationsQuery({
      page: 1,
      limit: SIDEBAR_FETCH_LIMIT,
    });
  const { data: challengesRes, isLoading: challengesLoading } =
    useGetMyStreamerChallengesQuery({
      page: 1,
      limit: SIDEBAR_FETCH_LIMIT,
    });

  const donationRows = useMemo(
    () => parseStreamerDonationsPayload(donationsRes),
    [donationsRes],
  );
  const challengeRows = useMemo(
    () => parseStreamerChallengesPayload(challengesRes),
    [challengesRes],
  );

  const donateRevenueVnd = useMemo(
    () =>
      donationRows
        .filter(donationCountsAsRevenue)
        .reduce((sum, d) => sum + (Number(d.amount ?? d.netAmount) || 0), 0),
    [donationRows],
  );

  const challengeEarnedVnd = useMemo(
    () =>
      challengeRows
        .filter((c) => normalizeChallengeStatus(c.status) === "completed")
        .reduce((sum, c) => sum + (Number(c.amount) || 0), 0),
    [challengeRows],
  );

  /** Thử thách đang mở: chờ streamer hoặc đã accept, chưa complete / reject / fail. */
  const openChallengesCount = useMemo(
    () =>
      challengeRows.filter((c) => {
        const s = normalizeChallengeStatus(c.status);
        return s === "pending" || s === "accepted";
      }).length,
    [challengeRows],
  );

  const totalRevenueVnd = useMemo(() => {
    const t = profile?.totalAll;
    if (typeof t === "number" && !Number.isNaN(t)) return t;
    return donateRevenueVnd + challengeEarnedVnd;
  }, [profile?.totalAll, donateRevenueVnd, challengeEarnedVnd]);

  const totalRevenueDisplayReady = useMemo(() => {
    if (
      typeof profile?.totalAll === "number" &&
      !Number.isNaN(profile.totalAll)
    )
      return !profileLoading;
    return !profileLoading && !donationsLoading && !challengesLoading;
  }, [profile?.totalAll, profileLoading, donationsLoading, challengesLoading]);

  const hasStreamerSocial =
    !!profile &&
    !!(
      profile.twitterHandle ||
      profile.youtubeChannel ||
      profile.facebookHandle ||
      profile.instagramHandle
    );

  const [historyTab, setHistoryTab] = useState("deposit");
  const [currentPage, setCurrentPage] = useState(1);
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [historyTab]);

  const { data: txDepositRes, isLoading: txDepositLoading } =
    useGetTransactionHistoryQuery(
      { type: "deposit", page: currentPage, limit: itemsPerPage },
      { skip: historyTab !== "deposit" },
    );

  const { data: txAssetRes, isLoading: txAssetLoading } =
    useGetTransactionHistoryQuery(
      { type: "asset_purchase", page: currentPage, limit: itemsPerPage },
      { skip: historyTab !== "battle" },
    );

  const { data: txWithdrawPoolRes, isLoading: txWithdrawLoading } =
    useGetTransactionHistoryQuery(
      { page: 1, limit: WITHDRAW_HISTORY_FETCH },
      { skip: historyTab !== "withdraw" },
    );

  const depositHistory = useMemo(
    () => unwrapTransactionHistory(txDepositRes),
    [txDepositRes],
  );

  const assetPurchaseHistory = useMemo(
    () => unwrapTransactionHistory(txAssetRes),
    [txAssetRes],
  );

  const withdrawRows = useMemo(() => {
    const { rows } = unwrapTransactionHistory(txWithdrawPoolRes);
    return rows.filter(isWithdrawLikeTx);
  }, [txWithdrawPoolRes]);

  const withdrawPageRows = useMemo(
    () =>
      withdrawRows.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
      ),
    [withdrawRows, currentPage, itemsPerPage],
  );

  const challengeHistoryPageRows = useMemo(
    () =>
      challengeRows.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
      ),
    [challengeRows, currentPage, itemsPerPage],
  );

  const donationHistoryPageRows = useMemo(
    () =>
      donationRows.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
      ),
    [donationRows, currentPage, itemsPerPage],
  );

  const renderPagination = (totalItems: number) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
      <div className="p-4 border-t border-outline-variant/5">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className={`cursor-pointer text-[10px] font-bold tracking-widest uppercase rounded-none border-outline-variant/20 hover:bg-primary hover:text-black ${currentPage === 1 ? "opacity-50 pointer-events-none" : ""}`}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  onClick={() => setCurrentPage(i + 1)}
                  isActive={currentPage === i + 1}
                  className={`cursor-pointer text-[10px] font-bold rounded-none border-outline-variant/20 ${currentPage === i + 1 ? "bg-primary text-black border-primary" : "hover:bg-primary/10 text-outline"}`}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                className={`cursor-pointer text-[10px] font-bold tracking-widest uppercase rounded-none border-outline-variant/20 hover:bg-primary hover:text-black ${currentPage === totalPages ? "opacity-50 pointer-events-none" : ""}`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-surface relative">
      <div className="scanline" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
          <ProfileDashboardHeader />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <button
              type="button"
              className="flex items-center gap-3 bg-surface-container/50 p-2.5 md:p-3 rounded-[12px] border border-outline-variant/5 cursor-pointer hover:bg-surface-container-highest/20 transition-colors text-left w-full"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("navigate", { detail: "OBS_SETTINGS" }),
                )
              }
            >
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Settings className="w-3 h-3 md:w-4 md:h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] md:text-[10px] text-outline uppercase font-bold tracking-widest">
                  Cấu hình
                </p>
                <p className="text-xs md:text-sm font-medium">
                  OBS Alert Settings
                </p>
              </div>
            </button>
          </div>

          {profile && (profile.bio || hasStreamerSocial) ? (
            <section className="bg-surface-container/30 p-3 md:p-4 rounded-[12px] border border-outline-variant/5">
              <p className="text-[9px] md:text-[10px] text-outline uppercase font-bold tracking-widest mb-1.5 md:mb-2">
                Giới thiệu và mạng xã hội
              </p>
              {profile.bio ? (
                <p className="text-xs md:text-sm text-foreground/80 leading-relaxed italic mb-3 whitespace-pre-wrap">
                  {profile.bio}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-3">
                {profile.twitterHandle ? (
                  <a
                    href={`https://twitter.com/${profile.twitterHandle.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-outline hover:text-primary transition-colors"
                  >
                    <SocialIcon type="twitter" />
                  </a>
                ) : null}
                {profile.youtubeChannel ? (
                  <a
                    href={
                      profile.youtubeChannel.startsWith("http")
                        ? profile.youtubeChannel
                        : `https://youtube.com/${profile.youtubeChannel}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-outline hover:text-primary transition-colors"
                  >
                    <SocialIcon type="youtube" />
                  </a>
                ) : null}
                {profile.facebookHandle ? (
                  <a
                    href={
                      profile.facebookHandle.startsWith("http")
                        ? profile.facebookHandle
                        : `https://facebook.com/${profile.facebookHandle}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-outline hover:text-primary transition-colors"
                  >
                    <SocialIcon type="facebook" />
                  </a>
                ) : null}
                {profile.instagramHandle ? (
                  <a
                    href={`https://instagram.com/${profile.instagramHandle.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-outline hover:text-primary transition-colors"
                  >
                    <SocialIcon type="instagram" />
                  </a>
                ) : null}
              </div>
            </section>
          ) : null}

          {/* Collapsible Top-up Section */}
          <section className="space-y-3 md:space-y-4">
            <button
              onClick={() => setIsTopupOpen(!isTopupOpen)}
              className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-2 md:gap-3 border-l-2 md:border-l-4 border-primary pl-3 md:pl-4">
                <h2 className="text-lg md:text-xl font-bold tracking-tight uppercase">
                  Nạp tiền
                </h2>
              </div>
              {isTopupOpen ? (
                <ChevronUp className="w-5 h-5 text-outline" />
              ) : (
                <ChevronDown className="w-5 h-5 text-outline" />
              )}
            </button>

            <AnimatePresence>
              {isTopupOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-surface-container-low border border-outline-variant/10 rounded-[12px]"
                >
                  <WalletQuickDepositPanel variant="embedded" />
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* History Section */}
          <section className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-2 md:gap-3 border-l-2 md:border-l-4 border-primary pl-3 md:pl-4">
              <h2 className="text-lg md:text-xl font-bold tracking-tight uppercase">
                Lịch sử hoạt động
              </h2>
            </div>

            <div className="bg-surface-container-low border border-outline-variant/10 rounded-[12px] overflow-hidden">
              <Tabs
                value={historyTab}
                onValueChange={setHistoryTab}
                className="w-full flex flex-col"
              >
                <div className="border-b border-outline-variant/10 p-1.5 md:p-2 bg-surface-container-lowest/50">
                  <TabsList className="bg-transparent h-auto p-0 flex gap-1 md:gap-2">
                    <TabsTrigger
                      value="withdraw"
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary border border-transparent rounded-[8px] text-[9px] md:text-[10px] font-bold tracking-widest uppercase px-3 md:px-4 py-1.5 md:py-2"
                    >
                      Rút tiền
                    </TabsTrigger>
                    <TabsTrigger
                      value="battle"
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary border border-transparent rounded-[8px] text-[9px] md:text-[10px] font-bold tracking-widest uppercase px-3 md:px-4 py-1.5 md:py-2"
                    >
                      Giao dịch Battle
                    </TabsTrigger>
                    <TabsTrigger
                      value="deposit"
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary border border-transparent rounded-[8px] text-[9px] md:text-[10px] font-bold tracking-widest uppercase px-3 md:px-4 py-1.5 md:py-2"
                    >
                      Nạp tiền
                    </TabsTrigger>
                    <TabsTrigger
                      value="challenge"
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary border border-transparent rounded-[8px] text-[9px] md:text-[10px] font-bold tracking-widest uppercase px-3 md:px-4 py-1.5 md:py-2"
                    >
                      Thử thách
                    </TabsTrigger>
                    <TabsTrigger
                      value="donate"
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary border border-transparent rounded-[8px] text-[9px] md:text-[10px] font-bold tracking-widest uppercase px-3 md:px-4 py-1.5 md:py-2"
                    >
                      Donate
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent
                  value="withdraw"
                  className="m-0 border-none outline-none"
                >
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-outline-variant/10 hover:bg-transparent">
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10">
                            Mã GD
                          </TableHead>
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10">
                            Số tiền
                          </TableHead>
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10 text-right">
                            Thời gian
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {txWithdrawLoading ? (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="py-8 text-center text-outline"
                            >
                              <Loader2 className="w-5 h-5 animate-spin inline mr-2 align-middle" />
                              <span className="text-xs">Đang tải…</span>
                            </TableCell>
                          </TableRow>
                        ) : withdrawPageRows.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="py-8 text-center text-xs text-outline"
                            >
                              Không có giao dịch rút
                            </TableCell>
                          </TableRow>
                        ) : (
                          withdrawPageRows.map((wd) => (
                            <TableRow
                              key={txRowId(wd)}
                              className="border-outline-variant/5 hover:bg-surface-container/50 transition-colors"
                            >
                              <TableCell className="font-mono text-[9px] md:text-[10px] text-foreground py-2 md:py-3">
                                {txRowId(wd)}
                              </TableCell>
                              <TableCell className="py-2 md:py-3">
                                <span className="text-[10px] md:text-xs font-bold text-primary">
                                  {(Number(wd.amount) || 0).toLocaleString(
                                    "vi-VN",
                                  )}{" "}
                                  {String(wd.currency || "VND").toUpperCase()}
                                </span>
                              </TableCell>
                              <TableCell className="text-right text-[8px] md:text-[9px] font-mono text-outline py-2 md:py-3">
                                {formatActivityTime(wd.createdAt)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                  {renderPagination(withdrawRows.length)}
                </TabsContent>

                <TabsContent
                  value="deposit"
                  className="m-0 border-none outline-none"
                >
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-outline-variant/10 hover:bg-transparent">
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10">
                            Mã GD
                          </TableHead>
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10">
                            Số lượng
                          </TableHead>
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10">
                            Thời gian
                          </TableHead>
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10 text-right">
                            Trạng thái
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {txDepositLoading ? (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="py-8 text-center text-outline"
                            >
                              <Loader2 className="w-5 h-5 animate-spin inline mr-2 align-middle" />
                              <span className="text-xs">Đang tải…</span>
                            </TableCell>
                          </TableRow>
                        ) : depositHistory.rows.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="py-8 text-center text-xs text-outline"
                            >
                              Chưa có giao dịch nạp
                            </TableCell>
                          </TableRow>
                        ) : (
                          depositHistory.rows.map((tx) => (
                            <TableRow
                              key={txRowId(tx)}
                              className="border-outline-variant/5 hover:bg-surface-container/50 transition-colors"
                            >
                              <TableCell className="font-mono text-[9px] md:text-[10px] text-foreground py-2 md:py-3">
                                {txRowId(tx)}
                              </TableCell>
                              <TableCell className="py-2 md:py-3">
                                <span className="text-[10px] md:text-xs font-bold text-primary">
                                  {(Number(tx.amount) || 0).toLocaleString(
                                    "vi-VN",
                                  )}{" "}
                                  {String(tx.currency || "VND").toUpperCase()}
                                </span>
                              </TableCell>
                              <TableCell className="text-[8px] md:text-[9px] font-mono text-outline py-2 md:py-3">
                                {formatActivityTime(tx.createdAt)}
                              </TableCell>
                              <TableCell className="text-right py-2 md:py-3">
                                <Badge
                                  variant="outline"
                                  className={`text-[7px] md:text-[8px] font-bold tracking-widest uppercase rounded-none border-none px-1.5 md:px-2 py-0.5 md:py-1 ${depositStatusBadgeClass(tx.status)}`}
                                >
                                  {depositStatusLabel(tx.status)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                  {renderPagination(depositHistory.total)}
                </TabsContent>

                <TabsContent
                  value="challenge"
                  className="m-0 border-none outline-none"
                >
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-outline-variant/10 hover:bg-transparent">
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10">
                            Mã TT
                          </TableHead>
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10">
                            Donor
                          </TableHead>
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10">
                            Nội dung
                          </TableHead>
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10">
                            Số lượng
                          </TableHead>
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10 text-right">
                            Trạng thái
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {challengesLoading ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="py-8 text-center text-outline"
                            >
                              <Loader2 className="w-5 h-5 animate-spin inline mr-2 align-middle" />
                              <span className="text-xs">Đang tải…</span>
                            </TableCell>
                          </TableRow>
                        ) : challengeRows.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="py-8 text-center text-xs text-outline"
                            >
                              Chưa có thử thách.
                            </TableCell>
                          </TableRow>
                        ) : (
                          challengeHistoryPageRows.map((ch) => {
                            const cid = String(ch._id ?? ch.id ?? "");
                            const ui = normalizeChallengeStatus(ch.status);
                            return (
                              <TableRow
                                key={cid}
                                className="border-outline-variant/5 hover:bg-surface-container/50 transition-colors"
                              >
                                <TableCell className="font-mono text-[9px] md:text-[10px] text-foreground py-2 md:py-3">
                                  {cid || "—"}
                                </TableCell>
                                <TableCell className="text-[9px] md:text-[10px] font-bold uppercase py-2 md:py-3">
                                  {donorNameFromChallenge(ch)}
                                </TableCell>
                                <TableCell className="text-[9px] md:text-[10px] text-outline max-w-[150px] md:max-w-[200px] truncate py-2 md:py-3">
                                  {String(ch.content ?? "—")}
                                </TableCell>
                                <TableCell className="py-2 md:py-3">
                                  <span className="text-[10px] md:text-xs font-bold text-primary">
                                    {(Number(ch.amount) || 0).toLocaleString(
                                      "vi-VN",
                                    )}{" "}
                                    VND
                                  </span>
                                </TableCell>
                                <TableCell className="text-right py-2 md:py-3">
                                  <Badge
                                    variant="outline"
                                    className={`text-[7px] md:text-[8px] font-bold tracking-widest uppercase rounded-none border-none px-1.5 md:px-2 py-0.5 md:py-1 ${challengeStatusBadgeClass(ui)}`}
                                  >
                                    {challengeStatusTableLabel(ui)}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                  {renderPagination(challengeRows.length)}
                </TabsContent>

                <TabsContent
                  value="donate"
                  className="m-0 border-none outline-none"
                >
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-outline-variant/10 hover:bg-transparent">
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10">
                            Mã Donate
                          </TableHead>
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10">
                            Donor
                          </TableHead>
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10">
                            Lời nhắn
                          </TableHead>
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10">
                            Số lượng
                          </TableHead>
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10 text-right">
                            Thời gian
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {donationsLoading ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="py-8 text-center text-outline"
                            >
                              <Loader2 className="w-5 h-5 animate-spin inline mr-2 align-middle" />
                              <span className="text-xs">Đang tải…</span>
                            </TableCell>
                          </TableRow>
                        ) : donationRows.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="py-8 text-center text-xs text-outline"
                            >
                              Chưa có donate.
                            </TableCell>
                          </TableRow>
                        ) : (
                          donationHistoryPageRows.map((don) => {
                            const did = String(don._id ?? don.id ?? "");
                            return (
                              <TableRow
                                key={did}
                                className="border-outline-variant/5 hover:bg-surface-container/50 transition-colors"
                              >
                                <TableCell className="font-mono text-[9px] md:text-[10px] text-foreground py-2 md:py-3">
                                  {did || "—"}
                                </TableCell>
                                <TableCell className="text-[9px] md:text-[10px] font-bold uppercase py-2 md:py-3">
                                  {donorNameFromDonation(don)}
                                </TableCell>
                                <TableCell className="text-[9px] md:text-[10px] text-outline max-w-[150px] md:max-w-[200px] truncate py-2 md:py-3">
                                  {String(don.message ?? "—")}
                                </TableCell>
                                <TableCell className="py-2 md:py-3">
                                  <span className="text-[10px] md:text-xs font-bold text-primary">
                                    {(
                                      Number(don.amount ?? don.netAmount) || 0
                                    ).toLocaleString("vi-VN")}{" "}
                                    {String(
                                      don.currency || "VND",
                                    ).toUpperCase()}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right text-[8px] md:text-[9px] font-mono text-outline py-2 md:py-3">
                                  {formatActivityTime(don.createdAt)}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                  {renderPagination(donationRows.length)}
                </TabsContent>

                <TabsContent
                  value="battle"
                  className="m-0 border-none outline-none"
                >
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-outline-variant/10 hover:bg-transparent">
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10">
                            Mã GD
                          </TableHead>
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10">
                            Mô tả
                          </TableHead>
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10">
                            Số tiền
                          </TableHead>
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10 text-right">
                            Thời gian
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {txAssetLoading ? (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="py-8 text-center text-outline"
                            >
                              <Loader2 className="w-5 h-5 animate-spin inline mr-2 align-middle" />
                              <span className="text-xs">Đang tải…</span>
                            </TableCell>
                          </TableRow>
                        ) : assetPurchaseHistory.rows.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="py-8 text-center text-xs text-outline"
                            >
                              Chưa có giao dịch mua.
                            </TableCell>
                          </TableRow>
                        ) : (
                          assetPurchaseHistory.rows.map((bt) => (
                            <TableRow
                              key={txRowId(bt)}
                              className="border-outline-variant/5 hover:bg-surface-container/50 transition-colors"
                            >
                              <TableCell className="font-mono text-[9px] md:text-[10px] text-foreground py-2 md:py-3">
                                {txRowId(bt)}
                              </TableCell>
                              <TableCell className="text-[9px] md:text-[10px] font-bold uppercase py-2 md:py-3 max-w-[200px] truncate">
                                {assetPurchaseTitle(bt)}
                              </TableCell>
                              <TableCell className="py-2 md:py-3">
                                <span className="text-[10px] md:text-xs font-bold text-primary">
                                  {(Number(bt.amount) || 0).toLocaleString(
                                    "vi-VN",
                                  )}{" "}
                                  {String(bt.currency || "VND").toUpperCase()}
                                </span>
                              </TableCell>
                              <TableCell className="text-right text-[8px] md:text-[9px] font-mono text-outline py-2 md:py-3">
                                {formatActivityTime(bt.createdAt)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                  {renderPagination(assetPurchaseHistory.total)}
                </TabsContent>
              </Tabs>
            </div>
          </section>
        </div>
      </div>

      {/* Right Sidebar: Management */}
      <aside className="w-full md:w-80 shrink-0 border-l border-outline-variant/10 bg-surface-container-lowest/50 flex flex-col overflow-hidden relative z-10">
        <ScrollArea className="flex-1">
          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Total Revenue — GET /users/profile (totalAll) hoặc tổng tạm từ donate + challenge đã hoàn thành */}
            <div className="space-y-0.5">
              <p className="text-[9px] text-outline font-bold tracking-widest uppercase">
                Tổng doanh thu
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-primary tracking-tighter">
                  {!totalRevenueDisplayReady
                    ? "…"
                    : totalRevenueVnd.toLocaleString("vi-VN")}
                </span>
                <span className="text-[10px] font-bold text-primary">VND</span>
              </div>
            </div>

            <div className="h-px bg-outline-variant/10 w-full" />

            {/* Revenue from Donation */}
            <div
              className="bg-surface-container-low border border-outline-variant/10 p-3 rounded-[12px] cursor-pointer hover:border-primary/30 transition-all flex items-center justify-between group"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("navigate", { detail: "STREAMER_DONATIONS" }),
                )
              }
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-primary/10 flex items-center justify-center text-primary">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9px] text-outline font-bold tracking-widest uppercase">
                    Donate
                  </p>
                  <p className="text-xs font-bold text-foreground">
                    {donationsLoading
                      ? "…"
                      : `${donateRevenueVnd.toLocaleString("vi-VN")} VND`}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-outline group-hover:text-primary" />
            </div>

            {/* Revenue from Challenge */}
            <div
              className="bg-surface-container-low border border-outline-variant/10 p-3 rounded-[12px] cursor-pointer hover:border-primary/30 transition-all flex items-center justify-between group"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("navigate", {
                    detail: "STREAMER_CHALLENGES",
                  }),
                )
              }
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-primary/10 flex items-center justify-center text-primary relative">
                  <Zap className="w-4 h-4" />
                  {openChallengesCount > 0 ? (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 bg-yellow-500 text-[8px] font-bold text-black rounded-full flex items-center justify-center tabular-nums">
                      {openChallengesCount > 99 ? "99+" : openChallengesCount}
                    </span>
                  ) : null}
                </div>
                <div>
                  <p className="text-[9px] text-outline font-bold tracking-widest uppercase">
                    Challenge
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {challengesLoading
                      ? "…"
                      : `${challengeEarnedVnd.toLocaleString("vi-VN")} VND`}
                  </p>
                  <p className="text-[8px] text-outline mt-0.5">
                    Doanh thu thử thách đã hoàn thành
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-outline group-hover:text-primary" />
            </div>

            {/* Donation Link Management */}
            <div
              className="bg-surface-container-low border border-outline-variant/10 p-4 rounded-[12px] cursor-pointer hover:border-primary/30 transition-all flex items-center justify-between group"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("navigate", { detail: "DONATION_LINKS" }),
                )
              }
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-primary/10 flex items-center justify-center text-primary">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-foreground group-hover:text-primary">
                  Quản lý Donation Link
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-outline group-hover:text-primary" />
            </div>

            {/* OBS Settings */}
            <div
              className="bg-surface-container-low border border-outline-variant/10 p-4 rounded-[12px] cursor-pointer hover:border-primary/30 transition-all flex items-center justify-between group"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("navigate", { detail: "OBS_SETTINGS" }),
                )
              }
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-primary/10 flex items-center justify-center text-primary">
                  <Settings className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-foreground group-hover:text-primary">
                  OBS Setting
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-outline group-hover:text-primary" />
            </div>
          </div>
        </ScrollArea>
      </aside>
    </div>
  );
}
