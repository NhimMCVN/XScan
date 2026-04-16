import { useState } from "react";
import { 
  Settings, Plus, Pencil, Trash2, Copy, Upload, Volume2, 
  Repeat, Zap, Eye, RefreshCw, ChevronDown, ChevronUp, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export function StreamerObsSettingsView() {
  const [levels, setLevels] = useState([
    { id: 1, name: "Default Level", min: 100000, max: 5000000, active: true, isOpen: false },
  ]);
  const [isAddLevelOpen, setIsAddLevelOpen] = useState(false);

  const toggleLevelOpen = (id: number) => {
    setLevels(levels.map(l => l.id === id ? { ...l, isOpen: !l.isOpen } : l));
  };

  const toggleLevelActive = (id: number) => {
    setLevels(levels.map(l => l.id === id ? { ...l, active: !l.active } : l));
  };

  const cloneLevel = (id: number) => {
    const levelToClone = levels.find(l => l.id === id);
    if (levelToClone) {
      const newLevel = { ...levelToClone, id: Date.now(), name: `${levelToClone.name} (Copy)` };
      setLevels([...levels, newLevel]);
    }
  };

  const deleteLevel = (id: number) => {
    setLevels(levels.filter(l => l.id !== id));
    setIsDeleteDialogOpen(false);
  };

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [levelToDelete, setLevelToDelete] = useState<number | null>(null);
  const [isEditLevelOpen, setIsEditLevelOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<any>(null);

  const openEditLevel = (level: any) => {
    setEditingLevel(level);
    setIsEditLevelOpen(true);
  };

  const saveEditLevel = () => {
    // Logic to save edit would go here
    setIsEditLevelOpen(false);
    setEditingLevel(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-surface-container-lowest relative overflow-hidden">
      <div className="scanline" />
      
      <div className="p-6 border-b border-outline-variant/10 bg-surface-container-low/30">
        <h2 className="text-2xl font-bold uppercase tracking-widest text-foreground italic flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" />
          CẤU HÌNH OBS
        </h2>
        <p className="text-xs text-outline mt-1">WIDGET ALERT, MEDIA VÀ ÂM THANH CHO STREAM</p>
      </div>

      <div className="flex-1 p-8 overflow-y-auto space-y-6">
        <Card className="bg-surface-container-low border-outline-variant/20 rounded-none">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold uppercase tracking-widest">WIDGET URL</h3>
                <p className="text-xs text-outline">Dán địa chỉ này vào OBS → Browser Source.</p>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-primary/10 text-primary border-none rounded-none">HOẠT ĐỘNG</Badge>
                <Button variant="outline" className="rounded-none"><Eye className="w-4 h-4 mr-2" /> Xem widget</Button>
                <Button variant="outline" className="rounded-none"><RefreshCw className="w-4 h-4 mr-2" /> Token mới</Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Input readOnly value="*/api/widget-public/alert/873d...1843de25825c8ba8b8ff10b5356911" className="bg-surface-container-highest/30 border-outline-variant/20 rounded-none font-mono" />
              <Button variant="outline" className="rounded-none"><Copy className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold uppercase tracking-widest">Cấu hình mức donation</h3>
            <p className="text-xs text-outline">Cấu hình giao diện của widget theo mức donation</p>
          </div>
          <Button onClick={() => setIsAddLevelOpen(true)} className="bg-primary text-black rounded-none font-bold uppercase tracking-widest">
            <Plus className="w-4 h-4 mr-2" /> Thêm mức
          </Button>
        </div>
        
        <div className="space-y-4">
          {levels.map(level => (
            <Card key={level.id} className="bg-surface-container-low border-outline-variant/20 rounded-none">
              <CardContent className="p-0">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => toggleLevelOpen(level.id)}>
                    <Button variant="ghost" size="icon">{level.isOpen ? <ChevronUp /> : <ChevronDown />}</Button>
                    <div>
                      <p className="font-bold">{level.name}</p>
                      <p className="text-xs text-outline">{level.min.toLocaleString()} - {level.max === Infinity ? 'Vô hạn' : level.max.toLocaleString()} VND</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={level.active} onCheckedChange={() => toggleLevelActive(level.id)} className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-500" />
                    <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => cloneLevel(level.id)}><Copy className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditLevel(level)}><Pencil className="w-4 h-4" /></Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive" 
                      disabled={levels.length <= 1}
                      onClick={() => { setLevelToDelete(level.id); setIsDeleteDialogOpen(true); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {level.isOpen && (
                  <div className="p-6 border-t border-outline-variant/10">
                    <SettingsForm />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Add Level Dialog */}
      <Dialog open={isAddLevelOpen} onOpenChange={setIsAddLevelOpen}>
        <DialogContent className="bg-surface-container-lowest border border-outline-variant/20 rounded-none max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold uppercase tracking-widest">Thêm mức donation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Tên mức (VD: Cấp 2)" className="bg-surface-container-highest/30 border-outline-variant/20 rounded-none" />
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Số tiền tối thiểu (VND)" className="bg-surface-container-highest/30 border-outline-variant/20 rounded-none" />
              <Input placeholder="Số tiền tối đa (VND)" className="bg-surface-container-highest/30 border-outline-variant/20 rounded-none" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="unlimited" />
              <Label htmlFor="unlimited">Số tiền tối đa là vô hạn</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddLevelOpen(false)} className="rounded-none">Huỷ</Button>
            <Button className="bg-primary text-black rounded-none">Tạo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Level Dialog */}
      <Dialog open={isEditLevelOpen} onOpenChange={setIsEditLevelOpen}>
        <DialogContent className="bg-surface-container-lowest border border-outline-variant/20 rounded-none max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold uppercase tracking-widest">Chỉnh sửa mức donation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input defaultValue={editingLevel?.name} placeholder="Tên mức" className="bg-surface-container-highest/30 border-outline-variant/20 rounded-none" />
            <div className="grid grid-cols-2 gap-4">
              <Input defaultValue={editingLevel?.min} placeholder="Số tiền tối thiểu (VND)" className="bg-surface-container-highest/30 border-outline-variant/20 rounded-none" />
              <Input defaultValue={editingLevel?.max === Infinity ? '' : editingLevel?.max} placeholder="Số tiền tối đa (VND)" className="bg-surface-container-highest/30 border-outline-variant/20 rounded-none" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="unlimited-edit" defaultChecked={editingLevel?.max === Infinity} />
              <Label htmlFor="unlimited-edit">Số tiền tối đa là vô hạn</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditLevelOpen(false)} className="rounded-none">Huỷ</Button>
            <Button onClick={saveEditLevel} className="bg-primary text-black rounded-none">Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-surface-container-lowest border border-outline-variant/20 rounded-none max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold uppercase tracking-widest">Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-outline">Bạn có chắc chắn muốn xóa mức donation này không?</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-none">Huỷ</Button>
            <Button onClick={() => levelToDelete && deleteLevel(levelToDelete)} className="bg-destructive text-white rounded-none">Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SettingsForm() {
  const Section = ({ title, children, className = "", rightContent }: { title: string, children: React.ReactNode, className?: string, rightContent?: React.ReactNode }) => (
    <div className={`bg-[#1A1A1A] p-6 space-y-4 border-l-4 border-primary ${className}`}>
      <div className="flex justify-between items-center">
        <h4 className="font-extrabold uppercase tracking-widest text-primary flex items-center gap-2">
          {title}
        </h4>
        {rightContent}
      </div>
      {children}
    </div>
  );

  const Control = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="bg-[#333333] p-4 space-y-1">
      <Label className="text-[10px] font-bold uppercase text-[#999999]">{label}</Label>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Media">
          <div className="border-2 border-dashed border-outline-variant/30 p-8 text-center text-outline bg-surface-container-lowest">
            <Upload className="w-8 h-8 mx-auto mb-2" />
            <p className="text-xs font-bold uppercase">Upload Media</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="border-outline rounded-none uppercase text-xs font-bold"><RefreshCw className="w-4 h-4 mr-2" /> Replace</Button>
            <Button variant="outline" className="border-outline rounded-none uppercase text-xs font-bold text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Delete</Button>
          </div>
        </Section>

        <Section title="Audio">
          <div className="space-y-4">
            <Control label="Volume">
              <div className="flex items-center gap-4">
                <Slider defaultValue={[50]} max={100} step={1} className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary [&_[role=slider]]:rounded-full" />
                <span className="text-sm font-bold text-primary w-8 text-right">50%</span>
              </div>
            </Control>
            <div className="grid grid-cols-2 gap-4">
              <Control label="On/Off">
                <Switch className="data-[state=checked]:bg-black data-[state=unchecked]:bg-amber-100 border border-primary [&_[role=thumb]]:rounded-full [&_[role=thumb]]:bg-primary" />
              </Control>
              <Control label="Loop">
                <Switch className="data-[state=checked]:bg-black data-[state=unchecked]:bg-amber-100 border border-primary [&_[role=thumb]]:rounded-full [&_[role=thumb]]:bg-primary" />
              </Control>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Control label="Fade in (ms)">
              <Input type="number" defaultValue={300} className="bg-transparent border-none p-0 h-6 text-sm" />
            </Control>
            <Control label="Fade out (ms)">
              <Input type="number" defaultValue={300} className="bg-transparent border-none p-0 h-6 text-sm" />
            </Control>
          </div>
        </Section>
      </div>

      <Section title="Styling & Typography">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Control label="Font Family">
              <Select><SelectTrigger className="bg-transparent border-none p-0 h-6 text-sm"><SelectValue placeholder="Space Grotesk" /></SelectTrigger></Select>
            </Control>
            <div className="grid grid-cols-2 gap-4">
              <Control label="Weight">
                <Select><SelectTrigger className="bg-transparent border-none p-0 h-6 text-sm"><SelectValue placeholder="Bold" /></SelectTrigger></Select>
              </Control>
              <Control label="Font Size (px)">
                <Input type="number" defaultValue={24} className="bg-transparent border-none p-0 h-6 text-sm" />
              </Control>
            </div>
            <Slider defaultValue={[50]} max={100} step={1} className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary [&_[role=slider]]:rounded-full" />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Control label="Message Color">
              <div className="w-8 h-8 bg-gray-200 border border-outline" />
            </Control>
            <Control label="Background Color">
              <div className="w-8 h-8 bg-black border border-outline" />
            </Control>
            <Control label="Money Color">
              <div className="w-8 h-8 bg-primary border border-outline" />
            </Control>
          </div>
        </div>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Animation" rightContent={<Switch className="data-[state=checked]:bg-black data-[state=unchecked]:bg-amber-100 border border-primary [&_[role=thumb]]:rounded-full [&_[role=thumb]]:bg-primary" />}>
          <div className="space-y-4">
            <Control label="Kiểu (Type)">
              <Select><SelectTrigger className="bg-transparent border-none p-0 h-6 text-sm"><SelectValue placeholder="Slide In" /></SelectTrigger></Select>
            </Control>
            <Control label="Hướng (Direction)">
              <Select><SelectTrigger className="bg-transparent border-none p-0 h-6 text-sm"><SelectValue placeholder="From Left" /></SelectTrigger></Select>
            </Control>
            <Control label="Duration (ms)">
              <Input type="number" defaultValue={800} className="bg-transparent border-none p-0 h-6 text-sm" />
            </Control>
          </div>
        </Section>

        <Section title="Thời gian hiển thị" rightContent={<div className="flex items-center gap-2"><span className="text-xs font-bold uppercase">Tự ẩn</span> <Switch className="data-[state=checked]:bg-black data-[state=unchecked]:bg-amber-100 border border-primary [&_[role=thumb]]:rounded-full [&_[role=thumb]]:bg-primary" /></div>}>
          <div className="space-y-4">
            <Control label="Display Duration (Seconds)">
              <Input type="number" defaultValue={10} className="bg-transparent border-none p-0 h-6 text-sm" />
            </Control>
            <div className="grid grid-cols-2 gap-4">
              <Control label="Fade in (ms)">
                <Input type="number" defaultValue={400} className="bg-transparent border-none p-0 h-6 text-sm" />
              </Control>
              <Control label="Fade out (ms)">
                <Input type="number" defaultValue={400} className="bg-transparent border-none p-0 h-6 text-sm" />
              </Control>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
