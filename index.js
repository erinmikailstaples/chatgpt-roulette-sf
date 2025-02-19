// Access the query string parameters
const queryParams = new URLSearchParams(window.location.search);
// Get the number of slides or default to 5
const numberOfSlides = queryParams.get('slides') || 8; // Default to 8 slides if not provided, for a 2min karaoke presentation
// Get the delay between slides or default to 15 seconds (15000 ms)
const delay = (queryParams.get('delay') || 15) * 1000;
// Get the search term from the data attribute
const searchTermsElement = document.getElementById('searchTerms');
// const searchTerm = searchTermsElement.getAttribute('data-query') || 'funny photos'; // Default to 'funny photos' if not provided
const searchTerm = await fetchTalkTitle();

console.log('Search Term:', searchTerm);
console.log('Number of Slides:', numberOfSlides);
console.log('Delay:', delay);

// Cache DOM elements
const autogenSlidesElement = document.getElementById('autogenSlides');

// Initialize Reveal.js
Reveal.initialize({
    width: '70%',
    height: '70%',
    margin: 0.05,
    hash: true,
    controls: false,
    progress: true,
    center: true,
    transition: 'slide', // none/fade/slide/convex/concave/zoom
    slideNumber: 'all',
    hash: true,
    history: true,
    loop: false,
    help: true,
    // autoSlide: 15000,
    autoSlide: delay,
    showNotes: false,
    viewDistance: 5,

    // Learn about plugins: https://revealjs.com/plugins/
    plugins: [RevealMarkdown, RevealHighlight]
});

// Debounce function to limit the rate of function execution
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Function to fetch data from the Netlify function
async function fetchSlides() {
    // const url = `/.netlify/functions/unsplash?query=${encodeURIComponent(searchTerm)}&slides=${numberOfSlides}`;
    const url = `/.netlify/functions/unsplash?query=${searchTerm}&slides=${numberOfSlides}`;
    // console.log(`Constructed URL: ${url}`); // Log to ensure it's correct

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Unsplash API Response:', data); // Log the API response
        generateSlides(data); // Use the data to generate slides
    } catch (error) {
        console.error('Error fetching data from Netlify function:', error);
        alert('An error occurred while fetching slides. Please try again later.');
    }
}

// Function to generate slides dynamically
function generateSlides(photos) {
    console.log('Photos Data:', photos);

    const slideTitle = document.createElement('section');
    slideTitle.setAttribute('data-background-image','https://picsum.photos/1920/1080/')
    slideTitle.setAttribute('data-background-size', 'contain');
    slideTitle.setAttribute('data-background-position', 'center');
    slideTitle.setAttribute('data-background-opacity', '0.5');
        slideTitle.innerHTML = `<h3>${searchTerm}</h3>`;

    autogenSlidesElement.appendChild(slideTitle);

    photos.forEach(photo => {
        if (photo && photo.urls && photo.urls.regular) { // Ensure the required properties exist
            // Create a new slide element (section)
            const slide = document.createElement('section');

            // Add custom data attributes to the section tag
            slide.setAttribute('data-background-image', photo.urls.regular);
            slide.setAttribute('data-background-size', 'contain');
            slide.setAttribute('data-background-position', 'center');
            slide.setAttribute('data-author', photo.user.name); // Author's name
            slide.setAttribute('data-location', photo.location ? photo.location.name : 'Unknown'); // Location (if available)
            slide.setAttribute('data-created-at', photo.created_at); // Photo creation date

            slide.innerHTML = `
                <div class="desc">
                    <font size="3rem;" color="white">
                        Photo by <a href="${photo.user.links.html}?utm_source=Jerdog_PPT_Karaoke&utm_medium=referral" target="_blank">${photo.user.name}</a> on <a href="https://unsplash.com/?utm_source=Jerdog_PPT_Karaoke&utm_medium=referral" target="_blank">Unsplash</a>
                    </font>
                </div>`;
            autogenSlidesElement.appendChild(slide);
            Reveal.sync(); // Sync Reveal.js after dynamically adding content
        } else {
            console.warn('Missing photo data:', photo); // Log missing or malformed data
        }
    });
}

// function to get random talk title
async function fetchTalkTitle() {
    try {
        const response = await fetch('/.netlify/functions/randomTalkTitle');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data.title;
    } catch (error) {
        console.error('Error fetching daily talk title:', error);
        return 'nature'; // Fallback search term
    }
}

// Generate the slides based on query parameters
const debouncedFetchSlides = debounce(fetchSlides, 300);
debouncedFetchSlides();
