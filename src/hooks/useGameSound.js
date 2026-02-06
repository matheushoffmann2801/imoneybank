import { useRef, useEffect, useCallback } from 'react';
import { Howl } from 'howler';

export const useGameSound = () => {
  const sounds = useRef(null);

  useEffect(() => {
    // Inicializa os sons com os caminhos exatos dos seus arquivos
    const s = {
      click: new Howl({ src: ['/sounds/click.wav'], volume: 0.5 }),
      cash: new Howl({ src: ['/sounds/cash.mp3'], volume: 0.6 }),
      error: new Howl({ src: ['/sounds/error.wav'], volume: 0.4 }),
      success: new Howl({ src: ['/sounds/success.wav'], volume: 0.5 }),
      turn: new Howl({ src: ['/sounds/turn.wav'], volume: 0.7 }),
    };

    // Aliases para compatibilidade com o código existente do App.jsx
    s.income = s.cash;
    s.expense = s.error;
    s.bankrupt = s.error;
    s.build = s.click;
    s.jail = s.error;
    s.jail_open = s.success;
    s.loan = s.cash;
    s.turn_pass = s.click;
    s.earthquake = s.error;
    s.tax = s.error;
    s.refund = s.cash;
    s.rent_receive = s.cash;
    s.visit = s.click;
    s.plane = s.click;
    s.rent_pay = s.error;
    s.achievement = s.success;
    s.auction_start = s.turn;
    s.auction_sold = s.cash;
    s.dice = s.click;
    s.sell = s.cash;
    s.reject = s.error;
    s.construct = s.click;
    s.lock = s.click;
    s.unlock = s.success;
    s.community_expense = s.error;
    s.community_income = s.cash;
    s.seized = s.error;
    s.loan_pay_anim = s.cash;
    s.debt_pay_anim = s.error;
    s.weather_sun = s.click;
    s.weather_rain = s.click;
    s.notification = s.turn;

    sounds.current = s;
  }, []);

  const play = useCallback((soundName) => {
    if (sounds.current && sounds.current[soundName]) {
      // Game Juice: Variação sutil de velocidade (0.95x a 1.05x)
      // Isso evita o "efeito metralhadora" robótico em cliques rápidos
      const rate = 0.95 + Math.random() * 0.1;
      
      const id = sounds.current[soundName].play();
      sounds.current[soundName].rate(rate, id);
    }
  }, []);

  return { play };
};
