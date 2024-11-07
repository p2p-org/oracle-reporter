import {logger} from "./helpers/logger";
import {FeeDistributorInput} from "./models/FeeDistributorInput";
import {getFdAddressesWithPeriodsFromApi} from "./getFdAddressesWithPeriodsFromApi";
import { ethers } from "ethers"
import { Period } from "./models/Period"
import { FdWithPeriodFromApi } from "./models/FdWithPeriodFromApi"
import { getProposers } from "./getProposers"

export async function getFeeDistributorInputs() {
    logger.info('getFeeDistributorInputs started')

    if (!process.env.REFERENCE_FEE_DISTRIBUTOR) {
        throw new Error("No REFERENCE_FEE_DISTRIBUTOR in ENV")
    }

    const withManual = await getFdAddressesWithPeriodsFromApi()
    logger.info(Object.keys(withManual).length + ' fd addresses with periods from API with manual')

    const fdAddressesWithPeriodsFromApi = await filterManualSetup(withManual)
    const fsAddresses = Object.keys(fdAddressesWithPeriodsFromApi)
    logger.info(fsAddresses.length + ' fd addresses with periods from API')

    const now = new Date()

    const feeDistributorInputs: FeeDistributorInput[] = fsAddresses.map(fdAddress => {
        const periodsFromApi = fdAddressesWithPeriodsFromApi[fdAddress]

        const first = periodsFromApi[0]

        const clientConfig = {
            recipient: first.client_fee_recipient,
            basisPoints: first.client_basis_points
        }

        const referrerConfig = {
            recipient: first.referrer_fee_recipient,
            basisPoints: first['referrer_basis_points'] as number || 0
        }

        const periods: Period[] = periodsFromApi.map(pa => ({
            startDate: new Date(pa.activated_at),

            endDate: pa.deactivated_at
              ? new Date(pa.deactivated_at)
              : now,

            pubkeys: pa.validators
        })).filter(p => p.startDate < p.endDate)

        periods.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())

        return {
            fdAddress: ethers.utils.getAddress(fdAddress),

            identityParams: {
                referenceFeeDistributor: process.env.REFERENCE_FEE_DISTRIBUTOR!,
                clientConfig,
                referrerConfig
            },

            periods
        }
    })

    logger.info('getFeeDistributorInputs finished')
    return feeDistributorInputs
}

async function filterManualSetup(fds: Record<string, FdWithPeriodFromApi[]>): Promise<Record<string, FdWithPeriodFromApi[]>> {
    const proposers = await getProposers()
    const filteredFds = {};

    Object.entries(fds).forEach(([ethAddress, detailsArray]) => {
        const filteredDetails = detailsArray.filter(details => {
            const validators = details.validators;

            const matchingProposers = Object.entries(proposers)
              .filter(([, proposerDetails]) => proposerDetails.fee_recipient === ethAddress);

            return matchingProposers.every(([pubkey]) => validators.includes(pubkey));
        });

        if (filteredDetails.length > 0) {
            // @ts-ignore
            filteredFds[ethAddress] = filteredDetails;
        }
    });

    return filteredFds
}

