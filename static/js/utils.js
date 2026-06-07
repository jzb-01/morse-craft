export function beep(audio, duration) {
  const oscillator = audio.createOscillator();
  
  oscillator.type = 'sine'; 
  oscillator.frequency.setValueAtTime(600, audio.currentTime); 
  
  oscillator.connect(audio.destination);

  oscillator.start(audio.currentTime);
  

  oscillator.stop(audio.currentTime + (duration / 1000)); 
}