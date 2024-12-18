// Using Web Speech API for browser-compatible speech services
export const synthesizeSpeech = async (text: string): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      // Since Web Speech API doesn't provide audio buffer,
      // we're returning an empty buffer for type compatibility
      resolve(new ArrayBuffer(0));
    };
    utterance.onerror = (error) => {
      reject(error);
    };
    window.speechSynthesis.speak(utterance);
  });
};

export const transcribeSpeech = async (audioContent: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      resolve(transcript);
    };

    recognition.onerror = (error) => {
      reject(error);
    };

    // Convert blob to audio element and play it
    const audio = new Audio(URL.createObjectURL(audioContent));
    audio.onended = () => {
      recognition.stop();
    };
    
    recognition.start();
    audio.play().catch(reject);
  });
};