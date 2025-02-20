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

async function generatePresentationStructure(title) {
  const structureResponse = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{
      role: "system",
      content: `Create a coherent presentation structure for a tech talk titled "${title}".
                Generate 8 slides including:
                1. Title slide
                2. Introduction/Overview
                3-7. Main content slides
                8. Conclusion/Summary
                Format as JSON with array of slides, each containing:
                - subtitle (string, max 10 words)
                - bullets (array of strings, 2-3 points, max 15 words each)
                - imagePrompt (string describing the ideal slide image)`
    }, {
      role: "user",
      content: "Generate presentation structure"
    }],
    temperature: 0.8,
  });

  return JSON.parse(structureResponse.choices[0].message.content);
}

async function generateImage(imagePrompt) {
  const prediction = await replicate.predictions.create({
    version: "black-forest-labs/flux-schnell",
    input: {
      prompt: imagePrompt,
      aspect_ratio: "16:9",
      output_format: "webp",
      output_quality: 90
    }
  });

  const finalPrediction = await waitForImageGeneration(prediction);
  return finalPrediction.output;
}

exports.handler = async function(event, context) {
  try {
    // Get presentation number from query params (1-6)
    const presentationNumber = event.queryStringParameters?.presentation || '1';
    
    // Generate title
    const titleResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: "You are a creative conference talk title generator. Generate a funny, engaging title for a tech talk on AI or machine learning. Get weird and ridiculous with it."
      }, {
        role: "user",
        content: `Generate a tech conference talk title for presentation ${presentationNumber}`
      }],
      temperature: 0.9,
    });

    const title = titleResponse.choices[0].message.content;
    console.log(`Generated title for presentation ${presentationNumber}:`, title);

    // Generate full presentation structure
    const presentationStructure = await generatePresentationStructure(title);
    console.log('Generated presentation structure');

    // Generate images for all slides
    const slides = await Promise.all(presentationStructure.slides.map(async (slide, index) => {
      console.log(`Generating image for slide ${index + 1}`);
      const imageUrl = await generateImage(slide.imagePrompt);
      return {
        ...slide,
        imageUrl
      };
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        presentationNumber,
        title,
        slides
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