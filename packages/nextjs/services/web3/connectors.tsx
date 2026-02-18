import { braavos, InjectedConnector, ready } from "@starknet-react/core";
import { getTargetNetworks } from "~~/utils/scaffold-stark";
import { BurnerConnector } from "@scaffold-stark/stark-burner";
import scaffoldConfig from "~~/scaffold.config";
import { LAST_CONNECTED_TIME_LOCALSTORAGE_KEY } from "~~/utils/Constants";
import { KeplrConnector } from "./keplr";
import { XverseConnector } from "./xverse";

const targetNetworks = getTargetNetworks();

export const connectors = getConnectors();

// workaround helper function to properly disconnect with removing local storage (prevent autoconnect infinite loop)
function withDisconnectWrapper(connector: InjectedConnector) {
  const connectorDisconnect = connector.disconnect;
  const _disconnect = (): Promise<void> => {
    localStorage.removeItem("lastUsedConnector");
    localStorage.removeItem(LAST_CONNECTED_TIME_LOCALSTORAGE_KEY);
    return connectorDisconnect();
  };
  connector.disconnect = _disconnect.bind(connector);
  return connector;
}

function getConnectors() {
  const { targetNetworks } = scaffoldConfig;

  const connectors: InjectedConnector[] = [ready(), braavos()];
  const isDevnet = targetNetworks.some(
    (network) => (network.network as string) === "devnet",
  );

  if (!isDevnet) {
    connectors.push(new XverseConnector());
    connectors.push(new KeplrConnector());
  } else {
    const burnerConnector = new BurnerConnector();
    // burnerConnector's should be initialized with dynamic network instead of hardcoded devnet to support mainnetFork
    burnerConnector.chain = targetNetworks[0];
    connectors.push(burnerConnector as unknown as InjectedConnector);
  }

  return connectors.map(withDisconnectWrapper);
}

export const appChains = targetNetworks;
