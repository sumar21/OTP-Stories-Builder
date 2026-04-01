import { useCallback, useEffect, useRef, useState } from "react";
import { formatToDayMonth } from "@/lib/date";
import type { ParticipantCard, VoucherPatch, VoucherPosition } from "@/lib/types";

type ParticipantsSlideRendererProps = {
  card: ParticipantCard;
  onVoucherUpdate?: (patch: VoucherPatch) => void;
};

const RESULT_LABEL: Record<ParticipantCard["resultado"], string> = {
  campeones: "CAMPEONES",
  subcampeones: "SUBCAMPEONES",
};

const CUP_LABEL: Record<ParticipantCard["copa"], string> = {
  oro: "Copa Oro",
  plata: "Copa Plata",
};

const CUP_TAG_SRC: Record<ParticipantCard["copa"], string> = {
  oro: "/tags/copa-oro.svg",
  plata: "/tags/copa-plata.svg",
};

const OTP_LOGO_SRC = "/logos/otp-logo.svg";
const CUP_TAG_HEIGHT = 36;
const MIN_SIZE = 24;
const MAX_SIZE = 140;

type GestureState = {
  initialDistance: number;
  initialAngle: number;
  initialSize: number;
  initialRotation: number;
};

const getTwoFingerInfo = (a: PointerEvent | React.PointerEvent, b: PointerEvent | React.PointerEvent) => {
  const dx = b.clientX - a.clientX;
  const dy = b.clientY - a.clientY;
  return {
    distance: Math.hypot(dx, dy),
    angle: Math.atan2(dy, dx) * (180 / Math.PI),
    midX: (a.clientX + b.clientX) / 2,
    midY: (a.clientY + b.clientY) / 2,
  };
};

type LocalVoucherState = {
  pos: VoucherPosition;
  size: number;
  rotation: number;
};

export function ParticipantsSlideRenderer({ card, onVoucherUpdate }: ParticipantsSlideRendererProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const rafRef = useRef(0);
  const callbackRef = useRef(onVoucherUpdate);
  callbackRef.current = onVoucherUpdate;

  // Multi-touch tracking
  const pointersRef = useRef<Map<number, PointerEvent>>(new Map());
  const gestureRef = useRef<GestureState | null>(null);

  // Local state during gestures — avoids parent re-renders
  const [local, setLocal] = useState<LocalVoucherState | null>(null);

  const cardPos = card.valorVoucherPos;
  const cardSize = card.valorVoucherSize;
  const cardRot = card.valorVoucherRotation;

  // Clear local state once parent catches up
  useEffect(() => {
    if (local && !draggingRef.current && pointersRef.current.size === 0) {
      setLocal(null);
    }
  }, [cardPos, cardSize, cardRot, local]);

  const formattedDate = formatToDayMonth(card.fecha);
  const topLabel = `${RESULT_LABEL[card.resultado]} | ${formattedDate || "--/--"}`;
  const playersLabel = `${card.nombreParticipante1 || "--"} | ${card.nombreParticipante2 || "--"}`;
  const categoryLabel = card.categoria.trim() || "--";
  const categoryFontClass =
    categoryLabel.length <= 2
      ? "text-[44px]"
      : categoryLabel.length <= 4
        ? "text-[28px]"
        : categoryLabel.length <= 6
          ? "text-[20px]"
          : "text-[16px]";

  const showVoucher = (card.valorVoucher ?? "").trim().length > 0;

  const calcPosition = useCallback(
    (clientX: number, clientY: number): VoucherPosition | null => {
      const el = containerRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
      return { x, y };
    },
    [],
  );

  const commitToParent = useCallback((state: LocalVoucherState) => {
    if (callbackRef.current) {
      callbackRef.current({
        valorVoucherPos: state.pos,
        valorVoucherSize: state.size,
        valorVoucherRotation: state.rotation,
      });
    }
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const pointers = pointersRef.current;

      // Update stored pointer
      if (pointers.has(e.pointerId)) {
        pointers.set(e.pointerId, e);
      }

      // Single finger drag
      if (draggingRef.current && pointers.size === 1) {
        e.preventDefault();
        const clientX = e.clientX;
        const clientY = e.clientY;

        if (rafRef.current) return;
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = 0;
          if (!draggingRef.current) return;
          const pos = calcPosition(clientX, clientY);
          if (pos) setLocal((prev) => ({ pos, size: prev?.size ?? cardSize, rotation: prev?.rotation ?? cardRot }));
        });
        return;
      }

      // Two finger pinch/rotate — only size and rotation, position stays fixed
      if (pointers.size === 2) {
        e.preventDefault();
        const [pA, pB] = Array.from(pointers.values());
        const info = getTwoFingerInfo(pA, pB);

        if (!gestureRef.current) {
          gestureRef.current = {
            initialDistance: info.distance,
            initialAngle: info.angle,
            initialSize: local?.size ?? cardSize,
            initialRotation: local?.rotation ?? cardRot,
          };
          return;
        }

        if (rafRef.current) return;
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = 0;
          const gesture = gestureRef.current;
          if (!gesture || pointers.size !== 2) return;

          const scale = info.distance / gesture.initialDistance;
          const newSize = Math.round(Math.max(MIN_SIZE, Math.min(MAX_SIZE, gesture.initialSize * scale)));

          let angleDelta = info.angle - gesture.initialAngle;
          if (angleDelta > 180) angleDelta -= 360;
          if (angleDelta < -180) angleDelta += 360;
          const newRotation = Math.round(Math.max(-180, Math.min(180, gesture.initialRotation + angleDelta)));

          setLocal((prev) => ({
            pos: prev?.pos ?? cardPos,
            size: newSize,
            rotation: newRotation,
          }));
        });
      }
    };

    const onUp = (e: PointerEvent) => {
      const pointers = pointersRef.current;
      pointers.delete(e.pointerId);

      // If we go from 2→1 fingers, reset gesture but keep dragging
      if (pointers.size === 1) {
        gestureRef.current = null;
        return;
      }

      // All fingers up
      if (pointers.size === 0) {
        draggingRef.current = false;
        gestureRef.current = null;
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = 0;
        }
        // Commit to parent
        setLocal((prev) => {
          if (prev) commitToParent(prev);
          return prev;
        });
      }
    };

    document.addEventListener("pointermove", onMove, { passive: false });
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [calcPosition, commitToParent, cardSize, cardRot, cardPos, local]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!callbackRef.current) return;
      e.preventDefault();
      e.stopPropagation();

      pointersRef.current.set(e.pointerId, e.nativeEvent);

      // Only start drag positioning on first finger
      if (pointersRef.current.size === 1) {
        draggingRef.current = true;
      }
      // Second finger: stop position drag, gesture will start on next move
      if (pointersRef.current.size === 2) {
        draggingRef.current = false;
        gestureRef.current = null;
      }
    },
    [],
  );

  // Desktop: wheel = size, shift+wheel = rotation
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!callbackRef.current) return;
      e.preventDefault();
      e.stopPropagation();

      const currentSize = local?.size ?? cardSize;
      const currentRotation = local?.rotation ?? cardRot;
      const currentPos = local?.pos ?? cardPos;

      if (e.shiftKey) {
        // Rotation
        const delta = e.deltaY > 0 ? 3 : -3;
        const newRotation = Math.max(-180, Math.min(180, currentRotation + delta));
        const newState = { pos: currentPos, size: currentSize, rotation: newRotation };
        setLocal(newState);
        commitToParent(newState);
      } else {
        // Size
        const delta = e.deltaY > 0 ? -4 : 4;
        const newSize = Math.max(MIN_SIZE, Math.min(MAX_SIZE, currentSize + delta));
        const newState = { pos: currentPos, size: newSize, rotation: currentRotation };
        setLocal(newState);
        commitToParent(newState);
      }
    },
    [commitToParent, cardSize, cardRot, cardPos, local],
  );

  // Active display values
  const activePos = local?.pos ?? cardPos;
  const activeSize = local?.size ?? cardSize;
  const activeRotation = local?.rotation ?? cardRot;

  return (
    <div ref={containerRef} className="relative size-full overflow-hidden bg-[#0b38d6] text-[#f5f7ff]">
      {card.fotoDataUrl ? (
        <img
          src={card.fotoDataUrl}
          alt="Participantes del torneo"
          className="absolute inset-0 size-full object-cover"
          loading="eager"
          decoding="sync"
          draggable={false}
        />
      ) : null}

      {showVoucher ? (
        <div
          className={`absolute z-20 select-none ${onVoucherUpdate ? "cursor-grab active:cursor-grabbing" : ""}`}
          style={{
            left: `${activePos.x}%`,
            top: `${activePos.y}%`,
            transform: `translate(-50%, -50%) rotate(${activeRotation ?? 0}deg)`,
            touchAction: onVoucherUpdate ? "none" : undefined,
          }}
          onPointerDown={onVoucherUpdate ? handlePointerDown : undefined}
          onWheel={onVoucherUpdate ? handleWheel : undefined}
        >
          <span
            className="whitespace-nowrap font-extrabold tracking-[-0.02em] text-black"
            style={{ fontSize: `${activeSize}px` }}
          >
            ${card.valorVoucher}
          </span>
        </div>
      ) : null}

      <div className="absolute inset-x-[34px] bottom-[34px]" data-testid="participants-card-shell">
        <div
          aria-hidden
          data-testid="participants-card-shadow"
          className="pointer-events-none absolute inset-x-[18px] -bottom-[12px] h-[28px] rounded-full bg-[rgba(3,10,42,0.5)] blur-[14px]"
        />

        <div
          className="relative z-10 grid h-[135px] grid-cols-[98px_minmax(0,1fr)_132px] items-center gap-[10px] rounded-[20px] border border-[#4268EB] bg-[#0B38D6] px-[11px] py-[11px]"
          data-testid="participants-card"
        >
          <div className="flex h-[80px] w-[80px] items-center justify-center justify-self-center self-center rounded-[10px] bg-[var(--otp-lime)]">
            <span
              className={`max-w-full px-[4px] text-center leading-none font-extrabold tracking-[-0.03em] text-[#1d42d2] ${categoryFontClass}`}
            >
              {categoryLabel}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-[7px]">
              <p className="otp-text-clamp-1 text-[31px] leading-none font-medium tracking-[-0.02em] text-[#98acef]">{topLabel}</p>
              <img
                src={CUP_TAG_SRC[card.copa]}
                alt={CUP_LABEL[card.copa]}
                className="w-auto shrink-0"
                style={{ height: `${CUP_TAG_HEIGHT}px` }}
                loading="eager"
                decoding="sync"
                fetchPriority="high"
                draggable={false}
              />
            </div>
            <p className="otp-text-clamp-1 mt-[8px] text-[36px] leading-[1.02] font-medium tracking-[-0.02em] text-[#f2f4ff]">
              {playersLabel}
            </p>
          </div>

          <div className="flex h-full items-center justify-center">
            <img
              src={OTP_LOGO_SRC}
              alt="OTP"
              className="h-[104px] w-[104px] object-contain"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
