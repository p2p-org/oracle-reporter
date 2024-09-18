import {logger} from "../helpers/logger";
import {ethers} from "ethers";
import {getSsvNetworkContract} from "../helpers/getSsvNetworkContract";

export async function getSsvPubKeysPerProxy(proxyAddress: string) { // same for 3.1
    logger.info('getSsvPubKeysPerProxy started for ' + proxyAddress)

    const ssvNetwork = getSsvNetworkContract()

    const logs = await ssvNetwork.queryFilter(ssvNetwork.filters.ValidatorAdded(proxyAddress))

    const publicKeys: string[] = logs.map(log => log.args?.publicKey)

    logger.info('getSsvPubKeysPerProxy finished for ' + proxyAddress)

    return publicKeys
}
