import { useState } from "react";
import { X, Zap, Wallet, QrCode, ShieldCheck, Smile } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: {
    type: 'streamer' | 'match';
    name?: string;
    avatar?: string;
    level?: string;
    team1?: { name: string; image: string };
    team2?: { name: string; image: string };
    currentDonation?: string;
  } | null;
}

export function DonateModal({ isOpen, onClose, subject }: DonateModalProps) {
  const [activeTab, setActiveTab] = useState<'wallet' | 'qrcode'>('wallet');
  const [isQrGenerated, setIsQrGenerated] = useState(false);
  const [amount, setAmount] = useState('100K');

  if (!subject) return null;

  const handleClose = () => {
    setIsQrGenerated(false);
    setActiveTab('wallet');
    onClose();
  };

  const displayName = subject.type === 'streamer' ? subject.name : `${subject.team1?.name} VS ${subject.team2?.name}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-surface-container-low border border-outline-variant/20 flex flex-col md:flex-row overflow-hidden cut-corner shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            {/* Left Section: Info */}
            <div className="w-full md:w-[40%] bg-surface-container-lowest p-12 flex flex-col items-center justify-center space-y-8 border-r border-outline-variant/10 relative">
              <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none overflow-hidden">
                <div className="w-full h-full" style={{ 
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)',
                  backgroundSize: '100% 4px'
                }} />
              </div>

              {subject.type === 'streamer' ? (
                <div className="relative">
                  <div className="w-48 h-48 border-2 border-primary/50 p-1 bg-surface-container">
                    <div className="w-full h-full border border-outline-variant/30 overflow-hidden relative">
                      <img 
                        src={subject.avatar} 
                        alt={subject.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-2 right-2 bg-primary px-1.5 py-0.5">
                        <span className="text-[10px] font-bold text-black uppercase">{subject.level || 'LVL 99'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 relative">
                  <div className="w-32 h-32 border-2 border-primary/50 p-1 bg-surface-container">
                    <img src={subject.team1?.image} alt={subject.team1?.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <span className="text-2xl font-bold text-primary italic">VS</span>
                  <div className="w-32 h-32 border-2 border-outline-variant/30 p-1 bg-surface-container">
                    <img src={subject.team2?.image} alt={subject.team2?.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                </div>
              )}

              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-[0.1em] uppercase text-foreground">
                  {subject.type === 'streamer' ? subject.name : 'MATCH_SUPPORT'}
                </h2>
                <p className="text-[10px] font-bold text-outline tracking-[0.3em] uppercase">
                  {subject.type === 'streamer' ? 'SUPPORTING OPERATOR' : `${subject.team1?.name} VS ${subject.team2?.name}`}
                </p>
              </div>

              <div className="w-full space-y-4 pt-8 border-t border-outline-variant/10">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-outline tracking-widest uppercase">
                    {subject.type === 'streamer' ? 'CURRENT_MATCH_XP' : 'MATCH_DONATIONS'}
                  </span>
                  <span className="text-[10px] font-mono text-primary font-bold">
                    {subject.type === 'streamer' ? '+1,240' : subject.currentDonation || '$0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-outline tracking-widest uppercase">SQUAD_BONUS</span>
                  <span className="text-[10px] font-mono text-primary font-bold">ACTIVE</span>
                </div>
              </div>
            </div>

            {/* Right Section: Transaction Details */}
            <div className="flex-1 p-12 space-y-8 relative bg-surface-container-low min-h-[600px] flex flex-col">
              <button 
                onClick={handleClose}
                className="absolute top-8 right-8 text-outline hover:text-primary transition-colors z-50"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="space-y-1">
                <h3 className="text-2xl font-bold tracking-tight uppercase text-foreground">SUPPORT TRANSACTION</h3>
                <p className="text-[10px] font-mono text-outline tracking-widest uppercase">PROTOCOL: SECURE_DONATE_V4.2</p>
              </div>

              {/* Tabs */}
              <div className="relative p-1 bg-surface-container-highest/30 flex gap-1 border border-outline-variant/10">
                <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-primary" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-primary" />
                
                <Button 
                  onClick={() => { setActiveTab('wallet'); setIsQrGenerated(false); }}
                  className={`flex-1 font-bold text-[10px] tracking-[0.2em] h-10 rounded-none transition-all ${activeTab === 'wallet' ? 'bg-surface-container-highest border border-primary/50 text-primary' : 'bg-transparent text-outline hover:text-primary'}`}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  WALLET
                </Button>
                <Button 
                  onClick={() => setActiveTab('qrcode')}
                  className={`flex-1 font-bold text-[10px] tracking-[0.2em] h-10 rounded-none transition-all ${activeTab === 'qrcode' ? 'bg-surface-container-highest border border-primary/50 text-primary' : 'bg-transparent text-outline hover:text-primary'}`}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  QR CODE
                </Button>
              </div>

              <div className="relative flex-1 flex flex-col">
                <AnimatePresence mode="wait">
                  {isQrGenerated ? (
                    <motion.div 
                      key="qr-view"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex-1 flex flex-col items-center justify-center space-y-8"
                    >
                      <div className="relative p-4 bg-white border-4 border-primary/30">
                        <div className="absolute -top-2 -right-2">
                          <Button 
                            size="icon" 
                            variant="destructive" 
                            className="h-6 w-6 rounded-none"
                            onClick={() => setIsQrGenerated(false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=DONATE_${amount}_TO_${displayName}`}
                          alt="QR Code"
                          className="w-48 h-48"
                        />
                      </div>
                      <div className="text-center space-y-6">
                        <div className="space-y-2">
                          <p className="text-primary font-bold tracking-widest uppercase">SCAN TO COMPLETE</p>
                          <p className="text-[10px] text-outline tracking-widest uppercase">AMOUNT: {amount} CREDITS</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          onClick={() => setIsQrGenerated(false)}
                          className="text-[10px] font-bold text-outline hover:text-primary tracking-[0.2em] uppercase h-8 rounded-none border border-outline-variant/20 px-4"
                        >
                          CHANGE AMOUNT
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="form-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-8"
                    >
                      {/* Preset Amounts */}
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-outline tracking-[0.2em] uppercase">PRESET AMOUNTS</label>
                        <div className="grid grid-cols-3 gap-4">
                          {['50K', '100K', '500K'].map((amt) => (
                            <div key={amt} className="relative group">
                              {amt === '100K' && (
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary px-2 py-0.5 z-10">
                                  <span className="text-[8px] font-bold text-black uppercase">POPULAR</span>
                                </div>
                              )}
                              <Button 
                                variant="outline" 
                                onClick={() => setAmount(amt)}
                                className={`w-full h-14 font-display font-bold text-lg tracking-widest rounded-none border-outline-variant/20 hover:border-primary/50 transition-all ${amount === amt ? 'border-primary/60 bg-primary/5 text-primary' : 'bg-surface-container-highest/50'}`}
                              >
                                {amt}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Custom Credits */}
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-outline tracking-[0.2em] uppercase">CUSTOM CREDITS</label>
                        <div className="relative">
                          <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                          <Input 
                            placeholder="Enter amount..." 
                            className="h-14 pl-12 bg-surface-container-highest/50 border-none focus-visible:ring-1 focus-visible:ring-primary/50 text-lg font-display tracking-widest rounded-none"
                          />
                        </div>
                      </div>

                      {/* Encrypted Message */}
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-outline tracking-[0.2em] uppercase">ENCRYPTED MESSAGE</label>
                        <div className="relative">
                          <Textarea 
                            placeholder="Add a tactical note..." 
                            className="min-h-[120px] bg-surface-container-highest/50 border-none focus-visible:ring-1 focus-visible:ring-primary/50 text-sm tracking-wide rounded-none p-4 resize-none"
                          />
                          <Smile className="absolute bottom-4 right-4 w-5 h-5 text-outline hover:text-primary cursor-pointer transition-colors" />
                        </div>
                      </div>

                      {/* Confirm Button */}
                      <div className="space-y-6 pt-4">
                        <Button 
                          onClick={() => {
                            if (activeTab === 'qrcode') {
                              setIsQrGenerated(true);
                            }
                          }}
                          className="w-full h-16 bg-primary hover:bg-primary/90 text-black font-bold text-lg tracking-[0.2em] rounded-none shadow-[0_0_20px_rgba(255,184,0,0.2)]"
                        >
                          {activeTab === 'wallet' ? 'CONFIRM DONATION' : 'CREATE QR CODE'}
                          <Zap className="w-6 h-6 ml-3 fill-black" />
                        </Button>
                        <p className="text-[9px] font-mono text-outline text-center tracking-[0.2em] uppercase">
                          TRANSACTIONS ARE FINALIZED UPON CONFIRMATION.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
