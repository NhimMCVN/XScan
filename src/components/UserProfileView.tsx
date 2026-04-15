import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Wallet, 
  Zap, 
  Copy, 
  Check, 
  QrCode, 
  X,
  CreditCard,
  ArrowRight,
  ArrowDownCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DepositHistoryDrawer } from "./DepositHistoryDrawer";

const DEPOSIT_HISTORY_PREVIEW = [
  { id: "DEP-001", amount: 500000, currency: 'VND', time: "2M AGO", status: 'completed' },
  { id: "DEP-002", amount: 100, currency: 'GEM', time: "15M AGO", status: 'completed' },
  { id: "DEP-003", amount: 200000, currency: 'VND', time: "22M AGO", status: 'failed' },
  { id: "DEP-004", amount: 50, currency: 'GEM', time: "45M AGO", status: 'pending' },
];

export function UserProfileView() {
  const [currency, setCurrency] = useState<"VND" | "GEM">("VND");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  const quickAmounts = [50000, 100000, 200000, 500000];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateQR = () => {
    if (!selectedAmount && !customAmount) return;
    setShowQR(true);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-surface relative">
      <div className="scanline" />
      
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
          
          {/* Profile Section (Top) */}
          <section className="bg-surface-container-low border border-outline-variant/10 p-8 rounded-[12px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16" />
            
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-primary/20 p-1">
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-primary">
                    <img 
                      src="https://picsum.photos/seed/adamhh/300/300" 
                      alt="Adam HH" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-primary text-black p-1.5 rounded-full border-4 border-surface-container-low">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>

              <div className="flex-1 space-y-6 text-center md:text-left">
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">Adam HH</h1>
                  <p className="text-primary font-mono text-sm tracking-widest">@adamhh_tactical</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 bg-surface-container/50 p-3 rounded-[12px] border border-outline-variant/5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-outline uppercase font-bold tracking-widest">Email Address</p>
                      <p className="text-sm font-medium">adam.hh@xscan.intel</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-surface-container/50 p-3 rounded-[12px] border border-outline-variant/5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-outline uppercase font-bold tracking-widest">Account Role</p>
                      <Badge className="bg-primary/20 text-primary border-none rounded-none px-2 py-0 text-[10px] font-bold tracking-widest">STREAMER</Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container/30 p-4 rounded-[12px] border border-outline-variant/5">
                  <p className="text-[10px] text-outline uppercase font-bold tracking-widest mb-2">Tactical Bio</p>
                  <p className="text-sm text-foreground/80 leading-relaxed italic">
                    "Elite recon specialist and digital arena strategist. Deploying high-octane content daily. Join the squad for tactical dominance."
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Wallet Balance Section (Middle) */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-l-4 border-primary pl-4">
              <h2 className="text-xl font-bold tracking-tight uppercase">Ví của tôi</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* VND Wallet */}
              <div className="bg-surface-container-low border border-outline-variant/10 p-6 rounded-[12px] group hover:border-primary/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-[12px] bg-primary/10 flex items-center justify-center text-primary">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <Badge className="bg-green-500/10 text-green-500 border-none rounded-full px-3 py-1 text-[10px] font-bold flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Hoạt động
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-outline font-bold tracking-widest uppercase">Số dư VND</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-foreground tracking-tighter">50.00K</span>
                    <span className="text-lg font-bold text-primary">VND</span>
                  </div>
                </div>
              </div>

              {/* GEM Wallet */}
              <div className="bg-surface-container-low border border-outline-variant/10 p-6 rounded-[12px] group hover:border-primary/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-[12px] bg-primary/10 flex items-center justify-center text-primary">
                    <Zap className="w-6 h-6" />
                  </div>
                  <Badge className="bg-green-500/10 text-green-500 border-none rounded-full px-3 py-1 text-[10px] font-bold flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Hoạt động
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-outline font-bold tracking-widest uppercase">Số dư GEM</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-foreground tracking-tighter">100.00K</span>
                    <span className="text-lg font-bold text-primary">GEM</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Integrated Deposit Flow (Bottom) */}
          <section className="space-y-6 relative">
            <div className="flex items-center gap-3 border-l-4 border-primary pl-4">
              <h2 className="text-xl font-bold tracking-tight uppercase">Nạp tiền nhanh vào ví</h2>
            </div>

            <div className="bg-surface-container-low border border-outline-variant/10 p-8 rounded-[12px] space-y-8">
              {/* Currency Toggle */}
              <div className="space-y-3">
                <p className="text-[10px] text-outline uppercase font-bold tracking-widest">Chọn loại tiền nạp</p>
                <Tabs value={currency} onValueChange={(v) => setCurrency(v as "VND" | "GEM")} className="w-full max-w-xs">
                  <TabsList className="bg-surface-container-highest/50 p-1 rounded-[12px] border border-outline-variant/10 w-full">
                    <TabsTrigger 
                      value="VND" 
                      className="flex-1 rounded-[8px] data-[state=active]:bg-primary data-[state=active]:text-black font-bold tracking-widest text-[10px]"
                    >
                      VND
                    </TabsTrigger>
                    <TabsTrigger 
                      value="GEM" 
                      className="flex-1 rounded-[8px] data-[state=active]:bg-primary data-[state=active]:text-black font-bold tracking-widest text-[10px]"
                    >
                      GEM
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Quick Amounts */}
              <div className="space-y-3">
                <p className="text-[10px] text-outline uppercase font-bold tracking-widest">Chọn nhanh số tiền</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => {
                        setSelectedAmount(amount);
                        setCustomAmount("");
                      }}
                      className={`p-4 rounded-[12px] border transition-all text-center group ${
                        selectedAmount === amount 
                          ? 'bg-primary border-primary text-black' 
                          : 'bg-surface-container-highest/30 border-outline-variant/10 text-foreground hover:border-primary/50'
                      }`}
                    >
                      <p className="text-lg font-bold tracking-tighter">
                        {(amount / 1000).toFixed(0)}K
                      </p>
                      <p className={`text-[8px] font-bold tracking-widest uppercase ${selectedAmount === amount ? 'text-black/60' : 'text-outline'}`}>
                        {currency}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div className="space-y-3">
                <p className="text-[10px] text-outline uppercase font-bold tracking-widest">Hoặc nhập số tiền tùy chỉnh</p>
                <div className="relative max-w-md">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">
                    {currency === "VND" ? "₫" : "💎"}
                  </div>
                  <Input
                    type="number"
                    placeholder="Nhập số tiền..."
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedAmount(null);
                    }}
                    className="pl-10 h-14 bg-surface-container-highest/30 border-outline-variant/10 rounded-[12px] focus-visible:ring-primary/50 text-lg font-bold"
                  />
                </div>
              </div>

              {/* Create QR Button */}
              <Button 
                onClick={handleCreateQR}
                disabled={!selectedAmount && !customAmount}
                className="w-full h-14 bg-primary hover:bg-primary-fixed-dim text-black font-bold text-lg tracking-widest rounded-[12px] shadow-[0_0_20px_rgba(255,184,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                TẠO QR NẠP TIỀN
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* QR Code Overlay/Section */}
            <AnimatePresence>
              {showQR && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute inset-x-0 bottom-0 top-0 z-50 bg-surface/95 backdrop-blur-md rounded-[12px] border-2 border-primary p-8 flex flex-col md:flex-row gap-8 items-center justify-center"
                >
                  <button 
                    onClick={() => setShowQR(false)}
                    className="absolute top-4 right-4 p-2 text-outline hover:text-primary transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  {/* QR Code */}
                  <div className="bg-white p-6 rounded-[12px] shadow-2xl relative group">
                    <div className="w-48 h-48 md:w-64 md:h-64 bg-slate-100 flex items-center justify-center border-2 border-slate-200">
                      <QrCode className="w-32 h-32 md:w-48 md:h-48 text-black" />
                    </div>
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <p className="bg-black text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">VietQR Protocol</p>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="flex-1 space-y-6 w-full max-w-md">
                    <div className="space-y-2">
                      <Badge className="bg-primary text-black rounded-none px-2 py-0 text-[10px] font-bold tracking-widest">PAYMENT_INTEL</Badge>
                      <h3 className="text-2xl font-bold tracking-tight uppercase">Thông tin thanh toán</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-surface-container p-4 rounded-[12px] border border-outline-variant/10">
                        <p className="text-[10px] text-outline uppercase font-bold tracking-widest mb-1">Ngân hàng</p>
                        <p className="text-lg font-bold text-foreground">MB BANK (Quân Đội)</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-surface-container p-4 rounded-[12px] border border-outline-variant/10">
                          <p className="text-[10px] text-outline uppercase font-bold tracking-widest mb-1">Số tài khoản</p>
                          <p className="text-lg font-bold text-foreground">0382910482</p>
                        </div>
                        <div className="bg-surface-container p-4 rounded-[12px] border border-outline-variant/10">
                          <p className="text-[10px] text-outline uppercase font-bold tracking-widest mb-1">Chủ tài khoản</p>
                          <p className="text-lg font-bold text-foreground">ADAM HOANG</p>
                        </div>
                      </div>

                      <div className="bg-primary/10 border-2 border-primary/30 p-6 rounded-[12px] flex items-center justify-between group">
                        <div>
                          <p className="text-[10px] text-primary uppercase font-bold tracking-widest mb-1">Nội dung chuyển khoản</p>
                          <p className="text-2xl font-bold text-primary tracking-widest">NAP {currency} 0F9C4D</p>
                        </div>
                        <Button 
                          onClick={() => handleCopy(`NAP ${currency} 0F9C4D`)}
                          className="h-14 px-6 bg-primary text-black hover:bg-primary-fixed-dim font-bold rounded-[12px] flex flex-col items-center justify-center gap-1"
                        >
                          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                          <span className="text-[8px] uppercase tracking-widest">COPY</span>
                        </Button>
                      </div>
                    </div>

                    <p className="text-[10px] text-outline text-center italic">
                      * Hệ thống sẽ tự động cộng tiền sau 1-3 phút khi nhận được thanh toán.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

        </div>
      </div>

      {/* Right Sidebar: Deposit History */}
      <aside className="w-80 shrink-0 border-l border-outline-variant/10 bg-surface-container-lowest/50 flex flex-col overflow-hidden relative z-10">
        <div className="p-6 border-b border-outline-variant/10 bg-surface-container-low/30">
          <h3 className="text-[10px] font-bold text-outline tracking-[0.2em] uppercase">DEPOSIT_HISTORY</h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {DEPOSIT_HISTORY_PREVIEW.map((item, idx) => (
              <div 
                key={item.id} 
                className={`relative bg-surface-container-low p-6 transition-all border-l-2 ${idx === 0 ? 'border-primary' : 'border-transparent'} hover:bg-surface-container-high`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <ArrowDownCircle className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-foreground tracking-wider uppercase">{item.id}</span>
                  </div>
                  <span className="text-[9px] font-mono text-outline uppercase">{item.time}</span>
                </div>
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <div className="text-2xl font-display font-bold text-primary tracking-tight">
                      {item.currency === 'VND' ? (item.amount / 1000).toFixed(0) + 'K' : item.amount}
                    </div>
                    <p className="text-[8px] font-bold text-outline uppercase tracking-widest">{item.currency}</p>
                  </div>
                  <div className={`text-[9px] font-bold uppercase tracking-widest ${
                    item.status === 'completed' ? 'text-green-500' : 
                    item.status === 'failed' ? 'text-destructive' : 
                    'text-primary'
                  }`}>
                    {item.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-outline-variant/20 bg-surface-container-low/50 relative z-20">
          <Button 
            variant="outline" 
            className="w-full text-[10px] font-bold tracking-[0.2em] uppercase h-12 rounded-none border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-black transition-all shadow-[0_0_15px_rgba(255,184,0,0.1)]"
            onClick={() => setIsHistoryDrawerOpen(true)}
          >
            VIEW ALL HISTORY
          </Button>
        </div>
      </aside>

      <DepositHistoryDrawer 
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
      />
    </div>
  );
}
