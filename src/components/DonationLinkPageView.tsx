import { useEffect, useMemo, useState } from "react";
import { Loader2, QrCode, Wallet, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useLazyGetPublicDonationLinkByCustomUrlQuery,
  type DonationLinkPublic,
} from "@/src/redux/queries/public.api";
import {
  useCreateDonationMutation,
  useGenerateDonationQrBankMutation,
} from "@/src/redux/queries/donate.api";
import { useAuthSelector } from "@/src/redux/slices/auth.slice";

const AMOUNT_PRESETS = [10_000, 20_000, 50_000, 100_000, 200_000, 500_000];

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
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
  if (typeof x.message === "string" && x.message) return x.message;
  return "Có lỗi xảy ra.";
}

export interface DonationLinkPageViewProps {
  customUrl: string;
}

export function DonationLinkPageView({ customUrl }: DonationLinkPageViewProps) {
  const { isAuthenticated } = useAuthSelector();
  const [fetchLink, { data: linkData, isLoading, isError }] =
    useLazyGetPublicDonationLinkByCustomUrlQuery();
  const [generateQr, { isLoading: qrLoading }] =
    useGenerateDonationQrBankMutation();
  const [createDonation, { isLoading: walletLoading }] =
    useCreateDonationMutation();

  useEffect(() => {
    if (customUrl) void fetchLink(customUrl);
  }, [customUrl, fetchLink]);

  const link: DonationLinkPublic | undefined = linkData?.data;

  const theme = useMemo(() => {
    const t = link?.theme as Record<string, string> | undefined;
    return {
      bg: t?.backgroundColor ?? "#0f0f0f",
      text: t?.textColor ?? "#ffffff",
      primary: t?.primaryColor ?? "#F6BD2A",
      secondary: t?.secondaryColor ?? "#D4A017",
    };
  }, [link]);

  const [amount, setAmount] = useState<number>(50_000);
  const [amountInput, setAmountInput] = useState("50000");
  const [message, setMessage] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [qrPayload, setQrPayload] = useState<Record<string, unknown> | null>(
    null,
  );
  const [banner, setBanner] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const donationLinkId = link?._id ?? link?.id;

  const onGenerateQr = async () => {
    setBanner(null);
    if (!isAuthenticated) {
      setBanner("Vui lòng đăng nhập để tạo mã QR.");
      return;
    }
    if (!link?.streamerId || !donationLinkId) {
      setBanner("Thiếu thông tin donation link.");
      return;
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 1) {
      setBanner("Số tiền không hợp lệ.");
      return;
    }
    const msg = message.trim();
    if (!msg) {
      setBanner("Vui lòng nhập lời nhắn (bắt buộc cho QR).");
      return;
    }
    try {
      const res = await generateQr({
        amount: amt,
        streamerId: String(link.streamerId),
        donationLinkId: String(donationLinkId),
        message: msg,
      }).unwrap();
      const inner = res?.data;
      const payload =
        inner && typeof inner === "object"
          ? (inner as Record<string, unknown>)
          : (res as unknown as Record<string, unknown>);
      setQrPayload(payload ?? null);
      setQrOpen(true);
      setBanner(null);
    } catch (e: unknown) {
      setBanner(getMutationError(e));
    }
  };

  const onDonateWallet = async () => {
    setBanner(null);
    if (!isAuthenticated) {
      setBanner("Vui lòng đăng nhập để donate bằng ví.");
      return;
    }
    if (!link?.streamerId || !donationLinkId) {
      setBanner("Thiếu thông tin donation link.");
      return;
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 1) {
      setBanner("Số tiền không hợp lệ.");
      return;
    }
    try {
      await createDonation({
        amount: amt,
        streamerId: String(link.streamerId),
        donationLinkId: String(donationLinkId),
        paymentMethod: "wallet",
        message: message.trim() || undefined,
      }).unwrap();
      setBanner("Donate bằng ví thành công!");
      setMessage("");
    } catch (e: unknown) {
      setBanner(getMutationError(e));
    }
  };

  const qrImageUrl =
    (qrPayload?.qrCodeUrl as string) ||
    (qrPayload?.qrUrl as string) ||
    (qrPayload?.imageUrl as string) ||
    undefined;

  const transferContent =
    (qrPayload?.transferContent as string) ||
    (qrPayload?.addInfo as string) ||
    (qrPayload?.content as string) ||
    undefined;

  const syncAmountFromInput = (raw: string) => {
    setAmountInput(raw);
    const digits = raw.replace(/\D/g, "");
    if (!digits) {
      setAmount(0);
      return;
    }
    const n = parseInt(digits, 10);
    if (Number.isFinite(n)) setAmount(n);
  };

  const onPickPreset = (p: number) => {
    setAmount(p);
    setAmountInput(String(p));
  };

  if (isLoading) {
    return (
      <div
        className="flex h-screen w-screen items-center justify-center"
        style={{ background: "#0f0f0f" }}
      >
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !link) {
    return (
      <div
        className="flex h-screen w-screen flex-col items-center justify-center gap-4 px-4 text-center"
        style={{ background: "#0f0f0f", color: "#fff" }}
      >
        <div className="text-5xl">😕</div>
        <h1 className="text-xl font-bold">Không tìm thấy donation link</h1>
        <p className="max-w-md text-sm text-white/60">
          Link không tồn tại hoặc đã bị xoá. Kiểm tra lại URL{" "}
          <span className="break-all opacity-80">{customUrl}</span>
        </p>
        <Button asChild variant="outline" className="mt-2 rounded-none">
          <a href="/">Về trang chủ</a>
        </Button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: theme.bg,
        color: theme.text,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <header
        className="w-full px-4 py-8 text-center"
        style={{
          background: `linear-gradient(135deg, ${theme.primary}22 0%, ${theme.secondary}11 100%)`,
          borderBottom: `1px solid ${theme.primary}33`,
        }}
      >
        <div
          className="mx-auto mb-3 flex h-[72px] w-[72px] items-center justify-center rounded-full text-3xl font-bold"
          style={{ background: theme.primary, color: theme.bg }}
        >
          {(link.title || customUrl || "?").slice(0, 1).toUpperCase()}
        </div>
        <h1 className="text-2xl font-bold" style={{ color: theme.text }}>
          {link.title || customUrl}
        </h1>
        {typeof link.description === "string" && link.description ? (
          <p
            className="mx-auto mt-2 max-w-lg text-sm leading-relaxed"
            style={{ color: `${theme.text}99` }}
          >
            {link.description}
          </p>
        ) : null}
      </header>

      <div className="mx-auto max-w-lg px-4 py-8">
        {banner ? (
          <p
            className="mb-4 rounded-sm border px-3 py-2 text-sm"
            style={{
              borderColor: `${theme.primary}55`,
              background: `${theme.primary}14`,
              color: theme.text,
            }}
          >
            {banner}
          </p>
        ) : null}

        <div className="mb-6">
          <p
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: `${theme.text}88` }}
          >
            Chọn hoặc nhập số tiền (VND)
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {AMOUNT_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onPickPreset(p)}
                className="rounded-lg px-3.5 py-1.5 text-[13px] transition-colors"
                style={{
                  border: `1.5px solid ${amount === p ? theme.primary : `${theme.text}22`}`,
                  background:
                    amount === p ? `${theme.primary}22` : "transparent",
                  color: amount === p ? theme.primary : theme.text,
                  fontWeight: amount === p ? 700 : 400,
                }}
              >
                {formatVnd(p)}
              </button>
            ))}
          </div>
          <Input
            type="text"
            inputMode="numeric"
            className="mt-3 rounded-lg border text-base"
            style={{
              background: `${theme.text}0d`,
              borderColor: `${theme.text}22`,
              color: theme.text,
            }}
            value={amountInput}
            onChange={(e) => syncAmountFromInput(e.target.value)}
            placeholder="Hoặc nhập số tiền khác…"
          />
        </div>

        <div className="mb-6">
          <p
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: `${theme.text}88` }}
          >
            Lời nhắn (bắt buộc cho QR)
          </p>
          <Textarea
            className="mt-2 min-h-[88px] resize-none rounded-lg border text-sm"
            style={{
              background: `${theme.text}0d`,
              borderColor: `${theme.text}22`,
              color: theme.text,
            }}
            maxLength={500}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Nhập lời nhắn sẽ hiển thị trên stream…"
          />
          <p className="mt-1 text-right text-[10px] opacity-60">
            {message.length}/500
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            disabled={qrLoading}
            className="h-auto rounded-xl py-3.5 text-base font-bold"
            style={{
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
              color: theme.bg,
              border: "none",
            }}
            onClick={() => void onGenerateQr()}
          >
            {qrLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Đang tạo QR…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <QrCode className="h-5 w-5" /> Tạo mã VietQR
              </span>
            )}
          </Button>

          {isAuthenticated ? (
            <Button
              type="button"
              variant="outline"
              disabled={walletLoading}
              className="h-auto rounded-xl border-2 py-3 text-[15px] font-semibold"
              style={{
                borderColor: `${theme.primary}66`,
                color: theme.primary,
                background: "transparent",
              }}
              onClick={() => void onDonateWallet()}
            >
              {walletLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Đang xử lý…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Wallet className="h-5 w-5" /> Donate bằng ví
                </span>
              )}
            </Button>
          ) : (
            <p className="text-center text-sm" style={{ color: `${theme.text}66` }}>
              Đăng nhập để donate bằng ví hoặc tạo VietQR.
            </p>
          )}
        </div>

        <p className="mt-10 text-center text-xs" style={{ color: `${theme.text}44` }}>
          <a href="/" className="underline underline-offset-2 hover:opacity-100">
            Về XScan
          </a>
        </p>
      </div>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-md rounded-none border border-outline-variant/30 bg-background">
          <DialogHeader>
            <DialogTitle>VietQR — chuyển khoản</DialogTitle>
          </DialogHeader>
          {qrImageUrl ? (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="flex h-56 w-56 items-center justify-center overflow-hidden rounded-lg bg-white p-2">
                <img
                  src={qrImageUrl}
                  alt="VietQR"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              {transferContent ? (
                <div className="w-full rounded-md border border-outline-variant/30 bg-muted/40 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Nội dung chuyển khoản
                  </p>
                  <p className="mt-1 break-all text-sm font-medium">
                    {transferContent}
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-2 rounded-none"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(transferContent);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      } catch {
                        /* ignore */
                      }
                    }}
                  >
                    {copied ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {copied ? "Đã copy" : "Copy"}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Không có ảnh QR — kiểm tra lại API.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
