import "dotenv/config"
import {buildMerkleTreeForFeeDistributorAddress} from "./scripts/helpers/buildMerkleTreeForFeeDistributorAddress";
import {logger} from "./scripts/helpers/logger";
import {
    getFeeDistributorsWithUpdatedAmountsFromAlreadySplitClRewards
} from "./scripts/getFeeDistributorsWithUpdatedAmountsFromAlreadySplitClRewards";

async function main() {
    logger.info('05-merkle-tree started')

    const fds = await getFeeDistributorsWithUpdatedAmountsFromAlreadySplitClRewards()

    const rewardData = fds.map(fd => {
        return [fd.fdAddress, fd.amount.toString()]
    })

    buildMerkleTreeForFeeDistributorAddress(rewardData)

    logger.info('05-merkle-tree finished')
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

