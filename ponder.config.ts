import { createConfig } from "ponder";

import { Escrow } from "./abis/Escrow";

export default createConfig({
  chains: {
    base: {
      id: 8453,
      rpc: process.env.PONDER_RPC_URL_8453,
      maxRequestsPerSecond: 50,
    },
  },
  contracts: {
    Escrow: {
      chain: 'base',
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
