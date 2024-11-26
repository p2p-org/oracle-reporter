import {logger} from "./helpers/logger";
import {FeeDistributorInput} from "./models/FeeDistributorInput";
import {getBalance} from "./helpers/getBalance";
import {ethers} from "ethers";
import {predictFeeDistributorAddress} from "./predictFeeDistributorAddress";
import {FeeDistributorToWithdraw} from "./models/FeeDistributorToWithdraw";
import {getSeconds} from "./helpers/getSeconds";
import { Period } from "./models/Period"

export async function getFeeDistributorsWithBalance(feeDistributorInputs: FeeDistributorInput[]) {
    logger.info('getFeeDistributorsWithBalance started')

    if (!process.env.MIN_BALANCE_TO_WITHDRAW_IN_GWEI) {
        throw new Error("No MIN_BALANCE_TO_WITHDRAW_IN_GWEI in ENV")
    }

    const fdsWithoutBalance: {
        clientAddress: string,
        basisPoints: number,
        periods: Period[]
    }[] = []

    const feeDistributorsWithBalance: FeeDistributorToWithdraw[] = []

    for (const input of feeDistributorInputs) {
        try {
            const feeDistributorsAddress = input.fdAddress || await predictFeeDistributorAddress(input)

            const balance = await getBalance(feeDistributorsAddress)
            logger.info(
                'Balance of '
                + feeDistributorsAddress
                + ' is '
                + ethers.utils.formatUnits(balance, "ether")
                + 'ETH'
            )

            if (balance.lt(ethers.utils.parseUnits(process.env.MIN_BALANCE_TO_WITHDRAW_IN_GWEI, "gwei"))) {
                logger.info(
                    'Balance of '
                    + feeDistributorsAddress
                    + ' is less than minimum to withdraw. Will not withdraw.'
                )

                if (input.identityParams) {
                    fdsWithoutBalance.push({
                        clientAddress: input.identityParams.clientConfig.recipient,
                        basisPoints: input.identityParams.clientConfig.basisPoints,
                        periods: input.periods
                    })
                }

                continue
            }

            feeDistributorsWithBalance.push({
                ...input,

                balance,
                newClientBasisPoints: null,
                amount: 0
            })
        } catch (error) {
            logger.error(error)
        }
    }

    if (fdsWithoutBalance.length) {
        logger.info(fdsWithoutBalance.length + ' fdsWithoutBalance')

        for (const fdWithoutBalance of fdsWithoutBalance) {
            const fdsWithBalanceForClient = feeDistributorsWithBalance.filter(
                fd => fd.identityParams?.clientConfig.recipient === fdWithoutBalance.clientAddress
            )
            const fdsWithoutBalanceForClient = fdsWithoutBalance.filter(
              fd => fd.clientAddress === fdWithoutBalance.clientAddress && fd !== fdWithoutBalance
            )

            if (fdsWithBalanceForClient.length) {
                const fdWithMaxBalance = fdsWithBalanceForClient.reduce(
                  (max, fd) =>
                    fd.balance.gt(max.balance) ? fd : max,
                  fdsWithBalanceForClient[0]
                )

                if (fdWithMaxBalance.identityParams) {
                    for (const period of fdWithoutBalance.periods) {
                        if (fdWithMaxBalance.periods.some(p =>
                          p.startDate.getTime() === period.startDate.getTime() &&
                          p.endDate.getTime() === period.endDate.getTime() &&
                          p.pubkeys.some(pk => period.pubkeys.some(ppk => ppk === pk))
                        )) {
                            continue
                        }

                        fdWithMaxBalance.periods.push(period)
                        fdWithMaxBalance.newClientBasisPoints = null // TODO: need a weighted average
                    }
                }
            }
        }
    }

    logger.info('getFeeDistributorsWithBalance finished')
    return feeDistributorsWithBalance
}
