import {logger} from "../helpers/logger";
import {ethers} from "ethers";

export async function getP2pSsvProxyAddresses_3_1() {
    logger.info('getP2pSsvProxyAddresses_3_1 started')

    if (!process.env.RPC_URL) {
        throw new Error("No RPC_URL in ENV")
    }
    if (!process.env.P2P_SSV_PROXY_FACTORY_ADDRESS_3_1) {
        throw new Error("No P2P_SSV_PROXY_FACTORY_ADDRESS_3_1 in ENV")
    }

    const eventSignature = ethers.utils.id("P2pSsvProxyFactory__P2pSsvProxyCreated(address,address,address)");

    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)

    const filter = {
        address: process.env.P2P_SSV_PROXY_FACTORY_ADDRESS_3_1,
        fromBlock: 0,
        toBlock: 'latest',
        topics: [ eventSignature ]
    };

    const logs = await provider.getLogs(filter)

    if (!logs.length) {
        logger.info('No P2pSsvProxyFactory__P2pSsvProxyCreated logs found')
        logger.info('getP2pSsvProxyAddresses finished')
        return []
    } else {
        const addresses: string[] = []

        for (const log of logs) {
            const decodedLog = new ethers.utils.Interface([
                'event P2pSsvProxyFactory__P2pSsvProxyCreated(\n' +
                '        address indexed _p2pSsvProxy,\n' +
                '        address indexed _client,\n' +
                '        address indexed _feeDistributor\n' +
                '    )'
            ]).parseLog(log);
            const p2pSsvProxyAddress = decodedLog.args._p2pSsvProxy
            addresses.push(p2pSsvProxyAddress)
        }

        logger.info('getP2pSsvProxyAddresses_3_1 finished')

        return addresses
    }
}
