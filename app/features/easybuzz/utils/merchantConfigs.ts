// @ts-nocheck

const DEFAULT_ADDRESS_HTML = 'Address details not configured';

const MERCHANT_CONFIGS = {
    easybuzz: {
        sparkleap: {
            key: 'sparkleap',
            displayName: 'Sparkleap',
            companyName: 'SPARKLEAP TECH SOFTWARE SOLUTIONS PRIVATE LIMITED',
            address: 'NO 195, VINAYAKAR KOVIL, STREET, VANUR TK, Eraiyur,<br/>Tindivanam, Villupuram- 604304 IN<br/>GST: 33ABOCS4605D1ZI',
            receiptEntityName: 'SPKL',
            logoPath: '/assets/merchants/easybuzz-logo.png',
            themeColor: '#1f4b99',
            aliases: ['sparkleap', 'spkl'],
        },
    },
    others: {
        apextech: {
            key: 'apextech',
            displayName: 'APEXTECH',
            companyName: 'APEXTECH SOFTWARE SOLUTIONS PRIVATE LIMITED',
            address: 'NO 32, NEDU STREET, VISWANATHAPURAM, NELLIKKUPPAM, PANRUTI, CUDDALORE - 607105<br/>GST: 33ABACA7708F1Z0',
            receiptEntityName: 'APLP',
            logoPath: '/assets/merchants/Apextech.png',
            themeColor: '#1f4b99',
            aliases: ['apextech', 'apextechsoftwaresolutionsprivatelimited'],
        },
        bytes_napse: {
            key: 'bytes_napse',
            displayName: 'BYTESYNAPSE',
            companyName: 'BYTESYNAPSE SOFTWARE SOLUTIONS PRIVATE LIMITED',
            address: 'NO 27, 2ND CROSS, NORTH STREET, THENGAITHITTU, PONDICHERRY - 607105<br/>GST: 34AANCB0540Q1ZF',
            receiptEntityName: 'BNLP',
            logoPath: '/assets/merchants/BYtes Napse.png',
            themeColor: '#1f4b99',
            aliases: [
                'bytesynapse',
                'bytesynapsesoftwaresolutionsprivatelimited',
                'bytes synapse',
                'bytes napse',
                'bytes_napse',
            ],
        },
        bytes_sparkz: {
            key: 'bytes_sparkz',
            displayName: 'BYTESPARKZ',
            companyName: 'BYTESPARKZ SOFTWARE SOLUTIONS PRIVATE LIMITED',
            address: 'NO 32, NEDU STREET, VISWANATHAPURAM, NELLIKKUPPAM, PANRUTI, CUDDALORE - 607105<br/>GST: 33AANCB1761F1ZV',
            receiptEntityName: 'BSLP',
            logoPath: '/assets/merchants/BYtes Sparkz.png',
            themeColor: '#7a2e1f',
            aliases: ['bytessparkz', 'bytes sparkz', 'bytes_sparkz', 'bytesparkzsoftwaresolutionsprivatelimited'],
        },
        byte_bliss: {
            key: 'byte_bliss',
            displayName: 'BYTEBLISS',
            companyName: 'BYTEBLISS SOFTWARE SOLUTIONS PRIVATE LIMITED',
            address: 'NO 15, 2 CRS, POONGAVANAM GARDEN, MANAVELY, ARIYANKUPPAM, PONDICHERRY - 605007<br/>GST: 34AAMCB6861D1ZN',
            receiptEntityName: 'BBLP',
            logoPath: '/assets/merchants/Byte Bliss.png',
            themeColor: '#0f4c5c',
            aliases: ['bytebliss', 'byte bliss', 'byteblisssoftwaresolutionsprivatelimited'],
        },
        byteevolve: {
            key: 'byteevolve',
            displayName: 'BYTEEVOLVE',
            companyName: 'BYTEEVOLVE SOFTWARE SOLUTIONS PRIVATE LIMITED',
            address: 'SF.NO.250/9, NO 195A, VINAYAGAR KOIL STREET, ERAIYUR, TINDIVANAM, VILLUPURAM - 604304, TAMIL NADU<br/>GST: 33AANCBI768N1Z7',
            receiptEntityName: 'BELP',
            logoPath: '/assets/merchants/Byteevolve.png',
            themeColor: '#184e77',
            aliases: ['byteevolve', 'byteevolvesoftwaresolutionsprivatelimited'],
        },
        cipher_byte: {
            key: 'cipher_byte',
            displayName: 'CIPHER BYTE',
            companyName: 'CIPHER BYTE SOFTWARE SOLUTIONS PRIVATE LIMITED',
            address: 'NO 4, NATTAR STREET, SECOND CROSS, MOUROUNGAPAKKAM, PONDICHERRY - 607105<br/>GST: 34AAMCC1682K1ZE',
            receiptEntityName: 'CBLP',
            logoPath: '/assets/merchants/CIPHER BYTE.png',
            themeColor: '#374151',
            aliases: [
                'cipherbyte',
                'cipherbytesoftwaresolutionsprivatelimited',
                'cipher byte',
                'cipherbytesoftwaresolutionsprivatelimited',
            ],
        },
        code_horizon: {
            key: 'code_horizon',
            displayName: 'CODEHORIZON',
            companyName: 'CODEHORIZON SOFTWARE SOLUTIONS PVT LTD',
            address: 'NO 424, MAIN ROAD NPM, NELLIKKUPPAM, PANRUTI, CUDDALORE, TAMIL NADU - 607105<br/>GST: 33AAMCC3726A1Z4',
            receiptEntityName: 'CHLP',
            logoPath: '/assets/merchants/Code Horizon.png',
            themeColor: '#0f4c81',
            aliases: [
                'codehorizon',
                'codehorizonsoftwaresolutionsprivatelimited',
                'codehorizonsoftwaresolutionspvtltd',
                'code horizon',
            ],
        },
        logic_nook: {
            key: 'logic_nook',
            displayName: 'LOGICNOOK',
            companyName: 'LOGICNOOK SOFTWARE SOLUTIONS PRIVATE LIMITED',
            address: 'NO 29, GOPU NAGAR, PADIRIKUPPAM, CUDDALORE - 607401<br/>GST: 33AAGCL0103N1ZT',
            receiptEntityName: 'LNLP',
            logoPath: '/assets/merchants/Logic Nook.png',
            themeColor: '#5b2c83',
            aliases: [
                'logicnook',
                'logicnooksoftwaresolutionsprivatelimited',
                'logic nook',
            ],
        },
        novalogic: {
            key: 'novalogic',
            displayName: 'NOVALOGIC',
            companyName: 'NOVALOGIC SOFTWARE SOLUTIONS PRIVATE LIMITED',
            address: 'NO 15, 2 CRS, POONGAVANAM GARDEN, MANAVELY, ARIYANKUPPAM, PONDICHERRY - 605007<br/>GST: 34AAKCN1154D1ZT',
            receiptEntityName: 'NLLP',
            logoPath: '/assets/merchants/NOVALOGIC.png',
            themeColor: '#2f4858',
            aliases: ['novalogic', 'novalogicsoftwaresolutionsprivatelimited'],
        },
        orionbyte: {
            key: 'orionbyte',
            displayName: 'ORIONBYTE',
            companyName: 'ORIONBYTE SOFTWARE SOLUTIONS PRIVATE LIMITED',
            address: 'NO 424, MAIN ROAD, NELLIKKUPPAM, PANRUTI, CUDDALORE - 607105<br/>GST: 33AAECO4187B1ZP',
            receiptEntityName: 'ONLP',
            logoPath: '/assets/merchants/Orionbyte.png',
            themeColor: '#1d3557',
            aliases: ['orionbyte', 'orionbytesoftwaresolutionsprivatelimited'],
        },
        shadaus: {
            key: 'shadaus',
            displayName: 'SHADAUS',
            companyName: 'SHADAUS SOFTWARE SOLUTIONS PRIVATE LIMITED',
            address: 'NO 424, MAIN ROAD, NELLIKKUPPAM, PANRUTI, CUDDALORE - 607105, TAMIL NADU<br/>GST: 33ABOCS7237H1Z0',
            receiptEntityName: 'SDUS',
            logoPath: '/assets/merchants/Shadaus.png',
            themeColor: '#6b3f2a',
            aliases: ['shadaus', 'shadaussoftwaresolutionsprivatelimited'],
        },
        techterra: {
            key: 'techterra',
            displayName: 'TECHTERRA',
            companyName: 'TECHTERRA SOFTWARE SOLUTIONS PRIVATE LIMITED',
            address: 'NO 15, MANDAPA STREET, TYR-1 ANAIKUDI, THIRUVAIYARU, THANJAVUR - 613204<br/>GST: 33AALCT6101F1ZN',
            receiptEntityName: 'TTLP',
            logoPath: '/assets/merchants/Techterra.png',
            themeColor: '#6d4c41',
            aliases: [
                'techterra',
                'tectera',
                'tecterra',
                'techterrasoftwaresolutionsprivatelimited',
            ],
        },
        voltiq: {
            key: 'voltiq',
            displayName: 'VoltIQ',
            companyName: 'VOLT IQ SOFTWARE SOLUTIONS PRIVATE LIMITED',
            address: 'NO 15, MANDAPA STREET, THIRUVAIYARU, ANAIKUDY, THANJAVUR - 607105<br/>GST: 33AAKCV1375L1ZZ',
            receiptEntityName: 'VIQLP',
            logoPath: '/assets/merchants/VoltIQ.png',
            themeColor: '#0f766e',
            aliases: [
                'voltiq',
                'voltiqsoftwaresolutionsprivatelimited',
                'volt iq',
            ],
        },
        zoving_business: {
            key: 'zoving_business',
            displayName: 'ZOVING BUSINESS',
            companyName: 'ZOVING BUSINESS SOFTWARE SOLUTIONS PRIVATE LIMITED',
            address: '32, NEDU STREET, VISWANATHAPURAM, PANRUTI, NELLIKKUPPAM, CUDDALORE - 607105<br/>GST: 33AACCZ5103E1ZS',
            receiptEntityName: 'ZVLP',
            logoPath: '/assets/merchants/Zoving business.png',
            themeColor: '#7c3aed',
            aliases: ['zovingbusiness', 'zoving business', 'zovingbusinesssoftwaresolutionsprivatelimited'],
        },
    },
};

const FALLBACK_CONFIGS = {
    easybuzz: MERCHANT_CONFIGS.easybuzz.sparkleap,
    others: {
        key: 'others_default',
        displayName: 'Others Merchant',
        companyName: 'Others Merchant',
        address: DEFAULT_ADDRESS_HTML,
        receiptEntityName: 'the merchant',
        logoPath: '/assets/branding/default-merchant-logo.png',
        themeColor: '#1f2937',
        aliases: [],
    },
};

export const normalizeMerchantName = (value) => String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

export const getMerchantCatalog = (workspaceMode = 'easybuzz') =>
    MERCHANT_CONFIGS[workspaceMode] || MERCHANT_CONFIGS.easybuzz;

export const getMerchantConfigByKey = (merchantKey, workspaceMode = 'easybuzz') => {
    const catalog = getMerchantCatalog(workspaceMode);
    return catalog[merchantKey] || FALLBACK_CONFIGS[workspaceMode] || FALLBACK_CONFIGS.easybuzz;
};

export const getMerchantKeyFromName = (merchantName, workspaceMode = 'easybuzz') => {
    if (workspaceMode === 'easybuzz') {
        return 'sparkleap';
    }

    const normalizedName = normalizeMerchantName(merchantName);
    const catalog = getMerchantCatalog(workspaceMode);

    const matchedEntry = Object.values(catalog).find((config) =>
        config.aliases.some((alias) => normalizedName.includes(normalizeMerchantName(alias)))
    );

    return matchedEntry?.key || FALLBACK_CONFIGS.others.key;
};

export const getMerchantConfig = (rowData, merchantColumn, workspaceMode = 'easybuzz') => {
    if (workspaceMode === 'easybuzz') {
        return getMerchantConfigByKey('sparkleap', workspaceMode);
    }

    const merchantName = merchantColumn ? rowData?.[merchantColumn] : '';
    const merchantKey = getMerchantKeyFromName(merchantName, workspaceMode);
    const config = getMerchantConfigByKey(merchantKey, workspaceMode);

    if (merchantKey === FALLBACK_CONFIGS.others.key && merchantName) {
        return {
            ...config,
            displayName: String(merchantName),
            companyName: String(merchantName),
            receiptEntityName: String(merchantName),
        };
    }

    return config;
};
