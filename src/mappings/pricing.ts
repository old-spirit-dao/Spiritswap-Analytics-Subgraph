/* eslint-disable prefer-const */
import { Pair, Token, Bundle } from '../types/schema'
import { BigDecimal, Address, BigInt } from '@graphprotocol/graph-ts/index'
import { ZERO_BD, factoryContract, ADDRESS_ZERO, ONE_BD } from './helpers'

const WFTM_ADDRESS = '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83'
const USDC_WFTM_PAIR = '0xe7e90f5a767406eff87fdad7eb07ef407922ec1d'
const DAI_WFTM_PAIR = '0x0ec0e1629e776272fa3e55548d4a656be0eedcf4'
const USDT_WFTM_PAIR = '0x0d29724d1834fc65869812bae5d63dce8acb7921'

// dummy for testing
export function getFtmPriceInUSD(): BigDecimal {
  // fetch FTM prices for each stablecoin
  let usdcPair = Pair.load(USDC_WFTM_PAIR) // usdc is token0
  let daiPair = Pair.load(DAI_WFTM_PAIR) // dai is token1

  // usdc and dai have been created
  if (usdcPair !== null && daiPair !== null) {
    let totalLiquidityFTM = usdcPair.reserve1.plus(daiPair.reserve0)
    let usdcWeight = usdcPair.reserve1.div(totalLiquidityFTM)
    let daiWeight = daiPair.reserve0.div(totalLiquidityFTM)
    return usdcPair.token0Price.times(usdcWeight).plus(daiPair.token1Price.times(daiWeight))
    // usdc is the only pair so far
  } else if (usdcPair !== null) {
    return usdcPair.token0Price
  } else {
    return ZERO_BD
  }
}

let WHITELIST: string[] = [
  '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83', // WFTM
  '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e', // DAI
  '0x5cc61a78f164885776aa610fb0fe1257df78e59b', // SPIRIT
  '0x04068da6c83afcfa0e13ba15a6696662335d5b75' // USDC
  //"0xaf319e5789945197e365e7f7fbfc56b130523b33", // FRAX
]

/**
 * Search through graph to find derived FTM per token.
 * @todo update to be derived FTM (add stablecoin estimates)
 **/
export function findFtmPerToken(token: Token): BigDecimal {
  if (token.id == WFTM_ADDRESS) {
    return ONE_BD
  }
  // loop through whitelist and check if paired with any
  for (let i = 0; i < WHITELIST.length; ++i) {
    let pairAddress = factoryContract.getPair(Address.fromString(token.id), Address.fromString(WHITELIST[i]))
    if (pairAddress.toHexString() != ADDRESS_ZERO) {
      let pair = Pair.load(pairAddress.toHexString())
      if (pair.token0 == token.id) {
        let token1 = Token.load(pair.token1)
        return pair.token1Price.times(token1.derivedFTM as BigDecimal) // return token1 per our token * FTM per token 1
      }
      if (pair.token1 == token.id) {
        let token0 = Token.load(pair.token0)
        return pair.token0Price.times(token0.derivedFTM as BigDecimal) // return token0 per our token * FTM per token 0
      }
    }
  }
  return ZERO_BD // nothing was found return 0
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD.
 * If both are, return average of two amounts
 * If neither is, return 0
 */
export function getTrackedVolumeUSD(
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token,
  pair: Pair
): BigDecimal {
  let bundle = Bundle.load('1')
  let price0 = token0.derivedFTM.times(bundle.ftmPrice)
  let price1 = token1.derivedFTM.times(bundle.ftmPrice)

  // if less than 5 LPs, require high minimum reserve amount amount or return 0
  if (pair.liquidityProviderCount.lt(BigInt.fromI32(5))) {
    let reserve0USD = pair.reserve0.times(price0)
    let reserve1USD = pair.reserve1.times(price1)
  }

  // both are whitelist tokens, take average of both amounts
  if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount0
      .times(price0)
      .plus(tokenAmount1.times(price1))
      .div(BigDecimal.fromString('2'))
  }

  // take full value of the whitelisted token amount
  if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0)
  }

  // take full value of the whitelisted token amount
  if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount1.times(price1)
  }

  // neither token is on white list, tracked volume is 0
  return ZERO_BD
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD * 2.
 * If both are, return sum of two amounts
 * If neither is, return 0
 */
export function getTrackedLiquidityUSD(
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token
): BigDecimal {
  let bundle = Bundle.load('1')
  let price0 = token0.derivedFTM.times(bundle.ftmPrice)
  let price1 = token1.derivedFTM.times(bundle.ftmPrice)

  // both are whitelist tokens, take average of both amounts
  if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0).plus(tokenAmount1.times(price1))
  }

  // take double value of the whitelisted token amount
  if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0).times(BigDecimal.fromString('2'))
  }

  // take double value of the whitelisted token amount
  if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount1.times(price1).times(BigDecimal.fromString('2'))
  }

  // neither token is on white list, tracked volume is 0
  return ZERO_BD
}
