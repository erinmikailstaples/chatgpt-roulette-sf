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

async function generateSlideContent() {
  try {
    const response = await fetch('/.netlify/functions/aiService');
    const data = await response.json();
    
    if (!data.imageUrl) {
      throw new Error('No image URL received');
    }

    // Create a new slide with the AI-generated content
    const slide = document.createElement('section');
    slide.setAttribute('data-background-image', data.imageUrl);
    slide.setAttribute('data-background-size', 'contain');
    slide.setAttribute('data-background-position', 'center');
    
    slide.innerHTML = `
      <h2>${data.title}</h2>
      <div class="desc">
        <font size="3rem;" color="white">
          AI-generated presentation slide
        </font>
      </div>`;
    
    autogenSlidesElement.appendChild(slide);
    Reveal.sync();
  } catch (error) {
    console.error('Error generating slide content:', error);
  }
}

// Modify the existing fetchSlides function to use our new generator
async function fetchSlides() {
  const slides = [];
  for (let i = 0; i < numberOfSlides; i++) {
    await generateSlideContent();
  }
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
