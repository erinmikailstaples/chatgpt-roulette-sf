# PowerPoint Karaoke + Unsplash API

## Overview

This project is a web application for [PowerPoint Karaoke](https://en.wikipedia.org/wiki/PowerPoint_karaoke), with a twist: all of the images are randomly pulled from the [Unsplash API](https://unsplash.com/developers) on load.

## Usage

To use this project, you will first need to [fork it](https://github.com/jerdog/pptkaraoke-unsplash/fork), then clone that fork to your local machine (see below), and then open the `index.html` file in your browser. You will of course need to edit specific information for your presentation/event (see below), but by default the slideshow shows 5 slides, auto-advancing every 15 seconds. The below parameters can be adjusted in the URL:

- `?slides=X` - the number of slides to show (default 8 for a 2min karaoke presentation)
- `?delay=X` - the delay between slides in seconds (default 15)

For example: `https://localhost:8888/index-1.html/?slides=10&delay=10` will show 10 slides, auto-advancing every 10 seconds (1min 40sec presentation). Not including those parameters will show the default 8 slides, auto-advancing every 15 seconds (2min presentation).

## Configuration

File descriptions:

- `index.html` - the main HTML file for the default presentation overview file. You will need to edit this file to include your own presentation information, along with links to the subsequent presentations you'll be using.
- `index-1.html` - the first karaoke presentation file. You will edit the Presentation Title on the first slide, and then provide the value for the search query used to pull images from Unsplash for the presentation.
- `index-*.html` - the subsequent karaoke presentation files that you will duplicate from the first, and then edit accordingly.
- `img/placeholder_logo.png` - the image used as a placeholder for the conference/event overlay logo. Add your logo here, and then update it in each of the presentation files (see below):
```html
<div class="slides" id="slides-container">
  <div class="overlay">
    <img src="img/placeholder_logo.png" width="100px">
  </div>
```
- `netlify/functions/unsplash.js` - the Unsplash API Netlify Function that is used to pull images from Unsplash. You will need to edit this file to include your Unsplash API key.
- `netlify/functions/randomTalkTitle.js` - random talk title pulled from the `netlify/functions/talkTitles.json` file. Edit the `talkTitles.json` file with your own talk titles.
- `netlify.toml` - the Netlify configuration file. By default, this is the bare minimum needed to build the project on Netlify.



In order to use this project, there are some prerequisites you will need to satisfy, and then do some local development. Those are identified below.

### Prerequisites

1. [Get an account on Netlify](https://www.netlify.com/)
2. [Create an application on Unsplash](https://unsplash.com/developers) and get an API key

### Development steps

1. Fork this repo](https://github.com/jerdog/pptkaraoke-unsplash/fork), and then clone the fork to your local machine
   ```
   git clone https://github.com/YOUR_USERNAME/pptkaraoke-unsplash.git
   cd pptkaraoke-unsplash
   ```
2. Run `npm install` to install the dependencies
3. Copy the `.env-example` file to `.env` and fill in the `ACCESS_KEY` with the API key (the Access Key, ***not the Secret key***) you got from Unsplash above.
4. Run `npm run build` to build the project
5. Run `netlify dev` to start the local development server
6. Open `http://localhost:8888/index.html` in your browser (or `http://localhost:8888/index-1.html` to jump straight to the first karaoke presentation)
7. You should see the presentation running locally, and use the `SPACEBAR` key to advance to the next slide, with an image pulled from Unsplash on each one. If not, check the console for any errors.

### Deploying to Netlify

If you want to have this project deployed to Netlify, you will need to do the following:

*NOTE: Know that if you do this, and then publicize the link, you run the risk of hitting Unsplash's API rate limits (50 requests/hr). You likely won't need to deploy, and can just use this locally.*

1. [Connect the repo](https://app.netlify.com/start) to Netlify
2. Add an environment variable to the project in Netlify, with the key `ACCESS_KEY` and the value being the API key you got from Unsplash above. *NOTE: This is the Access Key, ***not the Secret key***.*
  - Site Configuration > Environment Variables > Add a variable
3. Push your changes to GitHub, and then Netlify will automatically build and deploy the project.
4. Access the project at the URL Netlify provides.

## Acknowledgements

* [Unsplash API](https://unsplash.com/developers)
* [Reveal.js](https://revealjs.com/)
* [Netlify](https://www.netlify.com/)


## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.