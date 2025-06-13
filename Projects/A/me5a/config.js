// config.js - SAP Learning Platform Configuration

const config = {
    // Path to instruction files
    instructionsPath: './Instructions/',
    pdfPath: './pdf-instructions/',

    // Enable/disable add button
    enableAddButton: true,

    // Default view on load - now shows home screen
    defaultView: 'home', // Changed from specific category
    defaultCategory: 'inventory',
    defaultSubcategory: 'reservations',

    // Platform settings
    searchDelay: 300, // Milliseconds to wait before searching
    minSearchLength: 2, // Minimum characters for search
    itemsPerPage: 20, // For future pagination

    // Language settings
    language: 'is', // Icelandic
    dateFormat: 'YYYY-MM-DD'
};

// Categories configuration with icons and Icelandic names
const categories = {
    purchasing: {
        name: "Innkaupadeild",
        icon: "🛒",
        subcategories: {
            'purchase-orders': 'Innkaupapantanir',
            'requisitions': 'Innkaupabeiðnir',
            'vendors': 'Birgjar'
        }
    },
    inventory: {
        name: "Lager",
        icon: "📦",
        subcategories: {
            'inventory-general': 'Almennt',
            'stock-management': 'Maybe -> Birgðastjórnun',
            'reservations': 'Maybe -> Frátektir',
            'transfers': 'maybe -> Flutningar'
        }
    },
    sales: {
        name: "Sala",
        icon: "💰",
        subcategories: {
            'sales-orders': 'Sölupantanir',
            'quotations': 'Tilboð',
            'customers': 'Viðskiptavinir'
        }
    },
    finance: {
        name: "Fjármál",
        icon: "📊",
        subcategories: {
            'accounting': 'Bókhald',
            'controlling': 'Kostnaðareftirlit',
            'reports': 'Skýrslur'
        }
    },
    production: {
        name: "Framleiðsla",
        icon: "🏭",
        subcategories: {
            'production-orders': 'Framleiðslupantanir',
            'bom': 'Uppskriftir',
            'capacity': 'Afkastageta'
        }
    }
};

// Difficulty levels with Icelandic translations
const difficultyLevels = {
    beginner: {
        text: 'Einfallt',
        color: '#4caf50',
        bgColor: '#e8f5e9'
    },
    intermediate: {
        text: 'Miðlungs',
        color: '#ff9800',
        bgColor: '#fff3e0'
    },
    advanced: {
        text: 'Flókið',
        color: '#f44336',
        bgColor: '#ffebee'
    }
};

// Sort options configuration
const sortOptions = {
    newest: 'Nýjast fyrst',
    popular: 'Vinsælast',
    difficulty: 'Erfiðleikastigi',
    duration: 'Tímalengd'
};

// UI Text translations (for future internationalization)
const uiText = {
    search: {
        placeholder: 'Leita að leiðbeiningum...',
        noResults: 'Engar leiðbeiningar fundust',
        noResultsDesc: 'Prófaðu að breyta síunni eða leita að öðru.'
    },
    filters: {
        sortBy: 'Flokka eftir:',
        difficulty: 'Erfiðleiki:',
        all: 'Allir'
    },
    viewer: {
        loading: 'Hleður...',
        notReady: 'Þessar leiðbeiningar eru ekki enn tilbúnar.',
        inProgress: 'Verið að vinna í gerð þeirra.'
    },
    breadcrumb: {
        home: 'Heim'
    },
    meta: {
        time: 'Tími',
        minutes: 'mínútur',
        views: 'Áhorf',
        keywords: 'Lykilorð'
    },
    home: {
        welcome: 'Velkomin í SAP Leiðbeiningakerfið',
        welcomeDesc: 'Hér finnur þú allar nauðsynlegar leiðbeiningar til að vinna með SAP kerfið',
        statistics: 'Tölfræði',
        totalManuals: 'Leiðbeiningar samtals',
        categories: 'Flokkar',
        recentlyAdded: 'Nýlega bætt við',
        viewAll: 'Skoða allar'
    }
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { config, categories, difficultyLevels, sortOptions, uiText };
}