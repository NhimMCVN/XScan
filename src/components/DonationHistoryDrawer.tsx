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
import { X, Wallet, QrCode, Clock, MessageSquare, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DonationRecord {
  id: string;
  time: string;
  streamer: {
    name: string;
    avatar: string;
  };
  amount: number;
  method: 'wallet' | 'qrcode';
  status: 'pending' | 'completed' | 'failed';
  message: string;
}

const FULL_HISTORY: DonationRecord[] = [
  {
    id: "TX-99482",
    time: "2024-04-15 10:30",
    streamer: { name: "VALKYRIE_09", avatar: "https://picsum.photos/seed/v1/100/100" },
    amount: 250.00,
    method: 'wallet',
    status: 'completed',
    message: "Great play in the last match! Keep it up."
  },
  {
    id: "TX-99483",
    time: "2024-04-15 10:15",
    streamer: { name: "GHOST_TACTIC", avatar: "https://picsum.photos/seed/v2/100/100" },
    amount: 50.00,
    method: 'qrcode',
    status: 'completed',
    message: "Tactical support incoming."
  },
  {
    id: "TX-99484",
    time: "2024-04-15 09:50",
    streamer: { name: "NEON_REAPER", avatar: "https://picsum.photos/seed/v3/100/100" },
    amount: 1200.00,
    method: 'wallet',
    status: 'completed',
    message: "Absolute beast mode! That triple kill was insane."
  },
  {
    id: "TX-99485",
    time: "2024-04-15 09:20",
    streamer: { name: "CYBER_X", avatar: "https://picsum.photos/seed/v4/100/100" },
    amount: 25.00,
    method: 'wallet',
    status: 'failed',
    message: "Insufficient credits in reserve."
  },
  {
    id: "TX-99486",
    time: "2024-04-15 08:45",
    streamer: { name: "ZERO_RECALL", avatar: "https://picsum.photos/seed/v5/100/100" },
    amount: 100.00,
    method: 'qrcode',
    status: 'pending',
    message: "Waiting for verification..."
  },
  // Add more mock data for pagination
  ...Array.from({ length: 15 }).map((_, i) => ({
    id: `TX-9948${i + 7}`,
    time: `2024-04-14 ${10 + i}:00`,
    streamer: { name: `OPERATOR_${i}`, avatar: `https://picsum.photos/seed/op${i}/100/100` },
    amount: Math.floor(Math.random() * 500) + 10,
    method: (i % 2 === 0 ? 'wallet' : 'qrcode') as 'wallet' | 'qrcode',
    status: (i % 3 === 0 ? 'failed' : i % 3 === 1 ? 'completed' : 'pending') as 'pending' | 'completed' | 'failed',
    message: "Automated tactical support record."
  }))
];

interface DonationHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DonationHistoryDrawer({ isOpen, onClose }: DonationHistoryDrawerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(FULL_HISTORY.length / itemsPerPage);

  const currentData = FULL_HISTORY.slice(
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
                  FULL DONATION ARCHIVE
                </DrawerTitle>
                <DrawerDescription className="text-[10px] font-mono text-outline tracking-widest uppercase">
                  PROTOCOL: DATA_RETRIEVAL_V1.0 // TOTAL_RECORDS: {FULL_HISTORY.length}
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
                    <TableHead className="text-[10px] font-bold text-outline tracking-widest uppercase h-12">TIME</TableHead>
                    <TableHead className="text-[10px] font-bold text-outline tracking-widest uppercase h-12">STREAMER</TableHead>
                    <TableHead className="text-[10px] font-bold text-outline tracking-widest uppercase h-12">AMOUNT</TableHead>
                    <TableHead className="text-[10px] font-bold text-outline tracking-widest uppercase h-12">METHOD</TableHead>
                    <TableHead className="text-[10px] font-bold text-outline tracking-widest uppercase h-12">STATUS</TableHead>
                    <TableHead className="text-[10px] font-bold text-outline tracking-widest uppercase h-12">MESSAGE</TableHead>
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
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 border border-outline-variant/20">
                            <AvatarImage src={record.streamer.avatar} referrerPolicy="no-referrer" />
                            <AvatarFallback>{record.streamer.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                            {record.streamer.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-display font-bold text-primary text-sm">
                        ${record.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-outline uppercase tracking-widest">
                          {record.method === 'wallet' ? <Wallet className="w-3 h-3" /> : <QrCode className="w-3 h-3" />}
                          {record.method}
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
                            {record.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="flex items-start gap-2 text-[10px] text-outline leading-relaxed italic">
                          <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                          <span className="truncate">{record.message}</span>
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
                {Array.from({ length: totalPages }).map((_, i) => (
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
