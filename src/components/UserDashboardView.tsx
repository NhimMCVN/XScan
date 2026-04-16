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
];

const CREATED_CHALLENGES = [
  { id: "CH-001", streamer: "NINJA_X", amount: 50000, content: "Sử dụng rìu trong trận tiếp theo", status: 'completed', time: "1 NGÀY TRƯỚC" },
  { id: "CH-002", streamer: "TACTICAL_SAM", amount: 150000, content: "Chỉ dùng súng lục suốt hiệp", status: 'pending', time: "2 GIỜ TRƯỚC" },
];

const DONATION_HISTORY = [
  { id: "DON-001", streamer: "ZEN_VOID", amount: 200000, message: "Great stream!", time: "3 NGÀY TRƯỚC" },
  { id: "DON-002", streamer: "RAPTOR_7", amount: 500000, message: "Insane skills", time: "5 NGÀY TRƯỚC" },
];

export function UserDashboardView() {
  const [currency, setCurrency] = useState<"VND" | "GEM">("VND");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
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
          <section className="bg-surface-container-low border border-outline-variant/10 p-4 md:p-6 lg:p-8 rounded-[12px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-primary/5 blur-3xl rounded-full -mr-12 -mt-12 md:-mr-16 md:-mt-16" />
            
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 relative z-10">
              <div className="relative">
                <div className="w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-full border-2 md:border-4 border-primary/20 p-1">
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-primary">
                    <img 
                      src="https://picsum.photos/seed/adamhh/300/300" 
                      alt="Adam HH" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 bg-primary text-black p-1 md:p-1.5 rounded-full border-2 md:border-4 border-surface-container-low">
                  <User className="w-4 h-4 md:w-5 md:h-5" />
                </div>
              </div>

              <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left">
                <div className="space-y-1">
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Adam HH</h1>
                  <p className="text-primary font-mono text-xs md:text-sm tracking-widest">@adamhh_user</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="flex items-center gap-3 bg-surface-container/50 p-2.5 md:p-3 rounded-[12px] border border-outline-variant/5">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Mail className="w-3 h-3 md:w-4 md:h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-[9px] md:text-[10px] text-outline uppercase font-bold tracking-widest">Địa chỉ Email</p>
                      <p className="text-xs md:text-sm font-medium">adam.hh@xscan.intel</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-surface-container/50 p-2.5 md:p-3 rounded-[12px] border border-outline-variant/5">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Wallet className="w-3 h-3 md:w-4 md:h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-[9px] md:text-[10px] text-outline uppercase font-bold tracking-widest">Số dư ví</p>
                      <p className="text-xs md:text-sm font-bold text-primary tracking-tight">2,450,000 VND</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-surface-container/50 p-2.5 md:p-3 rounded-[12px] border border-outline-variant/5">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Zap className="w-3 h-3 md:w-4 md:h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-[9px] md:text-[10px] text-outline uppercase font-bold tracking-widest">Số dư GEM</p>
                      <p className="text-xs md:text-sm font-bold text-primary tracking-tight">1,250 GEM</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-surface-container/50 p-2.5 md:p-3 rounded-[12px] border border-outline-variant/5">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <User className="w-3 h-3 md:w-4 md:h-4" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-[9px] md:text-[10px] text-outline uppercase font-bold tracking-widest">Vai trò tài khoản</p>
                      <div className="flex items-center justify-between">
                        <Badge className="bg-surface-container-highest text-foreground border-none rounded-none px-1.5 py-0 md:px-2 text-[9px] md:text-[10px] font-bold tracking-widest">USER</Badge>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-5 md:h-6 px-1.5 md:px-2 text-[8px] md:text-[9px] font-bold tracking-widest text-primary hover:bg-primary/10 rounded-none border border-primary/20"
                          onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'BECOME_STREAMER' }))}
                        >
                          TRỞ THÀNH STREAMER
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Active Donations / Matches Section */}
          <section className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-2 md:gap-3 border-l-2 md:border-l-4 border-primary pl-3 md:pl-4">
              <h2 className="text-lg md:text-xl font-bold tracking-tight uppercase">Donations đang tham gia</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {[
                {
                  sessionId: "99482",
                  team1: { name: "TEAM_VALOR", image: "https://picsum.photos/seed/t1/200/200", amount: "12,450 GEM", ratio: 65 },
                  team2: { name: "TEAM_MYSTIC", image: "https://picsum.photos/seed/t2/200/200", amount: "6,700 GEM", ratio: 35 },
                  format: "BO3"
                }
              ].map((match, i) => (
                <div key={i} className="bg-surface-container-low border border-outline-variant/10 p-4 md:p-5 relative overflow-hidden group rounded-[12px]">
                  <div className="absolute top-0 right-0 p-1.5 md:p-2">
                    <Badge className="bg-primary/20 text-primary border-none rounded-none text-[7px] md:text-[8px] font-bold tracking-widest">ĐANG THI ĐẤU</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-3 md:gap-4">
                    <div className="flex flex-col items-center gap-1.5 md:gap-2 flex-1">
                      <div className="w-10 h-10 md:w-12 md:h-12 border border-primary/30 p-0.5">
                        <img src={match.team1.image} alt={match.team1.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
                      </div>
                      <span className="text-[8px] md:text-[9px] font-bold uppercase truncate w-full text-center">{match.team1.name}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-base md:text-lg font-bold italic text-primary">VS</span>
                      <span className="text-[7px] md:text-[8px] font-mono text-outline">{match.format}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 md:gap-2 flex-1">
                      <div className="w-10 h-10 md:w-12 md:h-12 border border-outline-variant/30 p-0.5">
                        <img src={match.team2.image} alt={match.team2.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
                      </div>
                      <span className="text-[8px] md:text-[9px] font-bold uppercase truncate w-full text-center">{match.team2.name}</span>
                    </div>
                  </div>
                  <div className="mt-3 md:mt-4 space-y-1.5 md:space-y-2">
                    <div className="flex justify-between text-[7px] md:text-[8px] font-mono text-outline">
                      <span>ỦNG HỘ CỦA BẠN: 500 GEM</span>
                      <span className="text-primary">TEAM_VALOR</span>
                    </div>
                    <div className="h-1 bg-surface-container-highest w-full relative">
                      <div className="absolute left-0 top-0 bottom-0 bg-primary shadow-[0_0_8px_rgba(255,184,0,0.5)]" style={{ width: '65%' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* History Section */}
          <section className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-2 md:gap-3 border-l-2 md:border-l-4 border-primary pl-3 md:pl-4">
              <h2 className="text-lg md:text-xl font-bold tracking-tight uppercase">Lịch sử hoạt động</h2>
            </div>
            
            <div className="bg-surface-container-low border border-outline-variant/10 rounded-[12px] overflow-hidden">
              <Tabs value={historyTab} onValueChange={setHistoryTab} className="w-full flex flex-col">
                <div className="border-b border-outline-variant/10 p-1.5 md:p-2 bg-surface-container-lowest/50">
                  <TabsList className="bg-transparent h-auto p-0 flex gap-1 md:gap-2">
                    <TabsTrigger 
                      value="deposit" 
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary border border-transparent rounded-[8px] text-[9px] md:text-[10px] font-bold tracking-widest uppercase px-3 md:px-4 py-1.5 md:py-2"
                    >
                      Nạp tiền
                    </TabsTrigger>
                    <TabsTrigger 
                      value="challenge" 
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary border border-transparent rounded-[8px] text-[9px] md:text-[10px] font-bold tracking-widest uppercase px-3 md:px-4 py-1.5 md:py-2"
                    >
                      Thử thách
                    </TabsTrigger>
                    <TabsTrigger 
                      value="donate" 
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary border border-transparent rounded-[8px] text-[9px] md:text-[10px] font-bold tracking-widest uppercase px-3 md:px-4 py-1.5 md:py-2"
                    >
                      Donate
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="deposit" className="m-0 border-none outline-none">
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-outline-variant/10 hover:bg-transparent">
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10">Mã GD</TableHead>
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10">Số lượng</TableHead>
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10">Thời gian</TableHead>
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10 text-right">Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {DEPOSIT_HISTORY.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((tx) => (
                          <TableRow key={tx.id} className="border-outline-variant/5 hover:bg-surface-container/50 transition-colors">
                            <TableCell className="font-mono text-[9px] md:text-[10px] text-foreground py-2 md:py-3">{tx.id}</TableCell>
                            <TableCell className="py-2 md:py-3">
                              <span className="text-[10px] md:text-xs font-bold text-primary">
                                {tx.amount.toLocaleString()} {tx.currency}
                              </span>
                            </TableCell>
                            <TableCell className="text-[8px] md:text-[9px] font-mono text-outline py-2 md:py-3">{tx.time}</TableCell>
                            <TableCell className="text-right py-2 md:py-3">
                              <Badge variant="outline" className={`
                                text-[7px] md:text-[8px] font-bold tracking-widest uppercase rounded-none border-none px-1.5 md:px-2 py-0.5 md:py-1
                                ${tx.status === 'completed' ? 'bg-primary/10 text-primary' : 
                                  tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 
                                  'bg-destructive/10 text-destructive'}
                              `}>
                                {tx.status === 'completed' ? 'THÀNH CÔNG' : tx.status === 'pending' ? 'ĐANG XỬ LÝ' : 'THẤT BẠI'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                  {renderPagination(DEPOSIT_HISTORY.length)}
                </TabsContent>

                <TabsContent value="challenge" className="m-0 border-none outline-none">
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-outline-variant/10 hover:bg-transparent">
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10">Mã TT</TableHead>
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10">Streamer</TableHead>
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10">Nội dung</TableHead>
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10">Số lượng</TableHead>
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10 text-right">Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {CREATED_CHALLENGES.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((ch) => (
                          <TableRow key={ch.id} className="border-outline-variant/5 hover:bg-surface-container/50 transition-colors">
                            <TableCell className="font-mono text-[9px] md:text-[10px] text-foreground py-2 md:py-3">{ch.id}</TableCell>
                            <TableCell className="text-[9px] md:text-[10px] font-bold uppercase py-2 md:py-3">{ch.streamer}</TableCell>
                            <TableCell className="text-[9px] md:text-[10px] text-outline max-w-[150px] md:max-w-[200px] truncate py-2 md:py-3">{ch.content}</TableCell>
                            <TableCell className="py-2 md:py-3">
                              <span className="text-[10px] md:text-xs font-bold text-primary">
                                {ch.amount.toLocaleString()} VND
                              </span>
                            </TableCell>
                            <TableCell className="text-right py-2 md:py-3">
                              <Badge variant="outline" className={`
                                text-[7px] md:text-[8px] font-bold tracking-widest uppercase rounded-none border-none px-1.5 md:px-2 py-0.5 md:py-1
                                ${ch.status === 'completed' ? 'bg-primary/10 text-primary' : 
                                  ch.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 
                                  'bg-destructive/10 text-destructive'}
                              `}>
                                {ch.status === 'completed' ? 'HOÀN THÀNH' : ch.status === 'pending' ? 'CHỜ DUYỆT' : 'THẤT BẠI'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                  {renderPagination(CREATED_CHALLENGES.length)}
                </TabsContent>

                <TabsContent value="donate" className="m-0 border-none outline-none">
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-outline-variant/10 hover:bg-transparent">
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10">Mã Donate</TableHead>
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10">Streamer</TableHead>
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10">Lời nhắn</TableHead>
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10">Số lượng</TableHead>
                          <TableHead className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase h-8 md:h-10 text-right">Thời gian</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {DONATION_HISTORY.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((don) => (
                          <TableRow key={don.id} className="border-outline-variant/5 hover:bg-surface-container/50 transition-colors">
                            <TableCell className="font-mono text-[9px] md:text-[10px] text-foreground py-2 md:py-3">{don.id}</TableCell>
                            <TableCell className="text-[9px] md:text-[10px] font-bold uppercase py-2 md:py-3">{don.streamer}</TableCell>
                            <TableCell className="text-[9px] md:text-[10px] text-outline max-w-[150px] md:max-w-[200px] truncate py-2 md:py-3">{don.message}</TableCell>
                            <TableCell className="py-2 md:py-3">
                              <span className="text-[10px] md:text-xs font-bold text-primary">
                                {don.amount.toLocaleString()} VND
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-[8px] md:text-[9px] font-mono text-outline py-2 md:py-3">
                              {don.time}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                  {renderPagination(DONATION_HISTORY.length)}
                </TabsContent>

              </Tabs>
            </div>
          </section>

        </div>
      </div>

      {/* Right Sidebar: Quick Top-up */}
      <aside className="w-full md:w-80 shrink-0 border-l border-outline-variant/10 bg-surface-container-lowest/50 flex flex-col overflow-hidden relative z-10">
        <div className="p-4 md:p-6 border-b border-outline-variant/10 bg-surface-container-low/30">
          <h3 className="text-[9px] md:text-[10px] font-bold text-outline tracking-[0.2em] uppercase">NẠP TIỀN NHANH</h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            <div className="space-y-2 md:space-y-3">
              <label className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase">CHỌN LOẠI TIỀN</label>
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrency("VND")}
                  className={`h-10 md:h-12 rounded-[8px] border-outline-variant/20 text-[9px] md:text-[10px] font-bold tracking-widest ${currency === "VND" ? "bg-primary/10 border-primary text-primary" : "hover:bg-surface-container-high"}`}
                >
                  <Wallet className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                  VND
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrency("GEM")}
                  className={`h-10 md:h-12 rounded-[8px] border-outline-variant/20 text-[9px] md:text-[10px] font-bold tracking-widest ${currency === "GEM" ? "bg-primary/10 border-primary text-primary" : "hover:bg-surface-container-high"}`}
                >
                  <Zap className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                  GEM
                </Button>
              </div>
            </div>

            <div className="space-y-2 md:space-y-3">
              <label className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase">MỆNH GIÁ NHANH</label>
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => { setSelectedAmount(amount); setCustomAmount(""); }}
                    className={`h-10 md:h-12 rounded-[8px] border-outline-variant/20 text-[10px] md:text-xs font-bold font-mono ${selectedAmount === amount ? "bg-primary text-black border-primary" : "hover:bg-surface-container-high"}`}
                  >
                    {amount.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2 md:space-y-3">
              <label className="text-[8px] md:text-[9px] font-bold text-outline tracking-widest uppercase">HOẶC NHẬP SỐ TIỀN</label>
              <div className="relative">
                <Input 
                  type="number"
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                  placeholder="0"
                  className="h-10 md:h-12 pl-3 md:pl-4 pr-12 md:pr-16 bg-surface-container-low border-outline-variant/20 font-mono text-xs md:text-sm rounded-[8px]"
                />
                <span className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-[9px] md:text-[10px] font-bold text-outline">
                  {currency}
                </span>
              </div>
            </div>

            {(selectedAmount || customAmount) && (
              <div className="bg-primary/5 border border-primary/10 p-3 md:p-4 rounded-[8px] flex items-start gap-2 md:gap-3">
                <AlertCircle className="w-3 h-3 md:w-4 md:h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[9px] md:text-[10px] text-primary/80 leading-relaxed">
                  {conversionText}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 md:p-6 border-t border-outline-variant/20 bg-surface-container-low/50 relative z-20">
          <Button 
            className="w-full text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase h-10 md:h-12 rounded-[8px] bg-primary text-black hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(255,184,0,0.1)]"
            onClick={handleCreateQR}
            disabled={!selectedAmount && !customAmount}
          >
            TẠO MÃ THANH TOÁN
          </Button>
        </div>

        {/* QR Code Overlay */}
        <AnimatePresence>
          {showQR && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute inset-0 z-50 bg-surface-container-lowest flex flex-col"
            >
              <div className="p-4 md:p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low/30">
                <h3 className="text-[9px] md:text-[10px] font-bold text-outline tracking-[0.2em] uppercase">QUÉT MÃ QR</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowQR(false)} className="h-6 w-6 md:h-8 md:w-8 hover:bg-surface-container-high rounded-[8px]">
                  <X className="w-3 h-3 md:w-4 md:h-4" />
                </Button>
              </div>
              
              <div className="flex-1 p-4 md:p-6 flex flex-col items-center justify-center space-y-6 md:space-y-8">
                <div className="bg-white p-3 md:p-4 rounded-[12px] md:rounded-[16px] shadow-[0_0_30px_rgba(255,184,0,0.15)] relative group">
                  <div className="absolute inset-0 border-2 border-primary/50 rounded-[12px] md:rounded-[16px] scale-105 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500" />
                  <QrCode className="w-40 h-40 md:w-48 md:h-48 text-black" />
                </div>
                
                <div className="text-center space-y-1 md:space-y-2">
                  <p className="text-[9px] md:text-[10px] text-outline uppercase font-bold tracking-widest">SỐ TIỀN THANH TOÁN</p>
                  <p className="text-xl md:text-2xl font-display font-bold text-primary tracking-tight">
                    {currentAmount.toLocaleString()} {currency}
                  </p>
                </div>

                <div className="w-full space-y-3 md:space-y-4 bg-surface-container-low p-3 md:p-4 rounded-[12px] border border-outline-variant/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] md:text-[9px] text-outline uppercase font-bold tracking-widest">NỘI DUNG CK</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] md:text-[10px] font-mono font-bold text-foreground">NAP {currentAmount} ADAMHH</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 md:h-6 md:w-6 hover:bg-surface-container-high rounded-[6px]"
                        onClick={() => handleCopy(`NAP ${currentAmount} ADAMHH`)}
                      >
                        {copied ? <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary" /> : <Copy className="w-2.5 h-2.5 md:w-3 md:h-3" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-outline">
                  <CreditCard className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-[8px] md:text-[9px] uppercase font-bold tracking-widest">Hỗ trợ mọi ngân hàng & ví điện tử</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>
    </div>
  );
}
