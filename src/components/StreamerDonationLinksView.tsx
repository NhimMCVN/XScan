import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Link as LinkIcon,
  Plus,
  Copy,
  Star,
  Edit2,
  Palette,
  Trash2,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  useGetDonationLinksQuery,
  useGetDonationLinkStatsQuery,
  useCreateDonationLinkMutation,
  useUpdateDonationLinkMutation,
  useDeleteDonationLinkMutation,
  useToggleDonationLinkStatusMutation,
  useSetDefaultDonationLinkMutation,
  useUpdateDonationLinkThemeMutation,
  type DonationLinkItem,
  type ThemeDTO,
  type DonationLinksListResponse,
} from "@/src/redux/queries/donationLinks.api";

const ITEMS_PER_PAGE = 5;

const DEFAULT_THEME: ThemeDTO = {
  primaryColor: "#fbbf24",
  secondaryColor: "#262626",
  backgroundColor: "#0e0e0e",
  textColor: "#fafafa",
};

function themeFromLink(link?: DonationLinkItem | null): ThemeDTO {
  const t = link?.theme;
  if (
    t &&
    typeof t.primaryColor === "string" &&
    typeof t.secondaryColor === "string" &&
    typeof t.backgroundColor === "string" &&
    typeof t.textColor === "string"
  ) {
    return {
      primaryColor: t.primaryColor,
      secondaryColor: t.secondaryColor,
      backgroundColor: t.backgroundColor,
      textColor: t.textColor,
    };
  }
  return { ...DEFAULT_THEME };
}

function parseLinksResponse(res: DonationLinksListResponse | undefined): {
  links: DonationLinkItem[];
  total: number;
} {
  if (res?.success === false) return { links: [], total: 0 };
  if (res?.data == null) return { links: [], total: 0 };
  const raw = res.data as Record<string, unknown> | DonationLinkItem[];
  if (Array.isArray(raw)) {
    return { links: raw as DonationLinkItem[], total: raw.length };
  }
  const links = Array.isArray(raw.links)
    ? (raw.links as DonationLinkItem[])
    : [];
  const p = raw.pagination as Record<string, unknown> | undefined;
  const total = Number(p?.total ?? links.length) || links.length;
  return { links, total };
}

function linkId(link: DonationLinkItem): string {
  const id = link._id ?? link.id;
  return id != null ? String(id) : "";
}

function formatCreatedAt(iso?: string) {
  if (!iso) return "—";
  const d = dayjs(iso);
  return d.isValid() ? d.format("DD/MM/YYYY HH:mm") : String(iso);
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
  if (typeof x.error === "string" && x.error) return x.error;
  return "Có lỗi xảy ra.";
}

export function StreamerDonationLinksView() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isColorDialogOpen, setIsColorDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<DonationLinkItem | null>(
    null,
  );

  const [formTitle, setFormTitle] = useState("");
  const [formCustomUrl, setFormCustomUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAllowAnonymous, setFormAllowAnonymous] = useState(true);
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formTheme, setFormTheme] = useState<ThemeDTO>({ ...DEFAULT_THEME });

  const [colorTheme, setColorTheme] = useState<ThemeDTO>({ ...DEFAULT_THEME });

  const [formError, setFormError] = useState<string | null>(null);
  const [colorError, setColorError] = useState<string | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const { data: listRes, isLoading, isError, refetch } = useGetDonationLinksQuery(
    { page: currentPage, limit: ITEMS_PER_PAGE },
  );
  const { data: statsRes } = useGetDonationLinkStatsQuery();

  const [createLink, { isLoading: creating }] = useCreateDonationLinkMutation();
  const [updateLink, { isLoading: updating }] = useUpdateDonationLinkMutation();
  const [deleteLinkMut, { isLoading: deleting }] = useDeleteDonationLinkMutation();
  const [toggleStatusMut] = useToggleDonationLinkStatusMutation();
  const [setDefaultMut] = useSetDefaultDonationLinkMutation();
  const [updateThemeMut, { isLoading: savingTheme }] =
    useUpdateDonationLinkThemeMutation();

  const { links, total } = useMemo(() => parseLinksResponse(listRes), [listRes]);
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  const stats = statsRes?.success !== false ? statsRes?.data : undefined;
  const statTotalLinks = stats?.totalLinks ?? total;
  const statActive = stats?.activeLinks ?? 0;
  const statViews = stats?.totalPageViews ?? 0;
  const statAmount = stats?.totalAmount ?? 0;

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const resetFormForCreate = useCallback(() => {
    setFormTitle("");
    setFormCustomUrl("");
    setFormDescription("");
    setFormAllowAnonymous(true);
    setFormIsFeatured(false);
    setFormTheme({ ...DEFAULT_THEME });
    setFormError(null);
  }, []);

  const loadFormFromLink = useCallback((link: DonationLinkItem) => {
    setFormTitle(link.title ?? "");
    setFormCustomUrl(link.customUrl ?? "");
    setFormDescription(
      typeof link.description === "string" ? link.description : "",
    );
    setFormAllowAnonymous(link.allowAnonymous !== false);
    setFormIsFeatured(link.isFeatured === true);
    setFormTheme(themeFromLink(link));
    setFormError(null);
  }, []);

  useEffect(() => {
    if (!isCreateDialogOpen) return;
    if (selectedLink) loadFormFromLink(selectedLink);
    else resetFormForCreate();
  }, [isCreateDialogOpen, selectedLink, loadFormFromLink, resetFormForCreate]);

  useEffect(() => {
    if (!isColorDialogOpen || !selectedLink) return;
    setColorTheme(themeFromLink(selectedLink));
    setColorError(null);
  }, [isColorDialogOpen, selectedLink]);

  const handleCopyUrl = (customUrl: string) => {
    const path = `/public/donation-links/${encodeURIComponent(customUrl)}`;
    const full =
      typeof window !== "undefined"
        ? `${window.location.origin}${path}`
        : path;
    void navigator.clipboard.writeText(full);
  };

  const handleToggleStatus = async (link: DonationLinkItem) => {
    const id = linkId(link);
    if (!id) return;
    setActionBusyId(id);
    try {
      await toggleStatusMut(id).unwrap();
    } catch (e) {
      setFormError(getMutationError(e));
    } finally {
      setActionBusyId(null);
    }
  };

  const handleSetDefault = async (link: DonationLinkItem) => {
    const id = linkId(link);
    if (!id || link.isDefault) return;
    setActionBusyId(id);
    try {
      await setDefaultMut(id).unwrap();
    } catch (e) {
      setFormError(getMutationError(e));
    } finally {
      setActionBusyId(null);
    }
  };

  const handleSaveForm = async () => {
    setFormError(null);
    const title = formTitle.trim();
    const customUrl = formCustomUrl.trim().replace(/^\/+|\/+$/g, "");
    if (!title || title.length > 100) {
      setFormError("Tiêu đề bắt buộc, tối đa 100 ký tự.");
      return;
    }
    if (customUrl.length < 3 || customUrl.length > 50) {
      setFormError("Custom URL từ 3 đến 50 ký tự.");
      return;
    }
    try {
      if (selectedLink) {
        const id = linkId(selectedLink);
        if (!id) throw new Error("Thiếu id link.");
        const res = await updateLink({
          id,
          body: {
            title,
            customUrl,
            description: formDescription.trim() || undefined,
            allowAnonymous: formAllowAnonymous,
            isFeatured: formIsFeatured,
          },
        }).unwrap();
        if (!res.success) {
          setFormError(res.message || "Cập nhật thất bại.");
          return;
        }
        const themeRes = await updateThemeMut({
          id,
          body: { theme: formTheme },
        }).unwrap();
        if (!themeRes.success) {
          setFormError(themeRes.message || "Cập nhật theme thất bại.");
          return;
        }
      } else {
        const res = await createLink({
          title,
          customUrl,
          description: formDescription.trim() || undefined,
          allowAnonymous: formAllowAnonymous,
          isFeatured: formIsFeatured,
          theme: formTheme,
        }).unwrap();
        if (!res.success) {
          setFormError(res.message || "Tạo link thất bại.");
          return;
        }
      }
      setIsCreateDialogOpen(false);
      setSelectedLink(null);
    } catch (e) {
      setFormError(getMutationError(e));
    }
  };

  const handleSaveColorOnly = async () => {
    setColorError(null);
    const id = selectedLink ? linkId(selectedLink) : "";
    if (!id) {
      setColorError("Không xác định được link.");
      return;
    }
    try {
      const res = await updateThemeMut({
        id,
        body: { theme: colorTheme },
      }).unwrap();
      if (!res.success) {
        setColorError(res.message || "Lưu theme thất bại.");
        return;
      }
      setIsColorDialogOpen(false);
      setSelectedLink(null);
    } catch (e) {
      setColorError(getMutationError(e));
    }
  };

  const handleDelete = async () => {
    setFormError(null);
    const id = selectedLink ? linkId(selectedLink) : "";
    if (!id) return;
    try {
      await deleteLinkMut(id).unwrap();
      setIsDeleteDialogOpen(false);
      setSelectedLink(null);
    } catch (e) {
      setFormError(getMutationError(e));
    }
  };

  const ColorFormFields = ({
    value,
    onChange,
  }: {
    value: ThemeDTO;
    onChange: (t: ThemeDTO) => void;
  }) => (
    <div className="grid grid-cols-2 gap-4">
      {(
        [
          ["primaryColor", "Màu chính"],
          ["secondaryColor", "Màu phụ"],
          ["backgroundColor", "Nền"],
          ["textColor", "Chữ"],
        ] as const
      ).map(([key, label]) => (
        <div key={key} className="space-y-1">
          <Label className="text-[9px] font-bold text-outline uppercase">
            {label}
          </Label>
          <Input
            type="color"
            value={value[key]}
            onChange={(e) => onChange({ ...value, [key]: e.target.value })}
            className="h-10 bg-surface-container-highest/30 border-outline-variant/20 rounded-none cursor-pointer"
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-surface relative overflow-hidden">
      <div className="scanline" />

      <div className="p-4 md:p-6 lg:p-8 border-b border-outline-variant/10 bg-surface-container-low/30">
        <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight uppercase text-foreground italic flex items-center gap-2 md:gap-3">
              <LinkIcon className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              QUẢN LÝ DONATION LINK
            </h2>
            <p className="text-[8px] md:text-[10px] font-mono text-outline tracking-widest uppercase">
              GET /donation-links · POST /donation-links · PUT /donation-links/
              {"{id}"}
            </p>
          </div>

          <Button
            onClick={() => {
              setSelectedLink(null);
              setIsCreateDialogOpen(true);
            }}
            className="bg-primary text-black hover:bg-primary/90 gap-2 rounded-none font-bold uppercase tracking-widest text-[10px]"
          >
            <Plus className="w-4 h-4" /> Tạo link mới
          </Button>
        </div>
      </div>

      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full grid grid-cols-2 md:grid-cols-4 gap-4">
        {(
          [
            ["Tổng link", String(statTotalLinks || 0)],
            ["Đang hoạt động", String(statActive ?? 0)],
            ["Tổng lượt xem", String(statViews ?? 0)],
            [
              "Tổng doanh thu",
              `${(Number(statAmount) || 0).toLocaleString("vi-VN")} VND`,
            ],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className="bg-surface-container-low p-4 border border-outline-variant/10"
          >
            <p className="text-[9px] text-outline uppercase font-bold tracking-widest">
              {label}
            </p>
            <p className="text-lg font-bold text-primary mt-1">{value}</p>
          </div>
        ))}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full">
          {formError && !isCreateDialogOpen && !isDeleteDialogOpen ? (
            <p className="text-xs text-red-400 mb-4 font-mono">{formError}</p>
          ) : null}

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-outline">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-sm uppercase tracking-widest">
                Đang tải…
              </span>
            </div>
          ) : isError ? (
            <div className="text-center py-16 space-y-4">
              <p className="text-sm text-red-400">Không tải được danh sách link.</p>
              <Button
                type="button"
                variant="outline"
                className="rounded-none"
                onClick={() => void refetch()}
              >
                Thử lại
              </Button>
            </div>
          ) : (
            <>
              <div className="bg-surface-container-low/40 border border-outline-variant/10 mb-6 md:mb-8">
                <Table>
                  <TableHeader>
                    <TableRow className="border-outline-variant/10 hover:bg-transparent">
                      <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">
                        Tiêu đề
                      </TableHead>
                      <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">
                        Custom URL
                      </TableHead>
                      <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">
                        <div className="flex items-center gap-1">
                          Tổng donate <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </TableHead>
                      <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">
                        <div className="flex items-center gap-1">
                          Lượt donate <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </TableHead>
                      <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">
                        <div className="flex items-center gap-1">
                          Lượt xem <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </TableHead>
                      <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">
                        Trạng thái
                      </TableHead>
                      <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">
                        <div className="flex items-center gap-1">
                          Ngày tạo <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </TableHead>
                      <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest text-right">
                        Hành động
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {links.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="py-12 text-center text-sm text-outline"
                        >
                          Chưa có donation link. Nhấn &quot;Tạo link mới&quot; để
                          thêm (POST /donation-links).
                        </TableCell>
                      </TableRow>
                    ) : (
                      links.map((link) => {
                        const id = linkId(link);
                        const busy = actionBusyId === id;
                        const active = link.isActive !== false;
                        return (
                          <TableRow
                            key={id || link.customUrl}
                            className="border-outline-variant/5 hover:bg-surface-container-highest/10 group"
                          >
                            <TableCell className="font-bold text-[11px] text-foreground uppercase tracking-wider">
                              {link.title ?? "—"}{" "}
                              {link.isDefault ? (
                                <Badge className="bg-primary/20 text-primary text-[8px] ml-2 rounded-none border-none">
                                  MẶC ĐỊNH
                                </Badge>
                              ) : null}
                            </TableCell>
                            <TableCell className="font-mono text-[11px] text-outline">
                              {link.customUrl ?? "—"}{" "}
                              <button
                                type="button"
                                title="Sao chép URL công khai"
                                className="inline p-0 align-middle border-none bg-transparent cursor-pointer text-outline hover:text-primary"
                                onClick={() =>
                                  link.customUrl &&
                                  handleCopyUrl(link.customUrl)
                                }
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </TableCell>
                            <TableCell className="text-primary font-bold text-[11px]">
                              {(Number(link.totalAmount) || 0).toLocaleString(
                                "vi-VN",
                              )}{" "}
                              đ
                            </TableCell>
                            <TableCell className="text-[11px]">
                              {link.totalDonations ?? 0}
                            </TableCell>
                            <TableCell className="text-[11px]">
                              {link.pageViews ?? 0}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={active}
                                  disabled={busy}
                                  onCheckedChange={() => void handleToggleStatus(link)}
                                  className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-500"
                                />
                                <span
                                  className={`text-[11px] font-bold ${active ? "text-primary" : "text-outline"}`}
                                >
                                  {active ? "HOẠT ĐỘNG" : "TẮT"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-outline text-[10px] font-mono">
                              {formatCreatedAt(link.createdAt)}
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-7 w-7 ${link.isDefault ? "text-primary" : ""}`}
                                disabled={busy || link.isDefault}
                                title="Đặt mặc định"
                                onClick={() => void handleSetDefault(link)}
                              >
                                <Star className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setSelectedLink(link);
                                  setIsCreateDialogOpen(true);
                                }}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setSelectedLink(link);
                                  setIsColorDialogOpen(true);
                                }}
                              >
                                <Palette className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => {
                                  setFormError(null);
                                  setSelectedLink(link);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 ? (
                <div className="flex justify-center pb-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) setCurrentPage(currentPage - 1);
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
                              setCurrentPage(currentPage + 1);
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
              ) : null}
            </>
          )}
        </div>
      </ScrollArea>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-surface-container-lowest border border-outline-variant/20 rounded-none max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold uppercase tracking-widest text-foreground">
              {selectedLink ? "Chỉnh sửa donation link" : "Tạo donation link mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {formError ? (
              <p className="text-[11px] font-mono text-red-400">{formError}</p>
            ) : null}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-outline uppercase">
                Tiêu đề *
              </Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="bg-surface-container-highest/30 border-outline-variant/20 rounded-none"
                placeholder="VD: Donate cho stream"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-outline uppercase">
                Custom URL *
              </Label>
              <Input
                value={formCustomUrl}
                onChange={(e) => setFormCustomUrl(e.target.value)}
                className="bg-surface-container-highest/30 border-outline-variant/20 rounded-none"
                placeholder="vd: my-donate-page"
              />
              <p className="text-[9px] text-outline">
                Công khai: GET /public/donation-links/
                {"{"}customUrl{"}"}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-outline uppercase">
                Mô tả
              </Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                maxLength={500}
                className="bg-surface-container-highest/30 border-outline-variant/20 rounded-none"
                placeholder="Mô tả ngắn (tuỳ chọn)"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold text-outline uppercase">
                Cho phép donate ẩn danh
              </Label>
              <Switch
                checked={formAllowAnonymous}
                onCheckedChange={setFormAllowAnonymous}
                className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold text-outline uppercase">
                Nổi bật
              </Label>
              <Switch
                checked={formIsFeatured}
                onCheckedChange={setFormIsFeatured}
                className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-outline uppercase">
                Theme (ThemeDTO)
              </Label>
              <ColorFormFields value={formTheme} onChange={setFormTheme} />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setSelectedLink(null);
                setFormError(null);
              }}
              className="rounded-none font-bold uppercase tracking-widest text-[10px]"
            >
              Huỷ
            </Button>
            <Button
              className="bg-primary text-black hover:bg-primary/90 rounded-none font-bold uppercase tracking-widest text-[10px]"
              disabled={creating || updating}
              onClick={() => void handleSaveForm()}
            >
              {creating || updating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin inline mr-2" />
                  Đang lưu…
                </>
              ) : selectedLink ? (
                "Lưu"
              ) : (
                "Tạo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isColorDialogOpen} onOpenChange={setIsColorDialogOpen}>
        <DialogContent className="bg-surface-container-lowest border border-outline-variant/20 rounded-none max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold uppercase tracking-widest text-foreground">
              Chỉnh màu theme
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {colorError ? (
              <p className="text-[11px] font-mono text-red-400">{colorError}</p>
            ) : null}
            <ColorFormFields value={colorTheme} onChange={setColorTheme} />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsColorDialogOpen(false);
                setSelectedLink(null);
                setColorError(null);
              }}
              className="rounded-none font-bold uppercase tracking-widest text-[10px]"
            >
              Huỷ
            </Button>
            <Button
              className="bg-primary text-black hover:bg-primary/90 rounded-none font-bold uppercase tracking-widest text-[10px]"
              disabled={savingTheme}
              onClick={() => void handleSaveColorOnly()}
            >
              {savingTheme ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin inline mr-2" />
                  Đang lưu…
                </>
              ) : (
                "Lưu"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-surface-container-lowest border border-outline-variant/20 rounded-none max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold uppercase tracking-widest text-foreground">
              Xác nhận xóa
            </DialogTitle>
          </DialogHeader>
          {formError ? (
            <p className="text-[11px] font-mono text-red-400">{formError}</p>
          ) : null}
          <p className="text-sm text-outline">
            Bạn có chắc chắn muốn xóa donation link &quot;
            {selectedLink?.title ?? "—"}&quot; không?
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setFormError(null);
              }}
              className="rounded-none font-bold uppercase tracking-widest text-[10px]"
            >
              Huỷ
            </Button>
            <Button
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90 rounded-none font-bold uppercase tracking-widest text-[10px]"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin inline mr-2" />
                  Đang xóa…
                </>
              ) : (
                "Xóa"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
