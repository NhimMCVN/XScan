import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Check, 
  ChevronRight, 
  Upload, 
  IdCard, 
  Youtube, 
  Video, 
  Globe, 
  Users, 
  FileText, 
  ShieldCheck,
  Zap,
  ArrowRight,
  Info,
  Facebook,
  Twitch,
  MoreHorizontal,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function StreamerRegistrationView() {
  const [step, setStep] = useState(1);
  const [platform, setPlatform] = useState("");
  const [otherPlatform, setOtherPlatform] = useState("");
  const [category, setCategory] = useState("");
  const [otherCategory, setOtherCategory] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const platforms = [
    { id: "youtube", name: "YouTube", icon: <Youtube className="w-5 h-5" /> },
    { id: "tiktok", name: "TikTok", icon: <Video className="w-5 h-5" /> },
    { id: "facebook", name: "Facebook", icon: <Facebook className="w-5 h-5" /> },
    { id: "twitch", name: "Twitch", icon: <Twitch className="w-5 h-5" /> },
    { id: "other", name: "Khác", icon: <MoreHorizontal className="w-5 h-5" /> },
  ];

  const categories = [
    { id: "fps", name: "FPS Gaming" },
    { id: "moba", name: "MOBA" },
    { id: "br", name: "Battle Royale" },
    { id: "sports", name: "Sports" },
    { id: "chatting", name: "Just Chatting" },
    { id: "other", name: "Khác" },
  ];

  const steps = [
    { id: 1, name: "Thông tin kênh", icon: <Video className="w-4 h-4" /> },
    { id: 2, name: "Định danh & Xác nhận", icon: <IdCard className="w-4 h-4" /> },
  ];

  const benefits = [
    "Tỷ lệ chia sẻ doanh thu lên đến 90%",
    "Hỗ trợ kỹ thuật và marketing 24/7",
    "Hệ thống donate và quà tặng độc quyền",
    "Cơ hội tham gia các giải đấu chuyên nghiệp"
  ];

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="flex-1 bg-surface flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-surface-container-low border border-primary/30 p-12 text-center space-y-8 cut-corner shadow-[0_0_50px_rgba(255,184,0,0.1)]"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto border-2 border-primary">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground uppercase italic">ĐƠN ĐÃ ĐƯỢC GỬI THÀNH CÔNG</h2>
            <p className="text-outline text-sm leading-relaxed">
              Cảm ơn bạn đã tin tưởng và đăng ký trở thành Streamer trên hệ thống XScan. 
              Hồ sơ của bạn đã được chuyển đến bộ phận xét duyệt và sẽ được phản hồi trong vòng 24-48 giờ tới.
            </p>
          </div>
          <Button 
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'MATCHES' }))}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-black font-bold tracking-widest rounded-none"
          >
            QUAY LẠI TRANG CHỦ
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-surface overflow-y-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-12 pb-20">
        
        {/* Header Section */}
        <header className="text-center space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground uppercase italic">
              Gia nhập cộng đồng <span className="text-primary">Streamer</span>
            </h1>
            <p className="text-outline text-sm md:text-base max-w-2xl mx-auto font-medium">
              Khởi đầu hành trình chuyên nghiệp của bạn cùng hệ thống stream hàng đầu. 
              Tận hưởng các đặc quyền và công cụ hỗ trợ tối tân nhất.
            </p>
          </motion.div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {benefits.map((benefit, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface-container-low/50 border border-outline-variant/10 p-4 rounded-[12px] flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold tracking-wider text-foreground/80 text-left leading-tight uppercase">
                  {benefit}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Step Progress */}
          <div className="relative pt-12 max-w-md mx-auto">
            <div className="absolute top-[calc(3rem+1.25rem)] left-0 right-0 h-0.5 bg-surface-container-highest" />
            <div 
              className="absolute top-[calc(3rem+1.25rem)] left-0 h-0.5 bg-primary transition-all duration-500" 
              style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
            />
            
            <div className="relative flex justify-between">
              {steps.map((s) => (
                <div key={s.id} className="flex flex-col items-center gap-3">
                  <button 
                    onClick={() => setStep(s.id)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all relative z-10 ${
                      step >= s.id 
                        ? 'bg-primary border-primary text-black shadow-[0_0_15px_rgba(255,184,0,0.3)]' 
                        : 'bg-surface-container-low border-surface-container-highest text-outline'
                    }`}
                  >
                    {s.icon}
                  </button>
                  <span className={`text-[10px] font-bold tracking-widest uppercase ${step >= s.id ? 'text-primary' : 'text-outline'}`}>
                    {s.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* Form Area */}
        <div className="bg-surface-container-low border border-outline-variant/10 rounded-[12px] overflow-hidden">
          <div className="p-8 md:p-12">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-12"
                >
                  {/* Section 1: Channel Info */}
                  <section className="space-y-8">
                    <div className="flex items-center gap-3 border-l-4 border-primary pl-4">
                      <h2 className="text-xl font-bold tracking-tight uppercase">Thông tin kênh & Nội dung</h2>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Chọn nền tảng chính</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                          {platforms.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => setPlatform(p.id)}
                              className={`flex flex-col items-center justify-center p-4 rounded-[12px] border transition-all gap-3 group ${
                                platform === p.id 
                                  ? 'bg-primary border-primary text-black shadow-[0_0_15px_rgba(255,184,0,0.2)]' 
                                  : 'bg-surface-container-highest/20 border-outline-variant/10 text-outline hover:border-primary/50 hover:text-primary'
                              }`}
                            >
                              <div className={`transition-transform group-hover:scale-110 ${platform === p.id ? 'text-black' : 'text-primary'}`}>
                                {p.icon}
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-widest">{p.name}</span>
                            </button>
                          ))}
                        </div>
                        
                        <AnimatePresence>
                          {platform === "other" && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="pt-2"
                            >
                              <div className="space-y-2">
                                <label className="text-[9px] font-bold text-primary uppercase tracking-widest">Tên nền tảng khác</label>
                                <Input 
                                  placeholder="Nhập tên nền tảng của bạn..." 
                                  value={otherPlatform}
                                  onChange={(e) => setOtherPlatform(e.target.value)}
                                  className="h-12 bg-surface-container-highest/30 border-outline-variant/10 rounded-[12px] focus:ring-primary/50"
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-outline uppercase tracking-widest">URL Kênh</label>
                          <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                            <Input 
                              placeholder="https://..." 
                              className="pl-12 h-12 bg-surface-container-highest/30 border-outline-variant/10 rounded-[12px]"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Danh mục nội dung</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {categories.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => setCategory(c.id)}
                                className={`px-3 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${
                                  category === c.id 
                                    ? 'bg-primary border-primary text-black' 
                                    : 'bg-surface-container-highest/20 border-outline-variant/10 text-outline hover:border-primary/50'
                                }`}
                              >
                                {c.name}
                              </button>
                            ))}
                          </div>
                          
                          <AnimatePresence>
                            {category === "other" && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-2 space-y-2">
                                  <label className="text-[9px] font-bold text-primary uppercase tracking-widest">Tên danh mục khác</label>
                                  <Input 
                                    placeholder="Nhập danh mục của bạn..." 
                                    value={otherCategory}
                                    onChange={(e) => setOtherCategory(e.target.value)}
                                    className="h-10 bg-surface-container-highest/30 border-outline-variant/10 rounded-[12px] focus:ring-primary/50"
                                  />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Mô tả kênh & Phong cách stream</label>
                        <Textarea 
                          placeholder="Hãy cho chúng tôi biết về phong cách stream của bạn..." 
                          className="min-h-[120px] bg-surface-container-highest/30 border-outline-variant/10 rounded-[12px] focus:ring-primary/50"
                        />
                      </div>
                    </div>
                  </section>
                  <div className="flex justify-end pt-8">
                    <Button 
                      onClick={() => setStep(2)}
                      className="h-14 px-8 bg-primary hover:bg-primary-fixed-dim text-black font-bold text-sm tracking-[0.2em] rounded-[12px] shadow-[0_0_20px_rgba(255,184,0,0.2)] group"
                    >
                      TIẾP THEO
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-12"
                >
                  {/* Section 2: Personal Info & KYC */}
                  <section className="space-y-8">
                    <div className="flex items-center gap-3 border-l-4 border-primary pl-4">
                      <h2 className="text-xl font-bold tracking-tight uppercase">Thông tin định danh</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Họ và tên</label>
                        <Input 
                          placeholder="Nhập họ và tên thật..." 
                          className="h-12 bg-surface-container-highest/30 border-outline-variant/10 rounded-[12px]"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Quê quán / Địa chỉ</label>
                        <Input 
                          placeholder="Nhập địa chỉ thường trú..." 
                          className="h-12 bg-surface-container-highest/30 border-outline-variant/10 rounded-[12px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="group relative bg-surface-container-highest/20 border-2 border-dashed border-outline-variant/20 p-8 rounded-[12px] flex flex-col items-center justify-center text-center space-y-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                        <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-outline group-hover:text-primary transition-colors">
                          <IdCard className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-sm uppercase tracking-wider">Mặt trước CCCD</p>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-[8px] border-outline-variant/30 group-hover:border-primary group-hover:text-primary">
                          <Upload className="w-3 h-3 mr-2" />
                          Tải ảnh
                        </Button>
                      </div>

                      <div className="group relative bg-surface-container-highest/20 border-2 border-dashed border-outline-variant/20 p-8 rounded-[12px] flex flex-col items-center justify-center text-center space-y-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                        <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-outline group-hover:text-primary transition-colors">
                          <IdCard className="w-8 h-8 rotate-180" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-sm uppercase tracking-wider">Mặt sau CCCD</p>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-[8px] border-outline-variant/30 group-hover:border-primary group-hover:text-primary">
                          <Upload className="w-3 h-3 mr-2" />
                          Tải ảnh
                        </Button>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-outline-variant/10">
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          id="terms" 
                          checked={agreed}
                          onCheckedChange={(v) => setAgreed(v as boolean)}
                          className="w-5 h-5 rounded-[4px] border-outline-variant/30 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                        />
                        <label 
                          htmlFor="terms" 
                          className="text-xs font-medium text-foreground/80 cursor-pointer select-none"
                        >
                          Tôi đồng ý với các <span className="text-primary hover:underline">điều khoản dành cho Streamer</span> và cam kết thông tin trên là chính xác.
                        </label>
                      </div>
                    </div>
                  </section>

                  <div className="flex justify-between pt-8">
                    <Button 
                      variant="ghost"
                      onClick={() => setStep(1)}
                      className="h-14 px-8 text-outline hover:text-primary font-bold text-sm tracking-[0.2em] group"
                    >
                      <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                      QUAY LẠI
                    </Button>
                    <Button 
                      disabled={!agreed}
                      onClick={handleSubmit}
                      className="h-14 px-8 bg-primary hover:bg-primary-fixed-dim text-black font-bold text-sm tracking-[0.2em] rounded-[12px] shadow-[0_0_20px_rgba(255,184,0,0.2)] group"
                    >
                      GỬI ĐƠN XÉT DUYỆT
                      <Zap className="ml-2 w-4 h-4 group-hover:scale-110 transition-transform" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-center gap-2 text-outline">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] font-bold tracking-widest uppercase">Hệ thống bảo mật dữ liệu cấp cao // XScan Intel Protocol</span>
        </div>

      </div>
    </div>
  );
}
