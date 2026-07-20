"use client";

import { usePhantom } from "@/hooks/usePhantom";
import { CONTRACT_ADDRESS } from "@/lib/config";
import { CopyIcon, QrCodeIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState } from "react";

export default function WalletPanel() {
	const { provider, address, connecting, connect, disconnect, lastError, isConnected, balanceSol } = usePhantom();
	const [copied, setCopied] = useState(false);
	const [showQR, setShowQR] = useState(false);

	const shortAddr = useMemo(() => {
		if (!address) return "";
		return address.slice(0, 4) + "..." + address.slice(-4);
	}, [address]);

	const shortContract = useMemo(() => CONTRACT_ADDRESS.slice(0, 8) + "…" + CONTRACT_ADDRESS.slice(-8), []);

	const onCopy = async () => {
		await navigator.clipboard.writeText(CONTRACT_ADDRESS);
		setCopied(true);
		setTimeout(() => setCopied(false), 1200);
	};

	const onPrimary = () => {
		if (!provider) {
			window.open("https://wallet.app/", "_blank");
			return;
		}
		if (isConnected) disconnect();
		else connect();
	};

	return (
		<div className="w-full rounded-2xl bg-white/[0.02] border border-white/[0.08] shadow-xl backdrop-blur-sm p-6 sm:p-8 card-neo">
			{/* Header */}
			<div className="flex items-center justify-between gap-4">
				<div>
					<div className="text-sm text-white/70">Wallet</div>
					<div className="text-lg font-medium font-mono tracking-wide">{address ? shortAddr : "Not connected"}</div>
				</div>
				<div className="text-right">
					<button
						onClick={onPrimary}
						disabled={connecting}
						className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
					>
						{connecting ? "Processing..." : !provider ? "Connect Wallet" : isConnected ? "Disconnect" : "Connect Wallet"}
					</button>
					<div className="text-[11px] text-white/40 mt-1">EVM wallet</div>
					{lastError && <div className="text-[11px] text-red-400 mt-1">{lastError}</div>}
				</div>
			</div>

			{/* Content */}
			<div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
				{/* Left info (spans 2) */}
				<div className="sm:col-span-2 space-y-3">
					<div>
						<div className="text-sm text-white/70 mb-2">Contract Address</div>
						<div className="flex items-center gap-3 rounded-xl bg-black/30 border border-white/[0.08] p-3">
							<div className="truncate text-sm" title={CONTRACT_ADDRESS}>{shortContract}</div>
							<button onClick={onCopy} className="ml-auto inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition">
								<CopyIcon size={16} /> {copied ? "Copied" : "Copy"}
							</button>
							<button onClick={() => setShowQR(v => !v)} className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition">
								<QrCodeIcon size={16} /> QR
							</button>
						</div>
					</div>
					{showQR && (
						<div className="rounded-2xl bg-white p-4 inline-block">
							<QRCodeSVG value={CONTRACT_ADDRESS} size={168} includeMargin={true} />
						</div>
					)}
				</div>

				{/* Right balance card */}
				<div className="sm:col-span-1">
					<div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4 text-center">
						<div className="text-xs text-white/60">Balance</div>
						<div className="mt-1 text-3xl font-semibold">
							{typeof balanceSol === "number" ? balanceSol.toFixed(4) : "—"}
							<span className="text-white/60 text-sm ml-1 align-middle">CREX</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
} 
