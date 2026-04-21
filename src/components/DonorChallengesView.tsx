import { useMemo, useState } from "react";
import { Sword, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import dayjs from "dayjs";
import type { Challenge } from "@/src/redux/queries/challenges.api";
import { useGetMyDonorChallengesQuery } from "@/src/redux/queries/challenges.api";
import { useAuthSelector } from "@/src/redux/slices/auth.slice";
import { isStreamerRole } from "@/src/utils/userRole";

const AVATAR_FALLBACK = "https://placehold.co/100x100/1a1a1a/666666?text=S";

const FETCH_LIMIT = 200;

type UiChallengeStatus =
  | "pending"
  | "accepted"
  | "completed"
  | "rejected"
  | "failed"
  | "unknown";

interface DonorChallengeRow {
  id: string;
  streamer: { name: string; avatar: string };
  amount: number;
  content: string;
  status: UiChallengeStatus;
  timestamp: string;
}

function parseChallengesPayload(
  res:
    | {
        success?: boolean;
        data?: unknown;
      }
    | undefined,
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

function normalizeStatus(raw?: string): UiChallengeStatus {
  const u = (raw || "").toLowerCase().replace(/\s+/g, "_");
  if (
    u === "pending" ||
    u === "created" ||
    u === "open" ||
    u === "awaiting_streamer" ||
    u === "awaitingacceptance"
  )
    return "pending";
  if (
    u === "accepted" ||
    u === "approved" ||
    u === "in_progress" ||
    u === "active" ||
    u === "ongoing"
  )
    return "accepted";
  if (u === "completed" || u === "success") return "completed";
  if (u === "rejected" || u === "cancelled" || u === "canceled")
    return "rejected";
  if (u === "failed" || u === "failure") return "failed";
  return "unknown";
}

function challengeToRow(c: Challenge): DonorChallengeRow | null {
  const id = String(c._id ?? c.id ?? "");
  if (!id) return null;
  const st = c.streamer as
    | {
        displayName?: string;
        username?: string;
        profilePicture?: string;
      }
    | undefined;
  const name = String(
    st?.displayName || st?.username || "STREAMER",
  ).toUpperCase();
  const avatar =
    typeof st?.profilePicture === "string" && st.profilePicture
      ? st.profilePicture
      : AVATAR_FALLBACK;
  const status = normalizeStatus(
    typeof c.status === "string" ? c.status : undefined,
  );
  const ts = c.createdAt ? dayjs(c.createdAt).format("YYYY-MM-DD HH:mm") : "—";
  const amt = typeof c.amount === "number" ? c.amount : Number(c.amount) || 0;
  const content = typeof c.content === "string" && c.content ? c.content : "—";
  return {
    id,
    streamer: { name, avatar },
    amount: amt,
    content,
    status,
    timestamp: ts,
  };
}

function badgeClass(s: UiChallengeStatus) {
  switch (s) {
    case "pending":
      return "bg-primary/20 text-primary";
    case "accepted":
      return "bg-green-500/20 text-green-500";
    case "completed":
      return "bg-blue-500/20 text-blue-500";
    case "rejected":
      return "bg-destructive/20 text-destructive";
    case "failed":
      return "bg-orange-500/20 text-orange-400";
    default:
      return "bg-outline/20 text-outline";
  }
}

function donorBadgeLabel(s: UiChallengeStatus) {
  switch (s) {
    case "pending":
      return "CHỜ STREAMER DUYỆT";
    case "accepted":
      return "STREAMER ĐANG LÀM";
    case "completed":
      return "HOÀN THÀNH";
    case "rejected":
      return "BỊ TỪ CHỐI";
    case "failed":
      return "THẤT BẠI";
    default:
      return "KHÁC";
  }
}

export function DonorChallengesView() {
  const { isAuthenticated, user } = useAuthSelector();
  const role = user?.role as string | undefined;
  const [statusFilter, setStatusFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "highest">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const {
    data: chRes,
    isLoading,
    isFetching,
    isError,
  } = useGetMyDonorChallengesQuery(
    { page: 1, limit: FETCH_LIMIT },
    {
      skip: !isAuthenticated || isStreamerRole(role),
    },
  );

  const rows = useMemo(() => {
    const list = parseChallengesPayload(chRes);
    return list
      .map((c) => challengeToRow(c))
      .filter((r): r is DonorChallengeRow => Boolean(r));
  }, [chRes]);

  const filtered = useMemo(() => {
    return rows
      .filter((ch) => {
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "approved" && ch.status === "accepted") ||
          ch.status === statusFilter;

        let matchesAmount = true;
        if (amountFilter === "under100") matchesAmount = ch.amount < 100000;
        else if (amountFilter === "100-500")
          matchesAmount = ch.amount >= 100000 && ch.amount <= 500000;
        else if (amountFilter === "500-1m")
          matchesAmount = ch.amount > 500000 && ch.amount <= 1000000;
        else if (amountFilter === "1m-5m")
          matchesAmount = ch.amount > 1000000 && ch.amount <= 5000000;
        else if (amountFilter === "over5m") matchesAmount = ch.amount > 5000000;

        return matchesStatus && matchesAmount;
      })
      .sort((a, b) => {
        if (sortBy === "highest") return b.amount - a.amount;
        return (
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });
  }, [rows, statusFilter, amountFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const pageRows = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const loadPending = isLoading || isFetching;

  if (isStreamerRole(role)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface">
        <p className="text-[11px] font-mono text-outline text-center max-w-md">
          Tài khoản streamer dùng màn{" "}
          <span className="text-primary">Quản lý thử thách</span> (API
          streamer). Vui lòng dùng menu CHALLENGE khi đăng nhập donor.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-surface relative overflow-hidden">
      <div className="scanline" />
      <div className="p-8 border-b border-outline-variant/10 bg-surface-container-low/30">
        <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight uppercase text-foreground italic flex items-center gap-3">
              <Sword className="w-8 h-8 text-primary" />
              THỬ THÁCH CỦA TÔI
            </h2>
            <p className="text-[10px] font-mono text-outline tracking-widest uppercase">
              Quản lý và theo dõi các thử thách
            </p>
            {/* <p className="text-[9px] font-mono text-outline/80 tracking-wide">
              Tối đa {FETCH_LIMIT} bản ghi — lọc trên trình duyệt.
            </p> */}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[160px] bg-surface-container-highest/30 border-outline-variant/20 rounded-none h-10 text-[10px] font-bold uppercase tracking-widest">
                <SelectValue placeholder="TRẠNG THÁI" />
              </SelectTrigger>
              <SelectContent className="bg-surface-container-low border-outline-variant/20 rounded-none">
                <SelectItem
                  value="all"
                  className="text-[10px] font-bold uppercase"
                >
                  TẤT CẢ
                </SelectItem>
                <SelectItem
                  value="pending"
                  className="text-[10px] font-bold uppercase"
                >
                  CHỜ DUYỆT
                </SelectItem>
                <SelectItem
                  value="approved"
                  className="text-[10px] font-bold uppercase"
                >
                  ĐANG LÀM
                </SelectItem>
                <SelectItem
                  value="rejected"
                  className="text-[10px] font-bold uppercase"
                >
                  TỪ CHỐI
                </SelectItem>
                <SelectItem
                  value="completed"
                  className="text-[10px] font-bold uppercase"
                >
                  HOÀN THÀNH
                </SelectItem>
                <SelectItem
                  value="failed"
                  className="text-[10px] font-bold uppercase"
                >
                  THẤT BẠI
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={amountFilter}
              onValueChange={(v) => {
                setAmountFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[160px] bg-surface-container-highest/30 border-outline-variant/20 rounded-none h-10 text-[10px] font-bold uppercase tracking-widest">
                <SelectValue placeholder="MỨC TIỀN" />
              </SelectTrigger>
              <SelectContent className="bg-surface-container-low border-outline-variant/20 rounded-none">
                <SelectItem
                  value="all"
                  className="text-[10px] font-bold uppercase"
                >
                  TẤT CẢ MỨC
                </SelectItem>
                <SelectItem
                  value="under100"
                  className="text-[10px] font-bold uppercase"
                >
                  DƯỚI 100K
                </SelectItem>
                <SelectItem
                  value="100-500"
                  className="text-[10px] font-bold uppercase"
                >
                  100K - 500K
                </SelectItem>
                <SelectItem
                  value="500-1m"
                  className="text-[10px] font-bold uppercase"
                >
                  500K - 1M
                </SelectItem>
                <SelectItem
                  value="1m-5m"
                  className="text-[10px] font-bold uppercase"
                >
                  1M - 5M
                </SelectItem>
                <SelectItem
                  value="over5m"
                  className="text-[10px] font-bold uppercase"
                >
                  TRÊN 5M
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={(v) => {
                setSortBy(v as "newest" | "highest");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[140px] bg-surface-container-highest/30 border-outline-variant/20 rounded-none h-10 text-[10px] font-bold uppercase tracking-widest">
                <SelectValue placeholder="SẮP XẾP" />
              </SelectTrigger>
              <SelectContent className="bg-surface-container-low border-outline-variant/20 rounded-none">
                <SelectItem
                  value="newest"
                  className="text-[10px] font-bold uppercase"
                >
                  MỚI NHẤT
                </SelectItem>
                <SelectItem
                  value="highest"
                  className="text-[10px] font-bold uppercase"
                >
                  TIỀN CAO
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-8 max-w-6xl mx-auto w-full">
          {!isAuthenticated && (
            <p className="text-[11px] font-mono text-outline mb-4">
              Đăng nhập để xem thử thách bạn đã tạo.
            </p>
          )}
          {isError && (
            <p className="text-[11px] font-mono text-red-400 mb-4">
              Không tải được danh sách.
            </p>
          )}
          {loadPending && (
            <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-4">
              Đang tải…
            </p>
          )}

          <div className="bg-surface-container-low/40 border border-outline-variant/10 mb-8">
            <Table>
              <TableHeader>
                <TableRow className="border-outline-variant/10 hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest w-[200px]">
                    Streamer nhận
                  </TableHead>
                  <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">
                    Nội dung
                  </TableHead>
                  <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">
                    Số tiền
                  </TableHead>
                  <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">
                    Trạng thái
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((ch) => (
                  <TableRow
                    key={ch.id}
                    className="border-outline-variant/5 hover:bg-surface-container-highest/10"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 border border-outline-variant/20">
                          <AvatarImage
                            src={ch.streamer.avatar}
                            referrerPolicy="no-referrer"
                          />
                          <AvatarFallback>
                            {ch.streamer.name[0] ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                            {ch.streamer.name}
                          </p>
                          <p className="text-[8px] font-mono text-outline uppercase flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {ch.timestamp}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-[11px] text-foreground/90 font-medium italic">
                        &quot;{ch.content}&quot;
                      </p>
                      <p className="text-[8px] font-mono text-outline mt-1 uppercase tracking-widest">
                        ID: {ch.id}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-bold text-primary">
                        {ch.amount.toLocaleString("vi-VN")} VND
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`rounded-none text-[8px] font-bold tracking-widest uppercase border-none ${badgeClass(ch.status)}`}
                      >
                        {donorBadgeLabel(ch.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {!loadPending && filtered.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-outline font-mono text-[10px] uppercase tracking-widest">
                  Chưa có thử thách nào.
                </p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center pb-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage((p) => p - 1);
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(i + 1);
                        }}
                        isActive={currentPage === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages)
                          setCurrentPage((p) => p + 1);
                      }}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
