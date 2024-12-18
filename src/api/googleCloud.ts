export const synthesizeSpeech = async (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => resolve();
    utterance.onerror = (error) => reject(error);
    window.speechSynthesis.speak(utterance);
  });
};

export const transcribeSpeech = async (audioBlob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      resolve(transcript);
    };

    recognition.onerror = (error) => reject(error);
    recognition.start();
  });
};