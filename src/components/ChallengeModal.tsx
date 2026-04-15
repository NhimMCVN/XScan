import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Zap, 
  ShieldAlert, 
  Sword,
  Wallet,
  QrCode,
  ShieldCheck
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  streamer: any;
}

export function ChallengeModal({ isOpen, onClose, streamer }: ChallengeModalProps) {
  const [activeTab, setActiveTab] = useState<'wallet' | 'qrcode'>('wallet');
  const [isQrGenerated, setIsQrGenerated] = useState(false);
  const [amount, setAmount] = useState("50000");
  const [challenge, setChallenge] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClose = () => {
    setIsQrGenerated(false);
    setActiveTab('wallet');
    onClose();
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (activeTab === 'qrcode' && !isQrGenerated) {
      setIsQrGenerated(true);
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      handleClose();
    }, 1500);
  };

  if (!streamer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-surface-container-low border border-primary/20 p-0 overflow-hidden cut-corner shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <DialogHeader className="p-8 pb-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-bold tracking-tight text-foreground uppercase italic flex items-center gap-3">
                <Sword className="w-6 h-6 text-primary" />
                THIẾT LẬP THỬ THÁCH
              </DialogTitle>
              <p className="text-[10px] font-mono text-outline tracking-widest uppercase">
                MỤC TIÊU: {streamer.name}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleClose}
              className="text-outline hover:text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Tabs */}
          <div className="relative p-1 bg-surface-container-highest/30 flex gap-1 border border-outline-variant/10">
            <Button 
              type="button"
              onClick={() => { setActiveTab('wallet'); setIsQrGenerated(false); }}
              className={`flex-1 font-bold text-[10px] tracking-[0.2em] h-10 rounded-none transition-all ${activeTab === 'wallet' ? 'bg-surface-container-highest border border-primary/50 text-primary' : 'bg-transparent text-outline hover:text-primary'}`}
            >
              <Wallet className="w-4 h-4 mr-2" />
              VÍ TIỀN
            </Button>
            <Button 
              type="button"
              onClick={() => setActiveTab('qrcode')}
              className={`flex-1 font-bold text-[10px] tracking-[0.2em] h-10 rounded-none transition-all ${activeTab === 'qrcode' ? 'bg-surface-container-highest border border-primary/50 text-primary' : 'bg-transparent text-outline hover:text-primary'}`}
            >
              <QrCode className="w-4 h-4 mr-2" />
              MÃ QR
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {isQrGenerated ? (
              <motion.div 
                key="qr-view"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center space-y-6 py-4"
              >
                <div className="relative p-4 bg-white border-4 border-primary/30">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=CHALLENGE_${amount}_TO_${streamer.name}`}
                    alt="QR Code"
                    className="w-40 h-40"
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-primary font-bold tracking-widest uppercase">QUÉT ĐỂ GỬI THỬ THÁCH</p>
                  <p className="text-[10px] text-outline tracking-widest uppercase">SỐ TIỀN: {parseInt(amount).toLocaleString()} VND</p>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => setIsQrGenerated(false)}
                  className="text-[10px] font-bold text-outline hover:text-primary tracking-[0.2em] uppercase h-8 rounded-none border border-outline-variant/20 px-4"
                >
                  THAY ĐỔI THÔNG TIN
                </Button>
              </motion.div>
            ) : (
              <motion.div 
                key="form-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* Amount Selection */}
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1 h-1 bg-primary" />
                    PHẦN THƯỞNG THỬ THÁCH (VND)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["20000", "50000", "100000", "200000", "500000", "1000000"].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmount(val)}
                        className={`py-2 text-[10px] font-bold border transition-all ${
                          amount === val 
                            ? 'bg-primary border-primary text-black' 
                            : 'bg-surface-container-highest/20 border-outline-variant/10 text-outline hover:border-primary/50'
                        }`}
                      >
                        {parseInt(val).toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <div className="relative group">
                    <Input 
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-12 bg-surface-container-highest/30 border-outline-variant/10 rounded-none font-mono text-sm tracking-widest pl-10"
                    />
                    <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  </div>
                </div>

                {/* Challenge Content */}
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1 h-1 bg-primary" />
                    NỘI DUNG THỬ THÁCH
                  </label>
                  <Textarea 
                    placeholder="Sử dụng rìu trong trận đấu tiếp theo"
                    value={challenge}
                    onChange={(e) => setChallenge(e.target.value)}
                    className="min-h-[100px] bg-surface-container-highest/30 border-outline-variant/10 rounded-none focus:ring-primary/50 font-medium text-sm"
                  />
                </div>

                {/* Alert Info */}
                <div className="bg-primary/5 border border-primary/20 p-4 flex gap-3">
                  <ShieldAlert className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-[10px] text-primary/80 leading-relaxed font-medium uppercase tracking-wider">
                    Streamer sẽ xem xét và chấp nhận thử thách của bạn. Nếu thử thách không được thực hiện hoặc bị từ chối, bạn sẽ được hoàn tiền 100% vào ví.
                  </p>
                </div>

                <Button 
                  type="submit"
                  disabled={isProcessing}
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-black font-bold tracking-[0.2em] rounded-none shadow-[0_0_30px_rgba(255,184,0,0.2)]"
                >
                  {isProcessing ? "ĐANG TRIỂN KHAI..." : activeTab === 'wallet' ? "GỬI THỬ THÁCH" : "TẠO MÃ QR"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </DialogContent>
    </Dialog>
  );
}
