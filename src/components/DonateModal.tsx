import { useEffect, useMemo, useState } from "react";
import { X, Zap, Wallet, QrCode, ShieldCheck, Smile } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useGetPublicDonationLinksByStreamerQuery } from "@/src/redux/queries/public.api";
import type { DonationLinkPublic } from "@/src/redux/queries/public.api";
import {
  useCreateDonationMutation,
  useGenerateDonationQrBankMutation,
  type DonationQrBankResponse,
} from "@/src/redux/queries/donate.api";
import { useGetMyWalletQuery } from "@/src/redux/queries/wallet.api";
import type { WalletMe } from "@/src/redux/queries/wallet.api";
import { useAuthSelector } from "@/src/redux/slices/auth.slice";

export interface DonateModalSubject {
  type: "streamer" | "match";
  /** Bắt buộc khi type === "streamer" — dùng cho API donation */
  streamerId?: string;
  name?: string;
  avatar?: string;
  level?: string;
  team1?: { name: string; image: string };
  team2?: { name: string; image: string };
  currentDonation?: string;
}

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: DonateModalSubject | null;
}

function pickDonationLinkId(links: DonationLinkPublic[]): string | undefined {
  if (!links?.length) return undefined;
  const def = links.find((l) => l.isDefault);
  const active = links.find((l) => l.isActive !== false);
  const picked = def || active || links[0];
  const id = picked._id ?? picked.id;
  return id != null ? String(id) : undefined;
}

function parsePresetVnd(preset: string): number {
  const m = preset.trim().match(/^(\d+)\s*K$/i);
  if (m) return parseInt(m[1], 10) * 1000;
  const digits = preset.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

function resolveDonationAmountVnd(
  presetLabel: string | null,
  customRaw: string,
): number {
  if (customRaw.trim()) {
    const n = parseInt(customRaw.replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? n : 0;
  }
  if (presetLabel) return parsePresetVnd(presetLabel);
  return 0;
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

export function DonateModal({ isOpen, onClose, subject }: DonateModalProps) {
  const { isAuthenticated } = useAuthSelector();
  const [activeTab, setActiveTab] = useState<"wallet" | "qrcode">("wallet");
  const [isQrGenerated, setIsQrGenerated] = useState(false);
  const [amountPreset, setAmountPreset] = useState<string | null>("100K");
  const [customAmountStr, setCustomAmountStr] = useState("");
  const [donationMessage, setDonationMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);

  const streamerId =
    subject?.type === "streamer" && subject.streamerId
      ? subject.streamerId
      : "";

  const { data: linksRes, isLoading: linksLoading } =
    useGetPublicDonationLinksByStreamerQuery(streamerId, {
      skip: !isOpen || !subject || subject.type !== "streamer" || !streamerId,
    });

  const donationLinks = useMemo(() => {
    const d = linksRes?.data;
    return Array.isArray(d) ? d : [];
  }, [linksRes]);

  const donationLinkId = useMemo(
    () => pickDonationLinkId(donationLinks),
    [donationLinks],
  );

  const [createDonation, { isLoading: walletSubmitting }] =
    useCreateDonationMutation();
  const [generateQr, { isLoading: qrSubmitting }] =
    useGenerateDonationQrBankMutation();

  const { data: walletBody, isLoading: walletLoading } = useGetMyWalletQuery(
    undefined,
    { skip: !isOpen || !isAuthenticated },
  );

  const balanceVnd = useMemo(() => {
    if (!walletBody || typeof walletBody !== "object") return 0;
    const w = (walletBody as { data?: WalletMe }).data;
    if (w && typeof w.balanceVnd === "number") return w.balanceVnd;
    return 0;
  }, [walletBody]);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSuccess(null);
    setIsQrGenerated(false);
    setQrImageUrl(null);
    setActiveTab("wallet");
    setAmountPreset("100K");
    setCustomAmountStr(String(parsePresetVnd("100K")));
    setDonationMessage("");
  }, [isOpen]);

  const fillWalletMaxToInput = () => {
    const max = Math.max(0, Math.floor(balanceVnd));
    setAmountPreset(null);
    setCustomAmountStr(max > 0 ? String(max) : "");
  };

  if (!subject) return null;

  const handleClose = () => {
    setIsQrGenerated(false);
    setActiveTab("wallet");
    setQrImageUrl(null);
    setError(null);
    setSuccess(null);
    onClose();
  };

  const canUseDonationApi =
    subject.type === "streamer" &&
    Boolean(streamerId) &&
    Boolean(donationLinkId);

  const runWalletDonation = async () => {
    setError(null);
    setSuccess(null);
    if (!isAuthenticated) {
      setError("Vui lòng đăng nhập để ủng hộ.");
      return;
    }
    if (subject.type !== "streamer" || !streamerId) {
      setError("Ủng hộ trận đấu chưa được kết nối API.");
      return;
    }
    if (!donationLinkId) {
      setError("Streamer chưa có link nhận ủng hộ.");
      return;
    }
    const amt = resolveDonationAmountVnd(amountPreset, customAmountStr);
    if (amt < 1000) {
      setError("Số tiền tối thiểu 1.000 VND.");
      return;
    }
    try {
      await createDonation({
        amount: amt,
        streamerId,
        donationLinkId,
        message: donationMessage.trim() || "Ủng hộ",
        isAnonymous: false,
        paymentMethod: "wallet",
      }).unwrap();
      setSuccess("Ủng hộ thành công.");
      setTimeout(() => handleClose(), 1200);
    } catch (e) {
      setError(getMutationError(e));
    }
  };

  const runQrDonation = async () => {
    setError(null);
    setSuccess(null);
    if (!isAuthenticated) {
      setError("Vui lòng đăng nhập để tạo mã QR.");
      return;
    }
    if (subject.type !== "streamer" || !streamerId) {
      setError("Ủng hộ trận đấu chưa được kết nối API.");
      return;
    }
    if (!donationLinkId) {
      setError("Streamer chưa có link nhận ủng hộ.");
      return;
    }
    const amt = resolveDonationAmountVnd(amountPreset, customAmountStr);
    if (amt < 1000) {
      setError("Số tiền tối thiểu 1.000 VND.");
      return;
    }
    const msg = (donationMessage.trim() || "Ủng hộ").slice(0, 500);
    if (msg.length < 1) {
      setError(
        "Vui lòng nhập tin nhắn (tối thiểu 1 ký tự) cho nội dung chuyển khoản.",
      );
      return;
    }
    try {
      const res = await generateQr({
        amount: amt,
        streamerId,
        donationLinkId,
        message: msg,
      }).unwrap();
      const payload = res.data as DonationQrBankResponse | undefined;
      const url = payload?.qrCodeUrl || payload?.imageUrl || payload?.qrUrl;
      if (!url) {
        setError("Máy chủ không trả về ảnh QR.");
        return;
      }
      setQrImageUrl(url);
      setIsQrGenerated(true);
    } catch (e) {
      setError(getMutationError(e));
    }
  };

  const onPrimaryAction = () => {
    if (subject.type === "match") {
      setError("Ủng hộ trận đấu qua API sẽ được bổ sung sau.");
      return;
    }
    if (!canUseDonationApi) {
      if (linksLoading) setError("Đang tải link ủng hộ...");
      else setError("Chưa có donation link hợp lệ cho streamer này.");
      return;
    }
    if (activeTab === "wallet") void runWalletDonation();
    else void runQrDonation();
  };

  const submitting = walletSubmitting || qrSubmitting;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl lg:max-w-5xl max-h-[min(92dvh,820px)] bg-surface-container-low border border-outline-variant/20 flex flex-col md:flex-row overflow-hidden overflow-y-auto cut-corner shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            <button
              type="button"
              onClick={handleClose}
              aria-label="Đóng"
              className="absolute right-2 top-2 z-[60] flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-outline-variant/50 bg-surface-container-highest/95 text-foreground shadow-md transition-colors hover:border-primary/50 hover:bg-surface-container-highest hover:text-primary md:right-3 md:top-3"
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>

            <div className="w-full min-w-0 md:w-[38%] lg:w-[36%] bg-surface-container-lowest p-6 pt-14 sm:p-8 sm:pt-14 md:p-8 md:pt-8 flex flex-col items-center justify-center space-y-6 md:space-y-8 border-r border-outline-variant/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none overflow-hidden">
                <div
                  className="w-full h-full"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)",
                    backgroundSize: "100% 4px",
                  }}
                />
              </div>

              {subject.type === "streamer" ? (
                <div className="relative">
                  <div className="w-48 h-48 border-2 border-primary/50 p-1 bg-surface-container">
                    <div className="w-full h-full border border-outline-variant/30 overflow-hidden relative">
                      <img
                        src={subject.avatar}
                        alt={subject.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-2 right-2 bg-primary px-1.5 py-0.5">
                        <span className="text-[10px] font-bold text-black uppercase">
                          {subject.level || "STREAMER"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex w-full max-w-full min-w-0 flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4 relative px-1">
                  <div className="h-20 w-20 shrink-0 border-2 border-primary/50 p-0.5 bg-surface-container sm:h-24 sm:w-24 md:h-28 md:w-28 md:p-1">
                    <img
                      src={subject.team1?.image}
                      alt={subject.team1?.name}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="shrink-0 text-lg font-bold italic text-primary sm:text-xl md:text-2xl">
                    VS
                  </span>
                  <div className="h-20 w-20 shrink-0 border-2 border-outline-variant/30 p-0.5 bg-surface-container sm:h-24 sm:w-24 md:h-28 md:w-28 md:p-1">
                    <img
                      src={subject.team2?.image}
                      alt={subject.team2?.name}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              )}

              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-[0.1em] uppercase text-foreground">
                  {subject.type === "streamer"
                    ? subject.name
                    : "ỦNG HỘ TRẬN ĐẤU"}
                </h2>
                <p className="text-[10px] font-bold text-outline tracking-[0.3em] uppercase">
                  {subject.type === "streamer"
                    ? "ĐANG ỦNG HỘ ĐẶC VỤ"
                    : `${subject.team1?.name} VS ${subject.team2?.name}`}
                </p>
              </div>

              <div className="w-full space-y-4 pt-8 border-t border-outline-variant/10">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-outline tracking-widest uppercase">
                    {subject.type === "streamer"
                      ? "ĐỊNH DANH"
                      : "TỔNG ỦNG HỘ TRẬN ĐẤU"}
                  </span>
                  <span className="text-[10px] font-mono text-primary font-bold truncate max-w-[50%] text-right">
                    {subject.type === "streamer" && streamerId
                      ? streamerId.slice(-8).toUpperCase()
                      : subject.currentDonation || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-outline tracking-widest uppercase">
                    KÊNH THANH TOÁN
                  </span>
                  <span className="text-[10px] font-mono text-primary font-bold">
                    VÍ / VIETQR
                  </span>
                </div>
              </div>
            </div>

            <div className="min-w-0 flex-1 p-6 sm:p-8 space-y-6 md:space-y-8 relative bg-surface-container-low min-h-0 flex flex-col md:min-h-[min(520px,60dvh)]">
              <div className="space-y-1 pr-12">
                <h3 className="text-2xl font-bold tracking-tight uppercase text-foreground">
                  GIAO DỊCH ỦNG HỘ
                </h3>
              </div>

              {error && (
                <p className="text-[11px] font-mono text-red-400 border border-red-400/30 bg-red-400/5 px-3 py-2">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-[11px] font-mono text-green-500 border border-green-500/30 bg-green-500/5 px-3 py-2">
                  {success}
                </p>
              )}

              <div className="relative p-1 bg-surface-container-highest/30 flex gap-1 border border-outline-variant/10">
                <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-primary" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-primary" />

                <Button
                  type="button"
                  onClick={() => {
                    setActiveTab("wallet");
                    setIsQrGenerated(false);
                    setQrImageUrl(null);
                  }}
                  className={`flex-1 font-bold text-[10px] tracking-[0.2em] h-10 rounded-none transition-all ${activeTab === "wallet" ? "bg-surface-container-highest border border-primary/50 text-primary" : "bg-transparent text-outline hover:text-primary"}`}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  VÍ TIỀN
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setActiveTab("qrcode");
                    setIsQrGenerated(false);
                    setQrImageUrl(null);
                  }}
                  className={`flex-1 font-bold text-[10px] tracking-[0.2em] h-10 rounded-none transition-all ${activeTab === "qrcode" ? "bg-surface-container-highest border border-primary/50 text-primary" : "bg-transparent text-outline hover:text-primary"}`}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  MÃ QR
                </Button>
              </div>

              <div className="relative flex-1 flex flex-col">
                <AnimatePresence mode="wait">
                  {isQrGenerated && qrImageUrl ? (
                    <motion.div
                      key="qr-view"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex-1 flex flex-col items-center justify-center space-y-8"
                    >
                      <div className="relative p-4 bg-white border-4 border-primary/30">
                        <div className="absolute -top-2 -right-2">
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="h-6 w-6 rounded-none"
                            onClick={() => {
                              setIsQrGenerated(false);
                              setQrImageUrl(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <img
                          src={qrImageUrl}
                          alt="VietQR"
                          className="w-48 h-48 object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="text-center space-y-6">
                        <div className="space-y-2">
                          <p className="text-primary font-bold tracking-widest uppercase">
                            QUÉT ĐỂ CHUYỂN KHOẢN
                          </p>
                          <p className="text-[10px] text-outline tracking-widest uppercase">
                            SỐ TIỀN:{" "}
                            {resolveDonationAmountVnd(
                              amountPreset,
                              customAmountStr,
                            ).toLocaleString("vi-VN")}{" "}
                            VND
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setIsQrGenerated(false);
                            setQrImageUrl(null);
                          }}
                          className="text-[10px] font-bold text-outline hover:text-primary tracking-[0.2em] uppercase h-8 rounded-none border border-outline-variant/20 px-4"
                        >
                          THAY ĐỔI SỐ TIỀN
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-8"
                    >
                      {subject.type === "streamer" && linksLoading && (
                        <p className="text-[10px] font-mono text-primary uppercase tracking-widest">
                          Đang tải link ủng hộ...
                        </p>
                      )}
                      {subject.type === "streamer" &&
                        !linksLoading &&
                        !donationLinkId && (
                          <p className="text-[10px] font-mono text-outline uppercase tracking-widest">
                            Streamer chưa có donation link công khai.
                          </p>
                        )}

                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-outline tracking-[0.2em] uppercase">
                          MỨC ỦNG HỘ CÓ SẴN (VND)
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                          {["50K", "100K", "500K"].map((amt) => (
                            <div key={amt} className="relative group">
                              {amt === "100K" && (
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary px-2 py-0.5 z-10">
                                  <span className="text-[8px] font-bold text-black uppercase">
                                    PHỔ BIẾN
                                  </span>
                                </div>
                              )}
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setAmountPreset(amt);
                                  setCustomAmountStr(
                                    String(parsePresetVnd(amt)),
                                  );
                                }}
                                className={`w-full h-14 font-display font-bold text-lg tracking-widest rounded-none border-outline-variant/20 hover:border-primary/50 transition-all ${amountPreset === amt ? "border-primary/60 bg-primary/5 text-primary" : "bg-surface-container-highest/50"}`}
                              >
                                {amt}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                          <label className="text-[10px] font-bold text-outline tracking-[0.2em] uppercase shrink-0">
                            SỐ TIỀN TÙY CHỈNH (VND)
                          </label>
                          {activeTab === "wallet" && (
                            <button
                              type="button"
                              onClick={fillWalletMaxToInput}
                              disabled={
                                !isAuthenticated ||
                                walletLoading ||
                                balanceVnd < 1
                              }
                              title="Bấm để điền tối đa số dư ví (VND) vào ô nhập"
                              className="text-right text-[10px] font-mono font-bold text-primary tracking-wide disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed max-w-[55%] sm:max-w-none"
                            >
                              {walletLoading ? (
                                <span className="text-outline">
                                  Đang tải ví…
                                </span>
                              ) : !isAuthenticated ? (
                                <span className="text-outline normal-case">
                                  Đăng nhập để xem số dư
                                </span>
                              ) : (
                                <>
                                  <span className="text-outline uppercase tracking-widest block text-[10px] font-bold mb-0.5">
                                    Số dư ví
                                  </span>
                                  <span className="hover:underline text-base">
                                    {balanceVnd.toLocaleString("vi-VN")} đ
                                  </span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                          <Input
                            value={customAmountStr}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (!v.trim()) {
                                setAmountPreset("100K");
                                setCustomAmountStr(
                                  String(parsePresetVnd("100K")),
                                );
                              } else {
                                setAmountPreset(null);
                                setCustomAmountStr(v);
                              }
                            }}
                            placeholder="VD: 200000"
                            inputMode="numeric"
                            className="h-14 pl-12 bg-surface-container-highest/50 border-none focus-visible:ring-1 focus-visible:ring-primary/50 text-lg font-display tracking-widest rounded-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-outline tracking-[0.2em] uppercase">
                          TIN NHẮN (BẮT BUỘC CHO VIETQR)
                        </label>
                        <div className="relative">
                          <Textarea
                            value={donationMessage}
                            onChange={(e) => setDonationMessage(e.target.value)}
                            placeholder="Thêm ghi chú cho streamer..."
                            className="min-h-[120px] bg-surface-container-highest/50 border-none focus-visible:ring-1 focus-visible:ring-primary/50 text-sm tracking-wide rounded-none p-4 resize-none"
                          />
                          <Smile className="absolute bottom-4 right-4 w-5 h-5 text-outline hover:text-primary cursor-pointer transition-colors" />
                        </div>
                      </div>

                      <div className="space-y-6 pt-4">
                        <Button
                          type="button"
                          disabled={submitting}
                          onClick={onPrimaryAction}
                          className="w-full h-16 bg-primary hover:bg-primary/90 text-black font-bold text-lg tracking-[0.2em] rounded-none shadow-[0_0_20px_rgba(255,184,0,0.2)]"
                        >
                          {submitting
                            ? "ĐANG XỬ LÝ..."
                            : activeTab === "wallet"
                              ? "XÁC NHẬN ỦNG HỘ"
                              : "TẠO MÃ QR"}
                          <Zap className="w-6 h-6 ml-3 fill-black" />
                        </Button>
                        <p className="text-[9px] font-mono text-outline text-center tracking-[0.2em] uppercase">
                          {activeTab === "wallet"
                            ? "Trừ ví theo POST /donations (paymentMethod: wallet)."
                            : "Tạo VietQR theo POST /donations/qrbank — quét app ngân hàng để chuyển khoản."}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
