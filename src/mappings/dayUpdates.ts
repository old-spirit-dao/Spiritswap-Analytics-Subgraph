import { PairHourData } from './../types/schema'
/* eslint-disable prefer-const */
import { BigInt, BigDecimal, EthereumEvent } from '@graphprotocol/graph-ts'
import { Pair, Bundle, Token, SpiritswapFactory, SpiritswapDayData, PairDayData, TokenDayData } from '../types/schema'
import { ONE_BI, ZERO_BD, ZERO_BI, FACTORY_ADDRESS } from './helpers'

// max number of entities to store
const maxTokenDayDatas = 10
const maxPairDayDatas = 10

export function updateHyperswapDayData(event: EthereumEvent): void {
  let hyperswap = SpiritswapFactory.load(FACTORY_ADDRESS)
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let hyperswapDayData = SpiritswapDayData.load(dayID.toString())
  if (hyperswapDayData == null) {
    let hyperswapDayData = new SpiritswapDayData(dayID.toString())
    hyperswapDayData.date = dayStartTimestamp
    hyperswapDayData.dailyVolumeUSD = ZERO_BD
    hyperswapDayData.dailyVolumeFTM = ZERO_BD
    hyperswapDayData.totalVolumeUSD = ZERO_BD
    hyperswapDayData.totalVolumeFTM = ZERO_BD
    hyperswapDayData.dailyVolumeUntracked = ZERO_BD
    hyperswapDayData.totalLiquidityUSD = ZERO_BD
    hyperswapDayData.totalLiquidityFTM = ZERO_BD
    hyperswapDayData.maxStored = maxTokenDayDatas
    hyperswapDayData.mostLiquidTokens = hyperswap.mostLiquidTokens
    hyperswapDayData.txCount = ZERO_BI
    hyperswapDayData.save()
  }
  hyperswapDayData = SpiritswapDayData.load(dayID.toString())
  hyperswapDayData.totalLiquidityUSD = hyperswap.totalLiquidityUSD
  hyperswapDayData.totalLiquidityFTM = hyperswap.totalLiquidityFTM
  hyperswapDayData.txCount = hyperswap.txCount
  hyperswapDayData.save()
}

export function updatePairDayData(event: EthereumEvent): void {
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let dayPairID = event.address
    .toHexString()
    .concat('-')
    .concat(BigInt.fromI32(dayID).toString())
  let pair = Pair.load(event.address.toHexString())
  let pairDayData = PairDayData.load(dayPairID)
  if (pairDayData == null) {
    let pairDayData = new PairDayData(dayPairID)
    let pair = Pair.load(event.address.toHexString())
    pairDayData.totalSupply = pair.totalSupply
    pairDayData.date = dayStartTimestamp
    pairDayData.token0 = pair.token0
    pairDayData.token1 = pair.token1
    pairDayData.pairAddress = event.address
    pairDayData.reserve0 = ZERO_BD
    pairDayData.reserve1 = ZERO_BD
    pairDayData.reserveUSD = ZERO_BD
    pairDayData.dailyVolumeToken0 = ZERO_BD
    pairDayData.dailyVolumeToken1 = ZERO_BD
    pairDayData.dailyVolumeUSD = ZERO_BD
    pairDayData.dailyTxns = ZERO_BI
    pairDayData.save()
  }
  pairDayData = PairDayData.load(dayPairID)
  pairDayData.totalSupply = pair.totalSupply
  pairDayData.reserve0 = pair.reserve0
  pairDayData.reserve1 = pair.reserve1
  pairDayData.reserveUSD = pair.reserveUSD
  pairDayData.dailyTxns = pairDayData.dailyTxns.plus(ONE_BI)
  pairDayData.save()
}

export function updatePairHourData(event: EthereumEvent): void {
  let timestamp = event.block.timestamp.toI32()
  let hourIndex = timestamp / 3600 // get unique hour within unix history
  let hourStartUnix = hourIndex * 3600 // want the rounded effect
  let hourPairID = event.address
    .toHexString()
    .concat('-')
    .concat(BigInt.fromI32(hourIndex).toString())
  let pair = Pair.load(event.address.toHexString())
  let pairHourData = PairHourData.load(hourPairID)
  if (pairHourData == null) {
    let pairHourData = new PairHourData(hourPairID)
    pairHourData.hourStartUnix = hourStartUnix
    pairHourData.pair = event.address.toHexString()
    pairHourData.reserve0 = ZERO_BD
    pairHourData.reserve1 = ZERO_BD
    pairHourData.reserveUSD = ZERO_BD
    pairHourData.hourlyVolumeToken0 = ZERO_BD
    pairHourData.hourlyVolumeToken1 = ZERO_BD
    pairHourData.hourlyVolumeUSD = ZERO_BD
    pairHourData.hourlyTxns = ZERO_BI
    pairHourData.save()
  }
  pairHourData = PairHourData.load(hourPairID)
  pairHourData.reserve0 = pair.reserve0
  pairHourData.reserve1 = pair.reserve1
  pairHourData.reserveUSD = pair.reserveUSD
  pairHourData.hourlyTxns = pairHourData.hourlyTxns.plus(ONE_BI)
  pairHourData.save()
}

export function updateTokenDayData(token: Token, event: EthereumEvent): void {
  let bundle = Bundle.load('1')
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let tokenDayID = token.id
    .toString()
    .concat('-')
    .concat(BigInt.fromI32(dayID).toString())

  let tokenDayData = TokenDayData.load(tokenDayID)
  if (tokenDayData == null) {
    let tokenDayData = new TokenDayData(tokenDayID)
    tokenDayData.date = dayStartTimestamp
    tokenDayData.token = token.id
    tokenDayData.priceUSD = token.derivedFTM.times(bundle.ftmPrice)
    tokenDayData.dailyVolumeToken = ZERO_BD
    tokenDayData.dailyVolumeFTM = ZERO_BD
    tokenDayData.dailyVolumeUSD = ZERO_BD
    tokenDayData.dailyTxns = ZERO_BI
    tokenDayData.totalLiquidityToken = ZERO_BD
    tokenDayData.totalLiquidityFTM = ZERO_BD
    tokenDayData.totalLiquidityUSD = ZERO_BD
    tokenDayData.maxStored = maxPairDayDatas
    tokenDayData.mostLiquidPairs = token.mostLiquidPairs
    tokenDayData.save()
  }
  tokenDayData = TokenDayData.load(tokenDayID)
  tokenDayData.priceUSD = token.derivedFTM.times(bundle.ftmPrice)
  tokenDayData.totalLiquidityToken = token.totalLiquidity
  tokenDayData.totalLiquidityFTM = token.totalLiquidity.times(token.derivedFTM as BigDecimal)
  tokenDayData.totalLiquidityUSD = tokenDayData.totalLiquidityFTM.times(bundle.ftmPrice)
  tokenDayData.dailyTxns = tokenDayData.dailyTxns.plus(ONE_BI)
  tokenDayData.save()

  /**
   * @todo test if this speeds up sync
   */
  // updateStoredTokens(tokenDayData as TokenDayData, dayID)
  // updateStoredPairs(tokenDayData as TokenDayData, dayPairID)
}
