const OpenAI = require('openai');
const Replicate = require('replicate');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

exports.handler = async function(event, context) {
  try {
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
    const imagePrompt = `A creative presentation slide for the tech talk titled: ${title}`;

    const image = await replicate.run("black-forest-labs/flux-schnell", {
      input: {
        prompt: imagePrompt,
        aspect_ratio: "16:9",
        output_format: "webp",
        output_quality: 90
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        title,
        imagePrompt,
        imageUrl: image
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}; 