import { useEffect, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Zap, ShieldAlert, Sword } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateChallengeMutation,
  CHALLENGE_CONTENT_MAX_LENGTH,
} from "@/src/redux/queries/challenges.api";
import { useAuthSelector } from "@/src/redux/slices/auth.slice";

export interface ChallengeModalStreamer {
  id: string;
  name: string;
}

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  streamer: ChallengeModalStreamer | null;
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

export function ChallengeModal({
  isOpen,
  onClose,
  streamer,
}: ChallengeModalProps) {
  const { isAuthenticated } = useAuthSelector();
  const [amount, setAmount] = useState("50000");
  const [challenge, setChallenge] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [createChallenge, { isLoading }] = useCreateChallengeMutation();

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    setChallenge("");
    setAmount("50000");
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSuccess(null);
    setChallenge("");
    setAmount("50000");
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!streamer?.id) {
      setError("Thiếu streamer.");
      return;
    }
    if (!isAuthenticated) {
      setError("Vui lòng đăng nhập để gửi thử thách.");
      return;
    }
    const amt = parseFloat(String(amount).replace(/,/g, ""));
    if (!Number.isFinite(amt) || amt < 1) {
      setError("Số tiền không hợp lệ.");
      return;
    }
    const content = challenge.trim();
    if (content.length < 1) {
      setError("Nhập nội dung thử thách.");
      return;
    }
    if (content.length > CHALLENGE_CONTENT_MAX_LENGTH) {
      setError(`Nội dung tối đa ${CHALLENGE_CONTENT_MAX_LENGTH} ký tự.`);
      return;
    }
    try {
      await createChallenge({
        amount: amt,
        content,
        streamerId: streamer.id,
      }).unwrap();
      setSuccess("Đã gửi thử thách — tiền đã trừ ví.");
      setTimeout(() => handleClose(), 1400);
    } catch (err) {
      setError(getMutationError(err));
    }
  };

  if (!streamer) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="max-w-md bg-surface-container-low border border-primary/20 p-0 overflow-hidden cut-corner shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <DialogHeader className="p-8 pb-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-bold tracking-tight text-foreground uppercase italic flex items-center gap-3">
                <Sword className="w-6 h-6 text-primary" />
                THIẾT LẬP THỬ THÁCH
              </DialogTitle>
              <p className="text-[10px] font-mono text-outline tracking-widest uppercase">
                MỤC TIÊU: {streamer.name}
              </p>
              <p className="text-[9px] font-mono text-outline/90 tracking-wide pt-1">
                POST /challenges — trừ ví ngay khi gửi
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
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

          <AnimatePresence mode="wait">
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-outline uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary" />
                  PHẦN THƯỞNG THỬ THÁCH (VND)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    "20000",
                    "50000",
                    "100000",
                    "200000",
                    "500000",
                    "1000000",
                  ].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className={`py-2 text-[10px] font-bold border transition-all ${
                        amount === val
                          ? "bg-primary border-primary text-black"
                          : "bg-surface-container-highest/20 border-outline-variant/10 text-outline hover:border-primary/50"
                      }`}
                    >
                      {parseInt(val, 10).toLocaleString("vi-VN")}
                    </button>
                  ))}
                </div>
                <div className="relative group">
                  <Input
                    type="number"
                    min={1}
                    step={1000}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-12 bg-surface-container-highest/30 border-outline-variant/10 rounded-none font-mono text-sm tracking-widest pl-10"
                  />
                  <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-outline uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary" />
                  NỘI DUNG THỬ THÁCH
                </label>
                <Textarea
                  placeholder="Sử dụng rìu trong trận đấu tiếp theo"
                  value={challenge}
                  onChange={(e) => setChallenge(e.target.value)}
                  maxLength={CHALLENGE_CONTENT_MAX_LENGTH}
                  className="min-h-[100px] bg-surface-container-highest/30 border-outline-variant/10 rounded-none focus:ring-primary/50 font-medium text-sm"
                />
                <p className="text-[9px] font-mono text-outline text-right">
                  {challenge.length}/{CHALLENGE_CONTENT_MAX_LENGTH}
                </p>
              </div>

              <div className="bg-primary/5 border border-primary/20 p-4 flex gap-3">
                <ShieldAlert className="w-5 h-5 text-primary shrink-0" />
                <p className="text-[10px] text-primary/80 leading-relaxed font-medium uppercase tracking-wider">
                  Streamer sẽ xem xét và chấp nhận thử thách của bạn. Nếu thử
                  thách không được thực hiện hoặc bị từ chối, bạn sẽ được hoàn
                  tiền vào ví.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-black font-bold tracking-[0.2em] rounded-none shadow-[0_0_30px_rgba(255,184,0,0.2)]"
              >
                {isLoading ? "ĐANG GỬI..." : "GỬI THỬ THÁCH"}
              </Button>
            </motion.div>
          </AnimatePresence>
        </form>
      </DialogContent>
    </Dialog>
  );
}
