import {getAlreadySplitClRewards} from "./getAlreadySplitClRewards";
import {logger} from "./helpers/logger";
import {getDatedJsonFilePath} from "./helpers/getDatedJsonFilePath";
import fs from "fs";
import { getValidatorWithFeeDistributorsAndAmount } from "./getValidatorWithFeeDistributorsAndAmount"

export async function getFeeDistributorsWithUpdatedAmountsFromAlreadySplitClRewards() {
    const validatorWithFeeDistributorsAndAmounts = await getValidatorWithFeeDistributorsAndAmount()

    logger.info(validatorWithFeeDistributorsAndAmounts.length + ' validatorWithFeeDistributorsAndAmounts found')

    for (const fd of validatorWithFeeDistributorsAndAmounts) {
        try {
            const alreadySplitClRewards = await getAlreadySplitClRewards(fd.fdAddress)

            logger.info(fd.fdAddress + ' amount before alreadySplitClRewards = ' + fd.amount)
            logger.info(fd.fdAddress + ' alreadySplitClRewards = ' + alreadySplitClRewards)

            const updatedAmount = fd.amount + alreadySplitClRewards
            logger.info(fd.fdAddress + ' amount after alreadySplitClRewards = ' + updatedAmount)
            fd.amount = updatedAmount
        } catch (error) {
            logger.error(error)
        }
    }

    const filePath = getDatedJsonFilePath('fee-distributors-with-legacy-already-split-amounts')
    logger.info('Saving fee-distributors-with-legacy-already-split-amounts to ' + filePath)
    fs.writeFileSync(filePath, JSON.stringify(validatorWithFeeDistributorsAndAmounts))
    logger.info('fee-distributors-with-legacy-already-split-amounts saved')

    logger.info(
      validatorWithFeeDistributorsAndAmounts.length
        + ' feeDistributors amount were updated'
    )

    return validatorWithFeeDistributorsAndAmounts
}
