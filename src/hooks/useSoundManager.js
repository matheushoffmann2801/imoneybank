import { Howl } from 'howler';
import { useCallback, useRef } from 'react';

// Centralize os caminhos aqui. Coloque os arquivos MP3 na pasta /public/sounds/
const SOUND_ASSETS = {
  // Sons Básicos (Solicitados)
  click: '/sounds/ui-click.mp3',
  success: '/sounds/success-chime.mp3',
  error: '/sounds/error-buzz.mp3',
  auction: '/sounds/gavel-hit.mp3',
  notification: '/sounds/pop.mp3',

  // Mapeamento de Compatibilidade (Para não quebrar o App.jsx existente)
  turn: '/sounds/pop.mp3',
  income: '/sounds/success-chime.mp3',
  expense: '/sounds/error-buzz.mp3',
  bankrupt: '/sounds/error-buzz.mp3',
  build: '/sounds/ui-click.mp3',
  jail: '/sounds/error-buzz.mp3',
  jail_open: '/sounds/success-chime.mp3',
  loan: '/sounds/success-chime.mp3',
  turn_pass: '/sounds/ui-click.mp3',
  earthquake: '/sounds/error-buzz.mp3',
  tax: '/sounds/error-buzz.mp3',
  refund: '/sounds/success-chime.mp3',
  rent_receive: '/sounds/success-chime.mp3',
  visit: '/sounds/ui-click.mp3',
  plane: '/sounds/ui-click.mp3',
  rent_pay: '/sounds/error-buzz.mp3',
  achievement: '/sounds/success-chime.mp3',
  auction_start: '/sounds/gavel-hit.mp3',
  auction_sold: '/sounds/success-chime.mp3',
  dice: '/sounds/ui-click.mp3',
  sell: '/sounds/success-chime.mp3',
  reject: '/sounds/error-buzz.mp3',
  construct: '/sounds/ui-click.mp3',
  lock: '/sounds/ui-click.mp3',
  unlock: '/sounds/ui-click.mp3',
  community_expense: '/sounds/error-buzz.mp3',
  community_income: '/sounds/success-chime.mp3',
  seized: '/sounds/error-buzz.mp3',
  loan_pay_anim: '/sounds/success-chime.mp3',
  debt_pay_anim: '/sounds/error-buzz.mp3',
  weather_sun: '/sounds/ui-click.mp3',
  weather_rain: '/sounds/ui-click.mp3'
};

export const useSoundManager = () => {
  // useRef mantém as instâncias do Howl sem recriar a cada render
  const sounds = useRef({});

  const play = useCallback((type, volume = 0.5) => {
    // Carregamento preguiçoso (Lazy load)
    if (!sounds.current[type]) {
      if (!SOUND_ASSETS[type]) {
        console.warn(`Som não registrado: ${type}`);
        return;
      }
      sounds.current[type] = new Howl({
        src: [SOUND_ASSETS[type]],
        volume: volume,
        preload: true,
      });
    }

    // Pequena variação de pitch para evitar som robótico em cliques rápidos
    const id = sounds.current[type].play();
    sounds.current[type].rate(0.9 + Math.random() * 0.2, id); 
  }, []);

  return { play };
};
