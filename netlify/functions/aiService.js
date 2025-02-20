const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Add this temporary debug log
console.log('Current working directory:', process.cwd());
console.log('Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  OPENAI_KEY_EXISTS: !!process.env.OPENAI_API_KEY,
  REPLICATE_TOKEN_EXISTS: !!process.env.REPLICATE_API_TOKEN
});

const OpenAI = require('openai');
const Replicate = require('replicate');

// Add this debug log
console.log('Environment variables check:', {
  hasOpenAIKey: !!process.env.OPENAI_API_KEY,
  openAIKeyLength: process.env.OPENAI_API_KEY?.length,
  hasReplicateToken: !!process.env.REPLICATE_API_TOKEN
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

exports.handler = async function(event, context) {
  if (event.httpMethod === 'GET' && event.queryStringParameters?.test === 'true') {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Function is accessible' })
    };
  }

try {
// Validate environment variables
if (!process.env.OPENAI_API_KEY || !process.env.REPLICATE_API_TOKEN) {
    throw new Error('Missing required environment variables');
}

console.log('Starting API request process...');

    // Generate a title using OpenAI
    const titleResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: "You are a creative conference talk title generator. Generate a funny, engaging title for a tech talk on AI or machine learning get weird with it and ridiculous with it."
      }, {
        role: "user",
        content: "Generate a tech conference talk title"
      }],
      temperature: 0.9,
    });

    // Validate OpenAI response
    if (!titleResponse?.choices?.[0]?.message?.content) {
    console.error('Invalid title response structure:', titleResponse);
    throw new Error('Failed to generate title: Invalid response structure');
    }

    const title = titleResponse.choices[0].message.content;
    console.log('Title generated successfully:', title);

    // Generate an image prompt using OpenAI
    const promptResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: "Generate a creative image prompt based on the given title that would work well for a presentation slide."
      }, {
        role: "user",
        content: `Generate an image prompt for the talk title: ${title}`
      }],
      temperature: 0.8,
    });

    // Validate prompt response
    if (!promptResponse?.choices?.[0]?.message?.content) {
    console.error('Invalid prompt response structure:', promptResponse);
    throw new Error('Failed to generate image prompt: Invalid response structure');
    }

    const imagePrompt = promptResponse.choices[0].message.content;
    console.log('Image prompt generated successfully:', imagePrompt);

    // Generate image using Replicate's Flux Schnella
    console.log('Starting image generation with Replicate...');
    const image = await replicate.run("black-forest-labs/flux-schnell", {
      input: {
        prompt: imagePrompt,
        aspect_ratio: "16:9", // Better for presentations
        output_format: "webp",
        output_quality: 90
      }
    });

    // Validate and process image response
    if (!image) {
    console.error('No image generated from Replicate');
    throw new Error('Failed to generate image: Empty response');
    }

    const imageUrl = Array.isArray(image) ? image[0] : image;
    console.log('Image generated successfully');

    return {
    statusCode: 200,
    body: JSON.stringify({
        title: title,
        imagePrompt: imagePrompt,
        imageUrl: imageUrl
    })
    };
} catch (error) {
// Enhanced error logging with context
console.error('API Service Error:', {
    message: error.message,
    type: error.constructor.name,
    stack: error.stack,
    responseError: error.response?.data, // Capture API response errors
    status: error.response?.status
});

// Determine appropriate status code based on error type
let statusCode = 500;
if (error.message.includes('Missing required environment')) {
    statusCode = 503; // Service Unavailable
} else if (error.response?.status) {
    statusCode = error.response.status;
}

return {
    statusCode: statusCode,
    body: JSON.stringify({ 
    error: error.message,
    type: error.constructor.name,
    status: statusCode
    })
    };
  }
}; 