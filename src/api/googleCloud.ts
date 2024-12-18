import { SpeechClient } from '@google-cloud/speech';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

// Initialize clients
const speechClient = new SpeechClient();
const ttsClient = new TextToSpeechClient();

export const synthesizeSpeech = async (text: string) => {
  const request = {
    input: { text },
    voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
    audioConfig: { audioEncoding: 'MP3' },
  };

  const [response] = await ttsClient.synthesizeSpeech(request);
  return response.audioContent;
};

export const transcribeSpeech = async (audioContent: Buffer) => {
  const audio = {
    content: audioContent.toString('base64'),
  };
  const config = {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'en-US',
  };
  const request = {
    audio,
    config,
  };

  const [response] = await speechClient.recognize(request);
  return response.results
    ?.map(result => result.alternatives?.[0]?.transcript)
    .join('\n');
};