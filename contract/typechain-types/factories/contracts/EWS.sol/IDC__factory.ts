/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { IDC, IDCInterface } from "../../../contracts/EWS.sol/IDC";

const _abi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
    ],
    name: "nameExpires",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
    ],
    name: "ownerOf",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export class IDC__factory {
  static readonly abi = _abi;
  static createInterface(): IDCInterface {
    return new utils.Interface(_abi) as IDCInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): IDC {
    return new Contract(address, _abi, signerOrProvider) as IDC;
  }
}