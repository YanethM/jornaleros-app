export const EMPLOYER_MESSAGES = {
    INITIAL_INTEREST: [
      "¡Hola {name}! Me gusta tu perfil y me gustaría contactarte sobre una oportunidad de trabajo.",
      "Hola {name}, tu experiencia me parece interesante. ¿Te gustaría conocer una oferta de trabajo?",
      "¡Hola {name}! He visto tu perfil y creo que podrías ser perfecto para un trabajo que tengo.",
    ],
  
    REQUEST_INFO: [
      "Hola {name}, me gustaría conocer más sobre tu experiencia. ¿Podrías contarme más?",
      "¡Hola {name}! ¿Podrías contarme sobre tu disponibilidad?",
    ],
  
    INTERVIEW_REQUEST: [
      "Hola {name}, ¿podríamos coordinar una llamada para conocernos mejor?",
      "¡Hola {name}! ¿Te parece si hablamos por teléfono?",
    ]
  };
  
  export const getContextualMessage = (worker, context = 'INITIAL_INTEREST') => {
    const messages = EMPLOYER_MESSAGES[context] || EMPLOYER_MESSAGES.INITIAL_INTEREST;
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    return randomMessage.replace('{name}', worker.user?.name || 'trabajador');
  };