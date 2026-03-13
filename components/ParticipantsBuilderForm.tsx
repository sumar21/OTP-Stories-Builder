"use client";

import { ArrowDown, ArrowUp, CalendarDays, ImagePlus, Medal, Trash2, Trophy } from "lucide-react";
import { CATEGORY_OPTIONS } from "@/lib/tournamentOptions";
import { buildDefaultParticipantCard } from "@/lib/defaultPostData";
import type { ParticipantCard, ParticipantsPost, ValidationError } from "@/lib/types";

type ParticipantsBuilderFormProps = {
  data: ParticipantsPost;
  onChange: (next: ParticipantsPost) => void;
  onReset: () => void;
  errors: ValidationError[];
};

const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
};

const RESULT_OPTIONS: { value: ParticipantCard["resultado"]; label: string }[] = [
  { value: "campeones", label: "Campeones" },
  { value: "subcampeones", label: "Subcampeones" },
];

const CUP_OPTIONS: { value: ParticipantCard["copa"]; label: string }[] = [
  { value: "oro", label: "Copa Oro" },
  { value: "plata", label: "Copa Plata" },
];

const reorder = <T,>(list: T[], from: number, to: number): T[] => {
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
};

const toggleButtonClass = (selected: boolean) =>
  `flex h-[50px] w-full items-center justify-center rounded-xl border px-3 text-center text-[14px] font-semibold leading-tight transition ${
    selected
      ? "border-[var(--otp-lime)] bg-[var(--otp-lime)] text-[var(--otp-blue)] shadow-[0_10px_24px_rgba(201,253,46,0.22)]"
      : "border-white/15 bg-white/[0.06] text-white/90 hover:bg-white/[0.1]"
  }`;

const controlPanelClass =
  "min-w-0 rounded-2xl border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4 backdrop-blur-sm";

const controlTitleClass = "inline-flex items-center gap-2 text-[13px] font-semibold tracking-[0.08em] text-white/88 uppercase";
const controlHintClass = "mt-1.5 text-[11px] leading-[1.4] text-white/58";

export function ParticipantsBuilderForm({ data, onChange, onReset, errors }: ParticipantsBuilderFormProps) {
  const updateCards = (updater: (cards: ParticipantCard[]) => ParticipantCard[]) => {
    onChange({ ...data, cards: updater(data.cards) });
  };

  const updateCard = (cardId: string, patch: Partial<ParticipantCard>) => {
    updateCards((cards) => cards.map((card) => (card.id === cardId ? { ...card, ...patch } : card)));
  };

  const addCard = () => {
    updateCards((cards) => [...cards, buildDefaultParticipantCard()]);
  };

  const removeCard = (cardId: string) => {
    updateCards((cards) => cards.filter((card) => card.id !== cardId));
  };

  const moveCard = (cardId: string, direction: "up" | "down") => {
    updateCards((cards) => {
      const index = cards.findIndex((card) => card.id === cardId);
      if (index < 0) {
        return cards;
      }
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= cards.length) {
        return cards;
      }
      return reorder(cards, index, target);
    });
  };

  const uploadPhoto = async (cardId: string, file: File | undefined) => {
    if (!file) {
      return;
    }
    const fotoDataUrl = await readFileAsDataUrl(file);
    updateCard(cardId, { fotoDataUrl });
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Participantes del torneo</h2>
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 transition hover:bg-white/20"
          >
            Restablecer todo
          </button>
        </div>
        <p className="mt-2 text-xs text-white/75">Formato fijo: Posteo 1080x1350.</p>
      </section>

      <section className="space-y-4 rounded-2xl border border-white/15 bg-white/8 p-4 md:p-5 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold text-white md:text-lg">Tarjetas</h3>
          <button
            type="button"
            onClick={addCard}
            className="rounded-xl border border-[var(--otp-lime)] bg-[var(--otp-lime)] px-4 py-2 text-sm font-semibold text-[var(--otp-blue)] shadow-[0_12px_24px_rgba(201,253,46,0.15)] transition hover:brightness-105"
          >
            + Agregar tarjeta
          </button>
        </div>

        <div className="space-y-4">
          {data.cards.map((card, cardIndex) => (
            <article
              key={card.id}
              className="rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(10,42,143,0.7),rgba(7,28,103,0.75))] p-4 md:p-5"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xl font-semibold tracking-[-0.02em] text-white md:text-2xl">Tarjeta {cardIndex + 1}</h4>
                  <p className="mt-1 text-sm text-white/60">Completá los datos visuales y del resultado para este post.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveCard(card.id, "up")}
                    disabled={cardIndex === 0}
                    aria-label={`Mover tarjeta ${cardIndex + 1} hacia arriba`}
                    className="rounded-lg border border-white/14 bg-white/[0.06] p-2.5 text-white/80 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCard(card.id, "down")}
                    disabled={cardIndex === data.cards.length - 1}
                    aria-label={`Mover tarjeta ${cardIndex + 1} hacia abajo`}
                    className="rounded-lg border border-white/14 bg-white/[0.06] p-2.5 text-white/80 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCard(card.id)}
                    disabled={data.cards.length === 1}
                    aria-label={`Eliminar tarjeta ${cardIndex + 1}`}
                    className="rounded-lg border border-red-300/30 bg-red-400/8 p-2.5 text-red-100 transition hover:bg-red-400/14 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              <div className="grid min-w-0 gap-4">
                <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
                  <div className="rounded-2xl border border-white/12 bg-white/[0.06] p-3">
                    <div className="relative h-[150px] overflow-hidden rounded-xl bg-[#08227a]">
                      {card.fotoDataUrl ? (
                        <img src={card.fotoDataUrl} alt={`Foto tarjeta ${cardIndex + 1}`} className="size-full object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center text-sm text-white/70">Sin foto</div>
                      )}
                    </div>
                    <label className="mt-3 inline-flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--otp-lime)] bg-[var(--otp-lime)] px-4 text-sm font-semibold text-[var(--otp-blue)] shadow-[0_12px_24px_rgba(201,253,46,0.14)] transition hover:brightness-105">
                      <ImagePlus className="size-5" />
                      Subir foto
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          void uploadPhoto(card.id, event.target.files?.[0]);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </div>

                  <div className="grid min-w-0 content-start gap-3">
                    <label className="flex min-w-0 flex-col gap-2 text-sm font-medium text-white/82">
                      <span className="tracking-[-0.01em]">Categoría *</span>
                      <select
                        value={card.categoria}
                        onChange={(event) => updateCard(card.id, { categoria: event.target.value })}
                        className="h-[52px] rounded-xl border border-white/15 bg-white/10 px-4 text-base text-white outline-none transition focus:border-[var(--otp-lime)]"
                      >
                        <option value="" className="text-black">
                          Seleccionar categoría
                        </option>
                        {CATEGORY_OPTIONS.map((category) => (
                          <option key={category} value={category} className="text-black">
                            {category}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="grid min-w-0 grid-cols-1 gap-3 2xl:grid-cols-2">
                      <label className="flex min-w-0 flex-col gap-2 text-sm font-medium text-white/82">
                        <span className="tracking-[-0.01em]">Participante 1 *</span>
                        <input
                          type="text"
                          value={card.nombreParticipante1}
                          onChange={(event) => updateCard(card.id, { nombreParticipante1: event.target.value })}
                          className="h-[52px] rounded-xl border border-white/15 bg-white/10 px-4 text-base text-white outline-none transition focus:border-[var(--otp-lime)]"
                        />
                      </label>
                      <label className="flex min-w-0 flex-col gap-2 text-sm font-medium text-white/82">
                        <span className="tracking-[-0.01em]">Participante 2 *</span>
                        <input
                          type="text"
                          value={card.nombreParticipante2}
                          onChange={(event) => updateCard(card.id, { nombreParticipante2: event.target.value })}
                          className="h-[52px] rounded-xl border border-white/15 bg-white/10 px-4 text-base text-white outline-none transition focus:border-[var(--otp-lime)]"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid min-w-0 gap-4 2xl:grid-cols-3">
                  <label className={`flex flex-col text-xs font-medium text-white/80 ${controlPanelClass}`}>
                    <span className={controlTitleClass}>
                      <CalendarDays className="size-4 text-[var(--otp-lime)]" />
                      Fecha *
                    </span>
                    <span className={controlHintClass}>Defini la fecha visible en la tarjeta.</span>
                    <input
                      type="date"
                      value={card.fecha}
                      onChange={(event) => updateCard(card.id, { fecha: event.target.value })}
                      className="mt-3 h-[52px] rounded-xl border border-white/15 bg-white/10 px-4 text-base text-white outline-none transition focus:border-[var(--otp-lime)]"
                    />
                  </label>

                  <fieldset className={`m-0 min-w-0 border-0 ${controlPanelClass}`}>
                    <legend className={controlTitleClass}>
                      <Medal className="size-4 text-[var(--otp-lime)]" />
                      Resultado
                    </legend>
                    <p className={controlHintClass}>Elegi el puesto alcanzado por la pareja.</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {RESULT_OPTIONS.map((option) => {
                        const isSelected = card.resultado === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => updateCard(card.id, { resultado: option.value })}
                            aria-pressed={isSelected}
                            className={toggleButtonClass(isSelected)}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <fieldset className={`m-0 min-w-0 border-0 ${controlPanelClass}`}>
                    <legend className={controlTitleClass}>
                      <Trophy className="size-4 text-[var(--otp-lime)]" />
                      Copa
                    </legend>
                    <p className={controlHintClass}>Selecciona la copa correspondiente.</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {CUP_OPTIONS.map((option) => {
                        const isSelected = card.copa === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => updateCard(card.id, { copa: option.value })}
                            aria-pressed={isSelected}
                            className={toggleButtonClass(isSelected)}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {errors.length > 0 ? (
        <section className="rounded-2xl border border-red-300/50 bg-red-400/10 p-4 text-sm text-red-50">
          <h3 className="font-semibold">Validaciones pendientes</h3>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">
            {errors.slice(0, 12).map((error) => (
              <li key={error.path + error.message}>{error.message}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
