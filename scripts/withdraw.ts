import {
    getFeeDistributorsWithUpdatedAmountsFromAlreadySplitClRewards
} from "./getFeeDistributorsWithUpdatedAmountsFromAlreadySplitClRewards";
import {buildMerkleTreeForFeeDistributorAddress} from "./helpers/buildMerkleTreeForFeeDistributorAddress";
import {logger} from "./helpers/logger";
import {makeOracleReport} from "./makeOracleReport";
import {withdrawAll} from "./withdrawAll";
import {setInitialNonce} from "./helpers/nonce";

export async function withdraw() {
    try {
        await setInitialNonce()

        const fds = await getFeeDistributorsWithUpdatedAmountsFromAlreadySplitClRewards()

        const rewardData = fds.map(fd => {
            return [fd.fdAddress, fd.amount.toString()]
        })

        const tree = buildMerkleTreeForFeeDistributorAddress(rewardData)

        await makeOracleReport(tree.root)
        logger.info('Root reported to the contract: ' + tree.root)

        await withdrawAll(fds, tree)
    } catch (error) {
        logger.error(error)
    }
}
