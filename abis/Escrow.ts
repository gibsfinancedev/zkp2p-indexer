import { parseAbi } from "viem";

export const Escrow = parseAbi([
  `event DepositReceived(uint256 indexed depositId,address indexed depositor,address indexed token,uint256 amount,(uint256,uint256) intentAmountRange)`,

  `event DepositVerifierAdded(uint256 indexed depositId,address indexed verifier,bytes32 indexed payeeDetailsHash,address intentGatingService)`,

  `event DepositCurrencyAdded(uint256 indexed depositId,address indexed verifier,bytes32 indexed currency,uint256 conversionRate)`,

  `event DepositConversionRateUpdated(uint256 indexed depositId,address indexed verifier,bytes32 indexed currency,uint256 newConversionRate)`,

  `event IntentSignaled(bytes32 indexed intentHash,uint256 indexed depositId,address indexed verifier,address owner,address to,uint256 amount,bytes32 currency,uint256 conversionRate,uint256 timestamp)`,

  `event IntentPruned(bytes32 indexed intentHash,uint256 indexed depositId)`,

  `event IntentFulfilled(bytes32 indexed intentHash,uint256 indexed depositId,address indexed verifier,address owner,address to,uint256 amount,uint256 sustainabilityFee,uint256 verifierFee)`,

  `event DepositWithdrawn(uint256 indexed depositId,address indexed depositor,uint256 amount)`,

  `event DepositClosed(uint256 depositId, address depositor)`,

  `event MinDepositAmountSet(uint256 minDepositAmount)`,
  `event SustainabilityFeeUpdated(uint256 fee)`,
  `event SustainabilityFeeRecipientUpdated(address feeRecipient)`,
  `event AcceptAllPaymentVerifiersUpdated(bool acceptAllPaymentVerifiers)`,
  `event IntentExpirationPeriodSet(uint256 intentExpirationPeriod)`,

  `event PaymentVerifierAdded(address verifier, uint256 feeShare)`,
  `event PaymentVerifierFeeShareUpdated(address verifier, uint256 feeShare)`,
  `event PaymentVerifierRemoved(address verifier)`,

  'function depositVerifierData(uint256 depositId, address verifier) view returns (address,string,bytes)',
]);
