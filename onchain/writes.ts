/*
 * wagmi-ama.ts
 * TypeScript helpers using @wagmi/core + viem
 */

import { simulateContract, writeContract, readContract } from "@wagmi/core";
import { parseUnits } from "viem";
import type { Address } from "viem";
import { base } from "viem/chains";
import {
  AMA_CONTRACT_ABI,
  AMA_CONTRACT_ADDRESS,
  STABLE_ERC_CONTRACT_ADDRESS,
  STABLE_ERC_CONTRACT_ABI,
} from "~/lib/constants";
import { config } from "~/components/providers/WagmiProvider";

interface WagmiConfig {
  chains: any[];
  connectors: any[];
  publicClient: any;
}

config.connectors[0].getChainId = async () => base.id;

async function txWrapper({
  address,
  abi,
  functionName,
  args,
  value,
}: {
  address: Address;
  abi: readonly any[];
  functionName: string;
  args?: any[];
  value?: bigint;
}) {
  // Check if the call will succeed
  const { request, result: simResult } = await simulateContract(config, {
    address,
    abi,
    functionName,
    args: args ?? [],
    value,
  });
  console.log(`Simulation result for ${functionName}:`, simResult);

  // Send the transaction for real
  const tx = await writeContract(config, { ...request });
  return tx;
}

/**
 * 1. Create a new AMA session
 */
export async function createSession(
  creatorUserName: string,
  title: string,
  description: string
) {
  return txWrapper({
    address: AMA_CONTRACT_ADDRESS,
    abi: AMA_CONTRACT_ABI,
    functionName: "createSession",
    args: [creatorUserName, title, description],
  });
}

/**
 * 2. Ask a question on an active session
 */
export async function askQuestion(sessionId: number, content: string) {
  return txWrapper({
    address: AMA_CONTRACT_ADDRESS,
    abi: AMA_CONTRACT_ABI,
    functionName: "askQuestion",
    args: [sessionId, content],
  });
}

/**
 * 3. Post an answer, creator-only
 */
export async function postAnswer(
  sessionId: number,
  questionId: number,
  content: string
) {
  return txWrapper({
    address: AMA_CONTRACT_ADDRESS,
    abi: AMA_CONTRACT_ABI,
    functionName: "postAnswer",
    args: [sessionId, questionId, content],
  });
}

/**
 * 4a. Optionally approve USDC to the session contract
 */
export async function approveUSDC(amount: string | number, address: Address) {
  const allowance = (await readContract(config, {
    address: STABLE_ERC_CONTRACT_ADDRESS,
    abi: STABLE_ERC_CONTRACT_ABI,
    functionName: "allowance",
    args: [address, AMA_CONTRACT_ADDRESS],
  })) as bigint;

  const needed = parseUnits(`${amount}`, 6); // USDC has 6 decimals
  if (allowance < needed) {
    return txWrapper({
      address: STABLE_ERC_CONTRACT_ADDRESS,
      abi: STABLE_ERC_CONTRACT_ABI,
      functionName: "approve",
      args: [AMA_CONTRACT_ADDRESS, needed],
    });
  }
  return undefined;
}

/**
 * 4b. Tip the AMA creator in USDC
 */
export async function tipCreator(
  sessionId: number,
  amountInUSDC: string | number,
  address: Address
) {
  const usdcUnits = parseUnits(`${amountInUSDC}`, 6);

  // Ensure approval is high enough
  await approveUSDC(amountInUSDC, address);

  return txWrapper({
    address: AMA_CONTRACT_ADDRESS,
    abi: AMA_CONTRACT_ABI,
    functionName: "tipCreator",
    args: [sessionId, usdcUnits],
  });
}

/**
 * 5. End an AMA session (creator-only)
 */
export async function endSession(sessionId: number) {
  return txWrapper({
    address: AMA_CONTRACT_ADDRESS,
    abi: AMA_CONTRACT_ABI,
    functionName: "endSession",
    args: [sessionId],
  });
}

/**
 * 6. Read-only helpers to fetch current stored data
 */
export async function getSessionQuestions(sessionId: number) {
  return readContract(config, {
    address: AMA_CONTRACT_ADDRESS,
    abi: AMA_CONTRACT_ABI,
    functionName: "getSessionQuestions",
    args: [sessionId],
  });
}
export async function getQuestionAnswers(questionId: number) {
  return readContract(config, {
    address: AMA_CONTRACT_ADDRESS,
    abi: AMA_CONTRACT_ABI,
    functionName: "getQuestionAnswers",
    args: [questionId],
  });
}
export async function getSessionTips(sessionId: number) {
  return readContract(config, {
    address: AMA_CONTRACT_ADDRESS,
    abi: AMA_CONTRACT_ABI,
    functionName: "getSessionTips",
    args: [sessionId],
  });
}
export async function getSessionDetails(sessionId: number) {
  return readContract(config, {
    address: AMA_CONTRACT_ADDRESS,
    abi: AMA_CONTRACT_ABI,
    functionName: "getSessionDetails",
    args: [sessionId],
  });
}
