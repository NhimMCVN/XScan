import { useState } from "react";
import { 
  Link as LinkIcon, 
  Plus, 
  Copy, 
  Star, 
  Edit2, 
  Palette, 
  Trash2, 
  ArrowUpDown,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const INITIAL_LINKS = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  title: `Link ${i + 1}`,
  customUrl: `link-${i + 1}`,
  totalDonate: i * 10000,
  donateCount: i,
  views: i * 5,
  status: i % 3 === 0 ? "active" : "inactive",
  isDefault: i === 0,
  createdAt: "16/04/2026 11:27"
}));

export function StreamerDonationLinksView() {
  const [links, setLinks] = useState(INITIAL_LINKS);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isColorDialogOpen, setIsColorDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<any>(null);

  const itemsPerPage = 5;
  const totalPages = Math.ceil(links.length / itemsPerPage);
  const paginatedLinks = links.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleStatus = (id: number) => {
    setLinks(links.map(l => l.id === id ? { ...l, status: l.status === 'active' ? 'inactive' : 'active' } : l));
  };

  const toggleDefault = (id: number) => {
    setLinks(links.map(l => ({ ...l, isDefault: l.id === id })));
  };

  const deleteLink = () => {
    setLinks(links.filter(l => l.id !== selectedLink.id));
    setIsDeleteDialogOpen(false);
  };

  const ColorForm = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label className="text-[10px] font-bold text-outline uppercase">Màu sắc Theme</Label>
        <div className="grid grid-cols-2 gap-4">
          <Input type="color" className="h-10 bg-surface-container-highest/30 border-outline-variant/20 rounded-none" />
          <Input type="color" className="h-10 bg-surface-container-highest/30 border-outline-variant/20 rounded-none" />
          <Input type="color" className="h-10 bg-surface-container-highest/30 border-outline-variant/20 rounded-none" />
          <Input type="color" className="h-10 bg-surface-container-highest/30 border-outline-variant/20 rounded-none" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-surface relative overflow-hidden">
      <div className="scanline" />
      
      {/* Header */}
      <div className="p-4 md:p-6 lg:p-8 border-b border-outline-variant/10 bg-surface-container-low/30">
        <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight uppercase text-foreground italic flex items-center gap-2 md:gap-3">
              <LinkIcon className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              QUẢN LÝ DONATION LINK
            </h2>
            <p className="text-[8px] md:text-[10px] font-mono text-outline tracking-widest uppercase">
              GIAO THỨC: DONATION_LINK_CONTROL_CENTER
            </p>
          </div>

          <Button 
            onClick={() => { setSelectedLink(null); setIsCreateDialogOpen(true); }}
            className="bg-primary text-black hover:bg-primary/90 gap-2 rounded-none font-bold uppercase tracking-widest text-[10px]"
          >
            <Plus className="w-4 h-4" /> Tạo link mới
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng link", value: links.length.toString() },
          { label: "Đang hoạt động", value: links.filter(l => l.status === 'active').length.toString() },
          { label: "Tổng lượt xem", value: links.reduce((acc, l) => acc + l.views, 0).toString() },
          { label: "Tổng doanh thu", value: `${links.reduce((acc, l) => acc + l.totalDonate, 0).toLocaleString()} VND` },
        ].map((stat, i) => (
          <div key={i} className="bg-surface-container-low p-4 border border-outline-variant/10">
            <p className="text-[9px] text-outline uppercase font-bold tracking-widest">{stat.label}</p>
            <p className="text-lg font-bold text-primary mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full">
          <div className="bg-surface-container-low/40 border border-outline-variant/10 mb-6 md:mb-8">
            <Table>
              <TableHeader>
                <TableRow className="border-outline-variant/10 hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">Tiêu đề</TableHead>
                  <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">Custom URL</TableHead>
                  <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest"><div className="flex items-center gap-1">Tổng donate <ArrowUpDown className="w-3 h-3" /></div></TableHead>
                  <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest"><div className="flex items-center gap-1">Lượt donate <ArrowUpDown className="w-3 h-3" /></div></TableHead>
                  <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest"><div className="flex items-center gap-1">Lượt xem <ArrowUpDown className="w-3 h-3" /></div></TableHead>
                  <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest">Trạng thái</TableHead>
                  <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest"><div className="flex items-center gap-1">Ngày tạo <ArrowUpDown className="w-3 h-3" /></div></TableHead>
                  <TableHead className="text-[10px] font-bold text-outline uppercase tracking-widest text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLinks.map((link) => (
                  <TableRow key={link.id} className="border-outline-variant/5 hover:bg-surface-container-highest/10 group">
                    <TableCell className="font-bold text-[11px] text-foreground uppercase tracking-wider">
                      {link.title} {link.isDefault && <Badge className="bg-primary/20 text-primary text-[8px] ml-2 rounded-none border-none">MẶC ĐỊNH</Badge>}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-outline">{link.customUrl} <Copy className="w-3 h-3 inline cursor-pointer hover:text-primary" /></TableCell>
                    <TableCell className="text-primary font-bold text-[11px]">{link.totalDonate.toLocaleString()} đ</TableCell>
                    <TableCell className="text-[11px]">{link.donateCount}</TableCell>
                    <TableCell className="text-[11px]">{link.views}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={link.status === 'active'} 
                          onCheckedChange={() => toggleStatus(link.id)}
                          className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-500" 
                        />
                        <span className={`text-[11px] font-bold ${link.status === 'active' ? 'text-primary' : 'text-outline'}`}>
                          {link.status === 'active' ? 'HOẠT ĐỘNG' : 'TẮT'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-outline text-[10px] font-mono">{link.createdAt}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" className={`h-7 w-7 ${link.isDefault ? 'text-primary' : ''}`} onClick={() => toggleDefault(link.id)}><Star className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedLink(link); setIsCreateDialogOpen(true); }}><Edit2 className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedLink(link); setIsColorDialogOpen(true); }}><Palette className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setSelectedLink(link); setIsDeleteDialogOpen(true); }}><Trash2 className="w-3 h-3" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-surface-container-lowest border border-outline-variant/20 rounded-none max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold uppercase tracking-widest text-foreground">{selectedLink ? 'Chỉnh sửa donation link' : 'Tạo donation link mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-outline uppercase">Tiêu đề *</Label>
              <Input defaultValue={selectedLink?.title} className="bg-surface-container-highest/30 border-outline-variant/20 rounded-none" placeholder="VD: Donate cho Adam HH" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-outline uppercase">Custom URL *</Label>
              <Input defaultValue={selectedLink?.customUrl} className="bg-surface-container-highest/30 border-outline-variant/20 rounded-none" placeholder="vd: adamhh-donate" />
              <p className="text-[9px] text-outline">Dùng để tra cứu công khai: /public/donation-links/{'{customUrl}'}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-outline uppercase">Mô tả</Label>
              <Textarea className="bg-surface-container-highest/30 border-outline-variant/20 rounded-none" placeholder="Mô tả ngắn (tuỳ chọn)" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold text-outline uppercase">Cho phép donate ẩn danh</Label>
              <Switch className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-outline uppercase">Màu sắc Theme</Label>
              <div className="grid grid-cols-2 gap-4">
                <Input type="color" className="h-10 bg-surface-container-highest/30 border-outline-variant/20 rounded-none" />
                <Input type="color" className="h-10 bg-surface-container-highest/30 border-outline-variant/20 rounded-none" />
                <Input type="color" className="h-10 bg-surface-container-highest/30 border-outline-variant/20 rounded-none" />
                <Input type="color" className="h-10 bg-surface-container-highest/30 border-outline-variant/20 rounded-none" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)} className="rounded-none font-bold uppercase tracking-widest text-[10px]">Huỷ</Button>
            <Button className="bg-primary text-black hover:bg-primary/90 rounded-none font-bold uppercase tracking-widest text-[10px]">{selectedLink ? 'Lưu' : 'Tạo'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Color Dialog */}
      <Dialog open={isColorDialogOpen} onOpenChange={setIsColorDialogOpen}>
        <DialogContent className="bg-surface-container-lowest border border-outline-variant/20 rounded-none max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold uppercase tracking-widest text-foreground">Chỉnh màu theme</DialogTitle>
          </DialogHeader>
          <ColorForm />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsColorDialogOpen(false)} className="rounded-none font-bold uppercase tracking-widest text-[10px]">Huỷ</Button>
            <Button className="bg-primary text-black hover:bg-primary/90 rounded-none font-bold uppercase tracking-widest text-[10px]">Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-surface-container-lowest border border-outline-variant/20 rounded-none max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold uppercase tracking-widest text-foreground">Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-outline">Bạn có chắc chắn muốn xóa donation link "{selectedLink?.title}" không?</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-none font-bold uppercase tracking-widest text-[10px]">Huỷ</Button>
            <Button onClick={deleteLink} className="bg-destructive text-white hover:bg-destructive/90 rounded-none font-bold uppercase tracking-widest text-[10px]">Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
