import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  ArrowRight, 
  Github, 
  Chrome,
  Zap,
  UserPlus,
  LogIn,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface AuthViewProps {
  onLogin: () => void;
}

export function AuthView({ onLogin }: AuthViewProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate tactical connection
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="w-full h-full" style={{ 
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)',
          backgroundSize: '100% 4px'
        }} />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Logo Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center space-y-2 relative z-10 cursor-pointer group"
        onClick={onLogin}
      >
        <h1 className="text-5xl font-bold tracking-tighter italic text-primary group-hover:scale-105 transition-transform">XSCAN_OPS</h1>
        <p className="text-[10px] font-bold text-outline tracking-[0.4em] uppercase group-hover:text-primary transition-colors">TACTICAL INTELLIGENCE PORTAL</p>
      </motion.div>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[480px] bg-surface-container-low border border-outline-variant/10 relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        style={{
          clipPath: 'polygon(0 40px, 40px 0, 100% 0, 100% calc(100% - 40px), calc(100% - 40px) 100%, 0 100%)'
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
                TRẠNG THÁI HỆ THỐNG: {isLoading ? "ĐANG KẾT NỐI..." : "ĐÃ MÃ HÓA"}
              </p>
            </div>
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
                      TÊN ĐẶC VỤ
                    </label>
                    <div className="relative group">
                      {/* Corner Brackets */}
                      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary opacity-0 group-focus-within:opacity-100 transition-opacity" />
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary opacity-0 group-focus-within:opacity-100 transition-opacity" />
                      
                      <Input 
                        required
                        placeholder="OPERATOR_NAME"
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
                      placeholder="USER@XSCAN.OPS"
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
                      <button type="button" className="text-[9px] font-bold text-outline hover:text-primary tracking-widest uppercase transition-colors">
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
                      placeholder="••••••••••••"
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
              {isLoading ? ( mode === "login" ? "ĐANG XÁC THỰC..." : "ĐANG KHỞI TẠO..." ) : ( mode === "login" ? "THIẾT LẬP KẾT NỐI" : "XÁC NHẬN ĐĂNG KÝ" )}
              {!isLoading && <Zap className="ml-3 w-5 h-5 fill-black group-hover:scale-110 transition-transform" />}
              
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
              <span className="relative px-4 bg-surface-container-low text-[9px] font-bold text-outline tracking-[0.3em] uppercase">XÁC THỰC NGOÀI</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-12 rounded-none border-outline-variant/20 hover:bg-surface-container-highest/50 text-[10px] font-bold tracking-widest uppercase">
                <Chrome className="w-4 h-4 mr-2" />
                GOOGLE NODE
              </Button>
              <Button variant="outline" className="h-12 rounded-none border-outline-variant/20 hover:bg-surface-container-highest/50 text-[10px] font-bold tracking-widest uppercase">
                <Github className="w-4 h-4 mr-2" />
                GITHUB CORE
              </Button>
            </div>
          </div>

          <div className="text-center">
            <button 
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-[10px] font-bold text-outline hover:text-primary tracking-[0.2em] uppercase transition-all group"
            >
              {mode === "login" ? (
                <>ĐẶC VỤ MỚI? <span className="text-primary group-hover:underline">KHỞI TẠO ĐĂNG KÝ</span></>
              ) : (
                <>ĐÃ CÓ TÀI KHOẢN? <span className="text-primary group-hover:underline">QUAY LẠI ĐĂNG NHẬP</span></>
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
