const fs = require('fs');
const path = require('path');

// // Mock database of talk titles
// const talkTitles = [
//     'Nature and Technology',
//     'The Art of Simplicity',
//     'Innovations in AI',
//     'Future of Work',
//     'Cloud Computing Trends',
//     'Data-Driven Development',
//     'Developer Experience Matters',
//     'Open Source Power',
//     'Scaling Microservices',
//     'The Ethics of AI'
// ];

// // Path to the JSON file for storing the daily talk title
// const talkTitlesPath = path.resolve(process.cwd(), 'netlify/functions/talkTitles.json');
// console.log('talkTitlesPath:', talkTitlesPath);

// Path to the original JSON file in the deployed directory
const originalTalkTitlesPath = path.resolve(__dirname, 'talkTitles.json');

// Path to the writable /tmp directory in Netlify Functions
const tmpTalkTitlesPath = path.resolve('/tmp', 'talkTitles.json');

// Function to get today's date in YYYY-MM-DD format
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

// Function to ensure talkTitles.json exists in /tmp
function ensureTmpFile() {
    if (!fs.existsSync(tmpTalkTitlesPath)) {
        fs.copyFileSync(originalTalkTitlesPath, tmpTalkTitlesPath);
        console.log('Copied talkTitles.json to /tmp');
    }
}

// // Function to get a new random talk title
// function getRandomTalkTitle() {
//     const randomIndex = Math.floor(Math.random() * talkTitles.length);
//     return talkTitles[randomIndex];
// }

// Function to read talk titles from JSON file
function readTalkTitles() {
    try {
        ensureTmpFile(); // Ensure /tmp/talkTitles.json exists
        const fileData = fs.readFileSync(tmpTalkTitlesPath, 'utf8').trim();

        if (!fileData) {
            throw new Error('talkTitles.json is empty.');
        }

        return JSON.parse(fileData);
    } catch (error) {
        console.error('Error reading talkTitles.json:', error.message);
        return [];
    }
}

// Function to write updated talk titles to JSON file
function writeTalkTitles(titles) {
    try {
        fs.writeFileSync(tmpTalkTitlesPath, JSON.stringify(titles, null, 2));
        console.log('Updated talkTitles.json successfully.');
    } catch (error) {
        console.error('Error writing to talkTitles.json:', error.message);
    }
}

// Function to get a talk title not used today
function getUnusedTalkTitle() {
    const today = getTodayDate();
    const titles = readTalkTitles();

    if (!titles || titles.length === 0) {
        throw new Error('No valid entries in talkTitles.json.');
    }

    let unusedTitle = titles.find(title => !title.last_used || title.last_used < today);

    if (!unusedTitle) {
        console.warn('All titles used today. Selecting a random fallback.');
        const randomIndex = Math.floor(Math.random() * titles.length);
        unusedTitle = titles[randomIndex];
    }

    unusedTitle.last_used = today;
    writeTalkTitles(titles);

    return unusedTitle.title;
}


// Netlify function handler
exports.handler = async (event, context) => {
    try {
        const title = getUnusedTalkTitle();
        return {
            statusCode: 200,
            body: JSON.stringify({ title, date: getTodayDate() }),
        };
    } catch (error) {
        console.error('Error fetching talk title:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch talk title' }),
        };
    }
};
