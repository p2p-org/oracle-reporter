import axios from "axios";
import {logger} from "./helpers/logger";
import {FdWithPeriodFromApi} from "./models/FdWithPeriodFromApi";

export async function getFdAddressesWithPeriodsFromApi() : Promise<Record<string, FdWithPeriodFromApi[]>> {
    logger.info('getFdAddressesWithPeriodsFromApi started')

    if (!process.env.DISTRIBUTORS_URL) {
        throw new Error("No DISTRIBUTORS_URL in ENV")
    }

    const result = await axios.get(process.env.DISTRIBUTORS_URL!)

    const array = result.data as Record<string, FdWithPeriodFromApi[]>

    logger.info('getFdAddressesWithPeriodsFromApi finished')
    return array
}
