import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  Mail,
  Lock,
  Zap,
  Chrome,
  Github,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useLoginMutation, useRegisterMutation } from "@/src/redux/queries/public.api";
import { useAppDispatch } from "@/src/redux";
import { setAuth } from "@/src/redux/slices/auth.slice";
import { parseAuthPayload } from "@/src/redux/utils/parseAuthPayload";

function mapUserFromPayload(
  raw?: Record<string, unknown>,
): {
  id?: string;
  email?: string;
  username?: string;
  role?: string;
  [key: string]: unknown;
} | null {
  if (!raw) return null;
  const idVal = raw._id ?? raw.id;
  return {
    ...raw,
    id: idVal != null ? String(idVal) : undefined,
    email: typeof raw.email === "string" ? raw.email : undefined,
    username: typeof raw.username === "string" ? raw.username : undefined,
    role: typeof raw.role === "string" ? raw.role : undefined,
  };
}

function splitOperatorName(name: string): { firstName: string; lastName: string } {
  const t = name.trim();
  if (!t) return { firstName: "Agent", lastName: "XScan" };
  const i = t.indexOf(" ");
  if (i === -1) return { firstName: t, lastName: t };
  return {
    firstName: t.slice(0, i).trim() || "Agent",
    lastName: t.slice(i + 1).trim() || t.slice(0, i).trim(),
  };
}

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== "object") return fallback;
  const e = err as Record<string, unknown>;
  const data = e.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.message === "string" && d.message) return d.message;
    const nested = d.error;
    if (nested && typeof nested === "object") {
      const m = (nested as Record<string, unknown>).message;
      if (typeof m === "string" && m) return m;
    }
  }
  if (typeof e.error === "string" && e.error) return e.error;
  return fallback;
}

export function AuthView() {
  const dispatch = useAppDispatch();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const [login, { isLoading: loginLoading }] = useLoginMutation();
  const [register, { isLoading: registerLoading }] = useRegisterMutation();
  const isLoading = loginLoading || registerLoading;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      if (mode === "login") {
        const result = await login({ email: email.trim(), password }).unwrap();
        if (!result.success) {
          setErrorMessage(
            result.message ||
              result.error?.message ||
              "Đăng nhập không thành công.",
          );
          return;
        }
        const parsed = parseAuthPayload(result);
        if (!parsed.accessToken) {
          setErrorMessage("Phản hồi máy chủ thiếu access token.");
          return;
        }
        dispatch(
          setAuth({
            accessToken: parsed.accessToken,
            refreshToken: parsed.refreshToken ?? "",
            user: mapUserFromPayload(parsed.user as Record<string, unknown> | undefined),
          }),
        );
        return;
      }

      const { firstName, lastName } = splitOperatorName(operatorName);
      const result = await register({
        email: email.trim(),
        password,
        firstName,
        lastName,
      }).unwrap();

      if (!result.success) {
        setErrorMessage(
          result.message ||
            result.error?.message ||
            "Đăng ký không thành công.",
        );
        return;
      }

      const parsed = parseAuthPayload(result);
      if (parsed.accessToken) {
        dispatch(
          setAuth({
            accessToken: parsed.accessToken,
            refreshToken: parsed.refreshToken ?? "",
            user: mapUserFromPayload(parsed.user as Record<string, unknown> | undefined),
          }),
        );
        return;
      }

      setInfoMessage(
        result.message ||
          "Đăng ký thành công. Nếu cần xác minh email, hãy kiểm tra hộp thư.",
      );
    } catch (err) {
      setErrorMessage(
        getApiErrorMessage(err, "Có lỗi xảy ra. Vui lòng thử lại."),
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)",
            backgroundSize: "100% 4px",
          }}
        />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Logo Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center space-y-2 relative z-10 group"
      >
        <h1 className="text-5xl font-bold tracking-tighter italic text-primary group-hover:scale-105 transition-transform">
          XSCAN_OPS
        </h1>
        <p className="text-[10px] font-bold text-outline tracking-[0.4em] uppercase group-hover:text-primary transition-colors">
          TACTICAL INTELLIGENCE PORTAL
        </p>
      </motion.div>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[480px] bg-surface-container-low border border-outline-variant/10 relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        style={{
          clipPath:
            "polygon(0 40px, 40px 0, 100% 0, 100% calc(100% - 40px), calc(100% - 40px) 100%, 0 100%)",
        }}
      >
        <div className="p-12 space-y-10">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight uppercase text-foreground">
              {mode === "login" ? "YÊU CẦU ỦY QUYỀN" : "KHỞI TẠO ĐẶC VỤ MỚI"}
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary animate-pulse" />
              <p className="text-[10px] font-mono text-primary tracking-widest uppercase">
                TRẠNG THÁI HỆ THỐNG:{" "}
                {isLoading ? "ĐANG KẾT NỐI..." : "ĐÃ MÃ HÓA"}
              </p>
            </div>
            {errorMessage && (
              <p className="text-[11px] font-mono text-red-400 tracking-wide">
                {errorMessage}
              </p>
            )}
            {infoMessage && (
              <p className="text-[11px] font-mono text-primary/90 tracking-wide">
                {infoMessage}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                {mode === "register" && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-outline tracking-widest uppercase flex items-center gap-2">
                      <div className="w-1 h-1 bg-primary" />
                      TÊN ĐẶC VỤ (HỌ TÊN)
                    </label>
                    <div className="relative group">
                      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary opacity-0 group-focus-within:opacity-100 transition-opacity" />
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary opacity-0 group-focus-within:opacity-100 transition-opacity" />

                      <Input
                        required
                        value={operatorName}
                        onChange={(ev) => setOperatorName(ev.target.value)}
                        placeholder="NGUYỄN VĂN A"
                        className="h-14 bg-surface-container-highest/30 border-none focus-visible:ring-1 focus-visible:ring-primary/30 rounded-none font-mono text-xs tracking-widest"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline tracking-widest uppercase flex items-center gap-2">
                    <div className="w-1 h-1 bg-primary" />
                    EMAIL ĐẶC VỤ
                  </label>
                  <div className="relative group">
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary opacity-0 group-focus-within:opacity-100 transition-opacity" />

                    <Input
                      required
                      type="email"
                      value={email}
                      onChange={(ev) => setEmail(ev.target.value)}
                      placeholder="USER@XSCAN.OPS"
                      autoComplete="email"
                      className="h-14 bg-surface-container-highest/30 border-none focus-visible:ring-1 focus-visible:ring-primary/30 rounded-none font-mono text-xs tracking-widest"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-outline tracking-widest uppercase flex items-center gap-2">
                      <div className="w-1 h-1 bg-primary" />
                      MẬT MÃ BẢO MẬT
                    </label>
                    {mode === "login" && (
                      <button
                        type="button"
                        className="text-[9px] font-bold text-outline hover:text-primary tracking-widest uppercase transition-colors"
                      >
                        QUÊN MẬT MÃ?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary opacity-0 group-focus-within:opacity-100 transition-opacity" />

                    <Input
                      required
                      type="password"
                      value={password}
                      onChange={(ev) => setPassword(ev.target.value)}
                      placeholder="••••••••••••"
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                      className="h-14 bg-surface-container-highest/30 border-none focus-visible:ring-1 focus-visible:ring-primary/30 rounded-none font-mono text-xs tracking-widest"
                    />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="persist"
                className="w-4 h-4 rounded-none border-outline-variant/30 data-[state=checked]:bg-primary data-[state=checked]:text-black"
              />
              <label
                htmlFor="persist"
                className="text-[10px] font-bold text-outline tracking-widest uppercase cursor-pointer select-none"
              >
                DUY TRÌ PHIÊN LÀM VIỆC
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-16 bg-primary hover:bg-primary/90 text-black font-bold text-sm tracking-[0.3em] rounded-none shadow-[0_0_30px_rgba(255,184,0,0.2)] relative overflow-hidden group"
            >
              {isLoading
                ? mode === "login"
                  ? "ĐANG XÁC THỰC..."
                  : "ĐANG KHỞI TẠO..."
                : mode === "login"
                  ? "THIẾT LẬP KẾT NỐI"
                  : "XÁC NHẬN ĐĂNG KÝ"}
              {!isLoading && (
                <Zap className="ml-3 w-5 h-5 fill-black group-hover:scale-110 transition-transform" />
              )}

              {isLoading && (
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                />
              )}
            </Button>
          </form>

          <div className="space-y-6">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/10"></div>
              </div>
              <span className="relative px-4 bg-surface-container-low text-[9px] font-bold text-outline tracking-[0.3em] uppercase">
                XÁC THỰC NGOÀI
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-none border-outline-variant/20 hover:bg-surface-container-highest/50 text-[10px] font-bold tracking-widest uppercase"
              >
                <Chrome className="w-4 h-4 mr-2" />
                GOOGLE NODE
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-none border-outline-variant/20 hover:bg-surface-container-highest/50 text-[10px] font-bold tracking-widest uppercase"
              >
                <Github className="w-4 h-4 mr-2" />
                GITHUB CORE
              </Button>
            </div>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setErrorMessage(null);
                setInfoMessage(null);
              }}
              className="text-[10px] font-bold text-outline hover:text-primary tracking-[0.2em] uppercase transition-all group"
            >
              {mode === "login" ? (
                <>
                  ĐẶC VỤ MỚI?{" "}
                  <span className="text-primary group-hover:underline">
                    KHỞI TẠO ĐĂNG KÝ
                  </span>
                </>
              ) : (
                <>
                  ĐÃ CÓ TÀI KHOẢN?{" "}
                  <span className="text-primary group-hover:underline">
                    QUAY LẠI ĐĂNG NHẬP
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Footer Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 flex items-center gap-12 text-[9px] font-mono text-outline tracking-[0.2em] uppercase"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3 h-3 text-primary" />
          RSA_4096_ENCRYPTION_ACTIVE
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-primary" />
          SECURE_NODE_04
        </div>
      </motion.div>
    </div>
  );
}
