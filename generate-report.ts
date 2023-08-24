import "dotenv/config"
import {logger} from "./scripts/helpers/logger";
import fs from "fs"
import {getProposers} from "./scripts/getProposers";
import {getValidatorIndexesFromBigQuery} from "./scripts/getValidatorIndexesFromBigQuery";
import {getRowsFromBigQuery} from "./scripts/getRowsFromBigQuery";
import {ValidatorWithFeeDistributorsAndAmount} from "./scripts/models/ValidatorWithFeeDistributorsAndAmount";
import {FeeDistributorWithAmount} from "./scripts/models/FeeDistributorWithAmount";
import {getValidatorWithFeeDistributorsAndAmount} from "./scripts/getValidatorWithFeeDistributorsAndAmount";

async function main() {
    const validatorWithFeeDistributorsAndAmounts = await getValidatorWithFeeDistributorsAndAmount()

    const feeDistributorsWithAmounts = validatorWithFeeDistributorsAndAmounts.reduce((
        accumulator: FeeDistributorWithAmount[],
        validator
    ) => {
        const existingEntry = accumulator.find(
            entry => entry.feeDistributor === validator.feeDistributor
        )

        if (existingEntry) {
            existingEntry.amount += validator.amount;
        } else {
            const newEntry: FeeDistributorWithAmount = {
                feeDistributor: validator.feeDistributor,
                amount: validator.amount
            }

            accumulator.push(newEntry);
        }

        return accumulator;
    }, [])

    // const rewardDataPromises = feeDistributors.map(async fd => {
    //     const amount = await getClRewards(fd)
    //     return [fd, amount.toString()]
    // })
    // const rewardData = await Promise.all(rewardDataPromises)
    // const tree = buildMerkleTreeForFeeDistributorAddress(rewardData)
    // await makeOracleReport('0xe3c1E6958da770fBb492f8b6B85ea00ABb81E8f9', tree.root)
    // // // Send tree.json file to the website and to the withdrawer
    // fs.writeFileSync("tree.json", JSON.stringify(tree.dump()));
    //
    // await withdrawAll(feeDistributorFactoryAddress)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

