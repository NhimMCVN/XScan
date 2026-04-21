import { useEffect, useMemo, useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import {
  X,
  Wallet,
  QrCode,
  Clock,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Loader2,
  DollarSign,
  Sword,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import dayjs from "dayjs";
import { useGetDonorDonationsQuery } from "@/src/redux/queries/donate.api";
import type { DonationRecord } from "@/src/redux/queries/donate.api";
import { useGetMyDonorChallengesQuery } from "@/src/redux/queries/challenges.api";
import type { Challenge } from "@/src/redux/queries/challenges.api";
import { useAuthSelector } from "@/src/redux/slices/auth.slice";

const AVATAR_FALLBACK =
  "https://placehold.co/100x100/1a1a1a/666666?text=X";

const ITEMS_PER_PAGE = 8;

type UiStatus = "pending" | "completed" | "failed";

interface DonationRowView {
  id: string;
  time: string;
  streamer: { name: string; avatar: string };
  amount: number;
  currency?: string;
  method: "wallet" | "qrcode";
  status: UiStatus;
  message: string;
}

interface ChallengeRowView {
  id: string;
  time: string;
  streamer: { name: string; avatar: string };
  amount: number;
  status: UiStatus;
  content: string;
}

function mapStatus(raw?: string): UiStatus {
  const u = (raw || "").toLowerCase();
  if (
    u.includes("complete") ||
    u === "paid" ||
    u === "success" ||
    u === "confirmed"
  )
    return "completed";
  if (
    u.includes("fail") ||
    u.includes("reject") ||
    u.includes("cancel") ||
    u === "refunded"
  )
    return "failed";
  return "pending";
}

function donationMethod(
  pm?: string,
): "wallet" | "qrcode" {
  const u = (pm || "").toLowerCase();
  if (u === "wallet") return "wallet";
  return "qrcode";
}

function formatMoney(amount: number, currency?: string): string {
  const c = (currency || "VND").toUpperCase();
  if (c === "USD") return `$${amount.toFixed(2)}`;
  return `${amount.toLocaleString("vi-VN")} ${c}`;
}

function parseDonorDonationsPayload(res: {
  success?: boolean;
  data?: unknown;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
} | undefined): { list: DonationRecord[]; meta?: typeof res.meta } {
  if (!res) return { list: [] };
  const d = res.data;
  if (Array.isArray(d)) return { list: d as DonationRecord[], meta: res.meta };
  if (d && typeof d === "object" && Array.isArray((d as { items?: unknown }).items))
    return {
      list: (d as { items: DonationRecord[] }).items,
      meta: res.meta ?? (d as { meta?: typeof res.meta }).meta,
    };
  return { list: [], meta: res.meta };
}

function donationToRow(d: DonationRecord): DonationRowView {
  const id = String(d._id ?? d.id ?? "");
  const st = d.streamer as
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
  const t = d.createdAt
    ? dayjs(d.createdAt).format("YYYY-MM-DD HH:mm")
    : "—";
  return {
    id,
    time: t,
    streamer: { name, avatar },
    amount: typeof d.amount === "number" ? d.amount : Number(d.amount) || 0,
    currency: typeof d.currency === "string" ? d.currency : undefined,
    method: donationMethod(
      typeof d.paymentMethod === "string" ? d.paymentMethod : undefined,
    ),
    status: mapStatus(typeof d.status === "string" ? d.status : undefined),
    message: typeof d.message === "string" && d.message ? d.message : "—",
  };
}

function parseDonorChallengesPayload(res: {
  success?: boolean;
  data?: unknown;
  message?: string;
} | undefined): {
  list: Challenge[];
  meta?: { page?: number; limit?: number; total?: number; totalPages?: number };
} {
  if (!res?.data) return { list: [] };
  const inner = res.data;
  if (Array.isArray(inner)) return { list: inner as Challenge[] };
  if (typeof inner === "object") {
    const o = inner as Record<string, unknown>;
    const arr = o.data ?? o.items;
    if (Array.isArray(arr)) {
      return {
        list: arr as Challenge[],
        meta:
          (o.meta as {
            page?: number;
            limit?: number;
            total?: number;
            totalPages?: number;
          }) ?? undefined,
      };
    }
  }
  return { list: [] };
}

function challengeToRow(c: Challenge): ChallengeRowView {
  const id = String(c._id ?? c.id ?? "");
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
  const t = c.createdAt
    ? dayjs(c.createdAt).format("YYYY-MM-DD HH:mm")
    : "—";
  return {
    id,
    time: t,
    streamer: { name, avatar },
    amount: typeof c.amount === "number" ? c.amount : Number(c.amount) || 0,
    status: mapStatus(typeof c.status === "string" ? c.status : undefined),
    content:
      typeof c.content === "string" && c.content ? c.content : "—",
  };
}

interface DonationHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DonationHistoryDrawer({
  isOpen,
  onClose,
}: DonationHistoryDrawerProps) {
  const { isAuthenticated } = useAuthSelector();
  const [activeTab, setActiveTab] = useState<"donate" | "challenge">("donate");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (isOpen) setCurrentPage(1);
  }, [isOpen]);

  const donorQuery = useGetDonorDonationsQuery(
    { page: currentPage, limit: ITEMS_PER_PAGE },
    {
      skip: !isOpen || !isAuthenticated || activeTab !== "donate",
    },
  );

  const donorChallengesQuery = useGetMyDonorChallengesQuery(
    { page: currentPage, limit: ITEMS_PER_PAGE },
    {
      skip: !isOpen || !isAuthenticated || activeTab !== "challenge",
    },
  );

  const donationParsed = useMemo(
    () => parseDonorDonationsPayload(donorQuery.data),
    [donorQuery.data],
  );

  const donationRows = useMemo(
    () => donationParsed.list.map(donationToRow),
    [donationParsed.list],
  );

  const donationMeta = donationParsed.meta;
  const donationTotal = donationMeta?.total ?? donationParsed.list.length;
  const donationTotalPages = Math.max(
    1,
    donationMeta?.totalPages ??
      (Math.ceil(donationTotal / ITEMS_PER_PAGE) || 1),
  );

  const challengeParsed = useMemo(
    () => parseDonorChallengesPayload(donorChallengesQuery.data),
    [donorChallengesQuery.data],
  );

  const challengeRows = useMemo(
    () => challengeParsed.list.map(challengeToRow),
    [challengeParsed.list],
  );

  const challengeMeta = challengeParsed.meta;
  const challengeTotal =
    challengeMeta?.total ?? challengeParsed.list.length;
  const challengeTotalPages = Math.max(
    1,
    challengeMeta?.totalPages ??
      (Math.ceil(challengeTotal / ITEMS_PER_PAGE) || 1),
  );

  const currentData: DonationRowView[] | ChallengeRowView[] =
    activeTab === "donate" ? donationRows : challengeRows;
  const totalPages =
    activeTab === "donate" ? donationTotalPages : challengeTotalPages;
  const totalRecords =
    activeTab === "donate" ? donationTotal : challengeTotal;

  const isLoading =
    activeTab === "donate" ? donorQuery.isLoading : donorChallengesQuery.isLoading;
  const isFetching =
    activeTab === "donate" ? donorQuery.isFetching : donorChallengesQuery.isFetching;
  const loadPending = isLoading || isFetching;

  const loadError =
    activeTab === "donate" ? donorQuery.isError : donorChallengesQuery.isError;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "pending":
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Hoàn tất";
      case "failed":
        return "Thất bại";
      case "pending":
        return "Đang xử lý";
      default:
        return status;
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-surface-container-low border-outline-variant/20 h-[85vh] outline-none">
        <div className="mx-auto w-full max-w-6xl h-full flex flex-col">
          <DrawerHeader className="border-b border-outline-variant/10 pb-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <DrawerTitle className="text-2xl font-bold tracking-tight uppercase text-foreground">
                  KHO LƯU TRỮ GIAO DỊCH
                </DrawerTitle>
                <DrawerDescription className="text-[10px] font-mono text-outline tracking-widest uppercase">
                  GIAO THỨC: DATA_RETRIEVAL_V1.0 // TỔNG SỐ BẢN GHI:{" "}
                  {isAuthenticated ? totalRecords : "—"}
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-outline hover:text-primary"
                >
                  <X className="w-6 h-6" />
                </Button>
              </DrawerClose>
            </div>

            <div className="flex gap-4 mt-6">
              <Button
                type="button"
                onClick={() => {
                  setActiveTab("donate");
                  setCurrentPage(1);
                }}
                variant="ghost"
                className={`h-10 px-6 rounded-none font-bold text-[10px] tracking-widest uppercase border-b-2 transition-all ${activeTab === "donate" ? "border-primary text-primary bg-primary/5" : "border-transparent text-outline hover:text-primary"}`}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                LỊCH SỬ ỦNG HỘ
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setActiveTab("challenge");
                  setCurrentPage(1);
                }}
                variant="ghost"
                className={`h-10 px-6 rounded-none font-bold text-[10px] tracking-widest uppercase border-b-2 transition-all ${activeTab === "challenge" ? "border-primary text-primary bg-primary/5" : "border-transparent text-outline hover:text-primary"}`}
              >
                <Sword className="w-4 h-4 mr-2" />
                LỊCH SỬ THỬ THÁCH
              </Button>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-auto p-6">
            {!isAuthenticated && (
              <p className="text-[11px] font-mono text-outline tracking-wide mb-4">
                Đăng nhập để xem lịch sử ủng hộ và thử thách của bạn từ máy chủ.
              </p>
            )}
            {isAuthenticated && loadError && (
              <p className="text-[11px] font-mono text-red-400 mb-4">
                Không tải được dữ liệu. Vui lòng thử lại.
              </p>
            )}
            {isAuthenticated && loadPending && (
              <p className="text-[10px] font-mono text-primary tracking-widest uppercase mb-4">
                Đang tải dữ liệu...
              </p>
            )}

            <div className="relative border border-outline-variant/10 bg-surface-container-lowest/30 cut-corner-sm">
              <Table>
                <TableHeader className="bg-surface-container-highest/30">
                  <TableRow className="hover:bg-transparent border-outline-variant/10">
                    <TableHead className="text-[10px] font-bold text-outline tracking-widest uppercase h-12">
                      THỜI GIAN
                    </TableHead>
                    <TableHead className="text-[10px] font-bold text-outline tracking-widest uppercase h-12">
                      STREAMER
                    </TableHead>
                    <TableHead className="text-[10px] font-bold text-outline tracking-widest uppercase h-12">
                      SỐ TIỀN
                    </TableHead>
                    {activeTab === "donate" && (
                      <TableHead className="text-[10px] font-bold text-outline tracking-widest uppercase h-12">
                        PHƯƠNG THỨC
                      </TableHead>
                    )}
                    <TableHead className="text-[10px] font-bold text-outline tracking-widest uppercase h-12">
                      TRẠNG THÁI
                    </TableHead>
                    <TableHead className="text-[10px] font-bold text-outline tracking-widest uppercase h-12">
                      {activeTab === "donate"
                        ? "TIN NHẮN"
                        : "NỘI DUNG THỬ THÁCH"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isAuthenticated &&
                    !loadPending &&
                    currentData.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={activeTab === "donate" ? 6 : 5}
                          className="text-center text-[10px] font-mono text-outline py-10 uppercase"
                        >
                          Chưa có bản ghi.
                        </TableCell>
                      </TableRow>
                    )}
                  {currentData.map((record) => (
                    <TableRow
                      key={record.id}
                      className="hover:bg-surface-container-high/50 border-outline-variant/5 transition-colors"
                    >
                      <TableCell className="font-mono text-[10px] text-outline">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {record.time}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 border border-outline-variant/20">
                            <AvatarImage
                              src={record.streamer.avatar}
                              referrerPolicy="no-referrer"
                            />
                            <AvatarFallback>
                              {record.streamer.name[0] ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                            {record.streamer.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-display font-bold text-primary text-sm">
                        {activeTab === "donate"
                          ? formatMoney(
                              (record as DonationRowView).amount,
                              (record as DonationRowView).currency,
                            )
                          : `${(record as ChallengeRowView).amount.toLocaleString("vi-VN")} VND`}
                      </TableCell>
                      {activeTab === "donate" && (
                        <TableCell>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-outline uppercase tracking-widest">
                            {(record as DonationRowView).method ===
                            "wallet" ? (
                              <Wallet className="w-3 h-3" />
                            ) : (
                              <QrCode className="w-3 h-3" />
                            )}
                            {(record as DonationRowView).method === "wallet"
                              ? "Ví"
                              : "QR / Ngân hàng"}
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                          {getStatusIcon(record.status)}
                          <span
                            className={
                              record.status === "completed"
                                ? "text-green-500"
                                : record.status === "failed"
                                  ? "text-destructive"
                                  : "text-primary"
                            }
                          >
                            {getStatusText(record.status)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="flex items-start gap-2 text-[10px] text-outline leading-relaxed italic">
                          {activeTab === "donate" ? (
                            <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                          ) : (
                            <Sword className="w-3 h-3 mt-0.5 shrink-0" />
                          )}
                          <span className="truncate">
                            {activeTab === "donate"
                              ? (record as DonationRowView).message
                              : (record as ChallengeRowView).content}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <DrawerFooter className="border-t border-outline-variant/10 py-6">
            {!isAuthenticated ? null : (
              <Pagination>
                <PaginationContent className="flex flex-wrap items-center justify-center gap-4">
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage((p) => p - 1);
                      }}
                      className={`text-[10px] font-bold tracking-widest uppercase rounded-none border-outline-variant/20 ${currentPage === 1 ? "opacity-50 pointer-events-none" : "hover:bg-primary/10 hover:text-primary"}`}
                    />
                  </PaginationItem>
                  <span className="text-[10px] font-mono text-outline tracking-wide px-2">
                    TRANG {currentPage} / {totalPages} ({totalRecords} bản ghi)
                  </span>
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages)
                          setCurrentPage((p) => p + 1);
                      }}
                      className={`text-[10px] font-bold tracking-widest uppercase rounded-none border-outline-variant/20 ${currentPage >= totalPages ? "opacity-50 pointer-events-none" : "hover:bg-primary/10 hover:text-primary"}`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
