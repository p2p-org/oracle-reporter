import {getValidatorIndexesFromBigQuery} from "./getValidatorIndexesFromBigQuery";
import {getRowsFromBigQuery} from "./getRowsFromBigQuery";
import {logger} from "./helpers/logger";
import {getDatedJsonFilePath} from "./helpers/getDatedJsonFilePath";
import fs from "fs";
import {getFeeDistributorInputs} from "./getFeeDistributorInputs";
import {getFeeDistributorsWithBalance} from "./getFeeDistributorsWithBalance";
import { getFeeDistributorsWithBalanceSsv } from "./getFeeDistributorsWithBalanceSsv"
import { getLastDistributionDate } from "./helpers/getLastDistributionDate"

export async function getValidatorWithFeeDistributorsAndAmount() {
    logger.info('getValidatorWithFeeDistributorsAndAmount started')

    const feeDistributorInputs = await getFeeDistributorInputs()

    const feeDistributorsWithBalance = await getFeeDistributorsWithBalance(feeDistributorInputs)
    logger.info(feeDistributorsWithBalance.length + ' feeDistributorsWithBalance')

    const filePath_feeDistributorsWithBalance = getDatedJsonFilePath('feeDistributorsWithBalance')
    logger.info('Saving feeDistributorsWithBalance to ' + filePath_feeDistributorsWithBalance)
    fs.writeFileSync(filePath_feeDistributorsWithBalance, JSON.stringify(feeDistributorsWithBalance))
    logger.info('feeDistributorsWithBalance saved')

    const feeDistributorsWithBalanceSsv = await getFeeDistributorsWithBalanceSsv()
    logger.info(feeDistributorsWithBalanceSsv.length + ' feeDistributorsWithBalanceSsv')

    feeDistributorsWithBalance.push(...feeDistributorsWithBalanceSsv)

    for (const fd of feeDistributorsWithBalance) {
        let fdAmount = 0

        const lastDistributionDate = await getLastDistributionDate(fd.fdAddress)
        if (lastDistributionDate) {
            fd.periods = fd.periods.filter(p => p.endDate > lastDistributionDate)

            for (const period of fd.periods) {
                if (period.startDate < lastDistributionDate) {
                    period.startDate = lastDistributionDate
                }
            }
        }

        for (const period of fd.periods) {
            const pubkeys = period.pubkeys

            logger.info(pubkeys.length + ' pubkeys for ' + fd.fdAddress + ' '
              + period.startDate.toISOString() + ' ' + period.endDate.toISOString()
            )

            try {
                const pubkeysWithIndexes = await getValidatorIndexesFromBigQuery(pubkeys)

                logger.info(pubkeysWithIndexes.length + ' pubkeysWithIndexes for ' + fd.fdAddress + ' '
                  + period.startDate.toISOString() + ' ' + period.endDate.toISOString()
                )

                if (!pubkeysWithIndexes.length) {
                    logger.info('Cannnot proceed without pubkeysWithIndexes. Skipping...')
                    continue
                }

                const val_ids = pubkeysWithIndexes.map(r => r.val_id)
                const indexesWithAmounts = await getRowsFromBigQuery(
                  val_ids,
                  period.startDate,
                  period.endDate
                )

                let periodAmount = 0

                for (const pubkey of pubkeys) {
                    const val_id = pubkeysWithIndexes.find(r => r.val_pubkey === pubkey)?.val_id
                    if (!val_id) {
                        logger.info('val_id not found for ' + pubkey)
                        continue
                    }

                    let amount = indexesWithAmounts.find(r => r.val_id === val_id)?.val_amount
                    if (!amount) {
                        logger.info('amount not found for ' + pubkey)
                        continue
                    }

                    logger.info(pubkey + ' amount = ' + amount)

                    periodAmount += amount
                }

                fdAmount += periodAmount
            } catch (error) {
                logger.error('Error happenned ' + error + ' for ' + fd.fdAddress + ' '
                  + period.startDate.toISOString() + ' ' + period.endDate.toISOString()
                )

                throw error
            }
        }

        fd.amount = fdAmount
    }

    const filePath = getDatedJsonFilePath('amounts-for-pubkeys')
    logger.info('Saving amounts-for-pubkeys to ' + filePath)
    fs.writeFileSync(filePath, JSON.stringify(feeDistributorsWithBalance))
    logger.info('amounts-for-pubkeys saved')

    return feeDistributorsWithBalance
}
