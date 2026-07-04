'use strict';

const QUESTIONNAIRES = [
  {
    id: 'eva',
    name: 'Escala Visual Analógica',
    abbr: 'EVA',
    region: 'General',
    description: 'Intensidad del dolor (0–10)',
    itemCount: 1,
    type: 'slider',
    items: [
      {
        id: 'pain',
        label: '¿Cómo puntúas tu dolor actual?',
        sublabel: '0 = sin dolor · 10 = peor dolor imaginable',
        min: 0,
        max: 10,
      },
    ],
    score(answers) {
      return answers[0] ?? 0;
    },
    interpret(score) {
      if (score === 0)          return { label: 'Sin dolor',         color: '#38d9a9' };
      if (score <= 3)           return { label: 'Dolor leve',        color: '#38d9a9' };
      if (score <= 6)           return { label: 'Dolor moderado',    color: '#f59e0b' };
      if (score <= 8)           return { label: 'Dolor intenso',     color: '#fb923c' };
                                return { label: 'Dolor muy intenso', color: '#ef4444' };
    },
    formatScore(score) { return `${score}/10`; },
  },

  {
    id: 'ndi',
    name: 'Neck Disability Index',
    abbr: 'NDI',
    region: 'Cervical',
    description: 'Discapacidad funcional en cervicalgia',
    itemCount: 10,
    type: 'radio',
    items: [
      {
        id: 'pain',
        label: '1. Intensidad del dolor',
        options: [
          'No tengo dolor en este momento',
          'El dolor es muy leve en este momento',
          'El dolor es moderado en este momento',
          'El dolor es bastante fuerte en este momento',
          'El dolor es muy fuerte en este momento',
          'El dolor es el peor que pueda imaginar',
        ],
      },
      {
        id: 'personal_care',
        label: '2. Cuidado personal',
        options: [
          'Puedo cuidarme con normalidad sin que cause dolor extra',
          'Puedo cuidarme con normalidad, aunque me causa dolor extra',
          'Resulta doloroso cuidarme y voy despacio y con cuidado',
          'Necesito algo de ayuda pero consigo hacer la mayor parte del aseo',
          'Necesito ayuda cada día para la mayoría de los aspectos del cuidado personal',
          'No me visto, me lavo con dificultad y tengo que quedarme en cama',
        ],
      },
      {
        id: 'lifting',
        label: '3. Levantamiento de peso',
        options: [
          'Puedo levantar objetos pesados sin que aumente el dolor',
          'Puedo levantar objetos pesados pero me causa dolor extra',
          'El dolor me impide levantar objetos pesados del suelo, pero puedo si están en una mesa',
          'El dolor me impide levantar objetos pesados aunque puedo levantar ligeros o medianos bien colocados',
          'Solo puedo levantar objetos muy ligeros',
          'No puedo levantar ni cargar nada',
        ],
      },
      {
        id: 'reading',
        label: '4. Lectura',
        options: [
          'Puedo leer todo lo que quiero sin que me duela el cuello',
          'Puedo leer todo lo que quiero con un ligero dolor de cuello',
          'Puedo leer todo lo que quiero con un dolor de cuello moderado',
          'No puedo leer todo lo que quiero por un dolor de cuello moderado',
          'Apenas puedo leer por el intenso dolor de cuello',
          'No puedo leer nada por el dolor de cuello',
        ],
      },
      {
        id: 'headaches',
        label: '5. Dolores de cabeza',
        options: [
          'No tengo ningún dolor de cabeza',
          'Tengo ligeros dolores de cabeza que aparecen de vez en cuando',
          'Tengo dolores de cabeza moderados que aparecen de vez en cuando',
          'Tengo dolores de cabeza moderados que aparecen con frecuencia',
          'Tengo dolores de cabeza intensos que aparecen con frecuencia',
          'Tengo dolores de cabeza casi continuos',
        ],
      },
      {
        id: 'concentration',
        label: '6. Concentración',
        options: [
          'Puedo concentrarme completamente cuando quiero sin ninguna dificultad',
          'Puedo concentrarme completamente cuando quiero con ligera dificultad',
          'Tengo cierta dificultad para concentrarme cuando quiero',
          'Tengo bastante dificultad para concentrarme cuando quiero',
          'Tengo mucha dificultad para concentrarme cuando quiero',
          'No puedo concentrarme en absoluto',
        ],
      },
      {
        id: 'work',
        label: '7. Trabajo',
        options: [
          'Puedo hacer todo el trabajo que quiero',
          'Solo puedo hacer mi trabajo habitual pero no más',
          'Puedo hacer la mayor parte de mi trabajo habitual pero no más',
          'No puedo hacer mi trabajo habitual',
          'Apenas puedo hacer algún trabajo',
          'No puedo hacer ningún trabajo',
        ],
      },
      {
        id: 'driving',
        label: '8. Conducción',
        options: [
          'Puedo conducir mi coche sin ningún dolor de cuello',
          'Puedo conducir mi coche con un ligero dolor de cuello',
          'Puedo conducir mi coche con un dolor de cuello moderado',
          'No puedo conducir mi coche por un dolor de cuello moderado',
          'Apenas puedo conducir por el intenso dolor de cuello',
          'No puedo conducir mi coche por el dolor de cuello',
        ],
      },
      {
        id: 'sleeping',
        label: '9. Sueño',
        options: [
          'No tengo problemas para dormir',
          'Mi sueño se ve ligeramente perturbado (menos de 1 hora sin dormir)',
          'Mi sueño se ve ligeramente perturbado (1–2 horas sin dormir)',
          'Mi sueño se ve moderadamente perturbado (2–3 horas sin dormir)',
          'Mi sueño se ve muy perturbado (3–5 horas sin dormir)',
          'Mi sueño se ve completamente perturbado (5–7 horas sin dormir)',
        ],
      },
      {
        id: 'recreation',
        label: '10. Actividades de ocio',
        options: [
          'Puedo hacer todas mis actividades de ocio sin dolor de cuello',
          'Puedo hacer todas mis actividades de ocio con algo de dolor de cuello',
          'Solo puedo hacer la mayor parte de mis actividades habituales por el dolor',
          'Solo puedo hacer algunas de mis actividades habituales por el dolor',
          'Apenas puedo hacer ninguna actividad de ocio por el dolor',
          'No puedo hacer ninguna actividad de ocio',
        ],
      },
    ],
    score(answers) {
      return answers.reduce((sum, v) => sum + (v ?? 0), 0);
    },
    interpret(score) {
      const pct = score * 2;
      if (pct <= 4)  return { label: 'Sin discapacidad',       color: '#38d9a9', pct };
      if (pct <= 14) return { label: 'Discapacidad leve',      color: '#38d9a9', pct };
      if (pct <= 24) return { label: 'Discapacidad moderada',  color: '#f59e0b', pct };
      if (pct <= 34) return { label: 'Discapacidad grave',     color: '#fb923c', pct };
                     return { label: 'Discapacidad completa',  color: '#ef4444', pct };
    },
    formatScore(score) { return `${score}/50 (${score * 2}%)`; },
  },

  {
    id: 'odi',
    name: 'Oswestry Disability Index',
    abbr: 'ODI',
    region: 'Lumbar',
    description: 'Discapacidad funcional en lumbalgia',
    itemCount: 10,
    type: 'radio',
    items: [
      {
        id: 'pain',
        label: '1. Intensidad del dolor',
        options: [
          'No tengo dolor en estos momentos',
          'El dolor es muy suave en estos momentos',
          'El dolor es moderado en estos momentos',
          'El dolor es bastante severo en estos momentos',
          'El dolor es muy severo en estos momentos',
          'El dolor es el peor imaginable en estos momentos',
        ],
      },
      {
        id: 'personal_care',
        label: '2. Cuidado personal',
        options: [
          'Me puedo cuidar normalmente sin que esto incremente el dolor',
          'Me puedo cuidar normalmente aunque me incremente el dolor',
          'Cuidarme resulta doloroso y soy lento y cuidadoso',
          'Necesito alguna ayuda aunque hago la mayoría de mi cuidado personal',
          'Necesito ayuda diaria en todos los aspectos de mi cuidado personal',
          'No me visto, me lavo con mucha dificultad y permanezco en cama',
        ],
      },
      {
        id: 'lifting',
        label: '3. Levantamiento de objetos',
        options: [
          'Puedo levantar objetos pesados sin incremento de dolor',
          'Puedo levantar objetos pesados pero me produce incremento de dolor',
          'El dolor me impide levantar objetos pesados del suelo, aunque puedo si están en una mesa',
          'El dolor me impide levantar objetos pesados aunque puedo levantar ligeros o medianos bien colocados',
          'Solo puedo levantar objetos muy ligeros',
          'No puedo levantar nada',
        ],
      },
      {
        id: 'walking',
        label: '4. Caminar',
        options: [
          'El dolor no me impide caminar cualquier distancia',
          'El dolor me impide caminar más de 1 km',
          'El dolor me impide caminar más de 500 m',
          'El dolor me impide caminar más de 100 m',
          'Solo puedo caminar con bastón o muletas',
          'Permanezco en cama y tengo que ir al baño arrastrándome',
        ],
      },
      {
        id: 'sitting',
        label: '5. Estar sentado',
        options: [
          'Puedo estar sentado en cualquier silla tanto tiempo como quiero',
          'Puedo estar sentado en mi silla favorita tanto tiempo como quiero',
          'El dolor me impide estar sentado más de 1 hora',
          'El dolor me impide estar sentado más de media hora',
          'El dolor me impide estar sentado más de 10 minutos',
          'El dolor me impide estar sentado',
        ],
      },
      {
        id: 'standing',
        label: '6. Estar de pie',
        options: [
          'Puedo estar de pie tanto tiempo como quiero sin que esto incremente el dolor',
          'Puedo estar de pie tanto tiempo como quiero aunque esto me incrementa el dolor',
          'El dolor me impide estar de pie más de 1 hora',
          'El dolor me impide estar de pie más de media hora',
          'El dolor me impide estar de pie más de 10 minutos',
          'El dolor me impide estar de pie',
        ],
      },
      {
        id: 'sleeping',
        label: '7. Dormir',
        options: [
          'El dolor no me impide dormir bien',
          'El dolor solo me impide dormir bien ocasionalmente',
          'El dolor me impide dormir más de 6 horas',
          'El dolor me impide dormir más de 4 horas',
          'El dolor me impide dormir más de 2 horas',
          'El dolor me impide totalmente dormir',
        ],
      },
      {
        id: 'sex_life',
        label: '8. Vida sexual',
        options: [
          'Mi vida sexual es normal y no incrementa mi dolor',
          'Mi vida sexual es normal pero incrementa mi dolor',
          'Mi vida sexual es casi normal pero es muy dolorosa',
          'Mi vida sexual está muy limitada a causa del dolor',
          'Mi vida sexual es casi inexistente a causa del dolor',
          'El dolor me impide cualquier tipo de vida sexual',
        ],
      },
      {
        id: 'social',
        label: '9. Vida social',
        options: [
          'Mi vida social es normal y no incrementa mi dolor',
          'Mi vida social es normal aunque incrementa mi dolor',
          'El dolor no tiene efecto significativo excepto en actividades más enérgicas',
          'El dolor ha limitado mi vida social y no salgo tan frecuentemente',
          'El dolor ha limitado mi vida social a mi hogar',
          'No tengo vida social por el dolor',
        ],
      },
      {
        id: 'travelling',
        label: '10. Viajar',
        options: [
          'Puedo viajar a cualquier lugar sin que esto me incremente el dolor',
          'Puedo viajar a cualquier lugar aunque esto me incrementa el dolor',
          'El dolor es severo pero puedo hacer viajes de más de 2 horas',
          'El dolor me limita los viajes a menos de 1 hora',
          'El dolor me limita los viajes estrictamente necesarios de menos de 30 minutos',
          'El dolor me impide viajar salvo para recibir tratamiento',
        ],
      },
    ],
    score(answers) {
      return answers.reduce((sum, v) => sum + (v ?? 0), 0);
    },
    interpret(score) {
      const pct = score * 2;
      if (pct <= 20) return { label: 'Discapacidad mínima',   color: '#38d9a9', pct };
      if (pct <= 40) return { label: 'Discapacidad moderada', color: '#f59e0b', pct };
      if (pct <= 60) return { label: 'Discapacidad grave',    color: '#fb923c', pct };
      if (pct <= 80) return { label: 'Incapacitado',          color: '#ef4444', pct };
                     return { label: 'Inmovilizado en cama',  color: '#ef4444', pct };
    },
    formatScore(score) { return `${score}/50 (${score * 2}%)`; },
  },

  {
    id: 'quickdash',
    name: 'QuickDASH',
    abbr: 'qDASH',
    region: 'Miembro superior',
    description: 'Discapacidad de brazo, hombro y mano',
    itemCount: 11,
    type: 'radio',
    note: 'En la última semana, ¿cuánta dificultad ha tenido para:',
    items: [
      {
        id: 'jar',
        label: '1. Abrir un tarro apretado o nuevo',
        options: ['Sin dificultad', 'Dificultad leve', 'Dificultad moderada', 'Dificultad grave', 'Incapaz'],
      },
      {
        id: 'write',
        label: '2. Escribir',
        options: ['Sin dificultad', 'Dificultad leve', 'Dificultad moderada', 'Dificultad grave', 'Incapaz'],
      },
      {
        id: 'key',
        label: '3. Girar una llave',
        options: ['Sin dificultad', 'Dificultad leve', 'Dificultad moderada', 'Dificultad grave', 'Incapaz'],
      },
      {
        id: 'meal',
        label: '4. Preparar comidas',
        options: ['Sin dificultad', 'Dificultad leve', 'Dificultad moderada', 'Dificultad grave', 'Incapaz'],
      },
      {
        id: 'door',
        label: '5. Empujar o abrir una puerta pesada',
        options: ['Sin dificultad', 'Dificultad leve', 'Dificultad moderada', 'Dificultad grave', 'Incapaz'],
      },
      {
        id: 'shelf',
        label: '6. Colocar un objeto en una estantería sobre la cabeza',
        options: ['Sin dificultad', 'Dificultad leve', 'Dificultad moderada', 'Dificultad grave', 'Incapaz'],
      },
      {
        id: 'housework',
        label: '7. Realizar tareas pesadas del hogar (fregar suelos, limpiar paredes…)',
        options: ['Sin dificultad', 'Dificultad leve', 'Dificultad moderada', 'Dificultad grave', 'Incapaz'],
      },
      {
        id: 'garden',
        label: '8. Hacer jardinería o cuidar el jardín',
        options: ['Sin dificultad', 'Dificultad leve', 'Dificultad moderada', 'Dificultad grave', 'Incapaz'],
      },
      {
        id: 'bed',
        label: '9. Hacer la cama',
        options: ['Sin dificultad', 'Dificultad leve', 'Dificultad moderada', 'Dificultad grave', 'Incapaz'],
      },
      {
        id: 'bag',
        label: '10. Llevar una bolsa de la compra o un maletín',
        options: ['Sin dificultad', 'Dificultad leve', 'Dificultad moderada', 'Dificultad grave', 'Incapaz'],
      },
      {
        id: 'back',
        label: '11. Lavar su espalda',
        options: ['Sin dificultad', 'Dificultad leve', 'Dificultad moderada', 'Dificultad grave', 'Incapaz'],
      },
    ],
    score(answers) {
      const values = answers.map(v => (v ?? 0) + 1); // shift to 1–5
      const n = values.length;
      return Math.round(((values.reduce((s, v) => s + v, 0) / n) - 1) * 25);
    },
    interpret(score) {
      if (score <= 25) return { label: 'Sin/mínima discapacidad',   color: '#38d9a9' };
      if (score <= 50) return { label: 'Discapacidad leve–moderada', color: '#f59e0b' };
      if (score <= 75) return { label: 'Discapacidad moderada–grave', color: '#fb923c' };
                       return { label: 'Discapacidad grave',          color: '#ef4444' };
    },
    formatScore(score) { return `${score}/100`; },
  },

  {
    id: 'koos-ps',
    name: 'KOOS Physical Function Short Form',
    abbr: 'KOOS-PS',
    region: 'Rodilla',
    description: 'Función física de rodilla (forma abreviada)',
    itemCount: 7,
    type: 'radio',
    note: '¿Qué grado de dificultad / molestia ha tenido en la última semana?',
    items: [
      {
        id: 'squat',
        label: '1. Ponerse en cuclillas',
        options: ['Ninguno', 'Leve', 'Moderado', 'Grave', 'Extremo'],
      },
      {
        id: 'run',
        label: '2. Correr',
        options: ['Ninguno', 'Leve', 'Moderado', 'Grave', 'Extremo'],
      },
      {
        id: 'uneven',
        label: '3. Andar por terreno irregular',
        options: ['Ninguno', 'Leve', 'Moderado', 'Grave', 'Extremo'],
      },
      {
        id: 'stairs',
        label: '4. Subir y bajar escaleras',
        options: ['Ninguno', 'Leve', 'Moderado', 'Grave', 'Extremo'],
      },
      {
        id: 'sleep',
        label: '5. Dificultad para dormir a causa del dolor de rodilla',
        options: ['Ninguno', 'Leve', 'Moderado', 'Grave', 'Extremo'],
      },
      {
        id: 'socks',
        label: '6. Ponerse calcetines o medias',
        options: ['Ninguno', 'Leve', 'Moderado', 'Grave', 'Extremo'],
      },
      {
        id: 'sitting',
        label: '7. Estar sentado',
        options: ['Ninguno', 'Leve', 'Moderado', 'Grave', 'Extremo'],
      },
    ],
    score(answers) {
      const mean = answers.reduce((s, v) => s + (v ?? 0), 0) / answers.length;
      return Math.round(100 - mean * 25);
    },
    interpret(score) {
      if (score >= 75) return { label: 'Función casi normal',          color: '#38d9a9' };
      if (score >= 50) return { label: 'Función moderadamente limitada', color: '#f59e0b' };
      if (score >= 25) return { label: 'Función gravemente limitada',   color: '#fb923c' };
                       return { label: 'Función muy gravemente limitada', color: '#ef4444' };
    },
    formatScore(score) { return `${score}/100`; },
  },
];
