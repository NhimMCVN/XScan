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
  ArrowDownCircle,
  AlertCircle,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DepositHistoryDrawer } from "./DepositHistoryDrawer";

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const DEPOSIT_HISTORY = [
  { id: "DEP-001", amount: 500000, currency: 'VND', time: "2 PHÚT TRƯỚC", status: 'completed' },
  { id: "DEP-002", amount: 100, currency: 'GEM', time: "15 PHÚT TRƯỚC", status: 'completed' },
  { id: "DEP-003", amount: 200000, currency: 'VND', time: "22 PHÚT TRƯỚC", status: 'failed' },
  { id: "DEP-004", amount: 50, currency: 'GEM', time: "45 PHÚT TRƯỚC", status: 'pending' },
  { id: "DEP-005", amount: 1000000, currency: 'VND', time: "1 GIỜ TRƯỚC", status: 'completed' },
  { id: "DEP-006", amount: 300, currency: 'GEM', time: "2 GIỜ TRƯỚC", status: 'completed' },
  { id: "DEP-007", amount: 50000, currency: 'VND', time: "3 GIỜ TRƯỚC", status: 'completed' },
];

const CREATED_CHALLENGES = [
  { id: "CH-001", streamer: "NINJA_X", amount: 50000, content: "Sử dụng rìu trong trận tiếp theo", status: 'completed', time: "1 NGÀY TRƯỚC" },
  { id: "CH-002", streamer: "TACTICAL_SAM", amount: 150000, content: "Chỉ dùng súng lục suốt hiệp", status: 'pending', time: "2 GIỜ TRƯỚC" },
  { id: "CH-003", streamer: "ZEN_VOID", amount: 200000, content: "Thắng trận không dùng hồi máu", status: 'failed', time: "3 NGÀY TRƯỚC" },
  { id: "CH-004", streamer: "RAPTOR_7", amount: 100000, content: "Kill 5 mạng bằng lựu đạn", status: 'completed', time: "4 NGÀY TRƯỚC" },
  { id: "CH-005", streamer: "GHOST_WALKER", amount: 300000, content: "Solo squad top 1", status: 'pending', time: "5 GIỜ TRƯỚC" },
  { id: "CH-006", streamer: "OPERATOR_AXL", amount: 50000, content: "Sử dụng dao kill boss", status: 'completed', time: "6 NGÀY TRƯỚC" },
];

const DONATION_HISTORY = [
  { id: "DON-001", streamer: "ZEN_VOID", amount: 200000, message: "Great stream!", time: "3 NGÀY TRƯỚC" },
  { id: "DON-002", streamer: "RAPTOR_7", amount: 500000, message: "Insane skills", time: "5 NGÀY TRƯỚC" },
  { id: "DON-003", streamer: "NINJA_X", amount: 100000, message: "Keep it up", time: "1 TUẦN TRƯỚC" },
  { id: "DON-004", streamer: "GHOST_WALKER", amount: 50000, message: "Nice game", time: "2 TUẦN TRƯỚC" },
  { id: "DON-005", streamer: "TACTICAL_SAM", amount: 1000000, message: "Legendary!", time: "1 THÁNG TRƯỚC" },
  { id: "DON-006", streamer: "ZEN_VOID", amount: 300000, message: "Another one", time: "2 THÁNG TRƯỚC" },
];

export function UserProfileView() {
  const [currency, setCurrency] = useState<"VND" | "GEM">("VND");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState("deposit");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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

  const currentAmount = selectedAmount || Number(customAmount) || 0;
  const conversionText = currency === "VND" 
    ? `Nạp ${currentAmount.toLocaleString()} VND sẽ nhận được ${(currentAmount / 1000).toFixed(0)} GEM`
    : `Nạp ${currentAmount.toLocaleString()} GEM sẽ cần thanh toán ${(currentAmount * 1000).toLocaleString()} VND`;

  const renderPagination = (totalItems: number) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
      <div className="p-4 border-t border-outline-variant/5">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className={`cursor-pointer text-[10px] font-bold tracking-widest uppercase rounded-none border-outline-variant/20 hover:bg-primary hover:text-black ${currentPage === 1 ? 'opacity-50 pointer-events-none' : ''}`}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink 
                  onClick={() => setCurrentPage(i + 1)}
                  isActive={currentPage === i + 1}
                  className={`cursor-pointer text-[10px] font-bold rounded-none border-outline-variant/20 ${currentPage === i + 1 ? 'bg-primary text-black border-primary' : 'hover:bg-primary/10 text-outline'}`}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className={`cursor-pointer text-[10px] font-bold tracking-widest uppercase rounded-none border-outline-variant/20 hover:bg-primary hover:text-black ${currentPage === totalPages ? 'opacity-50 pointer-events-none' : ''}`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
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
                      <p className="text-[10px] text-outline uppercase font-bold tracking-widest">Địa chỉ Email</p>
                      <p className="text-sm font-medium">adam.hh@xscan.intel</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-surface-container/50 p-3 rounded-[12px] border border-outline-variant/5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-outline uppercase font-bold tracking-widest">Ví của tôi</p>
                      <p className="text-sm font-bold text-primary tracking-tight">2,450,000 VND</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-surface-container/50 p-3 rounded-[12px] border border-outline-variant/5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-[10px] text-outline uppercase font-bold tracking-widest">Vai trò tài khoản</p>
                      <div className="flex items-center justify-between">
                        <Badge className="bg-primary/20 text-primary border-none rounded-none px-2 py-0 text-[10px] font-bold tracking-widest">STREAMER</Badge>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-[9px] font-bold tracking-widest text-primary hover:bg-primary/10 rounded-none border border-primary/20"
                          onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'BECOME_STREAMER' }))}
                        >
                          TRỞ THÀNH STREAMER
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container/30 p-4 rounded-[12px] border border-outline-variant/5">
                  <p className="text-[10px] text-outline uppercase font-bold tracking-widest mb-2">Tiểu sử chiến thuật</p>
                  <p className="text-sm text-foreground/80 leading-relaxed italic">
                    "Chuyên gia trinh sát tinh nhuệ và chiến lược gia đấu trường số. Triển khai nội dung kịch tính mỗi ngày. Gia nhập đội hình để thống trị chiến thuật."
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Management Section (New) */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-l-4 border-primary pl-4">
              <h2 className="text-xl font-bold tracking-tight uppercase">Quản lý</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className="bg-surface-container-low border border-outline-variant/10 p-6 rounded-[12px] cursor-pointer hover:border-primary/30 transition-all group"
                onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'STREAMER_DONATIONS' }))}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-[12px] bg-primary/10 flex items-center justify-center text-primary">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-outline group-hover:text-primary transition-colors" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-outline font-bold tracking-widest uppercase">Tổng tiền Donate</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-foreground tracking-tighter">12,850,000</span>
                    <span className="text-sm font-bold text-primary">VND</span>
                  </div>
                </div>
              </div>
              
              <div 
                className="bg-surface-container-low border border-outline-variant/10 p-6 rounded-[12px] cursor-pointer hover:border-primary/30 transition-all group"
                onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'STREAMER_CHALLENGES' }))}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-[12px] bg-primary/10 flex items-center justify-center text-primary">
                    <Zap className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-outline group-hover:text-primary transition-colors" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-outline font-bold tracking-widest uppercase">Tổng số Challenge</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-foreground tracking-tighter">42</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Active Donations / Matches Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-l-4 border-primary pl-4">
              <h2 className="text-xl font-bold tracking-tight uppercase">Donations đang tham gia</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  sessionId: "99482",
                  team1: { name: "TEAM_VALOR", image: "https://picsum.photos/seed/t1/200/200", amount: "12,450 GEM", ratio: 65 },
                  team2: { name: "TEAM_MYSTIC", image: "https://picsum.photos/seed/t2/200/200", amount: "6,700 GEM", ratio: 35 },
                  format: "BO3"
                }
              ].map((match, i) => (
                <div key={i} className="bg-surface-container-low border border-outline-variant/10 p-5 relative overflow-hidden group rounded-[12px]">
                  <div className="absolute top-0 right-0 p-2">
                    <Badge className="bg-primary/20 text-primary border-none rounded-none text-[8px] font-bold tracking-widest">ĐANG THI ĐẤU</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <div className="w-12 h-12 border border-primary/30 p-0.5">
                        <img src={match.team1.image} alt={match.team1.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
                      </div>
                      <span className="text-[9px] font-bold uppercase truncate w-full text-center">{match.team1.name}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-bold italic text-primary">VS</span>
                      <span className="text-[8px] font-mono text-outline">{match.format}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <div className="w-12 h-12 border border-outline-variant/30 p-0.5">
                        <img src={match.team2.image} alt={match.team2.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
                      </div>
                      <span className="text-[9px] font-bold uppercase truncate w-full text-center">{match.team2.name}</span>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-[8px] font-bold text-outline uppercase tracking-widest">
                      <span>TIẾN ĐỘ ỦNG HỘ</span>
                      <span>{match.team1.amount} / 20,000 GEM</span>
                    </div>
                    <div className="h-1 bg-surface-container-highest w-full relative">
                      <div className="absolute left-0 top-0 bottom-0 bg-primary" style={{ width: '62%' }} />
                    </div>
                  </div>
                </div>
              ))}
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

          {/* History Section (New) */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-l-4 border-primary pl-4">
              <h2 className="text-xl font-bold tracking-tight uppercase">Lịch sử hoạt động</h2>
            </div>
            
            <div className="bg-surface-container-low border border-outline-variant/10 rounded-[12px] overflow-hidden">
              <Tabs 
                value={historyTab} 
                onValueChange={(v) => {
                  setHistoryTab(v);
                  setCurrentPage(1);
                }} 
                className="w-full flex-col"
              >
                <TabsList className="bg-surface-container-highest/30 p-1 rounded-none border-b border-outline-variant/10 w-full flex justify-start h-12">
                  <TabsTrigger value="deposit" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary font-bold tracking-widest text-[10px] h-full px-6">
                    NẠP TIỀN
                  </TabsTrigger>
                  <TabsTrigger value="challenges" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary font-bold tracking-widest text-[10px] h-full px-6">
                    CHALLENGE ĐÃ TẠO
                  </TabsTrigger>
                  <TabsTrigger value="donations" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary font-bold tracking-widest text-[10px] h-full px-6">
                    LỊCH SỬ DONATE
                  </TabsTrigger>
                </TabsList>

                <div className="p-0">
                  <TabsContent value="deposit" className="m-0">
                    <div className="space-y-4">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-outline-variant/10 hover:bg-transparent">
                            <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">Mã GD</TableHead>
                            <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">Số tiền</TableHead>
                            <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">Thời gian</TableHead>
                            <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest text-right">Trạng thái</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {DEPOSIT_HISTORY.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => (
                            <TableRow key={item.id} className="border-outline-variant/5 hover:bg-surface-container-highest/20">
                              <TableCell className="text-[10px] font-mono font-bold">{item.id}</TableCell>
                              <TableCell className="text-[10px] font-bold text-primary">
                                {item.currency === 'VND' ? (item.amount / 1000).toFixed(0) + 'K' : item.amount} {item.currency}
                              </TableCell>
                              <TableCell className="text-[10px] text-outline">{item.time}</TableCell>
                              <TableCell className="text-right">
                                <Badge className={`text-[8px] font-bold uppercase rounded-none border-none ${
                                  item.status === 'completed' ? 'bg-green-500/10 text-green-500' : 
                                  item.status === 'failed' ? 'bg-destructive/10 text-destructive' : 
                                  'bg-primary/10 text-primary'
                                }`}>
                                  {item.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {renderPagination(DEPOSIT_HISTORY.length)}
                    </div>
                  </TabsContent>

                  <TabsContent value="challenges" className="m-0">
                    <div className="space-y-4">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-outline-variant/10 hover:bg-transparent">
                            <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">Streamer</TableHead>
                            <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">Nội dung</TableHead>
                            <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">Số tiền</TableHead>
                            <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest text-right">Trạng thái</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {CREATED_CHALLENGES.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => (
                            <TableRow key={item.id} className="border-outline-variant/5 hover:bg-surface-container-highest/20">
                              <TableCell className="text-[10px] font-bold">{item.streamer}</TableCell>
                              <TableCell className="text-[10px] text-foreground/80 italic max-w-[200px] truncate">"{item.content}"</TableCell>
                              <TableCell className="text-[10px] font-bold text-primary">{item.amount.toLocaleString()} VND</TableCell>
                              <TableCell className="text-right">
                                <Badge className={`text-[8px] font-bold uppercase rounded-none border-none ${
                                  item.status === 'completed' ? 'bg-green-500/10 text-green-500' : 
                                  item.status === 'pending' ? 'bg-primary/10 text-primary' : 
                                  'bg-destructive/10 text-destructive'
                                }`}>
                                  {item.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {renderPagination(CREATED_CHALLENGES.length)}
                    </div>
                  </TabsContent>

                  <TabsContent value="donations" className="m-0">
                    <div className="space-y-4">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-outline-variant/10 hover:bg-transparent">
                            <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">Streamer</TableHead>
                            <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">Lời nhắn</TableHead>
                            <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">Số tiền</TableHead>
                            <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest text-right">Thời gian</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {DONATION_HISTORY.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => (
                            <TableRow key={item.id} className="border-outline-variant/5 hover:bg-surface-container-highest/20">
                              <TableCell className="text-[10px] font-bold">{item.streamer}</TableCell>
                              <TableCell className="text-[10px] text-foreground/80 italic max-w-[200px] truncate">"{item.message}"</TableCell>
                              <TableCell className="text-[10px] font-bold text-primary">{item.amount.toLocaleString()} VND</TableCell>
                              <TableCell className="text-[10px] text-outline text-right">{item.time}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {renderPagination(DONATION_HISTORY.length)}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
              <div className="p-4 border-t border-outline-variant/10 bg-surface-container-low/50">
                <Button 
                  variant="ghost" 
                  className="w-full text-[9px] font-bold tracking-widest text-primary hover:bg-primary/5 uppercase"
                  onClick={() => setIsHistoryDrawerOpen(true)}
                >
                  XEM TẤT CẢ LỊCH SỬ CHI TIẾT
                </Button>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Right Sidebar: Quick Top-up */}
      <aside className="w-96 shrink-0 border-l border-outline-variant/10 bg-surface-container-lowest/50 flex flex-col overflow-hidden relative z-10">
        <div className="p-6 border-b border-outline-variant/10 bg-surface-container-low/30">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-bold text-outline tracking-[0.2em] uppercase">NẠP TIỀN NHANH</h3>
            <Badge className="bg-primary/10 text-primary border-none rounded-none text-[8px] font-bold tracking-widest">1K VND = 1 GEM</Badge>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8">
            {/* Currency Toggle */}
            <div className="space-y-3">
              <p className="text-[10px] text-outline uppercase font-bold tracking-widest">Loại tiền</p>
              <Tabs value={currency} onValueChange={(v) => setCurrency(v as "VND" | "GEM")} className="w-full">
                <TabsList className="bg-surface-container-highest/50 p-1 rounded-none border border-outline-variant/10 w-full">
                  <TabsTrigger value="VND" className="flex-1 rounded-none data-[state=active]:bg-primary data-[state=active]:text-black font-bold tracking-widest text-[10px]">VND</TabsTrigger>
                  <TabsTrigger value="GEM" className="flex-1 rounded-none data-[state=active]:bg-primary data-[state=active]:text-black font-bold tracking-widest text-[10px]">GEM</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Quick Amounts */}
            <div className="space-y-3">
              <p className="text-[10px] text-outline uppercase font-bold tracking-widest">Số tiền nhanh</p>
              <div className="grid grid-cols-2 gap-3">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      setSelectedAmount(amount);
                      setCustomAmount("");
                    }}
                    className={`p-3 border transition-all text-center group ${
                      selectedAmount === amount 
                        ? 'bg-primary border-primary text-black' 
                        : 'bg-surface-container-highest/30 border-outline-variant/10 text-foreground hover:border-primary/50'
                    }`}
                  >
                    <p className="text-sm font-bold tracking-tighter">{(amount / 1000).toFixed(0)}K</p>
                    <p className={`text-[8px] font-bold tracking-widest uppercase ${selectedAmount === amount ? 'text-black/60' : 'text-outline'}`}>{currency}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div className="space-y-3">
              <p className="text-[10px] text-outline uppercase font-bold tracking-widest">Tùy chỉnh</p>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-bold text-xs">
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
                  className="pl-8 h-10 bg-surface-container-highest/30 border-outline-variant/10 rounded-none focus-visible:ring-primary/50 text-sm font-bold"
                />
              </div>
              {currentAmount > 0 && (
                <p className="text-[9px] font-bold text-primary tracking-widest uppercase flex items-center gap-2">
                  <Zap className="w-3 h-3" />
                  {conversionText}
                </p>
              )}
            </div>

            {/* Create QR Button */}
            <Button 
              onClick={handleCreateQR}
              disabled={!selectedAmount && !customAmount}
              className="w-full h-12 bg-primary hover:bg-primary-fixed-dim text-black font-bold text-xs tracking-widest rounded-none shadow-[0_0_20px_rgba(255,184,0,0.1)] disabled:opacity-50 group"
            >
              TẠO QR NẠP TIỀN
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </ScrollArea>

        {/* QR Code Overlay */}
        <AnimatePresence>
          {showQR && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 z-50 bg-surface/95 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center"
            >
              <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 p-2 text-outline hover:text-primary"><X className="w-6 h-6" /></button>
              <div className="bg-white p-4 mb-6"><QrCode className="w-40 h-40 text-black" /></div>
              <div className="space-y-4 w-full">
                <div className="bg-surface-container p-3 border border-outline-variant/10 text-left">
                  <p className="text-[8px] text-outline uppercase font-bold mb-1">Nội dung chuyển khoản</p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-primary tracking-widest">NAP {currency} 0F9C4D</p>
                    <Button size="icon" variant="ghost" onClick={() => handleCopy(`NAP ${currency} 0F9C4D`)} className="h-8 w-8 text-primary">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div className="bg-surface-container p-2 border border-outline-variant/10">
                    <p className="text-[7px] text-outline uppercase font-bold">Số tài khoản</p>
                    <p className="text-[10px] font-bold">0382910482</p>
                  </div>
                  <div className="bg-surface-container p-2 border border-outline-variant/10">
                    <p className="text-[7px] text-outline uppercase font-bold">Chủ TK</p>
                    <p className="text-[10px] font-bold uppercase">ADAM HOANG</p>
                  </div>
                </div>
                <p className="text-[9px] text-outline italic">Tiền sẽ được cộng sau 1-3 phút.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>

      <DepositHistoryDrawer 
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
      />
    </div>
  );
}
