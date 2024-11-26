import {logger} from "../helpers/logger";
import {ethers} from "ethers";
import {getSsvNetworkContract} from "../helpers/getSsvNetworkContract";
import { sleep } from "../helpers/sleep"

export async function getSsvPubKeysPerProxy(proxyAddress: string): Promise<string[]> { // same for 3.1
    logger.info('getSsvPubKeysPerProxy started for ' + proxyAddress)

    const ssvNetwork = getSsvNetworkContract()

    try {
        const logs = await ssvNetwork.queryFilter(ssvNetwork.filters.ValidatorAdded(proxyAddress), 19326041, "latest")

        const publicKeys: string[] = logs.map(log => log.args?.publicKey)

        logger.info('getSsvPubKeysPerProxy finished for ' + proxyAddress)

        return publicKeys
    } catch (error) {
        logger.error(error)

        logger.info('Sleeping for 5 sec...')
        await sleep(5000)
        logger.info('Re-trying ' + proxyAddress)

        return await getSsvPubKeysPerProxy(proxyAddress)
    }
}
