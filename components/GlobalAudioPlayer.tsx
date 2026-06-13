'use client';

export function GlobalAudioPlayer() {
  return (
    <audio 
      id="global-intro-audio" 
      preload="auto" 
      src="https://upload.wikimedia.org/wikipedia/commons/1/18/Bach_-_Cello_Suite_No._1_in_G_Major_-_1._Prelude.ogg" 
    />
  );
}

export const playGlobalIntroAudio = () => {
  if (typeof document !== 'undefined') {
    const audioEl = document.getElementById('global-intro-audio') as HTMLAudioElement;
    if (audioEl) {
      audioEl.volume = 0;
      audioEl.currentTime = 0;
      const playPromise = audioEl.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          let volume = 0;
          const fadeInInterval = setInterval(() => {
            if (volume < 0.5) {
              volume += 0.05;
              audioEl.volume = Math.min(volume, 0.5);
            } else {
              clearInterval(fadeInInterval);
            }
          }, 200);

          setTimeout(() => {
            let fadeOutVol = audioEl.volume;
            const fadeOutInterval = setInterval(() => {
              if (fadeOutVol > 0.05) {
                fadeOutVol -= 0.05;
                audioEl.volume = Math.max(fadeOutVol, 0);
              } else {
                clearInterval(fadeOutInterval);
                audioEl.pause();
                audioEl.currentTime = 0;
              }
            }, 200);
          }, 27000);
        }).catch(error => {
          console.error("Audio autoplay prevented:", error);
        });
      }
    }
  }
};
