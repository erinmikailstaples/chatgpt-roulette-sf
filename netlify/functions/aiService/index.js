const OpenAI = require('openai');
const Replicate = require('replicate');

// Add debug logging for environment variables
console.log('Environment check:', {
  hasReplicateToken: !!process.env.REPLICATE_API_TOKEN,
  tokenPrefix: process.env.REPLICATE_API_TOKEN?.substring(0, 3),
  tokenLength: process.env.REPLICATE_API_TOKEN?.length
});

// Validate token format
if (!process.env.REPLICATE_API_TOKEN?.startsWith('r8_')) {
  console.error('Invalid Replicate token format. Token should start with "r8_"');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
  // Add additional options for better debugging
  fetch: (url, options) => {
    console.log('Replicate API request:', {
      url,
      method: options.method,
      hasAuth: !!options.headers?.Authorization
    });
    return fetch(url, options);
  }
});

async function waitForImageGeneration(prediction) {
  while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
    console.log('Waiting for image generation...', prediction.status);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    prediction = await replicate.predictions.get(prediction.id);
  }
  return prediction;
}

exports.handler = async function(event, context) {
  try {
    // Validate environment variables first
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('Missing Replicate API token');
    }

    // First, generate a presentation title and topic
    const titleResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: "You are a creative conference talk title generator. Generate a funny, engaging title for a tech talk."
      }, {
        role: "user",
        content: "Generate a tech conference talk title"
      }],
      temperature: 0.9,
    });

    const title = titleResponse.choices[0].message.content;

    // Then, generate slide content based on the title
    const slideContentResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: `You are a presentation content generator. Generate content for a slide in a tech talk titled "${title}". 
                 Include: 
                 1. A subtitle or key point (max 10 words)
                 2. 2-3 bullet points (each max 15 words)
                 3. A creative image description that matches the slide's content
                 Format as JSON with keys: subtitle, bullets (array), imagePrompt`
      }, {
        role: "user",
        content: "Generate slide content"
      }],
      temperature: 0.8,
    });

    // Parse the generated content
    const slideContent = JSON.parse(slideContentResponse.choices[0].message.content);

    // Create and wait for the image prediction
    let prediction;
    try {
      // Start the prediction
      prediction = await replicate.predictions.create({
        version: "black-forest-labs/flux-schnell",
        input: {
          prompt: slideContent.imagePrompt,
          aspect_ratio: "16:9",
          output_format: "webp",
          output_quality: 90
        }
      });

      console.log('Started image generation:', prediction.id);

      // Wait for the prediction to complete
      prediction = await waitForImageGeneration(prediction);

      if (prediction.status === 'failed') {
        throw new Error(`Image generation failed: ${prediction.error}`);
      }

      console.log('Image generation completed:', prediction.status);

    } catch (replicateError) {
      console.error('Replicate API error:', {
        message: replicateError.message,
        status: replicateError.response?.status,
        details: replicateError.response?.data
      });
      throw new Error(`Replicate API error: ${replicateError.message}`);
    }

    // Get the image URL from the prediction output
    const imageUrl = prediction.output;

    return {
      statusCode: 200,
      body: JSON.stringify({
        title,
        subtitle: slideContent.subtitle,
        bullets: slideContent.bullets,
        imagePrompt: slideContent.imagePrompt,
        imageUrl: imageUrl
      })
    };
  } catch (error) {
    console.error('Function error:', {
      message: error.message,
      stack: error.stack
    });
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message,
        type: error.constructor.name
      })
    };
  }
}; 