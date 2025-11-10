# Watch Battle

A tournament-style comparison game where users discover their perfect watch through 10 rounds of head-to-head matchups.

## Features

- **Tournament-Style Gameplay**: Winner advances through 10 rounds until a final champion emerges
- **Dynamic Data Loading**: Loads watch data from Google Sheets CSV with automatic fallback to local JSON
- **Responsive Design**: Fully optimized for desktop, tablet, and mobile devices
- **Smooth Animations**: Polished UI with hover effects and transitions
- **Progress Tracking**: Visual progress bar showing current round and completion status
- **Smart Matchup System**: Ensures variety by tracking used watches and avoiding duplicates

## Demo

Open `index.html` in your browser to start playing!

## Project Structure

```
watch-battle-game/
├── index.html          # Main HTML structure
├── app.js              # Game logic and data handling
├── style.css           # Styles and responsive design
├── watches.json        # Local fallback watch data (20 watches)
└── README.md           # This file
```

## Setup

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd watch-battle-game
   ```

2. **Open in browser**
   - Simply open `index.html` in your web browser
   - Or use a local server:
   ```bash
   # Python 3
   python -m http.server 8000

   # Node.js (with npx)
   npx serve
   ```

3. **Visit** `http://localhost:8000`

### Google Sheets Configuration

The app loads watch data from a Google Sheets CSV. To use your own data:

1. **Create a Google Sheet** with these columns:
   - `id` - Unique identifier (1, 2, 3...)
   - `brand` - Watch brand name
   - `Name` - Watch model name
   - `Model` - Specific model variant
   - `Image` - Full image URL
   - `style` - Watch style (Dive, Chronograph, etc.)
   - `retail price` - Price string (e.g., "$8,000")

2. **Example row:**
   ```
   1,Rolex,Submariner,Date,https://example.com/image.jpg,Dive,$8,950
   ```

3. **Publish the sheet:**
   - File → Share → Publish to web
   - Choose "Comma-separated values (.csv)"
   - Copy the published URL

4. **Update the code:**
   - Open `app.js`
   - Replace `GOOGLE_SHEET_CSV_URL` (line 34) with your published CSV URL

### Fallback Data

If Google Sheets fails to load, the app automatically falls back to:
1. Local `watches.json` file
2. Sample data generated in-code

## How It Works

### Game Flow

1. **Load Data**: Fetches watch data from Google Sheets (CSV) or local JSON
2. **Shuffle**: Randomizes watch order for unique gameplay each time
3. **Round 1**: Two random watches compete
4. **Rounds 2-10**: Winner faces new challengers
5. **Final Screen**: Displays the ultimate winning watch

### Data Structure

Each watch object contains:
```javascript
{
  id: 1,
  name: "Rolex Submariner",
  image: "https://example.com/image.jpg",
  brand: "Rolex",
  model: "Submariner",
  style: "Dive",
  retailPrice: "$8,000",
  affiliateLink: "https://example.com/affiliate" // Optional
}
```

## Deployment

### Netlify

1. Push to GitHub
2. Connect repository to Netlify
3. Deploy settings:
   - Build command: (leave empty)
   - Publish directory: `/`

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Deploy with default settings

### GitHub Pages

1. Push to GitHub
2. Settings → Pages → Source: main branch
3. Access at `https://<username>.github.io/<repo-name>/`

## Customization

### Change Number of Rounds

Edit `app.js` line 4:
```javascript
const totalRounds = 10; // Change to desired number
```

### Update Styling

- **Colors**: Modify gradient colors in `style.css` (lines 10, 61, 146)
- **Fonts**: Change font family in `style.css` (line 9)
- **Card sizes**: Adjust `.watch-card` dimensions (lines 89-99)

### Add More Watches

1. Edit `watches.json` with new watch entries
2. Or update your Google Sheet and republish

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: Flexbox, animations, media queries
- **Vanilla JavaScript**: ES6+ features, Fetch API, async/await
- **Google Sheets**: CSV data source
- **Unsplash**: Sample watch images

## Future Enhancements

Potential features to add:
- Affiliate link integration on winner screen
- Social sharing functionality
- Analytics tracking for watch preferences
- Local storage for game progress
- Watch details (price, style) display toggle
- Results summary before final winner
- PWA support for mobile installation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Credits

Watch images sourced from Unsplash. Replace with actual product images for production use.
