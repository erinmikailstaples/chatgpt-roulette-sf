exports.handler = async function(event, context) {
  const ACCESS_KEY = process.env.ACCESS_KEY; // Use environment variable
  const searchTerm = event.queryStringParameters.query || 'nature'; // Default to 'nature' if not provided
  const numberOfSlides = event.queryStringParameters.slides || 8; // Default to 8 slides if not provided, for a 2min karaoke presentation

  // Log received query parameters
  // console.log('Received Query Parameters:', event.queryStringParameters);
  // console.log('Search Term:', searchTerm);
  // console.log('Number of Slides:', numberOfSlides);
  // console.log('Access Key Present:', !!ACCESS_KEY); // To confirm the key is available (Don't log the actual key)

  try {
    // Construct Unsplash API URL and log it
    const apiUrl = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(searchTerm)}&orientation=landscape&content_filter=low&count=${numberOfSlides}&client_id=${ACCESS_KEY}`;
    // console.log('Constructed Unsplash API URL:', apiUrl); // Log URL to verify

    // Using the built-in fetch in Node.js 18+
    const unsplashResponse = await fetch(apiUrl); // Make the request to Unsplash API
    const responseData = await unsplashResponse.json(); // Unsplash API returns JSON response
    
    // Log the response status and response body
    // console.log('Unsplash Response Status:', unsplashResponse.status);
    // console.log('Unsplash Response Data:', responseData);

    if (!unsplashResponse.ok) {
      throw new Error(`Error fetching Unsplash data: ${unsplashResponse.statusText}`);
    }

    // Return the JSON response
    return {
      statusCode: 200,
      body: JSON.stringify(responseData),
    };
  } catch (error) {
    console.error('Error in Unsplash function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
