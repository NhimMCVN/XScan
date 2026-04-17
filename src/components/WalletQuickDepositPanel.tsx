import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Wallet,
  Zap,
  Copy,
  Check,
  X,
  CreditCard,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useCreateWalletDepositMutation,
  useGetDepositConfigQuery,
  type WalletDepositQrData,
} from "@/src/redux/queries/wallet.api";
import { absoluteApiUrl } from "@/src/utils/absoluteApiUrl";

/** Mệnh giá nhanh — VND và GEM cùng quy mô (hệ thống: 1.000 VND = 1.000 GEM). */
const QUICK_AMOUNTS = [50000, 100000, 200000, 500000];

function parseDepositAmount(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Math.floor(Number(t));
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

function quickPresetMatchesInput(
  preset: number,
  customAmount: string,
): boolean {
  const v = parseDepositAmount(customAmount);
  return v !== null && v === preset;
}

function walletDepositErrorMessage(e: unknown): string {
  if (!e || typeof e !== "object") return "Không tạo được mã thanh toán.";
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
  return "Không tạo được mã thanh toán.";
}

export type WalletQuickDepositVariant = "sidebarAside" | "embedded";

interface WalletQuickDepositPanelProps {
  variant: WalletQuickDepositVariant;
}

export function WalletQuickDepositPanel({
  variant,
}: WalletQuickDepositPanelProps) {
  const isSidebar = variant === "sidebarAside";
  const { data: depCfgRes, isError: depCfgError } = useGetDepositConfigQuery();
  const [createDeposit, { isLoading: depositLoading }] =
    useCreateWalletDepositMutation();

  const supportedList = depCfgRes?.data?.supportedCurrencies ?? [];
  const supportedKey = useMemo(() => {
    if (!Array.isArray(supportedList)) return "";
    return [...supportedList.map((c) => String(c).toUpperCase())]
      .filter(Boolean)
      .sort()
      .join(",");
  }, [supportedList]);

  const supported = useMemo(() => {
    const s = new Set<string>();
    if (!supportedKey) return s;
    for (const c of supportedKey.split(",")) {
      if (c) s.add(c);
    }
    return s;
  }, [supportedKey]);

  const vndAllowed = supported.size === 0 || supported.has("VND");
  const gemAllowed = supported.size === 0 || supported.has("GEM");

  const [currency, setCurrency] = useState<"VND" | "GEM">("VND");
  const [customAmount, setCustomAmount] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [depositResult, setDepositResult] =
    useState<WalletDepositQrData | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<"addInfo" | null>(null);

  useEffect(() => {
    if (!supportedKey) return;
    const s = new Set(supportedKey.split(",").filter(Boolean));
    setCurrency((prev) => {
      if (s.has(prev)) return prev;
      if (s.has("VND")) return "VND";
      if (s.has("GEM")) return "GEM";
      return prev;
    });
  }, [supportedKey]);

  const quickAmounts = QUICK_AMOUNTS;

  const parsedAmount = useMemo(
    () => parseDepositAmount(customAmount),
    [customAmount],
  );

  const conversionText = useMemo(() => {
    if (parsedAmount == null) return "";
    const n = parsedAmount.toLocaleString("vi-VN");
    if (currency === "VND") {
      return `Nạp ${n} VND — sau khi xác nhận bạn nhận ${n} GEM (tỷ giá hệ thống: 1.000 VND = 1.000 GEM).`;
    }
    return `Nạp ${n} GEM — bạn chuyển khoản ${n} VND tương ứng (1.000 VND = 1.000 GEM). Số tiền và nội dung CK theo mã VietQR bên dưới.`;
  }, [parsedAmount, currency]);

  const handleCopy = useCallback((text: string, field: "addInfo") => {
    void navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const closeQr = () => {
    setShowQR(false);
    setDepositResult(null);
  };

  const handleCreateQR = async () => {
    setFormError(null);
    const amt = parseDepositAmount(customAmount);
    if (amt == null) {
      setFormError("Nhập số tiền hợp lệ (số nguyên ≥ 1).");
      return;
    }
    const apiCurrency = currency.toUpperCase();
    if (supported.size > 0 && !supported.has(apiCurrency)) {
      setFormError(`Loại tiền ${apiCurrency} hiện không được hỗ trợ nạp.`);
      return;
    }
    try {
      const res = await createDeposit({
        amount: amt,
        currency: apiCurrency,
      }).unwrap();
      if (res && res.success === false) {
        setFormError(
          typeof res.message === "string" && res.message
            ? res.message
            : "Không tạo được mã thanh toán.",
        );
        return;
      }
      const payload = res?.data;
      if (!payload?.qrUrl && !payload?.addInfo) {
        setFormError(
          typeof res?.message === "string" && res.message
            ? res.message
            : "Hệ thống không trả về mã QR hoặc nội dung chuyển khoản.",
        );
        return;
      }
      setDepositResult(payload);
      setShowQR(true);
    } catch (e) {
      setFormError(walletDepositErrorMessage(e));
    }
  };

  const displayAmount = depositResult?.amount ?? parsedAmount ?? 0;
  const displayCurrency = (depositResult?.currency ?? currency).toUpperCase();
  const qrSrc = depositResult?.qrUrl ? absoluteApiUrl(depositResult.qrUrl) : "";
  const transferContent = depositResult?.addInfo?.trim() || "";

  const formBody = (
    <>
      {depCfgError ? (
        <p className="text-[9px] text-destructive/90 leading-relaxed">
          Không tải được cấu hình nạp tiền. Vẫn có thể thử tạo mã; nếu lỗi, hãy
          tải lại trang.
        </p>
      ) : null}

      <div className="space-y-2 md:space-y-3">
        <label className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase">
          CHỌN LOẠI TIỀN
        </label>
        <div
          className={
            isSidebar
              ? "grid grid-cols-2 gap-2 md:gap-3"
              : "grid grid-cols-2 gap-2 md:gap-3 max-w-md"
          }
        >
          <Button
            type="button"
            variant="outline"
            disabled={!vndAllowed}
            onClick={() => {
              setCurrency("VND");
              setFormError(null);
            }}
            className={`h-10 md:h-12 rounded-[8px] border-outline-variant/20 text-[9px] md:text-[10px] font-bold tracking-widest ${currency === "VND" ? "bg-primary/10 border-primary text-primary" : "hover:bg-surface-container-high"} disabled:opacity-40`}
          >
            <Wallet className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" />
            VND
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!gemAllowed}
            onClick={() => {
              setCurrency("GEM");
              setFormError(null);
            }}
            className={`h-10 md:h-12 rounded-[8px] border-outline-variant/20 text-[9px] md:text-[10px] font-bold tracking-widest ${currency === "GEM" ? "bg-primary/10 border-primary text-primary" : "hover:bg-surface-container-high"} disabled:opacity-40`}
          >
            <Zap className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" />
            GEM
          </Button>
        </div>
      </div>

      <div className="space-y-2 md:space-y-3">
        <label className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase">
          MỆNH GIÁ NHANH
        </label>
        <div
          className={
            isSidebar
              ? "grid grid-cols-2 gap-2 md:gap-3"
              : "grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 max-w-2xl"
          }
        >
          {quickAmounts.map((amount) => (
            <Button
              type="button"
              key={amount}
              variant="outline"
              onClick={() => {
                setCustomAmount(String(amount));
                setFormError(null);
              }}
              className={`h-10 md:h-12 rounded-[8px] border-outline-variant/20 text-[10px] md:text-xs font-bold font-mono ${quickPresetMatchesInput(amount, customAmount) ? "bg-primary text-black border-primary" : "hover:bg-surface-container-high"}`}
            >
              {amount.toLocaleString("vi-VN")}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2 md:space-y-3">
        <label className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase">
          HOẶC NHẬP SỐ TIỀN
        </label>
        <div className={isSidebar ? "relative" : "relative max-w-md"}>
          <Input
            type="number"
            min={1}
            step={1}
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setFormError(null);
            }}
            placeholder="0"
            className="h-10 md:h-12 pl-3 md:pl-4 pr-12 md:pr-16 bg-surface-container-low border-outline-variant/20 font-mono text-xs md:text-sm rounded-[8px]"
          />
          <span className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-[9px] md:text-[10px] font-bold text-outline">
            {currency}
          </span>
        </div>
      </div>

      {parsedAmount != null && conversionText ? (
        <div className="bg-primary/5 border border-primary/10 p-3 md:p-4 rounded-[8px] flex items-start gap-2 md:gap-3 max-w-2xl">
          <AlertCircle className="w-3 h-3 md:w-4 md:h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-[9px] md:text-[10px] text-primary/80 leading-relaxed">
            {conversionText}
          </p>
        </div>
      ) : null}

      {formError ? (
        <p className="text-[9px] md:text-[10px] text-destructive font-medium">
          {formError}
        </p>
      ) : null}
    </>
  );

  const qrBlock = depositResult && (
    <>
      <div className="p-4 md:p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low/30">
        <h3 className="text-[9px] md:text-[10px] font-bold text-outline tracking-[0.2em] uppercase">
          QUÉT MÃ QR
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={closeQr}
          className="h-6 w-6 md:h-8 md:w-8 hover:bg-surface-container-high rounded-[8px]"
        >
          <X className="w-3 h-3 md:w-4 md:h-4" />
        </Button>
      </div>

      <div className="p-4 md:p-6 flex flex-col items-center justify-center space-y-6 md:space-y-8 bg-surface-container-lowest/50">
        {qrSrc ? (
          <div className="bg-white p-3 md:p-4 rounded-[12px] md:rounded-[16px] shadow-[0_0_30px_rgba(255,184,0,0.15)] relative group">
            <div className="absolute inset-0 border-2 border-primary/50 rounded-[12px] md:rounded-[16px] scale-105 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 pointer-events-none" />
            <img
              src={qrSrc}
              alt="Mã VietQR nạp tiền"
              className="w-40 h-40 md:w-48 md:h-48 object-contain"
            />
          </div>
        ) : (
          <p className="text-[10px] text-outline text-center max-w-xs">
            Không có ảnh QR. Dùng thông tin tài khoản và nội dung chuyển khoản
            bên dưới để nạp thủ công.
          </p>
        )}

        {(depositResult.bankName ||
          depositResult.bankShortName ||
          depositResult.accountNumber ||
          depositResult.accountName) && (
          <div className="w-full max-w-md space-y-2 rounded-[12px] border border-outline-variant/10 bg-surface-container-low p-3 md:p-4 text-[9px] md:text-[10px]">
            {depositResult.bankName || depositResult.bankShortName ? (
              <div className="flex justify-between gap-2">
                <span className="text-outline uppercase font-bold tracking-widest shrink-0">
                  Ngân hàng
                </span>
                <span className="font-bold text-right text-foreground">
                  {depositResult.bankName || depositResult.bankShortName}
                </span>
              </div>
            ) : null}
            {depositResult.accountName ? (
              <div className="flex justify-between gap-2">
                <span className="text-outline uppercase font-bold tracking-widest shrink-0">
                  Chủ TK
                </span>
                <span className="font-mono font-bold text-right break-all">
                  {depositResult.accountName}
                </span>
              </div>
            ) : null}
            {depositResult.accountNumber ? (
              <div className="flex justify-between gap-2">
                <span className="text-outline uppercase font-bold tracking-widest shrink-0">
                  Số TK
                </span>
                <span className="font-mono font-bold text-right tracking-wide">
                  {depositResult.accountNumber}
                </span>
              </div>
            ) : null}
          </div>
        )}

        <div className="text-center space-y-1 md:space-y-2">
          <p className="text-[9px] md:text-[10px] text-outline uppercase font-bold tracking-widest">
            SỐ TIỀN THANH TOÁN
          </p>
          <p className="text-xl md:text-2xl font-display font-bold text-primary tracking-tight">
            {displayAmount.toLocaleString("vi-VN")} {displayCurrency}
          </p>
        </div>

        {transferContent ? (
          <div className="w-full max-w-md space-y-3 md:space-y-4 bg-surface-container-low p-3 md:p-4 rounded-[12px] border border-outline-variant/10">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <span className="text-[8px] md:text-[9px] text-outline uppercase font-bold tracking-widest shrink-0 pt-0.5">
                NỘI DUNG CK
              </span>
              <div className="flex items-start justify-end gap-2 min-w-0 flex-1">
                <span
                  className="text-[9px] md:text-[10px] font-mono font-bold text-foreground text-right break-all"
                  title={transferContent}
                >
                  {transferContent}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 md:h-6 md:w-6 shrink-0 hover:bg-surface-container-high rounded-[6px]"
                  onClick={() => handleCopy(transferContent, "addInfo")}
                >
                  {copiedField === "addInfo" ? (
                    <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary" />
                  ) : (
                    <Copy className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex items-center gap-2 text-outline">
          <CreditCard className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
          <span className="text-[8px] md:text-[9px] uppercase font-bold tracking-widest">
            Hỗ trợ mọi ngân hàng & ví điện tử
          </span>
        </div>
      </div>
    </>
  );

  const submitButton = (
    <Button
      type="button"
      className={
        isSidebar
          ? "w-full inline-flex items-center justify-center gap-2 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase h-10 md:h-12 rounded-[8px] bg-primary text-black hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(255,184,0,0.1)]"
          : "w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase h-10 md:h-12 rounded-[8px] bg-primary text-black hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(255,184,0,0.1)]"
      }
      onClick={() => void handleCreateQR()}
      disabled={
        depositLoading ||
        parsedAmount == null ||
        (supported.size > 0 && !supported.has(currency.toUpperCase()))
      }
    >
      {depositLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Đang tạo…
        </>
      ) : (
        "TẠO MÃ THANH TOÁN"
      )}
    </Button>
  );

  if (isSidebar) {
    return (
      <aside className="w-full md:w-80 shrink-0 border-l border-outline-variant/10 bg-surface-container-lowest/50 flex flex-col overflow-hidden relative z-10">
        <div className="p-4 md:p-6 border-b border-outline-variant/10 bg-surface-container-low/30">
          <h3 className="text-[9px] md:text-[10px] font-bold text-outline tracking-[0.2em] uppercase">
            NẠP TIỀN NHANH
          </h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 md:p-6 space-y-4 md:space-y-6">{formBody}</div>
        </ScrollArea>
        <div className="p-4 md:p-6 border-t border-outline-variant/20 bg-surface-container-low/50 relative z-20">
          {submitButton}
        </div>

        <AnimatePresence>
          {showQR && depositResult ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute inset-0 z-50 bg-surface-container-lowest flex flex-col overflow-hidden"
            >
              {qrBlock}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </aside>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 relative">
      {formBody}
      <div className="pt-2">{submitButton}</div>

      <AnimatePresence>
        {showQR && depositResult ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 border border-outline-variant/20 rounded-[12px] overflow-hidden"
          >
            {qrBlock}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
