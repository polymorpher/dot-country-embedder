/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PayableOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../../common";

export interface EWSInterface extends utils.Interface {
  functions: {
    "appendAllowedPages(string,string[])": FunctionFragment;
    "configs(bytes32)": FunctionFragment;
    "dc()": FunctionFragment;
    "getAllowedPages(bytes32)": FunctionFragment;
    "getAllowedPagesSlice(bytes32,uint256,uint256)": FunctionFragment;
    "getLandingPage(bytes32)": FunctionFragment;
    "getNumAllowedPages(bytes32)": FunctionFragment;
    "landingPageFee()": FunctionFragment;
    "owner()": FunctionFragment;
    "perAdditionalPageFee()": FunctionFragment;
    "remove(string)": FunctionFragment;
    "renounceOwnership()": FunctionFragment;
    "setDc(address)": FunctionFragment;
    "setLandingPageFee(uint256)": FunctionFragment;
    "setPerAdditionalPageFee(uint256)": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
    "update(string,string,string[],bool)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "appendAllowedPages"
      | "configs"
      | "dc"
      | "getAllowedPages"
      | "getAllowedPagesSlice"
      | "getLandingPage"
      | "getNumAllowedPages"
      | "landingPageFee"
      | "owner"
      | "perAdditionalPageFee"
      | "remove"
      | "renounceOwnership"
      | "setDc"
      | "setLandingPageFee"
      | "setPerAdditionalPageFee"
      | "transferOwnership"
      | "update"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "appendAllowedPages",
    values: [PromiseOrValue<string>, PromiseOrValue<string>[]]
  ): string;
  encodeFunctionData(
    functionFragment: "configs",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(functionFragment: "dc", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "getAllowedPages",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "getAllowedPagesSlice",
    values: [
      PromiseOrValue<BytesLike>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "getLandingPage",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "getNumAllowedPages",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "landingPageFee",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "perAdditionalPageFee",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "remove",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "renounceOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "setDc",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "setLandingPageFee",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "setPerAdditionalPageFee",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "update",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<string>[],
      PromiseOrValue<boolean>
    ]
  ): string;

  decodeFunctionResult(
    functionFragment: "appendAllowedPages",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "configs", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "dc", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getAllowedPages",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getAllowedPagesSlice",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getLandingPage",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getNumAllowedPages",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "landingPageFee",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "perAdditionalPageFee",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "remove", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "renounceOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "setDc", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "setLandingPageFee",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setPerAdditionalPageFee",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "update", data: BytesLike): Result;

  events: {
    "OwnershipTransferred(address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
}

export interface OwnershipTransferredEventObject {
  previousOwner: string;
  newOwner: string;
}
export type OwnershipTransferredEvent = TypedEvent<
  [string, string],
  OwnershipTransferredEventObject
>;

export type OwnershipTransferredEventFilter =
  TypedEventFilter<OwnershipTransferredEvent>;

export interface EWS extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: EWSInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    appendAllowedPages(
      name: PromiseOrValue<string>,
      moreAllowedPages: PromiseOrValue<string>[],
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    configs(
      arg0: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<[string] & { landingPage: string }>;

    dc(overrides?: CallOverrides): Promise<[string]>;

    getAllowedPages(
      node: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<[string[]]>;

    getAllowedPagesSlice(
      node: PromiseOrValue<BytesLike>,
      start: PromiseOrValue<BigNumberish>,
      end: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[string[]]>;

    getLandingPage(
      node: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<[string]>;

    getNumAllowedPages(
      node: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    landingPageFee(overrides?: CallOverrides): Promise<[BigNumber]>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    perAdditionalPageFee(overrides?: CallOverrides): Promise<[BigNumber]>;

    remove(
      name: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    setDc(
      _dc: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    setLandingPageFee(
      _landingPageFee: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    setPerAdditionalPageFee(
      _perAdditionalPageFee: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    update(
      name: PromiseOrValue<string>,
      landingPage: PromiseOrValue<string>,
      allowedPages: PromiseOrValue<string>[],
      landingPageOnly: PromiseOrValue<boolean>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  appendAllowedPages(
    name: PromiseOrValue<string>,
    moreAllowedPages: PromiseOrValue<string>[],
    overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  configs(
    arg0: PromiseOrValue<BytesLike>,
    overrides?: CallOverrides
  ): Promise<string>;

  dc(overrides?: CallOverrides): Promise<string>;

  getAllowedPages(
    node: PromiseOrValue<BytesLike>,
    overrides?: CallOverrides
  ): Promise<string[]>;

  getAllowedPagesSlice(
    node: PromiseOrValue<BytesLike>,
    start: PromiseOrValue<BigNumberish>,
    end: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<string[]>;

  getLandingPage(
    node: PromiseOrValue<BytesLike>,
    overrides?: CallOverrides
  ): Promise<string>;

  getNumAllowedPages(
    node: PromiseOrValue<BytesLike>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  landingPageFee(overrides?: CallOverrides): Promise<BigNumber>;

  owner(overrides?: CallOverrides): Promise<string>;

  perAdditionalPageFee(overrides?: CallOverrides): Promise<BigNumber>;

  remove(
    name: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  renounceOwnership(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  setDc(
    _dc: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  setLandingPageFee(
    _landingPageFee: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  setPerAdditionalPageFee(
    _perAdditionalPageFee: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  transferOwnership(
    newOwner: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  update(
    name: PromiseOrValue<string>,
    landingPage: PromiseOrValue<string>,
    allowedPages: PromiseOrValue<string>[],
    landingPageOnly: PromiseOrValue<boolean>,
    overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    appendAllowedPages(
      name: PromiseOrValue<string>,
      moreAllowedPages: PromiseOrValue<string>[],
      overrides?: CallOverrides
    ): Promise<void>;

    configs(
      arg0: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<string>;

    dc(overrides?: CallOverrides): Promise<string>;

    getAllowedPages(
      node: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<string[]>;

    getAllowedPagesSlice(
      node: PromiseOrValue<BytesLike>,
      start: PromiseOrValue<BigNumberish>,
      end: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<string[]>;

    getLandingPage(
      node: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<string>;

    getNumAllowedPages(
      node: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    landingPageFee(overrides?: CallOverrides): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<string>;

    perAdditionalPageFee(overrides?: CallOverrides): Promise<BigNumber>;

    remove(
      name: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    renounceOwnership(overrides?: CallOverrides): Promise<void>;

    setDc(
      _dc: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    setLandingPageFee(
      _landingPageFee: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    setPerAdditionalPageFee(
      _perAdditionalPageFee: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    update(
      name: PromiseOrValue<string>,
      landingPage: PromiseOrValue<string>,
      allowedPages: PromiseOrValue<string>[],
      landingPageOnly: PromiseOrValue<boolean>,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "OwnershipTransferred(address,address)"(
      previousOwner?: PromiseOrValue<string> | null,
      newOwner?: PromiseOrValue<string> | null
    ): OwnershipTransferredEventFilter;
    OwnershipTransferred(
      previousOwner?: PromiseOrValue<string> | null,
      newOwner?: PromiseOrValue<string> | null
    ): OwnershipTransferredEventFilter;
  };

  estimateGas: {
    appendAllowedPages(
      name: PromiseOrValue<string>,
      moreAllowedPages: PromiseOrValue<string>[],
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    configs(
      arg0: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    dc(overrides?: CallOverrides): Promise<BigNumber>;

    getAllowedPages(
      node: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getAllowedPagesSlice(
      node: PromiseOrValue<BytesLike>,
      start: PromiseOrValue<BigNumberish>,
      end: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getLandingPage(
      node: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getNumAllowedPages(
      node: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    landingPageFee(overrides?: CallOverrides): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    perAdditionalPageFee(overrides?: CallOverrides): Promise<BigNumber>;

    remove(
      name: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    setDc(
      _dc: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    setLandingPageFee(
      _landingPageFee: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    setPerAdditionalPageFee(
      _perAdditionalPageFee: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    update(
      name: PromiseOrValue<string>,
      landingPage: PromiseOrValue<string>,
      allowedPages: PromiseOrValue<string>[],
      landingPageOnly: PromiseOrValue<boolean>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    appendAllowedPages(
      name: PromiseOrValue<string>,
      moreAllowedPages: PromiseOrValue<string>[],
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    configs(
      arg0: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    dc(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getAllowedPages(
      node: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getAllowedPagesSlice(
      node: PromiseOrValue<BytesLike>,
      start: PromiseOrValue<BigNumberish>,
      end: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getLandingPage(
      node: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getNumAllowedPages(
      node: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    landingPageFee(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    perAdditionalPageFee(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    remove(
      name: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    setDc(
      _dc: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    setLandingPageFee(
      _landingPageFee: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    setPerAdditionalPageFee(
      _perAdditionalPageFee: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    update(
      name: PromiseOrValue<string>,
      landingPage: PromiseOrValue<string>,
      allowedPages: PromiseOrValue<string>[],
      landingPageOnly: PromiseOrValue<boolean>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}
