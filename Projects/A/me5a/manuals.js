// manuals.js - SAP Learning Platform Manual Database

// Manual data structure - Easy to add new manuals
// Simply add new objects to this array to add more instructions
const manuals = [


    // Lager leiðbeiningar
    {
        id: 1,
        title: "Eyða lagerúttekt úr SAP",
        category: "inventory",
        subcategory: "inventory-general",
        description: "Leiðbeiningar um hvernig á að eyða lagerúttektum úr SAP kerfinu sem eiga ekki lengur við.",
        difficulty: "intermediate",
        duration: 5,
        icon: "🗑️",
        filename: "Leiðbeiningar - Eyða lagerúttekt úr sap.html",
        pdfname: "Leiðbeiningar - Eyða lagerúttekt úr sap.pdf",
        tags: ["MD04", "frátektir", "eyðing", "Innkaup og Lager"],
        created: "2025-06-12",
        views: 145
    },
    {
        id: 2,
        title: "Leiðrétta birgðastöðu",
        category: "inventory",
        subcategory: "inventory-general",
        description: "Hvernig á að leiðrétta birgðastöðu í SAP þegar misræmi kemur upp.",
        difficulty: "advanced",
        duration: 10,
        icon: "🔧",
        filename: "Leiðbeiningar - leiðrétta birgðastöðu.html",
        pdfname: "Leiðbeiningar - Eyða lagerúttekt úr sap.pdf",
        tags: ["MI10", "birgðir", "leiðrétting"],
        created: "2025-01-18",
        views: 234
    },
    {
        id: 3,
        title: "Útbúa tilkynningu",
        category: "production",
        subcategory: "inventory-general",
        description: "Leiðbeiningar fyrir að búa til tilkynningu um framleiðslu í SAP.",
        difficulty: "intermediate",
        duration: 7,
        icon: "📋",
        filename: "Leiðbeiningar - Útbúa tilkynningu.html",
        pdfname: "Leiðbeiningar - Eyða lagerúttekt úr sap.pdf",
        tags: ["CO11N", "framleiðsla", "tilkynning"],
        created: "2025-01-10",
        views: 567
    },


    // Seinna
    {
        id: 10,
        title: "Stofna nýja frátekt",
        category: "inventory",
        subcategory: "reservations",
        description: "Skref fyrir skref leiðbeiningar um hvernig á að búa til nýja frátekt í SAP.",
        difficulty: "beginner",
        duration: 3,
        icon: "📝",
        filename: null, // No instruction file yet
        pdfname: null, // No pdf
        tags: ["MB21", "frátektir", "stofnun"],
        created: "2025-01-20",
        views: 89
    },
    {
        id: 11,
        title: "Móttaka innkaupapöntunar",
        category: "purchasing",
        subcategory: "purchase-orders",
        description: "Hvernig á að taka á móti vörum frá birgi og skrá í SAP með MIGO.",
        difficulty: "beginner",
        duration: 4,
        icon: "📥",
        filename: null, // No instruction file yet
        pdfname: null, // No pdf
        tags: ["MIGO", "móttaka", "innkaup"],
        created: "2025-01-22",
        views: 312
    }
];

    // Helper function to get difficulty text in Icelandic
    function getDifficultyText(difficulty) {
        return difficultyLevels[difficulty]?.text || difficulty;
    }

    // Function to get manuals by category
    function getManualsByCategory(category) {
        return manuals.filter(m => m.category === category);
    }

    // Function to get manuals by subcategory
    function getManualsBySubcategory(subcategory) {
        return manuals.filter(m => m.subcategory === subcategory);
    }

    // Function to search manuals
    function searchManuals(query) {
        const lowerQuery = query.toLowerCase();
        return manuals.filter(m =>
            m.title.toLowerCase().includes(lowerQuery) ||
            m.description.toLowerCase().includes(lowerQuery) ||
            m.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
    }

    // Function to sort manuals
    function sortManuals(manualsToSort, sortBy) {
        const sorted = [...manualsToSort];

        switch(sortBy) {
            case 'newest':
                return sorted.sort((a, b) => new Date(b.created) - new Date(a.created));

            case 'popular':
                return sorted.sort((a, b) => b.views - a.views);

            case 'difficulty':
                const diffOrder = { beginner: 0, intermediate: 1, advanced: 2 };
                return sorted.sort((a, b) => diffOrder[a.difficulty] - diffOrder[b.difficulty]);

            case 'duration':
                return sorted.sort((a, b) => a.duration - b.duration);

            default:
                return sorted;
        }
    }

    // Function to filter manuals by difficulty
    function filterByDifficulty(difficulty) {
        if (difficulty === 'all') {
            return manuals;
        }
        return manuals.filter(m => m.difficulty === difficulty);
    }

    // Function to add new manual to the system
    function addNewManual(manualData) {
        const newManual = {
            id: Math.max(...manuals.map(m => m.id)) + 1,
            ...manualData,
            created: new Date().toISOString().split('T')[0],
            views: 0
        };

        manuals.push(newManual);
        console.log('New manual added:', newManual);
        return newManual;
    }

    // Function to increment view count
    function incrementViews(manualId) {
        const manual = manuals.find(m => m.id === manualId);
        if (manual) {
            manual.views++;
            return manual.views;
        }
        return null;
    }

    // Function to get manual by ID
    function getManualById(id) {
        return manuals.find(m => m.id === id);
    }

    // Function to get category count
    function getCategoryCount(category) {
        return manuals.filter(m => m.category === category).length;
    }

    // Function to get all unique tags
    function getAllTags() {
        const tags = new Set();
        manuals.forEach(m => m.tags.forEach(tag => tags.add(tag)));
        return Array.from(tags).sort();
    }

    // Export manual data and functions
    const manualAPI = {
        manuals,
        getDifficultyText,
        getManualsByCategory,
        getManualsBySubcategory,
        searchManuals,
        sortManuals,
        filterByDifficulty,
        addNewManual,
        incrementViews,
        getManualById,
        getCategoryCount,
        getAllTags
    };

    // For use in browser
    if (typeof window !== 'undefined') {
        window.manualAPI = manualAPI;
    }