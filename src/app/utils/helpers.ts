// utils/helpers.ts

import nacl from "tweetnacl";

export const truncateAddress = (address: string): string => {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

export const verifySignature = (
  message: Uint8Array,
  signature: Uint8Array,
  publicKeyBytes: Uint8Array
): boolean => {
  return nacl.sign.detached.verify(message, signature, publicKeyBytes);
};
