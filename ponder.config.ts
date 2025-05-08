import { createConfig } from "ponder";
import { http } from "viem";

import { Escrow } from "./abis/Escrow";

export default createConfig({
  networks: {
    base: {
      chainId: 8453,
      transport: http(process.env.PONDER_RPC_URL_8453),
    },
  },
  contracts: {
    Escrow: {
      network: "base",
      abi: Escrow,
      address: "0xca38607d85e8f6294dc10728669605e6664c2d70",
      startBlock: 25303495,
      filter: [{
        event: "DepositReceived",
        args: {},
      }, {
        event: 'DepositWithdrawn',
        args: {},
      }, {
        event: 'DepositClosed',
        args: {},
      }, {
        event: 'DepositConversionRateUpdated',
        args: {},
      }, {
        event: 'DepositCurrencyAdded',
        args: {},
      }, {
        event: 'IntentSignaled',
        args: {},
      }, {
        event: 'PaymentVerifierAdded',
        args: {},
      }, {
        event: 'PaymentVerifierFeeShareUpdated',
        args: {},
      }, {
        event: 'PaymentVerifierRemoved',
        args: {},
      }],
    },
  },
});
