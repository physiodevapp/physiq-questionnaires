'use strict';

// Shared 0–4 response scale used by EFES (UEFI) and EFEI (LEFS)
const FUNCTIONAL_SCALE_OPTIONS = [
  'Extrema dificultad o incapaz de realizar la actividad',
  'Bastante dificultad',
  'Dificultad moderada',
  'Un poco de dificultad',
  'No dificultad',
];

const QUESTIONNAIRES = [
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
    id: 'rmq',
    name: 'Cuestionario de Discapacidad de Roland-Morris',
    abbr: 'RMQ',
    region: 'Lumbar',
    description: 'Discapacidad funcional por dolor lumbar',
    itemCount: 24,
    type: 'radio',
    note: 'Marque «Sí» únicamente en las frases que describan cómo se ha encontrado esta semana debido a su dolor de espalda.',
    items: [
      { id: 'i1',  label: '1. Me quedo en casa la mayor parte del tiempo por mi dolor de espalda', options: ['No', 'Sí'] },
      { id: 'i2',  label: '2. Cambio de postura con frecuencia para intentar aliviar la espalda', options: ['No', 'Sí'] },
      { id: 'i3',  label: '3. Debido a mi espalda, camino más lentamente de lo normal', options: ['No', 'Sí'] },
      { id: 'i4',  label: '4. Debido a mi espalda, no hago ninguna de las tareas que habitualmente hago en casa', options: ['No', 'Sí'] },
      { id: 'i5',  label: '5. Debido a mi espalda, utilizo el pasamanos para subir escaleras', options: ['No', 'Sí'] },
      { id: 'i6',  label: '6. Debido a mi espalda, me tumbo a descansar más a menudo', options: ['No', 'Sí'] },
      { id: 'i7',  label: '7. Debido a mi espalda, tengo que apoyarme en algo para levantarme de un sillón', options: ['No', 'Sí'] },
      { id: 'i8',  label: '8. Debido a mi espalda, intento que otras personas hagan las cosas por mí', options: ['No', 'Sí'] },
      { id: 'i9',  label: '9. Me visto más despacio de lo normal debido a mi espalda', options: ['No', 'Sí'] },
      { id: 'i10', label: '10. Debido a la espalda, estoy de pie sólo durante breves períodos de tiempo', options: ['No', 'Sí'] },
      { id: 'i11', label: '11. Debido a la espalda, intento no inclinarme o arrodillarme', options: ['No', 'Sí'] },
      { id: 'i12', label: '12. Debido a la espalda, me cuesta levantarme de la silla', options: ['No', 'Sí'] },
      { id: 'i13', label: '13. Me duele la espalda la mayor parte del tiempo', options: ['No', 'Sí'] },
      { id: 'i14', label: '14. Debido a la espalda, me cuesta darme la vuelta en la cama', options: ['No', 'Sí'] },
      { id: 'i15', label: '15. No tengo muy buen apetito debido al dolor de espalda', options: ['No', 'Sí'] },
      { id: 'i16', label: '16. Me cuesta ponerme los calcetines (o las medias), debido al dolor de espalda', options: ['No', 'Sí'] },
      { id: 'i17', label: '17. Debido al dolor de espalda, solo camino distancias cortas', options: ['No', 'Sí'] },
      { id: 'i18', label: '18. Duermo peor debido a mi espalda', options: ['No', 'Sí'] },
      { id: 'i19', label: '19. Debido al dolor de espalda, necesito ayuda de otra persona para vestirme', options: ['No', 'Sí'] },
      { id: 'i20', label: '20. Debido a la espalda, me paso la mayor parte del día sentado/a', options: ['No', 'Sí'] },
      { id: 'i21', label: '21. Debido a la espalda, evito las tareas pesadas en casa', options: ['No', 'Sí'] },
      { id: 'i22', label: '22. Debido al dolor de espalda, estoy más irritable y de peor humor con los demás que de costumbre', options: ['No', 'Sí'] },
      { id: 'i23', label: '23. Debido a mi espalda, subo las escaleras más despacio de lo normal', options: ['No', 'Sí'] },
      { id: 'i24', label: '24. Me quedo casi constantemente en la cama por mi espalda', options: ['No', 'Sí'] },
    ],
    score(answers) {
      return answers.reduce((sum, v) => sum + (v ?? 0), 0);
    },
    interpret(score) {
      if (score <= 4)  return { label: 'Discapacidad mínima',  color: '#38d9a9' };
      if (score <= 9)  return { label: 'Discapacidad leve',    color: '#38d9a9' };
      if (score <= 14) return { label: 'Discapacidad moderada', color: '#f59e0b' };
      if (score <= 19) return { label: 'Discapacidad grave',   color: '#fb923c' };
                       return { label: 'Discapacidad muy grave', color: '#ef4444' };
    },
    formatScore(score) { return `${score}/24`; },
  },

  {
    id: 'tsk11',
    name: 'Escala de Tampa para la Kinesiofobia',
    abbr: 'TSK-11',
    region: 'Psicológico',
    description: 'Miedo al movimiento y a la (re)lesión',
    itemCount: 11,
    type: 'radio',
    note: 'Indique su grado de acuerdo con cada afirmación.',
    items: [
      { id: 'i1',  label: '1. Tengo miedo de lesionarme si hago ejercicio físico', options: ['Totalmente en desacuerdo', 'Algo en desacuerdo', 'Algo de acuerdo', 'Totalmente de acuerdo'] },
      { id: 'i2',  label: '2. Si me dejara vencer por el dolor, el dolor aumentaría', options: ['Totalmente en desacuerdo', 'Algo en desacuerdo', 'Algo de acuerdo', 'Totalmente de acuerdo'] },
      { id: 'i3',  label: '3. Mi cuerpo me está diciendo que tengo algo serio', options: ['Totalmente en desacuerdo', 'Algo en desacuerdo', 'Algo de acuerdo', 'Totalmente de acuerdo'] },
      { id: 'i4',  label: '4. Tener dolor siempre quiere decir que en el cuerpo hay una lesión', options: ['Totalmente en desacuerdo', 'Algo en desacuerdo', 'Algo de acuerdo', 'Totalmente de acuerdo'] },
      { id: 'i5',  label: '5. Tengo miedo a lesionarme sin querer', options: ['Totalmente en desacuerdo', 'Algo en desacuerdo', 'Algo de acuerdo', 'Totalmente de acuerdo'] },
      { id: 'i6',  label: '6. Lo más seguro para evitar que aumente el dolor es tener cuidado y no hacer movimientos innecesarios', options: ['Totalmente en desacuerdo', 'Algo en desacuerdo', 'Algo de acuerdo', 'Totalmente de acuerdo'] },
      { id: 'i7',  label: '7. No me dolería tanto si no tuviese algo serio en mi cuerpo', options: ['Totalmente en desacuerdo', 'Algo en desacuerdo', 'Algo de acuerdo', 'Totalmente de acuerdo'] },
      { id: 'i8',  label: '8. El dolor me dice cuándo debo parar la actividad para no lesionarme', options: ['Totalmente en desacuerdo', 'Algo en desacuerdo', 'Algo de acuerdo', 'Totalmente de acuerdo'] },
      { id: 'i9',  label: '9. No es seguro para una persona con mi enfermedad hacer actividades físicas', options: ['Totalmente en desacuerdo', 'Algo en desacuerdo', 'Algo de acuerdo', 'Totalmente de acuerdo'] },
      { id: 'i10', label: '10. No puedo hacer todo lo que la gente normal hace porque me podría lesionar con facilidad', options: ['Totalmente en desacuerdo', 'Algo en desacuerdo', 'Algo de acuerdo', 'Totalmente de acuerdo'] },
      { id: 'i11', label: '11. Nadie debería hacer actividades físicas cuando tiene dolor', options: ['Totalmente en desacuerdo', 'Algo en desacuerdo', 'Algo de acuerdo', 'Totalmente de acuerdo'] },
    ],
    score(answers) {
      return answers.reduce((sum, v) => sum + (v ?? 0) + 1, 0);
    },
    interpret(score) {
      if (score < 27) return { label: 'Kinesiofobia baja (orientativo)',     color: '#38d9a9' };
      if (score <= 37) return { label: 'Kinesiofobia moderada (orientativo)', color: '#f59e0b' };
                       return { label: 'Kinesiofobia alta (orientativo)',     color: '#ef4444' };
    },
    formatScore(score) { return `${score}/44`; },
  },

  {
    id: 'phq2',
    name: 'Patient Health Questionnaire-2',
    abbr: 'PHQ-2',
    region: 'Psicológico',
    description: 'Cribado rápido de síntomas depresivos',
    itemCount: 2,
    type: 'radio',
    note: 'Durante las últimas 2 semanas, ¿con qué frecuencia le han molestado los siguientes problemas?',
    items: [
      { id: 'interest', label: '1. Poco interés o placer en hacer cosas', options: ['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días'] },
      { id: 'down',     label: '2. Se ha sentido decaído/a, deprimido/a o sin esperanza', options: ['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días'] },
    ],
    score(answers) {
      return answers.reduce((sum, v) => sum + (v ?? 0), 0);
    },
    interpret(score) {
      if (score >= 3) return { label: 'Cribado positivo — valorar PHQ-9', color: '#ef4444' };
      return { label: 'Cribado negativo', color: '#38d9a9' };
    },
    formatScore(score) { return `${score}/6`; },
  },

  {
    id: 'phq9',
    name: 'Patient Health Questionnaire-9',
    abbr: 'PHQ-9',
    region: 'Psicológico',
    description: 'Gravedad de los síntomas depresivos',
    itemCount: 9,
    type: 'radio',
    note: 'Durante las últimas 2 semanas, ¿con qué frecuencia le han molestado los siguientes problemas?',
    items: [
      { id: 'interest',      label: '1. Poco interés o placer en hacer cosas', options: ['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días'] },
      { id: 'down',          label: '2. Se ha sentido decaído(a), deprimido(a) o sin esperanzas', options: ['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días'] },
      { id: 'sleep',         label: '3. Problemas para dormir, ya sea en dormir demasiado o en no poder conciliar el sueño, o en despertarse demasiado temprano', options: ['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días'] },
      { id: 'tired',         label: '4. Se ha sentido cansado(a) o con poca energía', options: ['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días'] },
      { id: 'appetite',      label: '5. Poco apetito o comer en exceso', options: ['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días'] },
      { id: 'failure',       label: '6. Se ha sentido mal con usted mismo(a), o que es un fracaso, o que ha quedado mal con usted mismo(a) o con su familia', options: ['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días'] },
      { id: 'concentration', label: '7. Dificultad para concentrarse en cosas tales como leer el periódico o ver la televisión', options: ['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días'] },
      { id: 'psychomotor',   label: '8. Se ha movido o hablado tan despacio que otras personas podrían haberlo notado, o lo contrario: muy inquieto(a) o agitado(a), moviéndose mucho más de lo normal', options: ['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días'] },
      { id: 'self_harm',     label: '9. Pensamientos de que estaría mejor muerto(a) o de hacerse daño de alguna manera', options: ['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días'] },
    ],
    score(answers) {
      return answers.reduce((sum, v) => sum + (v ?? 0), 0);
    },
    interpret(score, answers) {
      let result;
      if (score <= 4)       result = { label: 'Mínima o ninguna', color: '#38d9a9' };
      else if (score <= 9)  result = { label: 'Depresión leve',   color: '#38d9a9' };
      else if (score <= 14) result = { label: 'Depresión moderada', color: '#f59e0b' };
      else if (score <= 19) result = { label: 'Depresión moderadamente grave', color: '#fb923c' };
      else                  result = { label: 'Depresión grave', color: '#ef4444' };
      if (Array.isArray(answers) && (answers[8] ?? 0) > 0) result.risk = true;
      return result;
    },
    formatScore(score) { return `${score}/27`; },
  },

  {
    id: 'pseq',
    name: 'Pain Self-Efficacy Questionnaire',
    abbr: 'PSEQ',
    region: 'Psicológico',
    description: 'Autoeficacia frente al dolor crónico',
    itemCount: 10,
    type: 'radio',
    note: 'Indique el grado de confianza que tiene actualmente para realizar lo siguiente a pesar del dolor (0 = Nada seguro, 6 = Totalmente seguro).',
    items: [
      { id: 'i1',  label: '1. Puedo disfrutar de las cosas, a pesar del dolor', options: ['Nada seguro en absoluto', '', '', '', '', '', 'Totalmente seguro'] },
      { id: 'i2',  label: '2. Puedo hacer la mayoría de las tareas del hogar (por ejemplo, ordenar, fregar los platos, etc.), a pesar del dolor', options: ['Nada seguro en absoluto', '', '', '', '', '', 'Totalmente seguro'] },
      { id: 'i3',  label: '3. Puedo relacionarme socialmente con mis amigos o familiares tan a menudo como antes, a pesar del dolor', options: ['Nada seguro en absoluto', '', '', '', '', '', 'Totalmente seguro'] },
      { id: 'i4',  label: '4. Puedo afrontar mi dolor en la mayoría de las situaciones', options: ['Nada seguro en absoluto', '', '', '', '', '', 'Totalmente seguro'] },
      { id: 'i5',  label: '5. Puedo realizar algún tipo de trabajo, a pesar del dolor (incluye tareas del hogar, trabajo remunerado y no remunerado)', options: ['Nada seguro en absoluto', '', '', '', '', '', 'Totalmente seguro'] },
      { id: 'i6',  label: '6. Todavía puedo hacer muchas de las cosas que disfruto, como aficiones o actividades de ocio, a pesar del dolor', options: ['Nada seguro en absoluto', '', '', '', '', '', 'Totalmente seguro'] },
      { id: 'i7',  label: '7. Puedo afrontar mi dolor sin necesidad de medicación', options: ['Nada seguro en absoluto', '', '', '', '', '', 'Totalmente seguro'] },
      { id: 'i8',  label: '8. Todavía puedo cumplir la mayoría de mis metas en la vida, a pesar del dolor', options: ['Nada seguro en absoluto', '', '', '', '', '', 'Totalmente seguro'] },
      { id: 'i9',  label: '9. Puedo llevar una vida normal, a pesar del dolor', options: ['Nada seguro en absoluto', '', '', '', '', '', 'Totalmente seguro'] },
      { id: 'i10', label: '10. Puedo volverme gradualmente más activo/a, a pesar del dolor', options: ['Nada seguro en absoluto', '', '', '', '', '', 'Totalmente seguro'] },
    ],
    score(answers) {
      return answers.reduce((sum, v) => sum + (v ?? 0), 0);
    },
    interpret(score) {
      if (score <= 20) return { label: 'Autoeficacia baja',      color: '#ef4444' };
      if (score <= 40) return { label: 'Autoeficacia moderada',  color: '#f59e0b' };
                       return { label: 'Autoeficacia alta',      color: '#38d9a9' };
    },
    formatScore(score) { return `${score}/60`; },
  },

  {
    id: 'efes',
    name: 'Escala Funcional de Extremidad Superior',
    abbr: 'EFES',
    region: 'ES',
    description: 'Función física de la extremidad superior (UEFI)',
    itemCount: 20,
    type: 'radio',
    note: 'Hoy, ¿le causa o le pudiera causar dificultad con:',
    items: [
      { id: 'i1',  label: '1. Cualquier trabajo usual, trabajo doméstico, o actividades de la escuela', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i2',  label: '2. Sus pasatiempos usuales, actividades recreativas o deportivas', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i3',  label: '3. Levantar una bolsa de comestibles al nivel de la cintura', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i4',  label: '4. Levantar una bolsa de comestibles por encima de la cabeza', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i5',  label: '5. Arreglarse el pelo', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i6',  label: '6. Poner presión en las manos como al levantarse de la bañera o silla', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i7',  label: '7. Preparando comida como pelar o cortar', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i8',  label: '8. Conducir', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i9',  label: '9. Limpiar con la aspiradora, barrer, o rastrillar', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i10', label: '10. Vestirse', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i11', label: '11. Abrochándose los botones', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i12', label: '12. Utilizando instrumentos o aparatos', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i13', label: '13. Abrir puertas', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i14', label: '14. Limpiar', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i15', label: '15. Atar zapatos', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i16', label: '16. Dormir', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i17', label: '17. Lavando, planchando, doblando ropa', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i18', label: '18. Abriendo un frasco', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i19', label: '19. Tirar una pelota', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i20', label: '20. Cargar una maleta pequeña con la extremidad afectada', options: FUNCTIONAL_SCALE_OPTIONS },
    ],
    score(answers) {
      return answers.reduce((sum, v) => sum + (v ?? 0), 0);
    },
    interpret(score) {
      if (score <= 20) return { label: 'Función muy limitada',     color: '#ef4444' };
      if (score <= 40) return { label: 'Función limitada',         color: '#fb923c' };
      if (score <= 60) return { label: 'Función moderadamente limitada', color: '#f59e0b' };
                       return { label: 'Función normal/casi normal', color: '#38d9a9' };
    },
    formatScore(score) { return `${score}/80`; },
  },

  {
    id: 'efei',
    name: 'Escala Funcional de Extremidad Inferior',
    abbr: 'EFEI',
    region: 'EI',
    description: 'Función física de la extremidad inferior (LEFS)',
    itemCount: 20,
    type: 'radio',
    note: 'Hoy, ¿le causa o le pudiera causar dificultad con:',
    items: [
      { id: 'i1',  label: '1. Cualquier trabajo usual, trabajo doméstico, o actividades de la escuela', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i2',  label: '2. Sus pasatiempos usuales, actividades recreativas o deportivas', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i3',  label: '3. Entrar o salir del baño', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i4',  label: '4. Andar entre cuartos', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i5',  label: '5. Poniendo sus zapatos o los calcetines', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i6',  label: '6. Ponerse en cuclillas', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i7',  label: '7. Levantar un objeto, como una bolsa de comestibles del piso', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i8',  label: '8. Realizar actividades ligeras domésticas', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i9',  label: '9. Realizar actividades pesadas domésticas', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i10', label: '10. Entrar o salir de un coche', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i11', label: '11. Caminar 2 cuadras', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i12', label: '12. Caminar una milla', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i13', label: '13. Subir o bajar 10 escalones (cerca de 1 escalera completa)', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i14', label: '14. Estar de pie por 1 hora', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i15', label: '15. Estar sentado por 1 hora', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i16', label: '16. Correr sobre suelo plano', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i17', label: '17. Correr sobre suelo desigual', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i18', label: '18. Hacer vueltas bruscas cuando corre rápidamente', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i19', label: '19. Saltar', options: FUNCTIONAL_SCALE_OPTIONS },
      { id: 'i20', label: '20. Darse la vuelta en la cama', options: FUNCTIONAL_SCALE_OPTIONS },
    ],
    score(answers) {
      return answers.reduce((sum, v) => sum + (v ?? 0), 0);
    },
    interpret(score) {
      if (score <= 20) return { label: 'Función muy limitada',     color: '#ef4444' };
      if (score <= 40) return { label: 'Función limitada',         color: '#fb923c' };
      if (score <= 60) return { label: 'Función moderadamente limitada', color: '#f59e0b' };
                       return { label: 'Función normal/casi normal', color: '#38d9a9' };
    },
    formatScore(score) { return `${score}/80`; },
  },
];
