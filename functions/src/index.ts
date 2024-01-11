export {};
const axios = require('axios');
const admin = require('firebase-admin');

const fs = require('fs');
const path = require('path');

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const secrets = require('../secrets.json');

admin.initializeApp();

const {Storage} = require('@google-cloud/storage');
const storage = new Storage();

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: secrets.apiKeyGPT,
});
const openai = new OpenAIApi(configuration);

type VideoMessage = {
  title: string;
  description: string;
  segments: Segment[];
}

type Segment = {
  time_start: string;
  time_end: string;
  prompt: string;
  voice_acting: string;
};

type Response = {
  role: string;
  content: VideoMessage;
};

const bucketName = secrets.bucket;

let imageNames = ['00_00.png', '00_10.png', '00_20.png', '00_30.png', '00_40.png', '00_50.png'];
let audioNames = ['00_00.mp3', '00_10.mp3', '00_20.mp3', '00_30.mp3', '00_40.mp3', '00_50.mp3'];

let windowsFolder = "D:\\tmp";
let folder = "test";
let finalOutputName: string;

async function downloadFile(bucketName: string, fileName: string) {
  const tempFilePath = path.join('D:', '/tmp', folder, fileName.replace(':', '_'));
  const file = storage.bucket(bucketName).file(fileName);
  console.log("downloading: " + fileName)
  await file.download({ destination: tempFilePath });
  console.log("downloaded at: " + tempFilePath)
  return tempFilePath;
}

async function deleteFile(filePath: string) {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    console.error(`Failed to delete file ${filePath}: ${error}`);
  }
}

const videoTitles = [
  "What if Cristiano Ronaldo Became a Professional Scientist?",
  "How Would the World Look if Walt Disney Designed Cities?",
  "What if Stephen King's Novels Came to Life?",
  "What if Lin-Manuel Miranda Wrote a Musical About Your Life?",
  "How Would Health Change if Dr. Fauci Created a Universal Vaccine?",
  "What if Jennifer Lawrence Became an Astronaut?",
  "What if Freddie Mercury Performed a Concert on the Moon?",
  "How Would the World Change if Michelle Obama Became UN Secretary-General?",
  "What if Tim Cook Invented an AI That Could Write Books?",
  "What if Jackie Chan Choreographed the Olympics Opening Ceremony?",
  "How Would Fashion Change if Kanye West Became a Classic Designer?",
  "What if Will Smith Became a Real-Life Superhero?",
  "What if Marie Curie Discovered a New Element Today?",
  "How Would Education Evolve if Malala Yousafzai Created a Global School?",
  "What if Emma Watson Was a Real-Life Wizard?",
  "What if Elon Musk and Jeff Bezos Colonized Mars Together?",
  "How Would Sports Change if Michael Phelps Could Fly?",
  "What if Keanu Reeves Was a Real-Life Time Traveler?",
  "What if Sir David Attenborough Narrated Your Day?",
  "What if All Oceans Were Freshwater?",
  "What if Modern Technology Existed in the Renaissance?",
  "What if Humans Lived for 500 Years?",
  "What if We Could See Other Galaxies with the Naked Eye?",
  "What if Famous Paintings Came to Life?",
  "How Would Society Change if Robots Did All Our Work?",
  "What if the Dark Ages Never Occurred?",
  "What if the Industrial Revolution Happened 100 Years Earlier?",
  "What if We Could Hear Colors and See Sounds?",
  "How Would World War I Change if Tanks Were Never Used?",
  "What if All Historical Myths Were True?",
  "What if We Could Grow Buildings from Seeds?",
  "What if the Black Death Never Happened?",
  "How Would Our Sky Look if Earth Had Two Moons?",
  "What if All Insects Were the Size of Cats?",
  "What if We Discovered a Mirror Universe?",
  "What if Electricity Was a Living Entity?",
  "How Would Language Evolve if We Could Read Minds?",
  "What if the Mayans Were Right About 2012?",
  "What if Water Was as Dense as Metal?",
  "How Would Civilizations Develop on a Waterless Earth?",
  "What if the Mona Lisa Had a Twin Painting?",
  "What if Antarctica Was a Tropical Paradise?",
  "What if Cars Were Never Invented?",
  "How Would Politics Change if Leaders Had to Take Truth Serum?",
  "What if We Found a Fifth Ocean on Earth?",
  "What if Shakespeare Was a Time Traveler?",
  "What if Trees Could Feel Pain and Communicate?",
  "How Would Warfare Change if All Weapons Disappeared?",
  "What if We Could Control Dreams Like Movies?",
  "What if All the World's Ice Cream Melted at Once?",
  "What if We Found a Real-Life Fountain of Youth?",
  "How Would Religion Evolve if We Met a Divine Being?",
  "What if Schools Taught Using Virtual Reality?",
  "What if Humans Could Only Eat One Type of Food?",
  "How Would Life Evolve on an Earth-Sized Moon?",
  "What if the Aztec Empire Still Existed Today?",
  "What if Our Shadows Had Minds of Their Own?",
  "How Would Music Sound if Instruments Were Alive?",
  "What if There Was No Nighttime, Only Day?",
  "What if We Found an Exact Replica of Earth?",
  "How Would Cities Look if Built by Ancient Egyptians?",
  "What if We Could Taste Words and Smell Feelings?",
  "What if the Concept of Money Never Existed?",
  "How Would Love Change if It Could Be Seen as a Color?",
  "What if We Discovered a New Primary Color?",
  "What if All Humans Had a Third Eye?",
  "How Would Technology Advance if Aliens Shared Knowledge?",
  "What if We Could Turn Emotions into Energy?",
  "What if the Universe Was Just a Simulation?",
  "How Would Oceans Look if Fish Flew and Birds Swam?",
  "What if We Could Listen to the Music of Planets?",
  "What if Ancient Mythological Creatures Were Real?",
  "How Would History Change if Everyone Had Nine Lives?",
  "What if We Could Speak Directly to Our Ancestors?",
  "What if the Earth Spun Sideways Instead of Rotating?",
  "What if All Books Could Talk and Narrate Themselves?",
  "How Would the Animal Kingdom Evolve if Predators Became Herbivores?",
  "What if We Could See the Entire Spectrum of Light?",
  "What if Superheroes and Supervillains Were Real?",
  "How Would Cultures Evolve if All Humans Looked Identical?",
  "What if Every Wish Made on a Shooting Star Came True?",
  "What People Once Thought the Moon was Made Of?",
  "What if the Internet was Invented in the 1800s?",
  "How Would Life be if Electricity was Never Discovered?",
  "What if the Library of Alexandria Never Burned Down?",
  "What if Humans Could Photosynthesize like Plants?",
  "How Would Modern Cities Look if Rome Never Fell?",
  "What if Leonardo da Vinci Had Modern Technology?",
  "What People in the Past Thought the Future Would Look Like?",
  "What if the Revolutionary War Never Happened?",
  "How Would Our Oceans Look if Coral Reefs Didn't Exist?",
  "What if Einstein Never Developed the Theory of Relativity?",
  "What if We Could Actually Travel Through Time?",
  "How Would Today's Music Sound if Mozart Was Still Alive?",
  "What if Your Favorite Historical Figure Used Social Media?",
  "How Would We Live if the World's Deserts Turned into Forests?",
  "What if the Wright Brothers Never Invented the Airplane?",
  "What People in Ancient Times Thought About Aliens?",
  "What if All the Volcanoes Erupted at Once?",
  "How Would Our World Change if Bees Went Extinct?",
  "What if Ancient Civilizations Had Modern Medicine?",
  "What if We Could Communicate with Dolphins?",
  "How Would History Change if We Found Atlantis?",
  "What if the Titanic Never Sank?",
  "What if Gravity Suddenly Became Weaker?",
  "How Would Life be Without the Invention of Plastic?",
  "What if Napoleon Won the Battle of Waterloo?",
  "What if the Printing Press Was Never Invented?",
  "How Would the World be if We Could Control Weather?",
  "What if the Moon Landing Never Happened?",
  "What if All the Continents Were Still Connected?",
  "What if the Internet Became Conscious?",
  "What if Ancient Greece Was Still a Major Power Today?",
  "What if We Never Discovered Germs?",
  "How Would Earth Look if It Were Flat?",
  "What if Coffee and Tea Never Existed?",
  "What if All Animals Could Speak Human Languages?",
  "What if We Found Evidence of Life on Mars?",
  "What if Christopher Columbus Never Discovered America?",
  "What if You Could Live in a Virtual World?",
  "How Would Sports Look if Ancient Gladiators Competed Today?",
  "What if the North Pole Completely Melted?",
  "What if Humans Could Fly Without Machines?",
  "What if the Sahara Desert Was a Lush Jungle?",
  "What if Alexander the Great Conquered the Whole World?",
  "What if We Could Regrow Lost Limbs like Starfish?",
  "What if the Great Wall of China Never Existed?",
  "What if We Found a New Fundamental Force of Nature?",
  "What if Dinosaurs Lived Alongside Humans?",
  "How Would Life Change if the Speed of Light Was Slower?",
  "What if Women Ruled the World Throughout History?",
  "What if All Historical Leaders Met in One Room?",
  "What if We Could Teleport Anywhere Instantly?",
  "What if the Pyramids Were Never Built?",
  "What if People Could Remember Everything?",
  "How Would Earth Change if It Had Rings like Saturn?",
  "What if We Could Breathe Underwater Naturally?",
  "What if Julius Caesar Was Never Assassinated?",
  "What if Dogs Were the Dominant Species on Earth?",
  "What if We Could Live on Other Planets Right Now?",
  "How Would History Change if Photos Existed in Ancient Times?",
  "What if Elon Musk Built a City on Mars?",
  "What if Beyoncé Was President of the United States?",
  "How Would the Internet Change if Bill Gates Created Social Media?",
  "What if Leonardo DiCaprio Really Lived on 'The Titanic'?",
  "What if Dwayne 'The Rock' Johnson Was an Actual Rock?",
  "What if Taylor Swift Wrote the National Anthem?",
  "How Would History Change if Albert Einstein Became a Pop Star?",
  "What if Serena Williams Competed in the Ancient Olympics?",
  "What if J.K. Rowling Was a Real-Life Witch?",
  "What if Steve Jobs Had Invented Time Travel Instead of the iPhone?",
  "How Would Fashion Look if Coco Chanel Was a Modern Designer?",
  "What if Stephen Hawking Discovered a Parallel Universe?",
  "What if Oprah Winfrey Ran a Global School System?",
  "How Would Movies Change if Tom Hanks Played Every Role?",
  "What if LeBron James Became a World-renowned Ballet Dancer?",
  "What if Lady Gaga Designed the New World's Tallest Building?",
  "How Would the World React if Prince William Became a Rock Star?",
  "What if Mark Zuckerberg Lived in the 18th Century?",
  "What if Usain Bolt Ran Across Entire Continents?",
  "What if Picasso Painted a New Mona Lisa?",
  "How Would the Universe Expand if Neil deGrasse Tyson Controlled It?",
  "What if Michael Jordan Played Soccer Instead of Basketball?",
  "What if Ariana Grande Conducted a Symphony Orchestra?",
  "How Would Travel Change if Richard Branson Invented Teleportation?",
  "What if Christopher Nolan Directed Your Life Story?",
  "What if Warren Buffett Gave Everyone Financial Advice?",
  "How Would Literature Change if J.R.R. Tolkien Wrote Modern Novels?",
  "What if Adele's Voice Could Heal Diseases?",
  "What if Jeff Bezos Funded Time Travel Research?",
  "How Would the Environment Change if David Attenborough Were World Leader?",
  "What if Meryl Streep Acted Out Historical Events in Real Time?",
];

const mainGenerateFunction = async () => {
  // folder = "What_if_Dinosaurs_Never_Went_Extinct_";
  //  await createVideo();
  //  return;

  getYoutubeToken();

  for (let i = 0; i < videoTitles.length; i++) {
    try
    {
      await generateVideoFromTheme(videoTitles[i]);
    }
    catch (e)
    {
      console.log("error: " + e);
      continue;
    }
  }
};

async function generateVideoFromTheme(theme : string) {

  folder = theme.replace(/[^a-zA-Z0-9]/g, "_");

  const response = await openai.createChatCompletion({
    model: "gpt-4-1106-preview",
    messages: [
      {
        "role": "system",
        "content": 'talk to me using json format as follows:\n["title": "video title",\n"description": "video description",\n"segments":\n[{\n"time_start": "00_00",\n"time_end": "00_05",\n"prompt": "prompt for dalle",\n"voice_acting": "narrators text"\n},\n"time_start": "00_05",\n"time_end": "00_08",\n"prompt": "prompt for dalle",\n"voice_acting": "narrators text"\n},]\n]\nI want you to create a youtube video script which will be composed of many sections. each section should be one or two sentences long to make each about 5-10s long. each section is defined using json as above.\nThe narrator will be david attenborough, and you will create a voiceline for him. only put his monolog in the voice acting field. the voice line should have value to the listener and explore the topic, so that the listener learns something new. be creative.\nThe video will be composed of images and the images are generated by dalle3. the prompts must not contain anything illegal, bad, or copyrighted, but still be on the topic!\nall keywords should be highly related to what is suppose to be shown in the video at the time to match what is explained by the narrator.\ntry to stay between 30-45s for the video\nonly output the json and make sure it has no mistakes in the json format.'
      },
      {
        "role": "user",
        "content": `The topic of the youtube video should be: \"${theme}\"`
      }
    ],
    temperature: 1,
    max_tokens: 3200,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
  }).catch((error: any) => {
    console.log(error);
  });

  var responseObject
  var contentObject
  try 
  {
    responseObject = response.data["choices"][0]["message"];
    contentObject = JSON.parse(responseObject.content);
  }
  catch (e)
  {
    console.log("error: " + e);
    console.log(responseObject)
    return;
  }

  const parsedResponse: Response = {
    role: responseObject.role,
    content: contentObject
  };

  imageNames = [];
  audioNames = [];

  // run function for each item in content
  const maxGenerationsPerMinute = 5
  const delay = 60 / maxGenerationsPerMinute;
  for (let i = 0; i < parsedResponse.content.segments.length; i++) {
    const element = parsedResponse.content.segments[i];

    console.log("starting image with prompt: " + element.prompt);
    await createOneDalleImage(element.prompt, element.time_start + ".png");
    //await createOneMidjourneyImage(element.prompt, element.time_start + ".png");
    imageNames[i] = element.time_start + ".png";

    console.log("starting voice line with text: " + element.voice_acting);
    await createOneVoiceLine(element.voice_acting, element.time_start + ".mp3");
    audioNames[i] = element.time_start + ".mp3";

    // wait to make sure we don't go over the limit
    await new Promise(resolve => setTimeout(resolve, delay * 1000));
  }

  await createVideo();

  
  await uploadVideo(finalOutputName, parsedResponse.content.title, parsedResponse.content.description);
}

async function createVideo() {
  console.log("creating video")

  const directory = path.join('D:', 'tmp', folder);

  // make sure the path exists
  if (!fs.existsSync(path.join('D:', '/tmp', folder))) {
    fs.mkdirSync(path.join('D:', '/tmp', folder));
  }

  // Delete the directory
  fs.readdir(directory, (err: any , files: any) => {
    if (err) throw err;
    for (const file of files) {
      const extname = path.extname(file).toLowerCase();
      if (extname === '.mp3' || extname === '.mp4' || extname === '.png') {
        fs.unlink(path.join(directory, file), (err: any) => {
          if (err) console.error(`Error deleting file ${file}: ${err}`);
        });
      }
    }
  });

  const images = await Promise.all(imageNames.map((name) => downloadFile(bucketName, name)));
  const audioFiles = await Promise.all(audioNames.map((name) => downloadFile(bucketName, name)));

  // Array to hold paths to the individual segment files
  const segmentsNames = [];
  const tempSegments = [];
  const transitions = ['fade', 'rectcrop', 'circlecrop', 'circleclose', 'circleopen', 'horzclose', 'horzopen', 'vertclose', 'fade', 'vertopen', 
  'diagbl', 'diagbr', 'diagtl', 'diagtr', 'pixelize', 'hblur', 'zoomin',
  'coverleft',  'coverright',  'coverup',  'coverdown',  'revealleft', 'revealright', 'revealup', 'revealdown', 'distance', 
    'smoothleft', 'smoothright', 'smoothdown', 'smoothup',
  ]; // Add more transitions as desired


  // Build complex filter graph
  let currentFinalName = path.join('D:', 'tmp', folder, "segment0.mp4"); 
  const finalOutputPath = path.join('D:', 'tmp', folder);
  let currentOffset = 0;

  let filter = "";
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const audioFile = audioFiles[i];
    const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${audioFile}`);
    const audioDuration = parseFloat(stdout.trim());
    const fadeDuration = 0.75;
    const duration = audioDuration; // Add 0.5 second before and after

    let segmentPath = path.join('D:', 'tmp', folder,  `segment${i}.mp4`);
    const tempSegmentPath = path.join('D:', 'tmp', folder, `temp_segment${i}.mp4`);

    // Random zoom direction (in or out)
    const zoomDirection = Math.random() < 0.5 ? -1 : 1; // Randomly selects -1 or 1
    const zoomStart = zoomDirection === -1 ? 1.5 : 1; // Starting zoom level
    const zoomEnd = zoomDirection === -1 ? 1 : 1 + (Math.random() * 0.5); // Ending zoom level

    // Random panning speeds
    const panSpeedX = (Math.random() - 0.5) * 2; // Random horizontal pan speed between -1 and 1
    const panSpeedY = (Math.random() - 0.5) * 2; // Random vertical pan speed between -1 and 1

    // Define the zoom and pan behavior
    const zoomExpression = zoomDirection == -1 ? `max(zoom-0.0005,${zoomEnd})` : `min(zoom+0.0005,${zoomEnd})`; // Gradually zoom in or out
    const xExpression = `if(gte(zoom,${zoomEnd}),x,x+${panSpeedX})`; // Pan horizontally at panSpeedX
    const yExpression = `if(gte(zoom,${zoomEnd}),y,y+${panSpeedY})`; // Pan vertically at panSpeedY


    const zoomPositionXRatio = Math.random() * 2 + 0.25;
    const zoomPositionX = `iw*${zoomPositionXRatio}-(iw/zoom*${zoomPositionXRatio})`;

    const zoomPositionYRatio = Math.random() * 2 + 0.25;
    const zoomPositionY = `iw*${zoomPositionYRatio}-(iw/zoom*${zoomPositionYRatio})`;

    console.log("creating video segment: " + i)

    const cmd = `ffmpeg -loop 1 -i ${image} -i ${audioFile} -t ${duration} -filter_complex [0]scale=1024:-2,setsar=1:1[out];[out]crop=1024:1024[out];[out]scale=8000:-1,zoompan=z='zoom+0.001':x=${zoomPositionX}:y=${zoomPositionY}:d=${60*duration}:s=1024x1024:fps=60[out] -map [out] -map 1:a -c:v libx264 -c:a aac -b:a 192k -pix_fmt yuv420p -y ${tempSegmentPath}`;
    await execAsync(cmd);

    tempSegments.push(tempSegmentPath);


    // If this is not the first segment, apply the xfade filter
    if (i > 0) {

      // Randomly select a transition from the list
      let transition = transitions[Math.floor(Math.random() * transitions.length)];

      const nextSegmentPath = path.join('D:', 'tmp', folder, `segment${i-1}_${i}.mp4`);

      console.log("merging " + currentFinalName + " and " + tempSegmentPath + " into " + nextSegmentPath)

      const xfadeCmd23 = `ffmpeg -i ${currentFinalName} -i ${tempSegmentPath} -c:v libx264 -c:a aac -b:a 192k -pix_fmt yuv420p -filter_complex "[0:v][1:v]xfade=transition=${transition}:duration=${fadeDuration}:offset=${currentOffset};[0:a][1:a]acrossfade=d=0.1;" -y ${nextSegmentPath}`;

      await execAsync(xfadeCmd23);
      currentFinalName = nextSegmentPath;

      segmentsNames.push(`file '${segmentPath}'`);
      currentOffset += duration - fadeDuration;
    } else {
      fs.copyFileSync(tempSegmentPath, currentFinalName);
      currentOffset += duration - fadeDuration;
    }
  }

  // find all files in music folder and save their paths to musicFiles
  const musicFiles = fs.readdirSync('D:\\tmp\\music').map((file: string) => {
    return path.join('D:\\tmp\\music', file);
  });

  const audioFile = musicFiles[Math.floor(Math.random() * musicFiles.length)];

  console.log("using audioFile: " + audioFile)

  finalOutputName = path.join(finalOutputPath, folder + ".mp4");

  const cmd = `ffmpeg -i ${currentFinalName} -i "${audioFile}" -filter_complex [1:a]apad[a1pad];[0:a]volume=1[a0];[a1pad]volume=.2[a1];[a0][a1]amerge=inputs=2 -c:v libx264 -c:a aac -b:a 192k -pix_fmt yuv420p -y ${finalOutputName}`;
  await execAsync(cmd);
  console.log("video done")


  const { Storage } = require('@google-cloud/storage');
  const storage = new Storage(); // Assumes you have set up authentication elsewhere

  // Reference to the Google Cloud Storage bucket and file path
  const filePath = 'final_output.mp4'; // Destination path in the bucket

  // Create a readable stream from the local file
  const readStream = fs.createReadStream(finalOutputName);

  // Create a writable stream to the Google Cloud Storage file
  const file = storage.bucket(bucketName).file(filePath);
  const writeStream = file.createWriteStream({
    metadata: {
      contentType: 'video/mp4', // Set the content type to video/mp4
    },
  });

  // Pipe the local file to Google Cloud Storage
  readStream.pipe(writeStream);

  writeStream.on('finish', () => {
    console.log('File written successfully to Google Cloud Storage');
  });

  writeStream.on('error', (error: any) => {
    console.error('Error writing file to Google Cloud Storage:', error);
  });


}

async function createOneDalleImage(prompt:String, fileName:String) {
  try {
    // Generate image using DALL-E
    const response = await openai.createImage({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });

    const imageUrl = response.data.data[0].url;

    // Download the image
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer', // Receive the response as a binary buffer
    });

    // Reference to the Google Cloud Storage bucket and file path
    const filePath = fileName;

    // Create a writable stream to the Google Cloud Storage file
    const file = storage.bucket(bucketName).file(filePath);
    const writeStream = file.createWriteStream({
      metadata: {
        contentType: 'image/png', // Set the content type to image/png
      },
    });

    // Write the image to Google Cloud Storage
    writeStream.write(imageResponse.data);
    writeStream.end();

    writeStream.on('finish', () => {
      console.log('File written successfully to Google Cloud Storage');
    });

    writeStream.on('error', (error: any) => {
      console.error('Error writing file to Google Cloud Storage:', error);
    });
  } catch (error) {
  console.error('Error generating or storing image:', error);
  if (error.response) {
    console.error('Response data:', error.response.data);
  }
}
}


async function createOneVoiceLine(text: string, fileName: string) {
    // URL to send the POST request
    const url = "https://api.elevenlabs.io/v1/text-to-speech/" + secrets.voiceModelID

    // Optional: Data to send in the POST request
    const postData = {
      "text": text,
      "model_id": "eleven_multilingual_v2",
      "voice_settings": {
        "stability": 0.5,
        "similarity_boost": 0.5
      }
    };
    
  
    // Send the POST request and receive the audio/mpeg file
    const response = await axios.post(url, postData, {
      responseType: 'arraybuffer', // Receive the response as a binary buffer
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
        'xi-api-key': secrets.xiApiKey
      },
    });
  
    // Reference to the Google Cloud Storage bucket and file path
    const filePath = fileName;
  
    // Create a writable stream to the Google Cloud Storage file
    const file = storage.bucket(bucketName).file(filePath);
    const writeStream = file.createWriteStream({
      metadata: {
        contentType: 'audio/mpeg',
      },
    });
  
    // Write the audio/mpeg file to Google Cloud Storage
    writeStream.write(response.data);
    writeStream.end();
  
    writeStream.on('finish', () => {
      console.log('File written successfully to Google Cloud Storage');
    });
  
    writeStream.on('error', (error: any) => {
      console.error('Error writing file to Google Cloud Storage:', error);
    });
}

async function createOneMidjourneyImage(prompt: string, fileName: string) {

  var url = secrets.midjourneyURL

  // Optional: Data to send in the POST request
  var postData = {
    "base64Array": [],
    "notifyHook": "",
    "prompt": prompt + " --ar 9:16",
    "state": ""
  };


  // Send the POST request and receive the audio/mpeg file
  var response = await axios.post(url, postData, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const id = response.data["result"];

  response = await waitForEmptyQueue(response);

  url = secrets.midjourneyURLChange;

  // Optional: Data to send in the POST request
  var nextPostData = {
    "action": "UPSCALE",
    "index": 1,
    "notifyHook": "",
    "state": "",
    "taskId": id.toString()
  };


  // Send the POST request and receive the audio/mpeg file
  response = await axios.post(url, nextPostData, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const newId = response.data["result"];

  response = await waitForEmptyQueue(response);

  const finalurl = secrets.midjourneyURLTask + newId.toString() + "/fetch";

  // Send the POST request and receive the audio/mpeg file
  response = await axios.get(finalurl, nextPostData, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const imageUrl = response.data["imageUrl"];

  response = await waitForEmptyQueue(response);

  const imageResponse = await axios.get(imageUrl, {
    responseType: 'arraybuffer', // Receive the response as a binary buffer
  });

  // Reference to the Google Cloud Storage bucket and file path
  const filePath = fileName;

  // Create a writable stream to the Google Cloud Storage file
  const file = storage.bucket(bucketName).file(filePath);
  const writeStream = file.createWriteStream({
    metadata: {
      contentType: 'image/png', // Set the content type to image/png
    },
  });

  // Write the image to Google Cloud Storage
  writeStream.write(imageResponse.data);
  writeStream.end();

  writeStream.on('finish', () => {
    console.log('File written successfully to Google Cloud Storage');
  });

  writeStream.on('error', (error: any) => {
    console.error('Error writing file to Google Cloud Storage:', error);
  });
}

async function waitForEmptyQueue(response: any) {
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: secrets.midjourneyURLQueue,
    headers: {},
    data: ''
  };

  const delay = 5;
  const maxDelay = 300;
  let count = 0;
  while (count < maxDelay) {

    // wait for 1 seconds
    await new Promise(resolve => setTimeout(resolve, delay * 1000));

    response = await axios.request(config);

    if (Object.keys(response.data).length == 0) {
      break;
    }

    count += delay;
  }

  return response;
}

async function debugFunction() {

  const currentFinalName = "D:\\tmp\\How_Would_Our_Oceans_Look_if_Coral_Reefs_Didn_t_Exist_\\segment5_6.mp4";
  const finalOutputName = "D:\\tmp\\How_Would_Our_Oceans_Look_if_Coral_Reefs_Didn_t_Exist_\\final_video.mp4";

  // find all files in music folder and save their paths to musicFiles
  const musicFiles = fs.readdirSync('D:\\tmp\\music').map((file: string) => {
    return path.join('D:\\tmp\\music', file);
  });

  let audioFile = musicFiles[Math.floor(Math.random() * musicFiles.length)];
  audioFile = "D:\\tmp\\music\\Action Cinematic Loop #18.wav";

  console.log("using audioFile: " + audioFile)



  // const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${currentFinalName}`);
  // const finalVideoLength = parseFloat(stdout.trim());

  // console.log("finalVideoLength: " + finalVideoLength)

  const cmd = `ffmpeg -i ${currentFinalName} -i "${audioFile}" -filter_complex [1:a]apad[a1pad];[0:a]volume=1[a0];[a1pad]volume=.2[a1];[a0][a1]amerge=inputs=2 -c:v libx264 -c:a aac -b:a 192k -pix_fmt yuv420p -y ${finalOutputName}`;
  await execAsync(cmd);
  console.log("video done")
}

async function testMidjrney() {
  await createOneMidjourneyImage("test", "test" + ".png");

}

async function testvoice() {
  createOneVoiceLine("test", "test");
}

const { google } = require('googleapis');
const { OAuth2 } = google.auth;

const CLIENT_ID = secrets.clientId
const CLIENT_SECRET = secrets.clientSecret
const REDIRECT_URI = "http://localhost:3000";

const oAuth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

function getAccessToken(oAuth2Client: { generateAuthUrl: (arg0: { access_type: string; scope: string[]; }) => any; }) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.upload'],
  });
  console.log('Authorize this app by visiting this url:', authUrl);
}


async function uploadVideo(
  path : string = 'D:\\tmp\\old\\How_Would_Life_be_Without_the_Invention_of_Plastic_\\final_output.mp4',
  title : string = 'How Would Life be Without the Invention of Plastic?',
  description : string = 'How Would Life be Without the Invention of Plastic?'
  ) {    

  var youtube = google.youtube('v3');

  var metadata = {
      snippet: { title:'title', description: 'description'}, 
      status: { privacyStatus: 'private' }
  };
  
  youtube.videos.insert(
    {
      auth: oAuth2Client,
      part: 'id,snippet,status',
      requestBody: {
        snippet: {
          title: title,
          description: description,
        },
        status: {
          privacyStatus: 'public',
        },
      },
      media: {
        body: fs.createReadStream(path),
      },
    },
    (err: any, response: { data: any; }) => {
      if (err) {
        console.log(err);
      } else {
        console.log(response.data);
      }
    }
  );
}

// call one with get Access Token uncommented to get the code and then run it to generate the token, dont forget to conver %2F to /
async function getYoutubeCredentials() {

  let code = secrets.googleCode
  code = code.replace("%2F", "/")

  //getAccessToken(oAuth2Client);
  
  // Exchange authorization code for access token
  oAuth2Client.getToken(code, (err: any, token: any) => {
    if (err) {
      console.error('Error retrieving access token', err);
      return console.error('Error retrieving access token');
    }

    // Save the token to a file
    fs.writeFile('tokens.json', JSON.stringify(token), (err: any) => {
      if (err) console.error(err);
      console.log('Tokens saved to file');
    });
  });
}

async function getYoutubeToken() {

  try {
    const data = fs.readFileSync('tokens.json', 'utf8');
    const tokens = JSON.parse(data);
    oAuth2Client.setCredentials(tokens);
    console.log("tokens set");
  
    // Now you can use the OAuth2 client as needed
  } catch (err) {
    console.error('Error reading the tokens file:', err);
  }
  
}

// generation function
mainGenerateFunction();

// youtube upload settings

// first use this to generate the code
//getAccessToken(oAuth2Client);

// second use this to generate the token
//getYoutubeCredentials();


// debug

//getYoutubeToken();

//debugFunction();

//uploadVideo();

//testMidjrney();

//testvoice();