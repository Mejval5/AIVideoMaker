# Youtube AI shorts maker

## Showcase
https://www.youtube.com/channel/UCe9WDr3LCEiej97IgFptQ8A

## What
This pipeline can create automatically generated YouTube videos. It generates video composed of several images each accompanied by a voiceover. The videos pan and zoom and have background music playing.
All of this is fully automatic even with the upload to youtube. All that is needed is to provide necessary tokens for all the API accesses.
The installation is obscure by design so that not everyone generates videos and spams YouTube.
I do think sometimes about making this an actual service for people to use, but it is a bit scary. Also it seems to be not economically feasible atm since every video costs at least 1$ and they are probably not good enough to generate that money back. Altough, I have very good like/dislake ratio on all my vids. Maybe some day.

## Technology stack

### List
1. Firebase functions - TypeScript
2. Google storage
3. OpenAI's API for text completion with GPT-4
4. OpenAI's API for image generation with Dall-e 3
5. Elevenlabs API
6. FFMPEG
7. YouTube API

### How it works
1. I run the firebase locally at least for now, but it could be deployed in the future. It contains functions and google storage emulation.
2. There is a list of video ideas. Sequentially each is processed.
3. The prompt for video is sent to GPT-4 to create a script for the video. The script contains definition for "scenes". Each "scene" is composed of an image prompt and voice over text. For each scene we do:
   a. Image prompt is sent to dalle-3 to create an image for the segment. The file is saved to Google Storage.
   b. Voice over line is sent to Elevenlabs to generate an audio file. The file is saved to Google Storage.
4. We now create a video using FFMPEG. We go through each "scene" and create a video segment.
5. We stich all the segments together and then add random music from library. This is done via local folder, but could be a google storage link to the music collection.
6. We save the final video to the cloud storage.
7. Then we take the YouTube credentials and call API to upload the video to our channel.

### Install guide
1. Pull repo
2. Create secrets.json file in the `/functions` folder and fill it with appropriate information as explained bellow.
3. Install firebase and run SetupLocally.bat
4. Run RunCompiler.bat so the changes are recompiled. If you do run the main function the recompile will NOT kill it. You have to kill the whole instance and create it again. Important because every recompile will technically create a new instance.
5. Go to code and on the bottom commend out the `mainGenerateFunction()` and uncomment the `getAccessToken(oAuth2Client)`
6. Run RunLocally.bat and check that in console you have a link to authenticate using Google 2 factor auth. Authenticate and then after redirect copy the auth code from the URL. Copy only the auth code, there is some stuff after it. Put this auth code into the secrets.json as `googleCode`
7. Comment out `getAccessToken(oAuth2Client)` and uncomment `getYoutubeCredentials();`. This should run and recompile without issue and it should create a file called `tokens.json` in the `/functions` folder.
8. Comment out `getYoutubeCredentials();` and uncomment the `mainGenerateFunction();`. Now the generation starts after recompile. You can now leave it do its thing and hopefully you setup all the credentials and it just works. If you refactor the code at this point the generation won't stop as it is running on it's own thread, so make sure to kill the instance and restart using the `RunLocally.bat`. You have to kill also the emulators which are in separate terminal otherwise you won't have ports available for the storage.
9. Wait and see your videos on YouTube.

#### Secrets
This file is used to generate all the images, voices, and video.
apiKeyGPT - api key for open ai playground
voiceModelID - ID of voice used in elevenlabs
xiApiKey - API key for elevenlabs
midjourneyURL - deprecated, but it is the url to the app which allows the usage of midjourney as an API
midjourneyURLChange - deprecated, see above
midjourneyURLTask - deprecated, see above
midjourneyURLQueue - deprecated, see above
clientId - google client ID for authentication for youtube
clientSecret - google Client secret for authentication for youtube
googleCode - oAuth code received after two factor authenticating your app with your youtube account
bucket - google bucket where to store files from generation

{
    "apiKeyGPT": "",
    "voiceModelID": "",
    "xiApiKey": "",
    "midjourneyURL": "[APP_URL]/mj/submit/imagine",
    "midjourneyURLChange": "[APP_URL]/mj/submit/change",
    "midjourneyURLTask": "[APP_URL]/mj/task/",
    "midjourneyURLQueue": "[APP_URL]/mj/task/queue",
    "clientId": "",
    "clientSecret": "",
    "googleCode": "",
    "bucket": ""
}
