"use client";

import {
  BellRing,
  CircleDot,
  Loader2,
  Search,
  Signal,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Address } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import {
  MAX_COLOR_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_STATE_LENGTH,
  signalLanternAbi,
  signalLanternContractAddress,
} from "@/lib/signal-lantern";

const STATES = ["BUILDING", "AVAILABLE", "FOCUS", "PAUSED", "LOOKING"] as const;
const COLORS = ["#12f7a5", "#ffe66d", "#ff6b6b", "#6bc7ff", "#c77dff"] as const;

function shortAddress(address?: Address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(createdAt?: bigint) {
  if (!createdAt) return "--";
  return new Date(Number(createdAt) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function LanternPreview({
  state,
  color,
  message,
  days,
}: {
  state: string;
  color: string;
  message: string;
  days: number;
}) {
  return (
    <div className="rounded-[6px] border border-[#30343b] bg-[#111317] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
      <div className="rounded-[4px] border border-[#3a3f49] bg-[#050607] p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="h-8 w-8 rounded-full border border-white/20"
              style={{ backgroundColor: color, boxShadow: `0 0 30px ${color}` }}
            />
            <p className="font-mono text-xs font-black uppercase tracking-[0.24em] text-[#a5adba]">
              Signal Lantern
            </p>
          </div>
          <Signal className="h-5 w-5 text-[#a5adba]" />
        </div>

        <h2
          className="mt-8 break-words font-mono text-5xl font-black uppercase leading-none sm:text-6xl"
          style={{ color, textShadow: `0 0 22px ${color}` }}
        >
          {state}
        </h2>
        <p className="mt-5 min-h-[88px] rounded-[4px] border border-[#30343b] bg-[#0b0d10] px-4 py-4 text-lg font-semibold leading-7 text-[#f4f1e8]">
          {message}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-[4px] border border-[#30343b] bg-[#0b0d10] px-3 py-3">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#7d8795]">
              Days
            </p>
            <p className="mt-2 text-2xl font-black text-[#f4f1e8]">{days}</p>
          </div>
          <div className="rounded-[4px] border border-[#30343b] bg-[#0b0d10] px-3 py-3">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#7d8795]">
              Mode
            </p>
            <p className="mt-2 text-2xl font-black text-[#f4f1e8]">ON</p>
          </div>
          <div className="rounded-[4px] border border-[#30343b] bg-[#0b0d10] px-3 py-3">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#7d8795]">
              Chain
            </p>
            <p className="mt-2 text-2xl font-black text-[#f4f1e8]">Base</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SignalLanternApp() {
  const [lanternIdInput, setLanternIdInput] = useState("1");
  const [state, setState] = useState<(typeof STATES)[number]>("BUILDING");
  const [color, setColor] = useState<(typeof COLORS)[number]>(COLORS[0]);
  const [message, setMessage] = useState(
    "Shipping a new thing today. Open to feedback, not meetings.",
  );
  const [days, setDays] = useState(3);
  const [status, setStatus] = useState(
    "Publish one public status lantern on Base.",
  );

  const { address, chainId, connector, isConnected } = useAccount();
  const {
    connectors,
    connectAsync,
    isPending: connecting,
  } = useConnect();
  const { disconnectAsync } = useDisconnect();
  async function disconnectWallet() {
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
    } catch {}
  }
  const { switchChain, isPending: switching } = useSwitchChain();
  const {
    data: hash,
    writeContractAsync,
    isPending: writing,
    error: writeError,
  } = useWriteContract();
  const { isLoading: confirming, isSuccess: confirmed } =
    useWaitForTransactionReceipt({ hash });

  const selectedConnector =
    connectors.find((connector) => connector.id === "injected") ??
    connectors.find((connector) => connector.id === "baseAccount") ??
    connectors[0];
  const parsedLanternId = BigInt(Math.max(1, Number(lanternIdInput || "1")));

  const lanternQuery = useReadContract({
    abi: signalLanternAbi,
    address: signalLanternContractAddress,
    functionName: "getLantern",
    args: [parsedLanternId],
    query: {
      enabled: Boolean(signalLanternContractAddress),
      refetchInterval: 12000,
    },
  });

  const totalQuery = useReadContract({
    abi: signalLanternAbi,
    address: signalLanternContractAddress,
    functionName: "nextLanternId",
    query: {
      enabled: Boolean(signalLanternContractAddress),
      refetchInterval: 12000,
    },
  });

  const lanternTuple = lanternQuery.data as
    | readonly [Address, string, string, string, bigint, bigint]
    | undefined;

  const liveLantern = useMemo(
    () =>
      lanternTuple
        ? {
            owner: lanternTuple[0],
            state: lanternTuple[1],
            color: lanternTuple[2],
            message: lanternTuple[3],
            days: lanternTuple[4],
            createdAt: lanternTuple[5],
          }
        : undefined,
    [lanternTuple],
  );

  const totalLanterns = totalQuery.data ? Math.max(Number(totalQuery.data) - 1, 0) : 0;
  const displayState = liveLantern?.state ?? state;
  const displayColor = liveLantern?.color ?? color;
  const displayMessage = liveLantern?.message ?? message;
  const displayDays = Number(liveLantern?.days ?? BigInt(days));

  const canPublish =
    Boolean(signalLanternContractAddress) &&
    isConnected &&
    chainId === base.id &&
    state.length > 0 &&
    state.length <= MAX_STATE_LENGTH &&
    color.length > 0 &&
    color.length <= MAX_COLOR_LENGTH &&
    message.trim().length > 0 &&
    message.trim().length <= MAX_MESSAGE_LENGTH &&
    days >= 1 &&
    days <= 30;

  const publishBlocker = !signalLanternContractAddress
    ? "Missing contract address. Add NEXT_PUBLIC_SIGNAL_LANTERN_CONTRACT_ADDRESS in Vercel, then redeploy."
    : !isConnected
      ? "Connect wallet first."
      : chainId !== base.id
        ? "Switch to Base before publishing."
        : message.trim().length === 0
          ? "Write a message before publishing."
          : message.trim().length > MAX_MESSAGE_LENGTH
            ? "Message is too long."
            : days < 1 || days > 30
              ? "Days must be between 1 and 30."
              : "";

  const statusText = confirmed
    ? "Lantern published on Base."
    : writeError
      ? writeError.message
      : status;

  async function connectWallet() {
    const connectorQueue = [
      connectors.find((connector) => connector.id === "injected"),
      connectors.find((connector) => connector.id === "baseAccount"),
      selectedConnector,
    ]
      .filter((connector): connector is NonNullable<typeof selectedConnector> =>
        Boolean(connector),
      )
      .filter(
        (connector, index, queue) =>
          queue.findIndex((item) => item.id === connector.id) === index,
      );

    if (connectorQueue.length === 0) {
      setStatus("No wallet connector found. Open this app inside Base App or a wallet browser.");
      return;
    }

    let lastError: unknown;

    setStatus("Opening wallet connection...");

    for (const connector of connectorQueue) {
      try {
        await connectAsync({ connector });
        setStatus("Wallet connected. Publish your lantern when ready.");
        return;
      } catch (error) {
        lastError = error;
      }
    }

    const message =
      lastError instanceof Error ? lastError.message : "Wallet connection was cancelled.";
    setStatus(
      message.includes("wallet_connect")
        ? "This browser does not support that wallet method. Refresh once, then open inside Base App or a wallet browser."
        : message,
    );
  }

  async function publishLantern() {
    if (!signalLanternContractAddress) {
      setStatus("Missing contract address. Add NEXT_PUBLIC_SIGNAL_LANTERN_CONTRACT_ADDRESS in Vercel, then redeploy.");
      return;
    }

    if (!canPublish) {
      setStatus(publishBlocker || "Check wallet, network, and message before publishing.");
      return;
    }

    try {
      setStatus("Confirm the signal lantern in your wallet.");
      await writeContractAsync({
        address: signalLanternContractAddress,
        abi: signalLanternAbi,
        functionName: "publishLantern",
        args: [state, color, message.trim(), BigInt(days)],
        chainId: base.id,
      });
      setStatus("Transaction sent. Waiting for Base confirmation...");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Transaction was cancelled.");
    }
  }

  return (
    <main className="min-h-screen bg-[#08090b] text-[#f4f1e8]">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[380px_minmax(0,1fr)] lg:px-6">
        <aside className="rounded-[6px] border border-[#30343b] bg-[#151820] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.45)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.24em] text-[#9ba3af]">
                Signal Lantern
              </p>
              <h1 className="mt-2 text-4xl font-black leading-none text-[#f4f1e8]">
                Turn status into a light.
              </h1>
            </div>
            <div
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/20"
              style={{ backgroundColor: color, boxShadow: `0 0 28px ${color}` }}
            >
              <CircleDot className="h-6 w-6 text-[#08090b]" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[4px] border border-[#30343b] bg-[#0d0f14] p-3">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#7d8795]">
                Lanterns
              </p>
              <p className="mt-2 text-3xl font-black">{totalLanterns}</p>
            </div>
            <div className="rounded-[4px] border border-[#30343b] bg-[#0d0f14] p-3">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#7d8795]">
                Chain
              </p>
              <p className="mt-2 text-xl font-black">Base</p>
            </div>
          </div>

          <section className="mt-4 rounded-[6px] border border-[#30343b] bg-[#0d0f14] p-4">
            <h2 className="text-xl font-black">Publish signal</h2>
            <div className="mt-4 space-y-4">
              <div>
                <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#8d96a3]">
                  State
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {STATES.map((value) => (
                    <button
                      key={value}
                      className={`rounded-[4px] border px-3 py-2 text-xs font-black ${
                        value === state
                          ? "border-transparent text-[#08090b]"
                          : "border-[#30343b] bg-[#151820] text-[#f4f1e8]"
                      }`}
                      style={value === state ? { backgroundColor: color } : undefined}
                      onClick={() => setState(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#8d96a3]">
                  Color
                </span>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {COLORS.map((value) => (
                    <button
                      key={value}
                      className="h-11 rounded-full border border-white/20"
                      style={{
                        backgroundColor: value,
                        boxShadow: value === color ? `0 0 24px ${value}` : undefined,
                      }}
                      onClick={() => setColor(value)}
                      aria-label={value}
                    />
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#8d96a3]">
                  Message
                </span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  maxLength={MAX_MESSAGE_LENGTH}
                  rows={4}
                  className="mt-1 w-full rounded-[4px] border border-[#30343b] bg-[#151820] px-3 py-3 text-sm font-semibold leading-6 text-[#f4f1e8] outline-none"
                />
              </label>

              <label className="block">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#8d96a3]">
                    Days active
                  </span>
                  <span className="font-black">{days}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={days}
                  onChange={(event) => setDays(Number(event.target.value))}
                  className="mt-3 w-full accent-[#12f7a5]"
                />
              </label>
            </div>
          </section>

          <div className="mt-4 space-y-3">
            {isConnected && chainId !== base.id ? (
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-[4px] border border-[#30343b] bg-[#6bc7ff] px-4 py-3 font-black text-[#08090b] disabled:opacity-60"
                disabled={switching}
                onClick={() => switchChain({ chainId: base.id })}
              >
                {switching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Switch to Base
              </button>
            ) : (
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-[4px] px-4 py-3 font-black text-[#08090b] disabled:opacity-60"
                style={{ backgroundColor: color }}
                disabled={writing || confirming}
                onClick={publishLantern}
              >
                {writing || confirming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BellRing className="h-4 w-4" />
                )}
                Publish on Base
              </button>
            )}

            {isConnected ? (
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-[4px] border border-[#30343b] bg-[#0d0f14] px-4 py-3 font-black"
                onClick={disconnectWallet}
              >
                {shortAddress(address)}
              </button>
            ) : (
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-[4px] border border-[#30343b] bg-[#f4f1e8] px-4 py-3 font-black text-[#08090b] disabled:opacity-60"
                disabled={!selectedConnector || connecting}
                onClick={connectWallet}
              >
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                Connect wallet
              </button>
            )}

            <p className="rounded-[4px] border border-[#30343b] bg-[#0d0f14] px-3 py-3 text-sm font-semibold leading-6">
              {statusText}
            </p>
            {publishBlocker && isConnected ? (
              <p className="rounded-[4px] border border-[#30343b] bg-[#151820] px-3 py-3 text-xs font-semibold leading-5 text-[#f4f1e8]/80">
                {publishBlocker}
              </p>
            ) : null}
          </div>
        </aside>

        <section className="grid gap-4">
          <LanternPreview
            state={displayState}
            color={displayColor}
            message={displayMessage}
            days={displayDays}
          />

          <div className="grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)]">
            <div className="rounded-[6px] border border-[#30343b] bg-[#151820] p-4">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                <h2 className="text-2xl font-black">Load lantern</h2>
              </div>
              <label className="mt-4 block">
                <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#8d96a3]">
                  Lantern ID
                </span>
                <input
                  value={lanternIdInput}
                  onChange={(event) =>
                    setLanternIdInput(event.target.value.replace(/\D/g, ""))
                  }
                  className="mt-1 w-full rounded-[4px] border border-[#30343b] bg-[#0d0f14] px-3 py-3 text-2xl font-black text-[#f4f1e8] outline-none"
                />
              </label>
            </div>

            <div className="rounded-[6px] border border-[#30343b] bg-[#151820] p-4">
              <p className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#8d96a3]">
                Owner
              </p>
              <p className="mt-2 font-black">
                {liveLantern?.owner ? shortAddress(liveLantern.owner) : "--"}
              </p>
              <p className="mt-5 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#8d96a3]">
                Published
              </p>
              <p className="mt-2 font-black">{formatDate(liveLantern?.createdAt)}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
