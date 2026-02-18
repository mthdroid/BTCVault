import {
  ConnectArgs,
  ConnectorNotConnectedError,
  ConnectorNotFoundError,
  InjectedConnector,
  InjectedConnectorOptions,
  UserRejectedRequestError,
} from "@starknet-react/core";
import {
  Permission,
  RequestFnCall,
  RpcMessage,
  RpcTypeToMessageMap,
} from "get-starknet-core";
import { ConnectorData } from "@starknet-react/core/src/connectors/base";
import { WalletEventListener } from "@starknet-io/types-js";
import { xverseWalletIcon, xverseWalletName, xverseWalletId } from "./consts";

interface StarknetWindowObject {
  id: string;
  name: string;
  version?: string;
  icon?: string;
  request: (call: any) => Promise<any>;
  on: (...args: any[]) => void;
  off: (...args: any[]) => void;
}

function getXverseFromWindow(): StarknetWindowObject | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as any).starknet_xverse as StarknetWindowObject | undefined;
}

export class XverseConnector extends InjectedConnector {
  private __wallet?: StarknetWindowObject;
  private __options: InjectedConnectorOptions;

  constructor() {
    const options: InjectedConnectorOptions = {
      id: xverseWalletId,
      name: xverseWalletName,
      icon: xverseWalletIcon,
    };
    super({ options });
    this.__options = options;
  }

  get id() {
    return this.__options.id;
  }

  get name() {
    return xverseWalletName;
  }

  get icon() {
    return xverseWalletIcon;
  }

  available(): boolean {
    return !!getXverseFromWindow();
  }

  async chainId(): Promise<bigint> {
    this._ensureWallet();
    if (!this.__wallet) {
      throw new ConnectorNotConnectedError();
    }
    try {
      return this._requestChainId();
    } catch {
      throw new ConnectorNotFoundError();
    }
  }

  async ready(): Promise<boolean> {
    this._ensureWallet();
    if (!this.__wallet) return false;
    try {
      const permissions: Permission[] = await this.request({
        type: "wallet_getPermissions",
      });
      return permissions?.includes(Permission.ACCOUNTS);
    } catch {
      return false;
    }
  }

  async connect(_args: ConnectArgs = {}): Promise<ConnectorData> {
    this._ensureWallet();
    if (!this.__wallet) {
      throw new ConnectorNotFoundError();
    }

    let accounts: string[];
    try {
      accounts = await this.request({
        type: "wallet_requestAccounts",
      });
    } catch {
      throw new UserRejectedRequestError();
    }

    if (!accounts || accounts.length === 0) {
      throw new UserRejectedRequestError();
    }

    (this.__wallet.on as WalletEventListener)(
      "accountsChanged",
      async (accounts) => {
        await this._onAccountsChanged(accounts);
      },
    );

    (this.__wallet.on as WalletEventListener)(
      "networkChanged",
      async (chainId, accounts) => {
        this._onNetworkChanged(chainId, accounts);
      },
    );

    const [account] = accounts;
    const chainId = await this._requestChainId();
    this.emit("connect", { account, chainId });

    return { account, chainId };
  }

  async disconnect(): Promise<void> {
    this._ensureWallet();
    if (!this.__wallet) {
      throw new ConnectorNotFoundError();
    }
    this.emit("disconnect");
  }

  async request<T extends RpcMessage["type"]>(
    call: RequestFnCall<T>,
  ): Promise<RpcTypeToMessageMap[T]["result"]> {
    this._ensureWallet();
    if (!this.__wallet) {
      throw new ConnectorNotConnectedError();
    }
    return this.__wallet.request(call);
  }

  private _ensureWallet() {
    this.__wallet = getXverseFromWindow();
  }

  private async _requestChainId(): Promise<bigint> {
    const chainIdHex = await this.request({ type: "wallet_requestChainId" });
    return BigInt(chainIdHex);
  }

  private async _onAccountsChanged(accounts?: string[]): Promise<void> {
    if (!accounts || accounts.length === 0) {
      this.emit("disconnect");
    } else {
      const [account] = accounts;
      if (account) {
        const chainId = await this._requestChainId();
        this.emit("change", { account, chainId });
      } else {
        this.emit("disconnect");
      }
    }
  }

  private _onNetworkChanged(chainIdHex?: string, accounts?: string[]): void {
    if (chainIdHex) {
      const chainId = BigInt(chainIdHex);
      const [account] = accounts || [];
      this.emit("change", { chainId, account });
    } else {
      this.emit("change", {});
    }
  }
}
