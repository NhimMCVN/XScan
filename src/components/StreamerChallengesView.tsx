import { useState } from "react";
import { 
  Sword, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  ArrowUpDown, 
  Search,
  Clock,
  DollarSign,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Challenge {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  amount: number;
  content: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
  timestamp: string;
}

const MOCK_CHALLENGES: Challenge[] = [
  {
    id: "CH-001",
    user: { name: "NINJA_X", avatar: "https://picsum.photos/seed/u1/100/100" },
    amount: 50000,
    content: "Sử dụng rìu trong trận đấu tiếp theo",
    status: 'pending',
    timestamp: "2024-04-15 10:30"
  },
  {
    id: "CH-002",
    user: { name: "TACTICAL_SAM", avatar: "https://picsum.photos/seed/u2/100/100" },
    amount: 150000,
    content: "Chỉ sử dụng súng lục trong suốt hiệp đấu",
    status: 'approved',
    timestamp: "2024-04-15 10:15"
  },
  {
    id: "CH-003",
    user: { name: "REAPER_07", avatar: "https://picsum.photos/seed/u3/100/100" },
    amount: 1200000,
    content: "Thắng trận mà không mất giáp",
    status: 'pending',
    timestamp: "2024-04-15 09:50"
  },
  {
    id: "CH-004",
    user: { name: "GHOST_OPERATOR", avatar: "https://picsum.photos/seed/u4/100/100" },
    amount: 750000,
    content: "Thực hiện 3 pha headshot liên tiếp",
    status: 'rejected',
    timestamp: "2024-04-15 09:20"
  },
  {
    id: "CH-005",
    user: { name: "CYBER_PUNK", avatar: "https://picsum.photos/seed/u5/100/100" },
    amount: 30000,
    content: "Nhảy múa trước mặt kẻ địch",
    status: 'completed',
    timestamp: "2024-04-15 08:45"
  }
];

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export function StreamerChallengesView() {
  const [challenges, setChallenges] = useState(MOCK_CHALLENGES);
  const [statusFilter, setStatusFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleAction = (id: string, newStatus: 'approved' | 'rejected') => {
    setChallenges(prev => prev.map(ch => ch.id === id ? { ...ch, status: newStatus } : ch));
  };

  const filteredChallenges = challenges.filter(ch => {
    const matchesStatus = statusFilter === "all" || ch.status === statusFilter;
    
    let matchesAmount = true;
    if (amountFilter === "under100") matchesAmount = ch.amount < 100000;
    else if (amountFilter === "100-500") matchesAmount = ch.amount >= 100000 && ch.amount <= 500000;
    else if (amountFilter === "500-1m") matchesAmount = ch.amount > 500000 && ch.amount <= 1000000;
    else if (amountFilter === "1m-5m") matchesAmount = ch.amount > 1000000 && ch.amount <= 5000000;
    else if (amountFilter === "over5m") matchesAmount = ch.amount > 5000000;

    return matchesStatus && matchesAmount;
  }).sort((a, b) => {
    if (sortBy === "newest") return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    if (sortBy === "highest") return b.amount - a.amount;
    return 0;
  });

  const totalPages = Math.ceil(filteredChallenges.length / itemsPerPage);
  const paginatedChallenges = filteredChallenges.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex-1 flex flex-col bg-surface relative overflow-hidden">
      <div className="scanline" />
      
      {/* Header */}
      <div className="p-4 md:p-6 lg:p-8 border-b border-outline-variant/10 bg-surface-container-low/30">
        <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight uppercase text-foreground italic flex items-center gap-2 md:gap-3">
              <Sword className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              QUẢN LÝ THỬ THÁCH
            </h2>
            <p className="text-[8px] md:text-[10px] font-mono text-outline tracking-widest uppercase">
              GIAO THỨC: CHALLENGE_CONTROL_CENTER_V2.1
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
              <SelectTrigger className="w-[120px] md:w-[140px] bg-surface-container-highest/30 border-outline-variant/20 rounded-none h-8 md:h-10 text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
                <SelectValue placeholder="TRẠNG THÁI" />
              </SelectTrigger>
              <SelectContent className="bg-surface-container-low border-outline-variant/20 rounded-none">
                <SelectItem value="all" className="text-[9px] md:text-[10px] font-bold uppercase">TẤT CẢ TRẠNG THÁI</SelectItem>
                <SelectItem value="pending" className="text-[9px] md:text-[10px] font-bold uppercase">CHỜ DUYỆT</SelectItem>
                <SelectItem value="approved" className="text-[9px] md:text-[10px] font-bold uppercase">ĐÃ CHẤP NHẬN</SelectItem>
                <SelectItem value="rejected" className="text-[9px] md:text-[10px] font-bold uppercase">ĐÃ TỪ CHỐI</SelectItem>
                <SelectItem value="completed" className="text-[9px] md:text-[10px] font-bold uppercase">HOÀN THÀNH</SelectItem>
              </SelectContent>
            </Select>

            {/* Amount Filter */}
            <Select value={amountFilter} onValueChange={(val) => { setAmountFilter(val); setCurrentPage(1); }}>
              <SelectTrigger className="w-[140px] md:w-[160px] bg-surface-container-highest/30 border-outline-variant/20 rounded-none h-8 md:h-10 text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
                <SelectValue placeholder="MỨC TIỀN" />
              </SelectTrigger>
              <SelectContent className="bg-surface-container-low border-outline-variant/20 rounded-none">
                <SelectItem value="all" className="text-[9px] md:text-[10px] font-bold uppercase">TẤT CẢ MỨC TIỀN</SelectItem>
                <SelectItem value="under100" className="text-[9px] md:text-[10px] font-bold uppercase">DƯỚI 100K</SelectItem>
                <SelectItem value="100-500" className="text-[9px] md:text-[10px] font-bold uppercase">100K - 500K</SelectItem>
                <SelectItem value="500-1m" className="text-[9px] md:text-[10px] font-bold uppercase">500K - 1M</SelectItem>
                <SelectItem value="1m-5m" className="text-[9px] md:text-[10px] font-bold uppercase">1M - 5M</SelectItem>
                <SelectItem value="over5m" className="text-[9px] md:text-[10px] font-bold uppercase">TRÊN 5M</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(val) => { setSortBy(val); setCurrentPage(1); }}>
              <SelectTrigger className="w-[120px] md:w-[140px] bg-surface-container-highest/30 border-outline-variant/20 rounded-none h-8 md:h-10 text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
                <SelectValue placeholder="SẮP XẾP" />
              </SelectTrigger>
              <SelectContent className="bg-surface-container-low border-outline-variant/20 rounded-none">
                <SelectItem value="newest" className="text-[9px] md:text-[10px] font-bold uppercase">MỚI NHẤT</SelectItem>
                <SelectItem value="highest" className="text-[9px] md:text-[10px] font-bold uppercase">TIỀN NHIỀU NHẤT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full">
          <div className="bg-surface-container-low/40 border border-outline-variant/10 mb-6 md:mb-8">
            <Table>
              <TableHeader>
                <TableRow className="border-outline-variant/10 hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest w-[200px]">Người gửi</TableHead>
                  <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">Nội dung thử thách</TableHead>
                  <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">Số tiền</TableHead>
                  <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">Trạng thái</TableHead>
                  <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedChallenges.map((ch) => (
                  <TableRow key={ch.id} className="border-outline-variant/5 hover:bg-surface-container-highest/10 group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 border border-outline-variant/20">
                          <AvatarImage src={ch.user.avatar} referrerPolicy="no-referrer" />
                          <AvatarFallback>{ch.user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">{ch.user.name}</p>
                          <p className="text-[8px] font-mono text-outline uppercase">{ch.timestamp}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-[11px] text-foreground/90 font-medium italic">"{ch.content}"</p>
                      <p className="text-[8px] font-mono text-outline mt-1 uppercase tracking-widest">ID: {ch.id}</p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-bold text-primary tracking-tight">{ch.amount.toLocaleString()} VND</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={`rounded-none text-[8px] font-bold tracking-widest uppercase border-none ${
                        ch.status === 'pending' ? 'bg-primary/20 text-primary' :
                        ch.status === 'approved' ? 'bg-green-500/20 text-green-500' :
                        ch.status === 'rejected' ? 'bg-destructive/20 text-destructive' :
                        'bg-blue-500/20 text-blue-500'
                      }`}>
                        {ch.status === 'pending' ? 'ĐANG CHỜ' : 
                         ch.status === 'approved' ? 'ĐÃ CHẤP NHẬN' : 
                         ch.status === 'rejected' ? 'ĐÃ TỪ CHỐI' : 
                         'HOÀN THÀNH'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {ch.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm"
                            onClick={() => handleAction(ch.id, 'approved')}
                            className="h-7 px-3 bg-green-500/10 border border-green-500/30 text-green-500 hover:bg-green-500 hover:text-black text-[9px] font-bold tracking-widest uppercase rounded-none transition-all"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            DUYỆT
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleAction(ch.id, 'rejected')}
                            className="h-7 px-3 bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive hover:text-white text-[9px] font-bold tracking-widest uppercase rounded-none transition-all"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            BỎ
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[9px] font-bold text-outline uppercase tracking-widest italic">ĐÃ XỬ LÝ</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredChallenges.length === 0 && (
              <div className="py-20 text-center space-y-4">
                <Sword className="w-12 h-12 text-outline/20 mx-auto" />
                <p className="text-outline font-mono text-[10px] uppercase tracking-[0.3em]">KHÔNG TÌM THẤY THỬ THÁCH NÀO</p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center pb-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(currentPage - 1); }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); setCurrentPage(i + 1); }}
                        isActive={currentPage === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(currentPage + 1); }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
