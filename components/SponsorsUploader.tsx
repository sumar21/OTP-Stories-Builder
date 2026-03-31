"use client";

import { useRef, useState, type ChangeEventHandler } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import type { Sponsor } from "@/lib/types";

type SponsorsUploaderProps = {
  sponsors: Sponsor[];
  onChange: (nextSponsors: Sponsor[]) => void;
};

const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
};

export function SponsorsUploader({ sponsors, onChange }: SponsorsUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const removeSponsor = (id: string) => {
    onChange(sponsors.filter((item) => item.id !== id));
  };

  const renameSponsor = (id: string, name: string) => {
    onChange(sponsors.map((item) => (item.id === id ? { ...item, name } : item)));
  };

  const handleUpload: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    setIsLoading(true);
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const logoDataUrl = await readFileAsDataUrl(file);
          const baseName = file.name.replace(/\.[a-z0-9]+$/i, "");
          return {
            id: nanoid(),
            name: baseName || "Sponsor",
            logoDataUrl,
          } satisfies Sponsor;
        }),
      );

      onChange([...sponsors, ...uploaded]);
    } finally {
      setIsLoading(false);
      event.target.value = "";
    }
  };

  return (
    <section className="rounded-2xl border border-white/15 bg-white/8 backdrop-blur-md">
      <details open={sponsors.length > 0} className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
          <div>
            <h3 className="text-sm font-semibold">Sponsors</h3>
            <p className="text-xs text-white/70">Se muestran en el footer del slide.</p>
          </div>
          <span className="rounded-full border border-white/15 bg-white/8 px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-white/60">
            {sponsors.length} {sponsors.length === 1 ? "sponsor" : "sponsors"}
          </span>
        </summary>

        <div className="border-t border-white/10 p-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--otp-lime)] bg-[var(--otp-lime)] px-3 py-1.5 text-xs font-semibold text-[var(--otp-blue)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ImagePlus className="size-4" />
              {isLoading ? "Cargando..." : "Subir logos"}
            </button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
            aria-label="Subir logos de sponsors"
          />

          <div className="mt-3 grid gap-2">
            {sponsors.map((sponsor) => (
              <div
                key={sponsor.id}
                className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-white/15 bg-[#0a2a8f]/60 p-2"
              >
                <div className="flex h-10 w-14 items-center justify-center rounded-md bg-white/10">
                  <img src={sponsor.logoDataUrl} alt={sponsor.name} className="max-h-8 max-w-12 object-contain" />
                </div>

                <input
                  type="text"
                  value={sponsor.name}
                  onChange={(event) => renameSponsor(sponsor.id, event.target.value)}
                  placeholder="Nombre del sponsor"
                  className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-[var(--otp-lime)]"
                />

                <button
                  type="button"
                  onClick={() => removeSponsor(sponsor.id)}
                  className="inline-flex items-center justify-center rounded-lg border border-red-300/60 p-2 text-red-100"
                  aria-label={`Eliminar sponsor ${sponsor.name}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </details>
    </section>
  );
}
