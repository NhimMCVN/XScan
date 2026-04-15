import { useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { X, Wallet, QrCode, Clock, CheckCircle2, AlertCircle, Loader2, ArrowDownCircle } from "lucide-react";

interface DepositRecord {
  id: string;
  time: string;
  amount: number;
  currency: 'VND' | 'GEM';
  method: 'wallet' | 'qrcode';
  status: 'pending' | 'completed' | 'failed';
  txHash: string;
}

const DEPOSIT_HISTORY: DepositRecord[] = [
  {
    id: "DEP-001",
    time: "2024-04-15 10:30",
    amount: 500000,
    currency: 'VND',
    method: 'qrcode',
    status: 'completed',
    txHash: "0F9C4D...E2A"
  },
  {
    id: "DEP-002",
    time: "2024-04-15 09:15",
    amount: 100,
    currency: 'GEM',
    method: 'wallet',
    status: 'completed',
    txHash: "8B2F1A...C3D"
  },
  {
    id: "DEP-003",
    time: "2024-04-14 18:50",
    amount: 200000,
    currency: 'VND',
    method: 'qrcode',
    status: 'failed',
    txHash: "5E4D3C...B2A"
  },
  {
    id: "DEP-004",
    time: "2024-04-14 14:20",
    amount: 50,
    currency: 'GEM',
    method: 'wallet',
    status: 'pending',
    txHash: "1A2B3C...D4E"
  },
  ...Array.from({ length: 20 }).map((_, i) => ({
    id: `DEP-0${i + 5}`,
    time: `2024-04-${13 - Math.floor(i/5)} ${10 + (i%12)}:00`,
    amount: Math.floor(Math.random() * 1000000),
    currency: (i % 2 === 0 ? 'VND' : 'GEM') as 'VND' | 'GEM',
    method: (i % 3 === 0 ? 'wallet' : 'qrcode') as 'wallet' | 'qrcode',
    status: (i % 4 === 0 ? 'failed' : i % 4 === 1 ? 'pending' : 'completed') as 'pending' | 'completed' | 'failed',
    txHash: `${Math.random().toString(16).toUpperCase().substring(2, 8)}...${Math.random().toString(16).toUpperCase().substring(2, 5)}`
  }))
];

interface DepositHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DepositHistoryDrawer({ isOpen, onClose }: DepositHistoryDrawerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(DEPOSIT_HISTORY.length / itemsPerPage);

  const currentData = DEPOSIT_HISTORY.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'pending': return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      default: return null;
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-surface-container-low border-outline-variant/20 h-[85vh] outline-none">
        <div className="mx-auto w-full max-w-6xl h-full flex flex-col">
          <DrawerHeader className="border-b border-outline-variant/10 pb-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <DrawerTitle className="text-2xl font-bold tracking-tight uppercase text-foreground">
                  KHO LƯU TRỮ NẠP TIỀN
                </DrawerTitle>
                <DrawerDescription className="text-[10px] font-mono text-outline tracking-widest uppercase">
                  GIAO THỨC: FINANCIAL_RECORDS_V2.0 // TỔNG SỐ MỤC: {DEPOSIT_HISTORY.length}
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="text-outline hover:text-primary">
                  <X className="w-6 h-6" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-auto p-6">
            <div className="relative border border-outline-variant/10 bg-surface-container-lowest/30 cut-corner-sm">
              <Table>
                <TableHeader className="bg-surface-container-highest/30">
                  <TableRow className="hover:bg-transparent border-outline-variant/10">
                    <TableHead className="text-[10px] font-bold text-outline tracking-widest uppercase h-12">THỜI GIAN</TableHead>
                    <TableHead className="text-[10px] font-bold text-outline tracking-widest uppercase h-12">MÃ GIAO DỊCH</TableHead>
                    <TableHead className="text-[10px] font-bold text-outline tracking-widest uppercase h-12">SỐ TIỀN</TableHead>
                    <TableHead className="text-[10px] font-bold text-outline tracking-widest uppercase h-12">PHƯƠNG THỨC</TableHead>
                    <TableHead className="text-[10px] font-bold text-outline tracking-widest uppercase h-12">TRẠNG THÁI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.map((record) => (
                    <TableRow key={record.id} className="hover:bg-surface-container-high/50 border-outline-variant/5 transition-colors">
                      <TableCell className="font-mono text-[10px] text-outline">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {record.time}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-foreground tracking-wider">
                        {record.id}
                      </TableCell>
                      <TableCell className="font-display font-bold text-primary text-sm">
                        {record.currency === 'VND' ? record.amount.toLocaleString() : record.amount.toFixed(2)} {record.currency}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-outline uppercase tracking-widest">
                          {record.method === 'wallet' ? <Wallet className="w-3 h-3" /> : <QrCode className="w-3 h-3" />}
                          {record.method === 'wallet' ? 'Ví' : 'Mã QR'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                          {getStatusIcon(record.status)}
                          <span className={
                            record.status === 'completed' ? 'text-green-500' : 
                            record.status === 'failed' ? 'text-destructive' : 
                            'text-primary'
                          }>
                            {record.status === 'completed' ? 'Hoàn tất' : record.status === 'failed' ? 'Thất bại' : 'Đang xử lý'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <DrawerFooter className="border-t border-outline-variant/10 py-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(p => p - 1); }}
                    className={`text-[10px] font-bold tracking-widest uppercase rounded-none border-outline-variant/20 ${currentPage === 1 ? 'opacity-50 pointer-events-none' : 'hover:bg-primary/10 hover:text-primary'}`}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); setCurrentPage(i + 1); }}
                      isActive={currentPage === i + 1}
                      className={`text-[10px] font-bold rounded-none border-outline-variant/20 ${currentPage === i + 1 ? 'bg-primary text-black border-primary' : 'hover:bg-primary/10 hover:text-primary'}`}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(p => p + 1); }}
                    className={`text-[10px] font-bold tracking-widest uppercase rounded-none border-outline-variant/20 ${currentPage === totalPages ? 'opacity-50 pointer-events-none' : 'hover:bg-primary/10 hover:text-primary'}`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
