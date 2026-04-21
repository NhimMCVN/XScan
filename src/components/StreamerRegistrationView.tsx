import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  Upload,
  IdCard,
  Youtube,
  Video,
  Globe,
  Users,
  ShieldCheck,
  Zap,
  ArrowRight,
  Facebook,
  Twitch,
  MoreHorizontal,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useCreateStreamerApplicationMutation,
  useGetMyStreamerApplicationQuery,
  type StreamerPlatform,
} from "@/src/redux/queries/streamerApplication.api";

function getMutationError(e: unknown): string {
  if (!e || typeof e !== "object") return "Có lỗi xảy ra.";
  const x = e as Record<string, unknown>;
  const data = x.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.message === "string" && d.message) return d.message;
    const err = d.error;
    if (err && typeof err === "object") {
      const m = (err as Record<string, unknown>).message;
      if (typeof m === "string" && m) return m;
    }
  }
  if (typeof x.error === "string" && x.error) return x.error;
  return "Có lỗi xảy ra.";
}

const MAX_ID_IMAGE_MB = 5;

function validateIdImageFile(f: File): string | null {
  if (!f.type.startsWith("image/"))
    return "Chỉ chấp nhận file ảnh (JPG, PNG, WebP...).";
  if (f.size > MAX_ID_IMAGE_MB * 1024 * 1024)
    return `Dung lượng mỗi ảnh tối đa ${MAX_ID_IMAGE_MB}MB.`;
  return null;
}

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function mapUiPlatformToApi(ui: string): StreamerPlatform {
  switch (ui) {
    case "youtube":
      return "youtube";
    case "facebook":
      return "facebook";
    case "twitch":
      return "twitch";
    case "tiktok":
    case "other":
      return "other";
    default:
      return "other";
  }
}

export function StreamerRegistrationView() {
  const [step, setStep] = useState(1);
  const [platform, setPlatform] = useState("");
  const [otherPlatform, setOtherPlatform] = useState("");
  const [category, setCategory] = useState("");
  const [otherCategory, setOtherCategory] = useState("");
  const [channelUrl, setChannelUrl] = useState("");
  const [description, setDescription] = useState("");
  const [monthlyViewersStr, setMonthlyViewersStr] = useState("");
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);

  const idFrontInputRef = useRef<HTMLInputElement>(null);
  const idBackInputRef = useRef<HTMLInputElement>(null);

  const {
    data: appRes,
    isLoading: appLoading,
    isError: appQueryError,
    error: appQueryErr,
    isFetching: appFetching,
  } = useGetMyStreamerApplicationQuery();

  const [createApplication, { isLoading: submitting }] =
    useCreateStreamerApplicationMutation();

  useEffect(() => {
    return () => {
      if (idFrontPreview?.startsWith("blob:"))
        URL.revokeObjectURL(idFrontPreview);
      if (idBackPreview?.startsWith("blob:"))
        URL.revokeObjectURL(idBackPreview);
    };
  }, [idFrontPreview, idBackPreview]);

  const setFrontImage = (file: File | null) => {
    if (idFrontPreview?.startsWith("blob:"))
      URL.revokeObjectURL(idFrontPreview);
    setIdFrontFile(file);
    setIdFrontPreview(file ? URL.createObjectURL(file) : null);
  };

  const setBackImage = (file: File | null) => {
    if (idBackPreview?.startsWith("blob:"))
      URL.revokeObjectURL(idBackPreview);
    setIdBackFile(file);
    setIdBackPreview(file ? URL.createObjectURL(file) : null);
  };

  const platforms = [
    { id: "youtube", name: "YouTube", icon: <Youtube className="w-5 h-5" /> },
    { id: "tiktok", name: "TikTok", icon: <Video className="w-5 h-5" /> },
    {
      id: "facebook",
      name: "Facebook",
      icon: <Facebook className="w-5 h-5" />,
    },
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
    {
      id: 2,
      name: "Định danh & Xác nhận",
      icon: <IdCard className="w-4 h-4" />,
    },
  ];

  const benefits = [
    "Tỷ lệ chia sẻ doanh thu lên đến 90%",
    "Hỗ trợ kỹ thuật và marketing 24/7",
    "Hệ thống donate và quà tặng độc quyền",
    "Cơ hội tham gia các giải đấu chuyên nghiệp",
  ];

  const existing = appRes?.success ? appRes.data : undefined;

  const noApplicationYet = useMemo(() => {
    if (
      appRes?.success === true &&
      (appRes.data === undefined || appRes.data === null)
    )
      return true;
    if (
      appQueryError &&
      typeof appQueryErr === "object" &&
      appQueryErr !== null &&
      "status" in appQueryErr &&
      (appQueryErr as { status: number }).status === 404
    )
      return true;
    return false;
  }, [appRes, appQueryError, appQueryErr]);

  const applicationStatus = (existing?.status || "").toLowerCase();

  const buildPayload = (): {
    platform: StreamerPlatform;
    channelUrl: string;
    contentCategory: string;
    description: string;
    reasonForApplying: string;
    monthlyViewers?: number;
  } => {
    const apiPlatform = mapUiPlatformToApi(platform);
    const catLabel =
      categories.find((c) => c.id === category)?.name || category || "";
    let contentCategory = catLabel;
    if (category === "other" && otherCategory.trim()) {
      contentCategory = `${catLabel}: ${otherCategory.trim()}`;
    }
    contentCategory = contentCategory.slice(0, 100);

    let desc = description.trim();
    if (platform === "tiktok") {
      desc = `[Kênh TikTok] ${desc}`;
    }
    if (platform === "other" && otherPlatform.trim()) {
      desc = `[Nền tảng: ${otherPlatform.trim()}] ${desc}`;
    }
    desc = desc.slice(0, 1000);

    const viewers = parseInt(monthlyViewersStr.replace(/\D/g, ""), 10);
    const monthlyViewers =
      Number.isFinite(viewers) && viewers >= 0 ? viewers : 0;

    const idNote =
      idFrontFile && idBackFile
        ? "(Đã chọn ảnh CCCD trên form để đối chiếu — chỉ xem trước cục bộ, API đơn không nhận file.)"
        : "(Theo API hiện tại không gửi kèm file ảnh CCCD; có thể được yêu cầu bổ sung sau khi duyệt.)";

    const reasonForApplying = [
      "Đăng ký trở thành streamer trên XScan.",
      "",
      "Thông tin định danh:",
      `- Họ và tên: ${fullName.trim()}`,
      `- Địa chỉ thường trú: ${address.trim()}`,
      "",
      idNote,
    ]
      .join("\n")
      .slice(0, 1000);

    return {
      platform: apiPlatform,
      channelUrl: channelUrl.trim(),
      contentCategory,
      description: desc,
      reasonForApplying,
      monthlyViewers,
    };
  };

  const goStep2 = () => {
    setStep1Error(null);
    if (!platform) {
      setStep1Error("Vui lòng chọn nền tảng chính.");
      return;
    }
    if (platform === "other" && !otherPlatform.trim()) {
      setStep1Error("Vui lòng nhập tên nền tảng.");
      return;
    }
    if (!channelUrl.trim() || !isValidHttpUrl(channelUrl)) {
      setStep1Error("Vui lòng nhập URL kênh hợp lệ (http/https).");
      return;
    }
    if (!category) {
      setStep1Error("Vui lòng chọn danh mục nội dung.");
      return;
    }
    if (category === "other" && !otherCategory.trim()) {
      setStep1Error("Vui lòng nhập tên danh mục.");
      return;
    }
    if (description.trim().length < 20) {
      setStep1Error("Mô tả kênh cần ít nhất 20 ký tự.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!agreed) return;
    if (!fullName.trim() || !address.trim()) {
      setSubmitError("Vui lòng nhập đầy đủ họ tên và địa chỉ.");
      return;
    }
    try {
      const body = buildPayload();
      const result = await createApplication(body).unwrap();
      if (!result.success) {
        setSubmitError(
          result.message ||
            result.error?.message ||
            "Gửi đơn không thành công.",
        );
        return;
      }
      setIsSubmitted(true);
    } catch (e) {
      setSubmitError(getMutationError(e));
    }
  };

  if (appLoading || appFetching) {
    return (
      <div className="flex-1 bg-surface flex items-center justify-center p-8">
        <p className="text-outline text-sm font-mono tracking-widest uppercase">
          Đang tải trạng thái đơn...
        </p>
      </div>
    );
  }

  if (appQueryError && !noApplicationYet) {
    return (
      <div className="flex-1 bg-surface flex items-center justify-center p-8">
        <p className="text-red-400 text-sm text-center max-w-md">
          Không tải được đơn đăng ký. {getMutationError(appQueryErr)}
        </p>
      </div>
    );
  }

  if (
    existing?._id &&
    applicationStatus !== "rejected" &&
    applicationStatus !== "declined"
  ) {
    if (
      applicationStatus === "approved" ||
      applicationStatus === "active" ||
      applicationStatus === "accepted"
    ) {
      return (
        <div className="flex-1 bg-surface flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-surface-container-low border border-primary/30 p-12 text-center space-y-6 cut-corner"
          >
            <ShieldCheck className="w-14 h-14 text-primary mx-auto" />
            <h2 className="text-xl font-bold uppercase italic text-foreground">
              Bạn đã là Streamer
            </h2>
            <p className="text-outline text-sm">
              Đơn đăng ký của bạn đã được duyệt. Dùng menu hồ sơ và dashboard
              streamer để quản lý kênh.
            </p>
            <Button
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("navigate", { detail: "MATCHES" }),
                )
              }
              className="w-full h-12 bg-primary text-black font-bold tracking-widest rounded-none"
            >
              VỀ TRANG CHỦ
            </Button>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="flex-1 bg-surface flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-surface-container-low border border-outline-variant/20 p-12 text-center space-y-6 cut-corner"
        >
          <Users className="w-14 h-14 text-primary mx-auto" />
          <h2 className="text-xl font-bold uppercase italic text-foreground">
            Đơn đang chờ xét duyệt
          </h2>
          <p className="text-outline text-sm leading-relaxed">
            Bạn đã gửi đơn đăng ký streamer
            {existing.createdAt
              ? ` (${new Date(existing.createdAt).toLocaleString("vi-VN")})`
              : ""}
            . Hồ sơ đang được xử lý; kết quả sẽ được phản hồi qua email hoặc
            thông báo trên hệ thống.
          </p>
          {existing.reviewNotes ? (
            <p className="text-[11px] font-mono text-outline border border-outline-variant/20 p-3 text-left">
              {existing.reviewNotes}
            </p>
          ) : null}
          <Button
            variant="outline"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("navigate", { detail: "MATCHES" }),
              )
            }
            className="w-full h-12 font-bold tracking-widest rounded-none"
          >
            VỀ TRANG CHỦ
          </Button>
        </motion.div>
      </div>
    );
  }

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
            <h2 className="text-2xl font-bold tracking-tight text-foreground uppercase italic">
              ĐƠN ĐÃ ĐƯỢC GỬI THÀNH CÔNG
            </h2>
            <p className="text-outline text-sm leading-relaxed">
              Cảm ơn bạn đã tin tưởng và đăng ký trở thành Streamer trên hệ
              thống XScan. Hồ sơ của bạn đã được chuyển đến bộ phận xét duyệt và
              sẽ được phản hồi trong vòng 24–48 giờ tới.
            </p>
          </div>
          <Button
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("navigate", { detail: "MATCHES" }),
              )
            }
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
        {existing?._id &&
        (applicationStatus === "rejected" ||
          applicationStatus === "declined") ? (
          <div className="rounded-[12px] border border-red-400/30 bg-red-400/5 px-4 py-3 text-sm text-red-300">
            <p className="font-bold uppercase tracking-widest text-[10px] mb-1">
              Đơn trước đã bị từ chối — bạn có thể gửi lại
            </p>
            {existing.reviewNotes ? (
              <p className="text-outline text-xs font-mono">
                {existing.reviewNotes}
              </p>
            ) : null}
          </div>
        ) : null}

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
              Khởi đầu hành trình chuyên nghiệp của bạn cùng hệ thống stream
              hàng đầu. Tận hưởng các đặc quyền và công cụ hỗ trợ tối tân nhất.
            </p>
          </motion.div>

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
                    type="button"
                    onClick={() => setStep(s.id)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all relative z-10 ${
                      step >= s.id
                        ? "bg-primary border-primary text-black shadow-[0_0_15px_rgba(255,184,0,0.3)]"
                        : "bg-surface-container-low border-surface-container-highest text-outline"
                    }`}
                  >
                    {s.icon}
                  </button>
                  <span
                    className={`text-[10px] font-bold tracking-widest uppercase ${step >= s.id ? "text-primary" : "text-outline"}`}
                  >
                    {s.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </header>

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
                  <section className="space-y-8">
                    <div className="flex items-center gap-3 border-l-4 border-primary pl-4">
                      <h2 className="text-xl font-bold tracking-tight uppercase">
                        Thông tin kênh & Nội dung
                      </h2>
                    </div>

                    {step1Error ? (
                      <p className="text-[11px] font-mono text-red-400 border border-red-400/30 bg-red-400/5 px-3 py-2">
                        {step1Error}
                      </p>
                    ) : null}

                    <div className="space-y-6">
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-outline uppercase tracking-widest">
                          Chọn nền tảng chính
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                          {platforms.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setPlatform(p.id)}
                              className={`flex flex-col items-center justify-center p-4 rounded-[12px] border transition-all gap-3 group ${
                                platform === p.id
                                  ? "bg-primary border-primary text-black shadow-[0_0_15px_rgba(255,184,0,0.2)]"
                                  : "bg-surface-container-highest/20 border-outline-variant/10 text-outline hover:border-primary/50 hover:text-primary"
                              }`}
                            >
                              <div
                                className={`transition-transform group-hover:scale-110 ${platform === p.id ? "text-black" : "text-primary"}`}
                              >
                                {p.icon}
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-widest">
                                {p.name}
                              </span>
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
                                <label className="text-[9px] font-bold text-primary uppercase tracking-widest">
                                  Tên nền tảng khác
                                </label>
                                <Input
                                  placeholder="Nhập tên nền tảng của bạn..."
                                  value={otherPlatform}
                                  onChange={(e) =>
                                    setOtherPlatform(e.target.value)
                                  }
                                  className="h-12 bg-surface-container-highest/30 border-outline-variant/10 rounded-[12px] focus:ring-primary/50"
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-outline uppercase tracking-widest">
                            URL Kênh
                          </label>
                          <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                            <Input
                              placeholder="https://..."
                              value={channelUrl}
                              onChange={(e) => setChannelUrl(e.target.value)}
                              className="pl-12 h-12 bg-surface-container-highest/30 border-outline-variant/10 rounded-[12px]"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-outline uppercase tracking-widest">
                            Lượt xem ước tính / tháng (tuỳ chọn)
                          </label>
                          <Input
                            placeholder="VD: 5000 — để trống = 0"
                            value={monthlyViewersStr}
                            onChange={(e) =>
                              setMonthlyViewersStr(e.target.value)
                            }
                            inputMode="numeric"
                            className="h-12 bg-surface-container-highest/30 border-outline-variant/10 rounded-[12px]"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-outline uppercase tracking-widest">
                          Danh mục nội dung
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {categories.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setCategory(c.id)}
                              className={`px-3 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${
                                category === c.id
                                  ? "bg-primary border-primary text-black"
                                  : "bg-surface-container-highest/20 border-outline-variant/10 text-outline hover:border-primary/50"
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
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-2 space-y-2">
                                <label className="text-[9px] font-bold text-primary uppercase tracking-widest">
                                  Tên danh mục khác
                                </label>
                                <Input
                                  placeholder="Nhập danh mục của bạn..."
                                  value={otherCategory}
                                  onChange={(e) =>
                                    setOtherCategory(e.target.value)
                                  }
                                  className="h-10 bg-surface-container-highest/30 border-outline-variant/10 rounded-[12px] focus:ring-primary/50"
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-outline uppercase tracking-widest">
                          Mô tả kênh & Phong cách stream
                        </label>
                        <Textarea
                          placeholder="Hãy cho chúng tôi biết về phong cách stream của bạn..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="min-h-[120px] bg-surface-container-highest/30 border-outline-variant/10 rounded-[12px] focus:ring-primary/50"
                        />
                      </div>
                    </div>
                  </section>
                  <div className="flex justify-end pt-8">
                    <Button
                      type="button"
                      onClick={goStep2}
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
                  <section className="space-y-8">
                    <div className="flex items-center gap-3 border-l-4 border-primary pl-4">
                      <h2 className="text-xl font-bold tracking-tight uppercase">
                        Thông tin định danh
                      </h2>
                    </div>

                    {submitError ? (
                      <p className="text-[11px] font-mono text-red-400 border border-red-400/30 bg-red-400/5 px-3 py-2">
                        {submitError}
                      </p>
                    ) : null}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-outline uppercase tracking-widest">
                          Họ và tên
                        </label>
                        <Input
                          placeholder="Nhập họ và tên thật..."
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="h-12 bg-surface-container-highest/30 border-outline-variant/10 rounded-[12px]"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-outline uppercase tracking-widest">
                          Quê quán / Địa chỉ
                        </label>
                        <Input
                          placeholder="Nhập địa chỉ thường trú..."
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="h-12 bg-surface-container-highest/30 border-outline-variant/10 rounded-[12px]"
                        />
                      </div>
                    </div>

                    <p className="text-[10px] font-mono text-outline border border-outline-variant/10 rounded-[12px] p-4">
                      Ảnh CCCD dùng để đối chiếu trên form (xem trước trên trình duyệt). Đơn gửi đi chỉ gồm
                      dữ liệu JSON theo API — không đính kèm file ảnh.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="group relative bg-surface-container-highest/20 border-2 border-dashed border-outline-variant/30 hover:border-primary/40 p-4 rounded-[12px] flex flex-col items-stretch text-center space-y-3 transition-colors">
                        <input
                          ref={idFrontInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = "";
                            if (!f) return;
                            const err = validateIdImageFile(f);
                            if (err) {
                              setSubmitError(err);
                              return;
                            }
                            setSubmitError(null);
                            setFrontImage(f);
                          }}
                        />
                        <div className="flex items-center justify-between gap-2 px-1">
                          <p className="font-bold text-xs uppercase tracking-wider text-left">
                            Mặt trước CCCD
                          </p>
                          <IdCard className="w-6 h-6 text-primary shrink-0" />
                        </div>
                        <div className="relative w-full aspect-[4/3] rounded-[8px] overflow-hidden bg-surface-container border border-outline-variant/20">
                          {idFrontPreview ? (
                            <img
                              src={idFrontPreview}
                              alt="CCCD mặt trước"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-outline font-mono px-2">
                              Chưa có ảnh
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 justify-center flex-wrap">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-[8px] border-primary/40 hover:bg-primary/10"
                            onClick={() => idFrontInputRef.current?.click()}
                          >
                            <Upload className="w-3 h-3 mr-2" />
                            {idFrontFile ? "Đổi ảnh" : "Tải ảnh"}
                          </Button>
                          {idFrontFile ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="rounded-[8px] text-outline"
                              onClick={() => setFrontImage(null)}
                            >
                              Xóa
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      <div className="group relative bg-surface-container-highest/20 border-2 border-dashed border-outline-variant/30 hover:border-primary/40 p-4 rounded-[12px] flex flex-col items-stretch text-center space-y-3 transition-colors">
                        <input
                          ref={idBackInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = "";
                            if (!f) return;
                            const err = validateIdImageFile(f);
                            if (err) {
                              setSubmitError(err);
                              return;
                            }
                            setSubmitError(null);
                            setBackImage(f);
                          }}
                        />
                        <div className="flex items-center justify-between gap-2 px-1">
                          <p className="font-bold text-xs uppercase tracking-wider text-left">
                            Mặt sau CCCD
                          </p>
                          <IdCard className="w-6 h-6 text-primary shrink-0 rotate-180" />
                        </div>
                        <div className="relative w-full aspect-[4/3] rounded-[8px] overflow-hidden bg-surface-container border border-outline-variant/20">
                          {idBackPreview ? (
                            <img
                              src={idBackPreview}
                              alt="CCCD mặt sau"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-outline font-mono px-2">
                              Chưa có ảnh
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 justify-center flex-wrap">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-[8px] border-primary/40 hover:bg-primary/10"
                            onClick={() => idBackInputRef.current?.click()}
                          >
                            <Upload className="w-3 h-3 mr-2" />
                            {idBackFile ? "Đổi ảnh" : "Tải ảnh"}
                          </Button>
                          {idBackFile ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="rounded-[8px] text-outline"
                              onClick={() => setBackImage(null)}
                            >
                              Xóa
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-outline-variant/10">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="terms"
                          checked={agreed}
                          onCheckedChange={(v) => setAgreed(v === true)}
                          className="w-5 h-5 rounded-[4px] border-outline-variant/30 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                        />
                        <label
                          htmlFor="terms"
                          className="text-xs font-medium text-foreground/80 cursor-pointer select-none"
                        >
                          Tôi đồng ý với các{" "}
                          <span className="text-primary hover:underline">
                            điều khoản dành cho Streamer
                          </span>{" "}
                          và cam kết thông tin trên là chính xác.
                        </label>
                      </div>
                    </div>
                  </section>

                  <div className="flex justify-between pt-8 gap-4 flex-wrap">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setStep(1)}
                      className="h-14 px-8 text-outline hover:text-primary font-bold text-sm tracking-[0.2em] group"
                    >
                      <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                      QUAY LẠI
                    </Button>
                    <Button
                      type="button"
                      disabled={!agreed || submitting}
                      onClick={handleSubmit}
                      className="h-14 px-8 bg-primary hover:bg-primary-fixed-dim text-black font-bold text-sm tracking-[0.2em] rounded-[12px] shadow-[0_0_20px_rgba(255,184,0,0.2)] group"
                    >
                      {submitting ? "ĐANG GỬI ĐƠN..." : "GỬI ĐƠN XÉT DUYỆT"}
                      <Zap className="ml-2 w-4 h-4 group-hover:scale-110 transition-transform" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-outline">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] font-bold tracking-widest uppercase">
            Hệ thống bảo mật dữ liệu cấp cao // XScan Intel Protocol
          </span>
        </div>
      </div>
    </div>
  );
}
