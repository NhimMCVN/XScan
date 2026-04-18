import { useMemo, useState } from "react";
import { Sword, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  useGetMyStreamerChallengesQuery,
  useAcceptChallengeMutation,
  useRejectChallengeMutation,
  useCompleteChallengeMutation,
  useFailChallengeMutation,
} from "@/src/redux/queries/challenges.api";
import { useAuthSelector } from "@/src/redux/slices/auth.slice";
import { isStreamerRole } from "@/src/utils/userRole";

const AVATAR_FALLBACK = "https://placehold.co/100x100/1a1a1a/666666?text=D";

const FETCH_LIMIT = 200;

type UiChallengeStatus =
  | "pending"
  | "accepted"
  | "completed"
  | "rejected"
  | "failed"
  | "unknown";

interface StreamerChallengeRow {
  id: string;
  user: { name: string; avatar: string };
  amount: number;
  content: string;
  status: UiChallengeStatus;
  timestamp: string;
}

function parseStreamerChallengesPayload(
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

function normalizeStreamerStatus(raw?: string): UiChallengeStatus {
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

function challengeToRow(c: Challenge): StreamerChallengeRow | null {
  const id = String(c._id ?? c.id ?? "");
  if (!id) return null;
  const donor = c.donor as
    | {
        displayName?: string;
        username?: string;
        profilePicture?: string;
      }
    | undefined;
  const name = String(
    donor?.displayName || donor?.username || "DONOR",
  ).toUpperCase();
  const avatar =
    typeof donor?.profilePicture === "string" && donor.profilePicture
      ? donor.profilePicture
      : AVATAR_FALLBACK;
  const status = normalizeStreamerStatus(
    typeof c.status === "string" ? c.status : undefined,
  );
  const ts = c.createdAt ? dayjs(c.createdAt).format("YYYY-MM-DD HH:mm") : "—";
  const amt = typeof c.amount === "number" ? c.amount : Number(c.amount) || 0;
  const content = typeof c.content === "string" && c.content ? c.content : "—";
  return {
    id,
    user: { name, avatar },
    amount: amt,
    content,
    status,
    timestamp: ts,
  };
}

function getMutationError(e: unknown): string {
  if (!e || typeof e !== "object") return "Có lỗi xảy ra.";
  const x = e as Record<string, unknown>;
  const data = x.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.message === "string" && d.message) return d.message;
    const err = d.error;
    if (err && typeof err === "object") {
      const m = (err as Record<string, unknown>).message;
      if (typeof m === "string" && m) return m;
    }
  }
  return "Có lỗi xảy ra.";
}

export function StreamerChallengesView() {
  const { isAuthenticated, user } = useAuthSelector();
  const role = user?.role as string | undefined;
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [amountFilter, setAmountFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "highest">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [banner, setBanner] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const itemsPerPage = 8;

  const skipStreamerList =
    !isAuthenticated ||
    (typeof role === "string" && role.length > 0 && !isStreamerRole(role));

  const {
    data: chRes,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetMyStreamerChallengesQuery(
    { page: 1, limit: FETCH_LIMIT },
    { skip: skipStreamerList },
  );

  const rows = useMemo(() => {
    const list = parseStreamerChallengesPayload(chRes);
    return list
      .map((c) => challengeToRow(c))
      .filter((r): r is StreamerChallengeRow => Boolean(r));
  }, [chRes]);

  const filteredChallenges = useMemo(() => {
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

  const totalPages = Math.max(
    1,
    Math.ceil(filteredChallenges.length / itemsPerPage),
  );
  const paginatedChallenges = filteredChallenges.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const [acceptMut] = useAcceptChallengeMutation();
  const [rejectMut] = useRejectChallengeMutation();
  const [completeMut] = useCompleteChallengeMutation();
  const [failMut] = useFailChallengeMutation();

  const runAction = async (
    id: string,
    action: "accept" | "reject" | "complete" | "fail",
  ) => {
    setBanner(null);
    setActingId(id);
    try {
      if (action === "accept") await acceptMut(id).unwrap();
      else if (action === "reject") await rejectMut(id).unwrap();
      else if (action === "complete") await completeMut(id).unwrap();
      else await failMut(id).unwrap();
      void refetch();
    } catch (e) {
      setBanner(getMutationError(e));
    } finally {
      setActingId(null);
    }
  };

  const badgeClass = (s: UiChallengeStatus) => {
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
  };

  const badgeLabel = (s: UiChallengeStatus) => {
    switch (s) {
      case "pending":
        return "ĐANG CHỜ";
      case "accepted":
        return "ĐÃ CHẤP NHẬN";
      case "completed":
        return "HOÀN THÀNH";
      case "rejected":
        return "ĐÃ TỪ CHỐI";
      case "failed":
        return "THẤT BẠI";
      default:
        return "KHÁC";
    }
  };

  const loadPending = isLoading || isFetching;

  return (
    <div className="flex-1 flex flex-col bg-surface relative overflow-hidden">
      <div className="scanline" />

      <div className="p-8 border-b border-outline-variant/10 bg-surface-container-low/30">
        <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight uppercase text-foreground italic flex items-center gap-2 md:gap-3">
              <Sword className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              QUẢN LÝ THỬ THÁCH
            </h2>
            <p className="text-[10px] font-mono text-outline tracking-widest uppercase">
              Theo dõi và quản lý các thử thách của bạn
            </p>
            {/* <p className="text-[9px] font-mono text-outline/80 tracking-wide">
              Tối đa {FETCH_LIMIT} bản ghi gần nhất — lọc/sắp xếp trên trình
              duyệt.
            </p> */}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
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
                  TẤT CẢ TRẠNG THÁI
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
                  ĐÃ CHẤP NHẬN
                </SelectItem>
                <SelectItem
                  value="rejected"
                  className="text-[10px] font-bold uppercase"
                >
                  ĐÃ TỪ CHỐI
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
              onValueChange={(val) => {
                setAmountFilter(val);
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
                  TẤT CẢ MỨC TIỀN
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
              onValueChange={(val) => {
                setSortBy(val as "newest" | "highest");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[160px] bg-surface-container-highest/30 border-outline-variant/20 rounded-none h-10 text-[10px] font-bold uppercase tracking-widest">
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
                  TIỀN NHIỀU NHẤT
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
              Đăng nhập bằng tài khoản streamer để xem và xử lý thử thách.
            </p>
          )}
          {banner && (
            <p className="text-[11px] font-mono text-red-400 border border-red-400/30 bg-red-400/5 px-3 py-2 mb-4">
              {banner}
            </p>
          )}
          {isAuthenticated && isError && (
            <p className="text-[11px] font-mono text-red-400 mb-4">
              Không tải được danh sách thử thách.
            </p>
          )}
          {isAuthenticated && loadPending && (
            <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-4">
              Đang tải…
            </p>
          )}

          <div className="bg-surface-container-low/40 border border-outline-variant/10 mb-8">
            <Table>
              <TableHeader>
                <TableRow className="border-outline-variant/10 hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest w-[200px]">
                    Người gửi
                  </TableHead>
                  <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">
                    Nội dung thử thách
                  </TableHead>
                  <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">
                    Số tiền
                  </TableHead>
                  <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">
                    Trạng thái
                  </TableHead>
                  <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest text-right">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isAuthenticated &&
                  paginatedChallenges.map((ch) => (
                    <TableRow
                      key={ch.id}
                      className="border-outline-variant/5 hover:bg-surface-container-highest/10 group"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 border border-outline-variant/20">
                            <AvatarImage
                              src={ch.user.avatar}
                              referrerPolicy="no-referrer"
                            />
                            <AvatarFallback>
                              {ch.user.name[0] ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5">
                            <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                              {ch.user.name}
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
                        <span className="text-sm font-bold text-primary tracking-tight">
                          {ch.amount.toLocaleString("vi-VN")} VND
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`rounded-none text-[8px] font-bold tracking-widest uppercase border-none ${badgeClass(ch.status)}`}
                        >
                          {badgeLabel(ch.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {ch.status === "pending" ? (
                          <div className="flex justify-end gap-2 flex-wrap">
                            <Button
                              type="button"
                              size="sm"
                              disabled={actingId === ch.id}
                              onClick={() => void runAction(ch.id, "accept")}
                              className="h-7 px-3 bg-green-500/10 border border-green-500/30 text-green-500 hover:bg-green-500 hover:text-black text-[9px] font-bold tracking-widest uppercase rounded-none transition-all"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              DUYỆT
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={actingId === ch.id}
                              onClick={() => void runAction(ch.id, "reject")}
                              className="h-7 px-3 bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive hover:text-white text-[9px] font-bold tracking-widest uppercase rounded-none transition-all"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              BỎ
                            </Button>
                          </div>
                        ) : ch.status === "accepted" ? (
                          <div className="flex justify-end gap-2 flex-wrap">
                            <Button
                              type="button"
                              size="sm"
                              disabled={actingId === ch.id}
                              onClick={() => void runAction(ch.id, "complete")}
                              className="h-7 px-3 bg-blue-500/10 border border-blue-500/30 text-blue-500 hover:bg-blue-500 hover:text-white text-[9px] font-bold tracking-widest uppercase rounded-none transition-all"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              HOÀN THÀNH
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={actingId === ch.id}
                              onClick={() => void runAction(ch.id, "fail")}
                              className="h-7 px-3 bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-black text-[9px] font-bold tracking-widest uppercase rounded-none transition-all"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              THẤT BẠI
                            </Button>
                          </div>
                        ) : ch.status === "unknown" ? (
                          <span className="text-[9px] font-bold text-outline uppercase tracking-widest italic">
                            TRẠNG THÁI CHƯA NHẬN DIỆN
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-outline uppercase tracking-widest italic">
                            ĐÃ XỬ LÝ
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>

            {isAuthenticated &&
              !loadPending &&
              filteredChallenges.length === 0 && (
                <div className="py-20 text-center space-y-4">
                  <Sword className="w-12 h-12 text-outline/20 mx-auto" />
                  <p className="text-outline font-mono text-[10px] uppercase tracking-[0.3em]">
                    KHÔNG TÌM THẤY THỬ THÁCH NÀO
                  </p>
                </div>
              )}
          </div>

          {isAuthenticated && totalPages > 1 && (
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
