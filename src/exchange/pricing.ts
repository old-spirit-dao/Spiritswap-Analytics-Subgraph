/* eslint-disable prefer-const */
import { BigDecimal, Address } from "@graphprotocol/graph-ts/index";
import { Pair, Token, Bundle } from "../../generated/schema";
import { ZERO_BD, factoryContract, ADDRESS_ZERO, ONE_BD } from "./utils";

//const WBNB_ADDRESS = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";
//const WBNB_BUSD_PAIR = "0x1b96b92314c44b159149f7e0303511fb2fc4774f"; // created block 589414
//const DAI_WBNB_PAIR = "0xf3010261b58b2874639ca2e860e9005e3be5de0b"; // created block 481116
//const USDT_WBNB_PAIR = "0x20bcc3b8a0091ddac2d0bc30f68e6cbb97de59cd"; // created block 648115

const WFTM_ADDRESS = "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83";
const USDC_WFTM_PAIR = "0xe7e90f5a767406eff87fdad7eb07ef407922ec1d";
const DAI_WFTM_PAIR = "0x0ec0e1629e776272fa3e55548d4a656be0eedcf4";
const USDT_WFTM_PAIR = "0x0d29724d1834fc65869812bae5d63dce8acb7921";

export function getFtmPriceInUSD(): BigDecimal {
  /*
  // fetch bnb prices for each stablecoin
  let usdtPair = Pair.load(USDT_WBNB_PAIR); // usdt is token0
  let busdPair = Pair.load(WBNB_BUSD_PAIR); // busd is token1
  let daiPair = Pair.load(DAI_WBNB_PAIR); // dai is token0

  // all 3 have been created
  if (daiPair !== null && busdPair !== null && usdtPair !== null) {
    let totalLiquidityBNB = daiPair.reserve1.plus(busdPair.reserve0).plus(usdtPair.reserve1);
    let daiWeight = daiPair.reserve1.div(totalLiquidityBNB);
    let busdWeight = busdPair.reserve0.div(totalLiquidityBNB);
    let usdtWeight = usdtPair.reserve1.div(totalLiquidityBNB);
    return daiPair.token0Price
      .times(daiWeight)
      .plus(busdPair.token1Price.times(busdWeight))
      .plus(usdtPair.token0Price.times(usdtWeight));
    // busd and usdt have been created
  } else if (busdPair !== null && usdtPair !== null) {
    let totalLiquidityBNB = busdPair.reserve0.plus(usdtPair.reserve1);
    let busdWeight = busdPair.reserve0.div(totalLiquidityBNB);
    let usdtWeight = usdtPair.reserve1.div(totalLiquidityBNB);
    return busdPair.token1Price.times(busdWeight).plus(usdtPair.token0Price.times(usdtWeight));
    // usdt is the only pair so far
  } else if (busdPair !== null) {
    return busdPair.token1Price;
  } else if (usdtPair !== null) {
    return usdtPair.token0Price;
  } else {
    return ZERO_BD;
  }

  */
  let usdcPair = Pair.load(USDC_WFTM_PAIR); // usdc is token0
  let daiPair = Pair.load(DAI_WFTM_PAIR); // dai is token1
  // usdc and dai have been created
  if (usdcPair !== null && daiPair !== null) {
    let totalLiquidityFTM = usdcPair.reserve1.plus(daiPair.reserve0);
    let usdcWeight = usdcPair.reserve1.div(totalLiquidityFTM);
    let daiWeight = daiPair.reserve0.div(totalLiquidityFTM);
    return usdcPair.token0Price.times(usdcWeight).plus(daiPair.token1Price.times(daiWeight));
    // usdc is the only pair so far
  } else if (usdcPair !== null) {
    return usdcPair.token0Price;
  } else {
    return ZERO_BD;
  }
}

// token where amounts should contribute to tracked volume and liquidity
/*
let WHITELIST: string[] = [
  "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c", // WBNB
  "0xe9e7cea3dedca5984780bafc599bd69add087d56", // BUSD
  "0x55d398326f99059ff775485246999027b3197955", // USDT
  "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", // USDC
  "0x23396cf899ca06c4472205fc903bdb4de249d6fc", // UST
  "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3", // DAI
  "0x4bd17003473389a42daf6a0a729f6fdb328bbbd7", // VAI
  "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c", // BTCB
  "0x2170ed0880ac9a755fd29b2688956bd959f933f8", // WETH
  "0x250632378e573c6be1ac2f97fcdf00515d0aa91b", // BETH
];*/

let WHITELIST: string[] = [
  "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83", // WFTM
  "0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e", // DAI
  "0x5cc61a78f164885776aa610fb0fe1257df78e59b", // SPIRIT
  "0x04068da6c83afcfa0e13ba15a6696662335d5b75", // USDC
  "0xaf319e5789945197e365e7f7fbfc56b130523b33", // FRAX
];
// minimum liquidity for price to get tracked
let MINIMUM_LIQUIDITY_THRESHOLD_FTM = BigDecimal.fromString("5000");

/**
 * Search through graph to find derived FTM per token.
 * @todo update to be derived FTM (add stablecoin estimates)
 **/
export function findFtmPerToken(token: Token): BigDecimal {
  if (token.id == WFTM_ADDRESS) {
    return ONE_BD;
  }
  // loop through whitelist and check if paired with any
  for (let i = 0; i < WHITELIST.length; ++i) {
    let pairAddress = factoryContract.getPair(Address.fromString(token.id), Address.fromString(WHITELIST[i]));
    if (pairAddress.toHexString() != ADDRESS_ZERO) {
      let pair = Pair.load(pairAddress.toHexString());
      if (pair.token0 == token.id && pair.reserveFTM.gt(MINIMUM_LIQUIDITY_THRESHOLD_FTM)) {
        let token1 = Token.load(pair.token1);
        return pair.token1Price.times(token1.derivedFTM as BigDecimal); // return token1 per our token * FTM per token 1
      }
      if (pair.token1 == token.id && pair.reserveFTM.gt(MINIMUM_LIQUIDITY_THRESHOLD_FTM)) {
        let token0 = Token.load(pair.token0);
        return pair.token0Price.times(token0.derivedFTM as BigDecimal); // return token0 per our token * FTM per token 0
      }
    }
  }
  return ZERO_BD; // nothing was found return 0
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD.
 * If both are, return average of two amounts
 * If neither is, return 0
 */
export function getTrackedVolumeUSD(
  bundle: Bundle,
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token
): BigDecimal {
  let price0 = token0.derivedFTM.times(bundle.ftmPrice);
  let price1 = token1.derivedFTM.times(bundle.ftmPrice);

  // both are whitelist tokens, take average of both amounts
  if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0).plus(tokenAmount1.times(price1)).div(BigDecimal.fromString("2"));
  }

  // take full value of the whitelisted token amount
  if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0);
  }

  // take full value of the whitelisted token amount
  if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount1.times(price1);
  }

  // neither token is on white list, tracked volume is 0
  return ZERO_BD;
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD * 2.
 * If both are, return sum of two amounts
 * If neither is, return 0
 */
export function getTrackedLiquidityUSD(
  bundle: Bundle,
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token
): BigDecimal {
  let price0 = token0.derivedFTM.times(bundle.ftmPrice);
  let price1 = token1.derivedFTM.times(bundle.ftmPrice);

  // both are whitelist tokens, take average of both amounts
  if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0).plus(tokenAmount1.times(price1));
  }

  // take double value of the whitelisted token amount
  if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0).times(BigDecimal.fromString("2"));
  }

  // take double value of the whitelisted token amount
  if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount1.times(price1).times(BigDecimal.fromString("2"));
  }

  // neither token is on white list, tracked volume is 0
  return ZERO_BD;
}
