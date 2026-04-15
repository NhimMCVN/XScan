import { useState } from "react";
import { 
  DollarSign, 
  Calendar, 
  Search,
  Trophy,
  ArrowUpDown,
  Clock,
  Filter,
  ChevronDown,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Donation {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  amount: number;
  message: string;
  timestamp: string;
}

const MOCK_DONATIONS: Donation[] = [
  { id: "D-001", user: { name: "NINJA_X", avatar: "https://picsum.photos/seed/u1/100/100" }, amount: 500000, message: "Keep it up!", timestamp: "2024-04-15 10:30" },
  { id: "D-002", user: { name: "TACTICAL_SAM", avatar: "https://picsum.photos/seed/u2/100/100" }, amount: 150000, message: "Great aim!", timestamp: "2024-04-15 09:15" },
  { id: "D-003", user: { name: "REAPER_07", avatar: "https://picsum.photos/seed/u3/100/100" }, amount: 2000000, message: "God tier gameplay", timestamp: "2024-04-14 22:50" },
  { id: "D-004", user: { name: "NINJA_X", avatar: "https://picsum.photos/seed/u1/100/100" }, amount: 1000000, message: "Another one!", timestamp: "2024-04-14 21:20" },
  { id: "D-005", user: { name: "CYBER_PUNK", avatar: "https://picsum.photos/seed/u5/100/100" }, amount: 50000, message: "GG", timestamp: "2024-04-14 18:45" },
  { id: "D-006", user: { name: "GHOST_OPERATOR", avatar: "https://picsum.photos/seed/u4/100/100" }, amount: 750000, message: "Support from the shadows", timestamp: "2024-04-13 15:30" },
];

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export function StreamerDonationsView() {
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Calculate Top 5 Donors
  const donorTotals = MOCK_DONATIONS.reduce((acc: any, curr) => {
    const name = curr.user.name;
    if (!acc[name]) {
      acc[name] = { ...curr.user, total: 0 };
    }
    acc[name].total += curr.amount;
    return acc;
  }, {});

  const topDonors = Object.values(donorTotals)
    .sort((a: any, b: any) => b.total - a.total)
    .slice(0, 5);

  const filteredDonations = MOCK_DONATIONS.filter(d => {
    if (dateFilter === "today") return d.timestamp.includes("2024-04-15");
    if (dateFilter === "yesterday") return d.timestamp.includes("2024-04-14");
    return true;
  }).sort((a, b) => {
    if (sortBy === "newest") return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    if (sortBy === "highest") return b.amount - a.amount;
    return 0;
  });

  const totalPages = Math.ceil(filteredDonations.length / itemsPerPage);
  const paginatedDonations = filteredDonations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex-1 flex flex-col bg-surface relative overflow-hidden">
      <div className="scanline" />
      
      {/* Header */}
      <div className="p-8 border-b border-outline-variant/10 bg-surface-container-low/30">
        <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight uppercase text-foreground italic flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-primary" />
              LỊCH SỬ NHẬN DONATE
            </h2>
            <p className="text-[10px] font-mono text-outline tracking-widest uppercase">
              GIAO THỨC: REVENUE_TRACKER_V4.0
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={dateFilter} onValueChange={(val) => { setDateFilter(val); setCurrentPage(1); }}>
              <SelectTrigger className="w-[160px] bg-surface-container-highest/30 border-outline-variant/20 rounded-none h-10 text-[10px] font-bold uppercase tracking-widest">
                <SelectValue placeholder="THỜI GIAN" />
              </SelectTrigger>
              <SelectContent className="bg-surface-container-low border-outline-variant/20 rounded-none">
                <SelectItem value="all" className="text-[10px] font-bold uppercase">TẤT CẢ THỜI GIAN</SelectItem>
                <SelectItem value="today" className="text-[10px] font-bold uppercase">HÔM NAY</SelectItem>
                <SelectItem value="yesterday" className="text-[10px] font-bold uppercase">HÔM QUA</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(val) => { setSortBy(val); setCurrentPage(1); }}>
              <SelectTrigger className="w-[160px] bg-surface-container-highest/30 border-outline-variant/20 rounded-none h-10 text-[10px] font-bold uppercase tracking-widest">
                <SelectValue placeholder="SẮP XẾP" />
              </SelectTrigger>
              <SelectContent className="bg-surface-container-low border-outline-variant/20 rounded-none">
                <SelectItem value="newest" className="text-[10px] font-bold uppercase">MỚI NHẤT</SelectItem>
                <SelectItem value="highest" className="text-[10px] font-bold uppercase">TIỀN NHIỀU NHẤT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Main List */}
        <ScrollArea className="flex-1">
          <div className="p-8 max-w-4xl mx-auto w-full space-y-4">
            <div className="bg-surface-container-low/40 border border-outline-variant/10 mb-8">
              <Table>
                <TableHeader>
                  <TableRow className="border-outline-variant/10 hover:bg-transparent">
                    <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest w-[200px]">Người gửi</TableHead>
                    <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">Lời nhắn</TableHead>
                    <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">Số tiền</TableHead>
                    <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest text-right">Thời gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDonations.map((d) => (
                    <TableRow key={d.id} className="border-outline-variant/5 hover:bg-surface-container-highest/10 group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 border border-outline-variant/20">
                            <AvatarImage src={d.user.avatar} referrerPolicy="no-referrer" />
                            <AvatarFallback>{d.user.name[0]}</AvatarFallback>
                          </Avatar>
                          <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">{d.user.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-[11px] text-foreground/80 italic">"{d.message}"</p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-bold text-primary tracking-tight">{d.amount.toLocaleString()} VND</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-[9px] font-mono text-outline uppercase">{d.timestamp}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredDonations.length === 0 && (
                <div className="py-20 text-center space-y-4">
                  <DollarSign className="w-12 h-12 text-outline/20 mx-auto" />
                  <p className="text-outline font-mono text-[10px] uppercase tracking-[0.3em]">KHÔNG TÌM THẤY DONATE NÀO</p>
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

        {/* Top Donors Sidebar */}
        <aside className="w-full lg:w-80 bg-surface-container-lowest/50 border-l border-outline-variant/10 p-8 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-l-2 border-primary pl-3">
              <Trophy className="w-5 h-5 text-primary" />
              <h3 className="text-[10px] font-bold text-foreground tracking-[0.2em] uppercase">TOP 5 CHIẾN BINH</h3>
            </div>
            
            <div className="space-y-3">
              {topDonors.map((donor: any, idx) => (
                <div key={donor.name} className="relative bg-surface-container-low p-4 border border-outline-variant/5 group hover:border-primary/30 transition-all">
                  <div className="absolute -top-2 -left-2 w-5 h-5 bg-primary flex items-center justify-center text-black text-[10px] font-bold italic">
                    #{idx + 1}
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8 border border-outline-variant/20">
                      <AvatarImage src={donor.avatar} referrerPolicy="no-referrer" />
                      <AvatarFallback>{donor.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-foreground uppercase truncate">{donor.name}</p>
                      <p className="text-[11px] font-display font-bold text-primary tracking-tight">
                        {donor.total.toLocaleString()} VND
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/10 p-4 space-y-2">
            <p className="text-[9px] font-bold text-primary uppercase tracking-widest">THÔNG TIN DOANH THU</p>
            <p className="text-[10px] text-outline leading-relaxed uppercase tracking-wider">
              Dữ liệu được cập nhật theo thời gian thực từ hệ thống thanh toán tập trung.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
