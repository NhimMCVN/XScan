import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DonationAlert } from "@/src/hooks/useWidgetWebSocket";
import type {
  WidgetAnimationSettings,
  WidgetDisplaySettings,
  WidgetImageSettings,
  WidgetPositionSettings,
  WidgetSoundSettings,
  WidgetStyleSettings,
} from "@/src/redux/queries/public.api";

export type WidgetAlertSettings = {
  animationSettings?: WidgetAnimationSettings;
  displaySettings?: WidgetDisplaySettings;
  imageSettings?: WidgetImageSettings;
  soundSettings?: WidgetSoundSettings;
  styleSettings?: WidgetStyleSettings;
  donationLevels?: any[];
  positionSettings?: WidgetPositionSettings;
};

type Props = {
  alert: DonationAlert;
  settings: WidgetAlertSettings | undefined;
  donationLevels: any[] | undefined;
  onDismiss: (id: string) => void;
};

function formatAmount(amount: number, currency: string) {
  if (currency === "VND") {
    return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function findMatchingLevel(amount: number, levels: any[] | undefined) {
  if (!levels?.length) return null;
  return levels
    .filter((l: any) => l.isEnabled !== false)
    .sort((a: any, b: any) => (b.minAmount ?? 0) - (a.minAmount ?? 0))
    .find(
      (l: any) =>
        amount >= (l.minAmount ?? 0) &&
        amount <= (l.maxAmount ?? Infinity),
    );
}

function buildTextShadow(s: WidgetStyleSettings | undefined): string | undefined {
  if (!s?.textShadow) return undefined;
  const x = s.textShadowOffsetX ?? 1;
  const y = s.textShadowOffsetY ?? 1;
  const blur = s.textShadowBlur ?? 3;
  const color = s.textShadowColor ?? "#000000";
  return `${x}px ${y}px ${blur}px ${color}`;
}

function buildBoxShadow(img: WidgetImageSettings | undefined): string | undefined {
  if (!img?.shadow) return undefined;
  const x = img.shadowOffsetX ?? 2;
  const y = img.shadowOffsetY ?? 2;
  const blur = img.shadowBlur ?? 10;
  const color = img.shadowColor ?? "#000000";
  return `${x}px ${y}px ${blur}px ${color}`;
}

function getAnimationTransform(
  phase: string,
  anim: WidgetAnimationSettings | undefined,
): CSSProperties {
  const type = anim?.animationType ?? "fade";
  const zoom = anim?.zoomScale ?? 1.2;

  if (phase === "visible") {
    return { opacity: 1, transform: "translate(0, 0) scale(1)" };
  }

  const isEnter = phase === "enter";

  switch (type) {
    case "slide": {
      const dir = anim?.direction ?? "right";
      const offset = isEnter ? 80 : -80;
      const tx = dir === "left" ? -offset : dir === "right" ? offset : 0;
      const ty = dir === "up" ? -offset : dir === "down" ? offset : 0;
      return {
        opacity: isEnter ? 0 : 0,
        transform: `translate(${tx}px, ${ty}px) scale(1)`,
      };
    }
    case "zoom":
      return {
        opacity: isEnter ? 0 : 0,
        transform: `translate(0, 0) scale(${isEnter ? zoom : 0.8})`,
      };
    case "bounce":
      return {
        opacity: isEnter ? 0 : 0,
        transform: `translate(0, ${isEnter ? 40 : -40}px) scale(${isEnter ? 0.8 : 0.9})`,
      };
    case "fade":
    default:
      return { opacity: 0, transform: "translate(0, 0) scale(1)" };
  }
}

export default function AlertOverlay({
  alert,
  settings,
  donationLevels,
  onDismiss,
}: Props) {
  const [phase, setPhase] = useState<"enter" | "visible" | "exit" | "done">(
    "enter",
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const anim = settings?.animationSettings;
  const display = settings?.displaySettings;
  const imgSettings = settings?.imageSettings;
  const sndSettings = settings?.soundSettings;
  const style = settings?.styleSettings;

  const isMatchTarget = alert.kind === "match_target_reached";

  const level = findMatchingLevel(alert.amount ?? 0, donationLevels);
  const levelCfg = (level?.configuration || {}) as any;

  const imageUrl =
    alert.userMediaUrl ||
    levelCfg?.imageSettings?.url ||
    imgSettings?.url;

  const soundUrl =
    alert.userSoundUrl ||
    levelCfg?.soundSettings?.url ||
    sndSettings?.url;

  const soundVolume =
    levelCfg?.soundSettings?.volume ?? sndSettings?.volume ?? 80;

  const displayDuration = display?.duration ?? 5000;
  const fadeInDuration = display?.fadeInDuration ?? anim?.duration ?? 500;
  const fadeOutDuration = display?.fadeOutDuration ?? anim?.duration ?? 300;

  const dismiss = useCallback(() => {
    if (phase === "done") return;
    setPhase("exit");
    setTimeout(() => {
      setPhase("done");
      onDismiss(alert.id!);
    }, fadeOutDuration);
  }, [alert.id, onDismiss, phase, fadeOutDuration]);

  useEffect(() => {
    requestAnimationFrame(() => setPhase("visible"));
  }, []);

  useEffect(() => {
    if (phase === "visible") {
      timerRef.current = setTimeout(dismiss, displayDuration);
      return () => clearTimeout(timerRef.current);
    }
  }, [phase, displayDuration, dismiss]);

  useEffect(() => {
    if (!soundUrl || sndSettings?.enabled === false) return;
    const audio = new Audio(soundUrl);
    audio.volume = Math.min(1, Math.max(0, soundVolume / 100));
    audio.loop = sndSettings?.loop ?? false;
    void audio.play().catch(() => {});
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [soundUrl, soundVolume, sndSettings?.enabled, sndSettings?.loop]);

  if (phase === "done") return null;

  const animTransform = getAnimationTransform(phase, anim);
  const transitionDuration =
    phase === "exit" ? fadeOutDuration : fadeInDuration;
  const easing = anim?.easing ?? "ease-out";

  const isVideo = imageUrl && /\.(mp4|webm)$/i.test(imageUrl);

  const textShadow = buildTextShadow(style);
  const imgBoxShadow = buildBoxShadow(imgSettings);

  const bgColor = style?.backgroundColor ?? "#1a1a1a";
  const textColor = style?.textColor ?? "#ffffff";
  const accentColor = style?.accentColor ?? "#F6BD2A";
  const borderColor = style?.borderColor ?? "#333333";
  const borderWidth = style?.borderWidth ?? 2;
  const borderStyle = style?.borderStyle ?? "solid";
  const fontFamily =
    style?.fontFamily ??
    "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif";
  const fontSize = style?.fontSize ?? 16;

  const imgWidth = imgSettings?.width ?? 300;
  const imgHeight = imgSettings?.height ?? 200;
  const imgBorderRadius = imgSettings?.borderRadius ?? 8;

  return (
    <div
      style={{
        ...animTransform,
        transition: `all ${transitionDuration}ms ${easing}`,
        fontFamily,
      }}
    >
      <div className="flex flex-col items-center">
        {imageUrl && imgSettings?.enabled !== false && (
          <div className="mb-3 flex justify-center">
            {isVideo ? (
              <video
                src={imageUrl}
                autoPlay
                loop
                muted
                playsInline
                style={{
                  maxWidth: imgWidth,
                  maxHeight: imgHeight,
                  borderRadius: imgBorderRadius,
                  boxShadow: imgBoxShadow,
                  objectFit: "contain",
                }}
              />
            ) : (
              <img
                src={imageUrl}
                alt=""
                style={{
                  maxWidth: imgWidth,
                  maxHeight: imgHeight,
                  borderRadius: imgBorderRadius,
                  boxShadow: imgBoxShadow,
                  objectFit: "contain",
                }}
              />
            )}
          </div>
        )}

        <div
          style={{
            backgroundColor: bgColor,
            color: textColor,
            border: `${borderWidth}px ${borderStyle} ${borderColor}`,
            borderRadius: 16,
            padding: "20px 32px",
            textAlign: "center",
            backdropFilter: "blur(12px)",
            boxShadow: `0 0 60px ${accentColor}26`,
            textShadow,
            fontSize,
          }}
        >
          {isMatchTarget ? (
            <>
              <div
                style={{
                  color: accentColor,
                  fontSize: fontSize * 1.25,
                  fontWeight: 800,
                  marginBottom: 8,
                  filter: `drop-shadow(0 0 12px ${accentColor}80)`,
                }}
              >
                {alert.matchTitle || "Match"}
              </div>
              <div
                style={{
                  color: textColor,
                  fontSize: fontSize * 1.35,
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                Pool:{" "}
                {formatAmount(
                  alert.poolTotal ?? alert.amount ?? 0,
                  alert.currency ?? "VND",
                )}
              </div>
              <div
                style={{
                  color: `${textColor}99`,
                  fontSize: fontSize * 0.8,
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Mục tiêu match đã đạt
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  color: accentColor,
                  fontSize: fontSize * 1.5,
                  fontWeight: 800,
                  marginBottom: 4,
                  filter: `drop-shadow(0 0 12px ${accentColor}80)`,
                }}
              >
                {formatAmount(alert.amount ?? 0, alert.currency ?? "VND")}
              </div>

              <div
                style={{
                  color: textColor,
                  fontSize: fontSize * 1.125,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                {alert.donorName || "Ẩn danh"}
              </div>

              {alert.message && (
                <div
                  style={{
                    color: `${textColor}cc`,
                    fontSize: fontSize * 0.875,
                    lineHeight: 1.6,
                    maxWidth: 360,
                  }}
                >
                  {alert.message}
                </div>
              )}
            </>
          )}

          {!isMatchTarget && level && (
            <div
              style={{
                display: "inline-block",
                marginTop: 8,
                backgroundColor: `${accentColor}33`,
                color: accentColor,
                borderRadius: 9999,
                padding: "2px 12px",
                fontSize: fontSize * 0.75,
                fontWeight: 600,
              }}
            >
              {level.levelName}
            </div>
          )}
        </div>

        {display?.showProgress && (
          <ProgressBar
            duration={displayDuration}
            color={display.progressColor ?? accentColor}
            height={display.progressHeight ?? 3}
            active={phase === "visible"}
          />
        )}
      </div>
    </div>
  );
}

function ProgressBar({
  duration,
  color,
  height,
  active,
}: {
  duration: number;
  color: string;
  height: number;
  active: boolean;
}) {
  return (
    <div
      style={{
        width: "100%",
        height,
        backgroundColor: `${color}33`,
        borderRadius: height,
        marginTop: 8,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          backgroundColor: color,
          borderRadius: height,
          width: active ? "0%" : "0%",
          animation: active
            ? `progress-shrink ${duration}ms linear forwards`
            : undefined,
        }}
      />
      <style>{`
        @keyframes progress-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
