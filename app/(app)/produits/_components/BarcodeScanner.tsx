"use client";

import { useEffect, useRef, useState } from "react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
}

type Status = "loading" | "scanning" | "denied" | "error";

export default function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [status, setStatus] = useState<Status>("loading");
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const onScanRef = useRef(onScan);
  const handledRef = useRef(false);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const scanner = new (Html5Qrcode as any)("barcode-scanner-view", {
          verbose: false,
        });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 280, height: 140 },
            aspectRatio: 1.8,
          },
          (code: string) => {
            if (cancelled || handledRef.current) return;
            handledRef.current = true;
            scanner.stop().catch(() => {});
            onScanRef.current(code);
          }
        );

        if (!cancelled) setStatus("scanning");
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = String(err).toLowerCase();
        if (
          msg.includes("permission") ||
          msg.includes("denied") ||
          msg.includes("notallowed")
        ) {
          setStatus("denied");
        } else {
          setStatus("error");
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="space-y-3">
      {/* Camera view — always in DOM so html5-qrcode can find it */}
      <div
        id="barcode-scanner-view"
        className={`w-full rounded-2xl overflow-hidden bg-black ${
          status !== "scanning" ? "hidden" : ""
        }`}
        style={{ minHeight: 220 }}
      />

      {status === "loading" && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-gray-400">Démarrage de la caméra…</p>
        </div>
      )}

      {status === "scanning" && (
        <p className="text-xs text-gray-400 text-center">
          Place le code-barres dans le cadre
        </p>
      )}

      {status === "denied" && (
        <div className="text-center py-12 px-6">
          <div className="text-4xl mb-3">📷</div>
          <p className="text-sm font-semibold text-[#1A1A2E]">
            Accès à la caméra refusé
          </p>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            Autorise l&apos;accès à la caméra dans les paramètres de ton
            navigateur, puis recharge la page.
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="text-center py-12 px-6">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-sm font-semibold text-[#1A1A2E]">
            Impossible de démarrer la caméra
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Essaie la saisie manuelle.
          </p>
        </div>
      )}
    </div>
  );
}
