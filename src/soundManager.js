// src/soundManager.js
import { Howl, Howler } from 'howler';

const sounds = {
  click: new Howl({ src: ['/sounds/click.mp3'], volume: 0.5 }),
  notification: new Howl({ src: ['/sounds/notification.mp3'], volume: 0.6 }),
  turn: new Howl({ src: ['/sounds/turn.mp3'], volume: 0.8 }),
  income: new Howl({ src: ['/sounds/income.mp3'], volume: 0.7 }),
  expense: new Howl({ src: ['/sounds/expense.mp3'], volume: 0.7 }),
  build: new Howl({ src: ['/sounds/build.mp3'], volume: 0.6 }),
  bankrupt: new Howl({ src: ['/sounds/bankrupt.mp3'], volume: 0.8 }),
  dice: new Howl({ src: ['/sounds/dice.mp3'], volume: 0.6 }),
  chat: new Howl({ src: ['/sounds/chat.mp3'], volume: 0.5 }),
};

export const playSound = (type) => {
  if (sounds[type]) {
    sounds[type].play();
  } else {
    console.warn(`Som não encontrado: ${type}`);
  }
};

export const setGlobalMute = (muted) => {
  Howler.mute(muted);
};
