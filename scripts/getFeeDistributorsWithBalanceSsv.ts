import {logger} from "./helpers/logger";
import {getBalance} from "./helpers/getBalance";
import {ethers} from "ethers";
import {FeeDistributorToWithdraw} from "./models/FeeDistributorToWithdraw";
import {getP2pSsvProxyAddresses} from "./ssv/getP2pSsvProxyAddresses";
import {getP2pSsvProxyAddresses_3_1} from "./ssv/getP2pSsvProxyAddresses_3_1";
import {getSsvPubKeysPerProxy} from "./ssv/getSsvPubKeysPerProxy";
import {
    getSsvFeeRecipientAddressesWithTimestampsPerProxy
} from "./ssv/getSsvFeeRecipientAddressesWithTimestampsPerProxy";

export async function getFeeDistributorsWithBalanceSsv() {
    logger.info('getFeeDistributorsWithBalanceSsv started')

    if (!process.env.MIN_BALANCE_TO_WITHDRAW_IN_GWEI) {
        throw new Error("No MIN_BALANCE_TO_WITHDRAW_IN_GWEI in ENV")
    }

    const periods: {recipientAddress: string, from: Date, to: Date | null, pubkeys: string[]}[] = []

    const proxyAddresses = await getP2pSsvProxyAddresses()
    const proxyAddresses_3_1 = await getP2pSsvProxyAddresses_3_1()
    proxyAddresses.push(...proxyAddresses_3_1)

    for (const proxyAddress of proxyAddresses) {
        const feeRecipientAddressesWithTimestamps = await getSsvFeeRecipientAddressesWithTimestampsPerProxy(proxyAddress)
        const pubkeys = await getSsvPubKeysPerProxy(proxyAddress)

        // First Pass: Group by recipientAddress and find the minimum timestamp for each group.
        const minTimestampsByRecipient: { [key: string]: Date } = {};
        feeRecipientAddressesWithTimestamps.forEach(({ recipientAddress, timestamp }) => {
            if (!minTimestampsByRecipient[recipientAddress]) {
                minTimestampsByRecipient[recipientAddress] = timestamp;
            } else if (timestamp < minTimestampsByRecipient[recipientAddress]) {
                minTimestampsByRecipient[recipientAddress] = timestamp;
            }
        })

        // Second Pass: Determine the 'to' value for each group.
        const groupedByRecipientAddress: { [key: string]: { from: Date; to: Date | null } } = {};

        feeRecipientAddressesWithTimestamps.forEach(({ recipientAddress, timestamp }) => {
            if (!groupedByRecipientAddress[recipientAddress]) {
                groupedByRecipientAddress[recipientAddress] = { from: minTimestampsByRecipient[recipientAddress], to: null };
            }

            for (const [otherAddress, otherTimestamp] of Object.entries(minTimestampsByRecipient)) {
                if (otherAddress !== recipientAddress) {
                    if (
                      (groupedByRecipientAddress[recipientAddress].to === null && groupedByRecipientAddress[recipientAddress].from < otherTimestamp) ||
                      (otherTimestamp < groupedByRecipientAddress[recipientAddress].to!)
                    ) {
                        groupedByRecipientAddress[recipientAddress].to = otherTimestamp;
                    }
                }
            }
        })

        const feeDistributorsPerProxy = Object.keys(groupedByRecipientAddress).map(recipientAddress => ({
            recipientAddress,
            from: groupedByRecipientAddress[recipientAddress].from,
            to: groupedByRecipientAddress[recipientAddress].to,
            pubkeys
        }))

        periods.push(...feeDistributorsPerProxy)
    }

    const now = new Date()

    const feeDistributorsWithBalance: FeeDistributorToWithdraw[] = []

    for (const period of periods) {
        try {

            const balance = await getBalance(period.recipientAddress)
            logger.info(
                'Balance of '
                + period.recipientAddress
                + ' is '
                + ethers.utils.formatUnits(balance, "ether")
                + 'ETH'
            )

            if (balance.lt(ethers.utils.parseUnits(process.env.MIN_BALANCE_TO_WITHDRAW_IN_GWEI, "gwei"))) {
                logger.info(
                    'Balance of '
                    + period.recipientAddress
                    + ' is less than minimum to withdraw. Will not withdraw.'
                )
                continue
            }

            const existingFd = feeDistributorsWithBalance.find(f => f.fdAddress === period.recipientAddress)
            const currentPeriod = {
                pubkeys: period.pubkeys,
                startDate: period.from,
                endDate: period.to && period.from !== period.to ? period.to : now
            }

            if (existingFd) {
                existingFd.periods.push(currentPeriod)
            } else {
                feeDistributorsWithBalance.push({
                    fdAddress: period.recipientAddress,
                    identityParams: null,
                    balance,
                    periods: [currentPeriod],
                    newClientBasisPoints: null,
                    amount: 0
                })
            }
        } catch (error) {
            logger.error(error)
        }
    }

    logger.info('getFeeDistributorsWithBalanceSsv finished')
    return feeDistributorsWithBalance
}
