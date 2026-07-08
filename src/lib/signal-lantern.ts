import type { Address } from "viem";

export const MAX_STATE_LENGTH = 16;
export const MAX_COLOR_LENGTH = 16;
export const MAX_MESSAGE_LENGTH = 180;

export const signalLanternAbi = [
  {
    type: "function",
    name: "publishLantern",
    stateMutability: "nonpayable",
    inputs: [
      { name: "state", type: "string" },
      { name: "color", type: "string" },
      { name: "message", type: "string" },
      { name: "daysActive", type: "uint256" },
    ],
    outputs: [{ name: "lanternId", type: "uint256" }],
  },
  {
    type: "function",
    name: "getLantern",
    stateMutability: "view",
    inputs: [{ name: "lanternId", type: "uint256" }],
    outputs: [
      { name: "owner", type: "address" },
      { name: "state", type: "string" },
      { name: "color", type: "string" },
      { name: "message", type: "string" },
      { name: "daysActive", type: "uint256" },
      { name: "createdAt", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "nextLanternId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const defaultSignalLanternContractAddress =
  "0x949f80374550307873071958e942ab7b70a6877a";

const configuredSignalLanternContractAddress =
  process.env.NEXT_PUBLIC_SIGNAL_LANTERN_CONTRACT_ADDRESS?.trim();

export const signalLanternContractAddress = (
  configuredSignalLanternContractAddress || defaultSignalLanternContractAddress
) as Address;
