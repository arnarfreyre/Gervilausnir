[# SAP Learning Platform - Documentation

## File Structure

```
├── Main platform/
│   ├── Main.html          (Main platform file)
│   ├── Main-styles.css    (Platform styling)
│   ├── config.js          (Configuration settings)
│   ├── manuals.js         (Manual database)
│   └────Instructions/ 
│        ├── Leiðbeiningar - Eyða lagerúttekt úr sap.html
│        ├── Leiðbeiningar - leiðrétta birgðastöðu.html
│        ├── Leiðbeiningar - Útbúa tilkynningu.html
│        ├── styles.css         (Instruction styles)
│        └── ... (other instruction files)
└── README.md (This file)
```

## Quick Start - Adding New Instructions

### Step 1: Create Your Instruction HTML File
1. Create your instruction HTML file in the `Instructions` folder
2. Name it descriptively in Icelandic (e.g., `Leiðbeiningar - your topic.html`)

### Step 2: Add Entry to manuals.js
Open `Main platform/manuals.js` and add a new object to the array:

## javascript

```javascript

{
    id: 6,  // Increment from the last ID
    title: "Your Manual Title",
    category: "inventory",  // Choose: purchasing, inventory, sales, finance, production
    subcategory: "stock-management",  // Must match subcategories in config.js
    description: "Brief description of what this manual teaches",
    difficulty: "beginner",  // Choose: easy, beginner, intermediate, advanced
    duration: 5,  // Time in minutes
    icon: "📄",  // Any emoji that represents the content
    filename: "Leiðbeiningar - your file.html",  // Exact filename in Instructions folder
    tags: ["SAP", "keyword1", "keyword2"],  // For search functionality
    created: "2025-01-25",  // YYYY-MM-DD format
    views: 0  // Always start at 0
}
```

That's it! The platform will automatically:
- Display your new manual in the correct category
- Update the category counts
- Make it searchable by title, description, and tags
- Track view counts

## Configuration Options

### config.js
Contains all platform settings:
- `instructionsPath`: Path to instruction files (default: `'../Instructions/'`)
- `enableAddButton`: Show/hide the add button (default: `true`)
- `defaultCategory`: Category shown on load
- `defaultSubcategory`: Subcategory shown on load

### Categories and Subcategories
Defined in `config.js`. To add new categories:
1. Add to the `categories` object
2. Create corresponding HTML structure in `Main.html` sidebar

### Difficulty Levels
- `easy`: Auðvelt (Easy)
- `beginner`: Byrjandi (Beginner)
- `intermediate`: Miðlungs (Intermediate)
- `advanced`: Háþróaður (Advanced)

## Platform Features

### Search
- Searches through titles, descriptions, and tags
- Real-time filtering as you type

### Sorting Options
- **Newest First**: By creation date
- **Most Popular**: By view count
- **Difficulty**: From easy to advanced
- **Duration**: Shortest to longest

### Filtering
- Filter by difficulty level
- Filter by category and subcategory

### Responsive Design
- Mobile-friendly with collapsible sidebar
- Touch-optimized interface

## API Functions

The platform exposes a global `sapPlatform` object:

```javascript
// Add a new manual programmatically
sapPlatform.addNewManual({
    title: "New Manual",
    category: "sales",
    // ... other properties
});

// Get all manuals
const allManuals = sapPlatform.getManuals();

// Get categories
const categories = sapPlatform.getCategories();

// Refresh the view
sapPlatform.refreshView();

// Update category counts
sapPlatform.updateCounts();
```

## Best Practices

1. **File Naming**: Use consistent Icelandic naming for instruction files
2. **Icons**: Choose emojis that clearly represent the content
3. **Tags**: Include relevant SAP transaction codes and keywords
4. **Descriptions**: Keep them concise but informative
5. **Testing**: Always test that your instruction file loads correctly

## Troubleshooting

### Manual Not Showing
- Check that the category and subcategory match those in `config.js`
- Verify the filename matches exactly (case-sensitive)
- Ensure the ID is unique

### Instruction Not Loading
- Verify the file exists in the Instructions folder
- Check the console for 404 errors
- Ensure the path in `config.js` is correct

### Categories Not Updating
- Run `sapPlatform.updateCounts()` in the console
- Check that the category key matches exactly

## Future Enhancements

Consider implementing:
- User authentication
- Progress tracking
- Favorites/bookmarks
- Comments/feedback system
- Video support
- Multi-language support
- Export to PDF functiona]()