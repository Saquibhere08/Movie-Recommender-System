# Interactive Movie Recommender

A fast, modern, client‑only movie recommender built with HTML, CSS, and JavaScript that uses a movie database API for real data, featuring live search, genre chips, sorting, infinite scroll, favorites, local star ratings, a details modal, theme toggle, and shimmering skeleton loaders.

## Features
- Live search with lightweight suggestions and debounced querying.
- Discover feed with sort by popularity, rating, or newest and clickable genre chips.
- Infinite scroll using an intersection observer and a responsive card grid.
- Favorites and per‑movie star ratings saved in localStorage.
- Details modal with poster, year, rating, overview, and quick actions.
- Shimmering skeleton loaders, lazy‑loaded posters, and theme toggle.

## Tech stack
- HTML5 and CSS3 with custom responsive layout
- Vanilla JavaScript with ES6 modules and fetch
- A movie database API v3 for data and images


## Getting started

Prerequisites
- A modern browser.
- An API key from the movie database provider.

Setup the API key
- Open script.js and set the constant:
- Open the printed local address.

## Usage

Search
- Type in the top bar; suggestions appear and results refresh after a short pause.

Sort
- Choose Popularity, Rating, or Newest to reshape the discover feed.

Genres
- Click a chip to filter by that genre; click All to reset.

Favorites
- Use the heart on any card or the button in the modal; toggle the Favorites switch to show only saved items.

Ratings
- Click one to five stars on a card or in the modal; ratings are stored locally.

Details
- Click the button on any card to open the details modal for overview and actions.

Theme
- Use the Theme button to switch between light and dark palettes.

Infinite scroll
- More items load automatically near the bottom of the page.

## Configuration

Poster size

Language
- Update the language parameter in fetch calls, for example en-US.

Adult content
- Requests use include_adult: false by default; change cautiously.

Caching
- Uses a simple in‑memory cache for responses during the session.

## How recommendations work

- The default feed uses a discover endpoint with sort options, genre filters, and pagination to simulate a personalized explore page fully on the client.
- Search uses the search endpoint with a debounced input and lightweight local suggestions from the current results.
- Favorites and ratings in localStorage can be used to filter the grid or power future client‑only preference tweaks.

## Accessibility

- Visible focus rings on interactive controls.
- High‑contrast dark theme by default with an optional light theme.
- Native dialog element with backdrop and close control.

## Performance notes

- Shimmering skeleton cards improve perceived performance during network fetches.
- Responsive grid with aspect-ratio keeps layouts stable while images load.
- Debounced search avoids excessive API calls.

## Deployment

- Works out of the box on static hosts such as GitHub Pages or other static site platforms.
- For production, prefer a small backend or serverless proxy that injects the API key server‑side and enforces rate limits.

## Screenshots

- Home view at assets/screenshots/home.png
- Search view at assets/screenshots/search.png
- Modal view at assets/screenshots/modal.png

## Roadmap

- Fuzzy search for more tolerant suggestions and typo handling.
- Similar titles carousel in the modal for stronger recommendations.
- Dynamic image configuration to pick optimal sizes for device and network.
- Watchlist export and import with shareable recommendation links.

## Contributing

- Fork the repository and create a feature branch.
- Use clear commit messages and include before and after screenshots for UI changes.
- Open a pull request that describes the motivation and testing steps.

## License

- MIT License. See the LICENSE file for details.

## Acknowledgements

- This project uses an external movie database API for data and images and is not endorsed or certified by the provider.

