import "dotenv/config"
import {logger} from "./scripts/helpers/logger";
import {
    getFeeDistributorsWithUpdatedAmountsFromAlreadySplitClRewards
} from "./scripts/getFeeDistributorsWithUpdatedAmountsFromAlreadySplitClRewards";
import {getAllBalances} from "./scripts/getAllBalances";

async function main() {
    logger.info('04-balances started')

    const fds = await getFeeDistributorsWithUpdatedAmountsFromAlreadySplitClRewards()

    const feeDistributorsAddresses = fds.map(fd => fd.fdAddress)

    await getAllBalances(feeDistributorsAddresses, 'balances-before')

    logger.info('04-balances finished')
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

