const OpenAI = require('openai');
const Replicate = require('replicate');

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
    // Log environment variables presence (not the values!)
    console.log('Environment check:', {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasReplicate: !!process.env.REPLICATE_API_TOKEN
    });

    // Generate a title using OpenAI
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

    // Log successful title generation
    console.log('Title generated successfully');

    const title = titleResponse.choices[0].message.content;

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

    const imagePrompt = promptResponse.choices[0].message.content;

    // Generate image using Replicate's Flux Schnella
    const image = await replicate.run("black-forest-labs/flux-schnell", {
      input: {
        prompt: imagePrompt,
        aspect_ratio: "16:9", // Better for presentations
        output_format: "webp",
        output_quality: 90
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        title: title,
        imagePrompt: imagePrompt,
        imageUrl: image
      })
    };
  } catch (error) {
    // Enhanced error logging
    console.error('Detailed error:', {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name
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