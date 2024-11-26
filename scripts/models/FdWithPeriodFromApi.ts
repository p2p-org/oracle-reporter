export interface FdWithPeriodFromApi {
    "activated_at": string,
    "deactivated_at": string | undefined,

    "address": string,
    "client_basis_points": number,
    "client_fee_recipient": string,

    "id": number,

    "referrer_fee_recipient": string,
    "referrer_basis_points": number | undefined,

    "sessions": string[],
    "validators": string[]
}
