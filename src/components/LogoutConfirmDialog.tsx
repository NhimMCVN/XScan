import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface LogoutConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function LogoutConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: LogoutConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "max-w-sm gap-0 overflow-hidden rounded-none border border-outline-variant/25 bg-surface-container-lowest p-0",
          "cut-corner shadow-[0_0_40px_rgba(0,0,0,0.45)] sm:max-w-sm",
        )}
      >
        <div className="flex border-b border-outline-variant/15 bg-surface-container-high/40">
          <div className="flex w-14 shrink-0 items-center justify-center border-r border-outline-variant/15 bg-destructive/10">
            <LogOut className="h-6 w-6 text-destructive" aria-hidden />
          </div>
          <DialogHeader className="flex-1 gap-1 px-5 py-4 text-left">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.35em] text-outline">
              Kết thúc phiên
            </p>
            <DialogTitle className="text-base font-bold uppercase tracking-widest text-foreground">
              Đăng xuất?
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-outline">
              Bạn sẽ cần đăng nhập lại để tiếp tục ủng hộ streamer và dùng ví.
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter className="border-t border-outline-variant/15 bg-surface/30 p-4 sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="rounded-none font-mono text-[10px] font-bold uppercase tracking-widest text-outline hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            Ở lại
          </Button>
          <Button
            type="button"
            className="rounded-none bg-destructive px-6 font-mono text-[10px] font-bold uppercase tracking-widest text-white hover:bg-destructive/90"
            onClick={onConfirm}
          >
            Đăng xuất
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
