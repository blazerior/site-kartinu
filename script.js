/* ============================================================
   ЕКАТЕРИНА ЛАПТЕВА — script.js
   ============================================================ */

'use strict';

/* ============================================================
   i18n
   ============================================================ */
const translations = {
  ru: {
    'nav.logo': 'ЕКАТЕРИНА ЛАПТЕВА',
    'nav.home': 'Главная',
    'nav.about': 'Обо мне',
    'nav.works': 'Работы',
    'nav.contacts': 'Контакты',

    'hero.subtitle': 'Художник · Москва',
    'hero.name.first': 'ЕКАТЕРИНА',
    'hero.name.last': 'ЛАПТЕВА',
    'hero.cta': 'Смотреть работы',

    'about.label': 'Обо мне',
    'about.heading': 'Биография',
    'about.p1': 'Родилась в Самаре, сейчас живу в Москве. С самого детства знала, что я художник. Пробовала себя в разных направлениях: много лет работала декоратором, сотрудничала с «Первым каналом», пишу сценарии. Сейчас я двигаюсь от керамики к живописи. В моих работах соединяются символизм и поиск чудесного. Для меня важны метафора, цвет, свет, символ, глубина и экспрессия — всё это имеет значение.',
    'about.p2': '2022 — Британская высшая школа дизайна. 2021 — Курс современной керамики, Британская высшая школа дизайна. 2000–2004 — Самарский государственный университет культуры, факультет декоративно-прикладного творчества. 1995–2000 — Самарское художественное училище им. Петрова-Водкина, факультет живописи.',
    'about.p3': '2025–2026 — Курс живописи Кати Грановой. 2024 — «Уновис 2», Центр творческих индустрий «Фабрика».',
    'about.p4': '2024 — «Сценарий на Оскар», галерея «Лин», Москва. 2005 — «Прекрасный сад», Московская городская дума, Москва.',

    'works.label': 'Работы',
    'works.heading': 'Серии',
    'series.btn': 'Смотреть серию',

    'series.ceramics': 'Керамика',
    'series.fate': 'Судьба человека',
    'series.dutch': 'Голландский натюрморт',
    'series.wind': 'Разговор с ветром',
    'series.egg': 'В начале было яйцо',
    'series.life': 'Форма жизни',
    'series.miracle': 'В поисках чуда',
    'series.graphics': 'Графика избранная',
    'series.lucism': 'Графика. Лучизм',
    'series.music': 'Графика. Серия «Музыка»',

    'card.fate.1.title': 'Небесная канцелярия',   'card.fate.1.mat': 'Холст, масло, пастель',
    'card.fate.2.title': 'Моменты',               'card.fate.2.mat': 'Холст, масло, карандаш',
    'card.fate.3.title': 'Решение',               'card.fate.3.mat': 'Холст, масло, карандаш',
    'card.fate.4.title': 'Ось',                   'card.fate.4.mat': 'Холст, масло, карандаш, пастель',
    'card.fate.5.title': 'Я+Я',                   'card.fate.5.mat': 'Холст, масло, пастель',
    'card.fate.6.title': 'Неизведанное',          'card.fate.6.mat': 'Холст, масло, пастель',
    'card.fate.7.title': 'Вечные перемены',       'card.fate.7.mat': 'Холст, масло, карандаш, пастель',
    'card.fate.8.title': 'Сейчас',                'card.fate.8.mat': 'Холст, масло, пастель',
    'card.fate.9.title': 'Эволюция',              'card.fate.9.mat': 'Холст, масло, пастель',
    'card.fate.10.title': 'Красной нитью 1',      'card.fate.10.mat': 'Бумага, карандаш, гуашь, пастель',
    'card.fate.11.title': 'Красной нитью 2',      'card.fate.11.mat': 'Бумага, карандаш, гуашь, пастель',
    'card.fate.12.title': 'Мечта',                'card.fate.12.mat': 'Бумага, карандаш, гуашь, пастель',

    'card.dutch.1.title': 'Голландский натюрморт с лимоном',         'card.dutch.1.mat': 'Холст, масло, пастель',
    'card.dutch.2.title': 'Голландский натюрморт с крыжовником',     'card.dutch.2.mat': 'Холст, масло, пастель',
    'card.dutch.3.title': 'Голландский натюрморт с раком',           'card.dutch.3.mat': 'Холст, масло, пастель',
    'card.dutch.4.title': 'Голландский натюрморт с чашей',           'card.dutch.4.mat': 'Холст, масло, пастель',
    'card.dutch.5.title': 'Голландский натюрморт с фруктами',        'card.dutch.5.mat': 'Холст, масло',
    'card.dutch.6.title': 'Голландский натюрморт с кубком-наутилусом', 'card.dutch.6.mat': 'Холст, масло, пастель',

    'card.wind.1.title': 'Солнечные зайчики',      'card.wind.1.mat': 'Холст, масло',
    'card.wind.2.title': 'Разговор с ветром 1',    'card.wind.2.mat': 'Бумага, карандаш',
    'card.wind.3.title': 'Вольный ветер',          'card.wind.3.mat': 'Бумага, карандаш',
    'card.wind.4.title': 'Разговор с ветром 2',    'card.wind.4.mat': 'Бумага, карандаш',
    'card.wind.5.title': 'Штормовое предупреждение', 'card.wind.5.mat': 'Бумага, карандаш',
    'card.wind.6.title': 'Разговор с ветром 3',    'card.wind.6.mat': 'Бумага, карандаш',
    'card.wind.7.title': 'Весенний ветер',         'card.wind.7.mat': 'Холст, масло, акрил',
    'card.wind.8.title': 'Тайное движение',        'card.wind.8.mat': 'Холст, масло, акрил',

    'card.egg.1.title': 'Дочки — матери', 'card.egg.1.mat': 'Холст на картоне, масло, акрил',
    'card.egg.2.title': 'Пришелец',       'card.egg.2.mat': 'Холст на картоне, масло',
    'card.egg.3.title': 'Драгоценное',    'card.egg.3.mat': 'Холст на картоне, масло',
    'card.egg.4.title': 'Птички',         'card.egg.4.mat': 'Холст на картоне, масло, акрил',

    'card.life.1.title': 'Форма жизни',          'card.life.1.mat': 'Холст, масло, пастель',
    'card.life.2.title': 'Сверхновая Цветозвезда', 'card.life.2.mat': 'Холст, масло',
    'card.life.3.title': 'Тишина',               'card.life.3.mat': 'Холст, масло',
    'card.life.4.title': 'Глубина',              'card.life.4.mat': 'Холст, масло',
    'card.life.5.title': 'Чудотворение',         'card.life.5.mat': 'Холст, акрил, пастель',

    'card.miracle.0.title': 'Тайная вечеря',                 'card.miracle.0.mat': 'Холст, масло, карандаш, пастель',
    'card.miracle.1.title': 'Семь лун',                      'card.miracle.1.mat': 'Холст, масло, акрил, пастель',
    'card.miracle.2.title': 'Танец жизни',                   'card.miracle.2.mat': 'Холст, масло, акрил',
    'card.miracle.3.title': 'Аналемма',                      'card.miracle.3.mat': 'Холст, масло, акрил, пастель',
    'card.miracle.4.title': 'Ловец Бабочек',                 'card.miracle.4.mat': 'Холст, акрил, масленная пастель',
    'card.miracle.5.title': 'В Поисках Чуда',                'card.miracle.5.mat': 'Холст, масло, масленный карандаш',
    'card.miracle.6.title': 'Жемчужина',                     'card.miracle.6.mat': 'Холст, масло, акрил',
    'card.miracle.7.title': 'Ливень света в эхе рассвета',   'card.miracle.7.mat': 'Холст на картоне, акварель, акрил',
    'card.miracle.8.title': 'Выше потолка',                  'card.miracle.8.mat': 'Холст, масло',
    'card.miracle.9.title': 'Чудесный знак',                 'card.miracle.9.mat': 'Акрил, гуашь',
    'card.miracle.10.title': 'Другое измерение',             'card.miracle.10.mat': 'Холст, акрил, пастель',
    'card.miracle.11.title': 'Нежность',                     'card.miracle.11.mat': 'Холст на картоне, акрил',

    'card.graphics.1.title': 'Где то там наверху', 'card.graphics.1.mat': 'Бумага, акварель, гуашь',
    'card.graphics.2.title': 'Осколки',            'card.graphics.2.mat': 'Бумага, гуашь, пастель',
    'card.graphics.3.title': 'Потустороннее',      'card.graphics.3.mat': 'Бумага, акварель, пастель',

    'card.lucism.1.title': 'Птицы',        'card.lucism.1.mat': 'Бумага, акварель, карандаш',
    'card.lucism.2.title': 'Кот улыбается','card.lucism.2.mat': 'Бумага, акварель, карандаш',
    'card.lucism.3.title': 'Сомный дракон','card.lucism.3.mat': 'Бумага, акварель, карандаш',
    'card.lucism.4.title': 'Сфера',        'card.lucism.4.mat': 'Бумага, акварель, карандаш',
    'card.lucism.5.title': 'Чистый луч',   'card.lucism.5.mat': 'Бумага, акварель, карандаш',
    'card.lucism.6.title': 'LED',          'card.lucism.6.mat': 'Бумага, акварель, карандаш',
    'card.lucism.7.title': 'Ленты',        'card.lucism.7.mat': 'Бумага, акварель, карандаш',
    'card.lucism.8.title': 'Весна',        'card.lucism.8.mat': 'Бумага, акварель, карандаш',
    'card.lucism.9.title': 'Чеснок',       'card.lucism.9.mat': 'Бумага, акварель, карандаш',

    'card.music.1.title': 'Моцарт',                      'card.music.1.mat': 'Бумага, акрил',
    'card.music.2.title': 'Огонь',                       'card.music.2.mat': 'Нотный лист, карандаш',
    'card.music.3.title': 'Ветер',                       'card.music.3.mat': 'Нотная бумага, акрил, карандаш',
    'card.music.4.title': 'Philip Glass «Morning Passages»', 'card.music.4.mat': 'Нотная бумага, акрил',
    'card.music.5.title': 'Вода',                        'card.music.5.mat': 'Бумага, акварель',

    'card.ceramics.1.title': 'Ящик Пандоры',         'card.ceramics.1.mat': 'Глина шамот, глазурь, стекло',
    'card.ceramics.2.title': 'Жизнь игра',           'card.ceramics.2.mat': 'Шамот, глазурь',
    'card.ceramics.3.title': 'Плод фантазий',        'card.ceramics.3.mat': 'Шамот, глазурь',
    'card.ceramics.4.title': 'Миром правит любовь',  'card.ceramics.4.mat': 'Шамотная глина, глазурь. На металлических подставках',
    'card.ceramics.5.title': 'Без цензуры',          'card.ceramics.5.mat': 'Шамотная глина, глазурь',
    'card.ceramics.6.title': 'Взгляд',               'card.ceramics.6.mat': 'Шамотная глина, глазурь',
    'card.ceramics.7.title': 'Упущенное время',      'card.ceramics.7.mat': 'Шамотная глина, глазурь',

    'contacts.label': 'Контакты',
    'contacts.heading': 'Связаться',
    'contacts.inn': 'ИНН:',
    'footer.name': 'Екатерина Лаптева',
  },

  en: {
    'nav.logo': 'EKATERINA LAPTEVA',
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.works': 'Works',
    'nav.contacts': 'Contact',

    'hero.subtitle': 'Artist · Moscow',
    'hero.name.first': 'EKATERINA',
    'hero.name.last': 'LAPTEVA',
    'hero.cta': 'View works',

    'about.label': 'About',
    'about.heading': 'Biography',
    'about.p1': 'Born in Samara, now living in Moscow. From early childhood I knew I was an artist. I have explored many directions: worked as a decorator for years, collaborated with Channel One, and write screenplays. Today I am moving from ceramics to painting. My works combine symbolism and a search for the miraculous — metaphor, colour, light, symbol, depth and expression all matter.',
    'about.p2': '2022 — British Higher School of Art & Design. 2021 — Contemporary Ceramics Course, BHSAD. 2000–2004 — Samara State University of Culture, Decorative & Applied Arts. 1995–2000 — Samara Art College named after Petrov-Vodkin, Painting.',
    'about.p3': '2025–2026 — Painting course by Katya Granova. 2024 — "Unovis 2", Centre for Creative Industries "Fabrika".',
    'about.p4': '2024 — "Oscar Script", gallery "Lin", Moscow. 2005 — "Beautiful Garden", Moscow City Duma, Moscow.',

    'works.label': 'Works',
    'works.heading': 'Series',
    'series.btn': 'View series',

    'series.ceramics': 'Ceramics',
    'series.fate': 'Fate of a Man',
    'series.dutch': 'Dutch Still Life',
    'series.wind': 'Conversation with the Wind',
    'series.egg': 'In the Beginning Was the Egg',
    'series.life': 'Form of Life',
    'series.miracle': 'In Search of a Miracle',
    'series.graphics': 'Selected Graphics',
    'series.lucism': 'Graphics. Lucism',
    'series.music': 'Graphics. Series "Music"',

    'card.fate.1.title': 'Heavenly Office',        'card.fate.1.mat': 'Canvas, oil, pastel',
    'card.fate.2.title': 'Moments',                'card.fate.2.mat': 'Canvas, oil, pencil',
    'card.fate.3.title': 'Decision',               'card.fate.3.mat': 'Canvas, oil, pencil',
    'card.fate.4.title': 'Axis',                   'card.fate.4.mat': 'Canvas, oil, pencil, pastel',
    'card.fate.5.title': 'I+I',                    'card.fate.5.mat': 'Canvas, oil, pastel',
    'card.fate.6.title': 'The Unknown',            'card.fate.6.mat': 'Canvas, oil, pastel',
    'card.fate.7.title': 'Eternal Changes',        'card.fate.7.mat': 'Canvas, oil, pencil, pastel',
    'card.fate.8.title': 'Now',                    'card.fate.8.mat': 'Canvas, oil, pastel',
    'card.fate.9.title': 'Evolution',              'card.fate.9.mat': 'Canvas, oil, pastel',
    'card.fate.10.title': 'Red Thread 1',          'card.fate.10.mat': 'Paper, pencil, gouache, pastel',
    'card.fate.11.title': 'Red Thread 2',          'card.fate.11.mat': 'Paper, pencil, gouache, pastel',
    'card.fate.12.title': 'Dream',                 'card.fate.12.mat': 'Paper, pencil, gouache, pastel',

    'card.dutch.1.title': 'Dutch Still Life with Lemon',       'card.dutch.1.mat': 'Canvas, oil, pastel',
    'card.dutch.2.title': 'Dutch Still Life with Gooseberries','card.dutch.2.mat': 'Canvas, oil, pastel',
    'card.dutch.3.title': 'Dutch Still Life with Crayfish',    'card.dutch.3.mat': 'Canvas, oil, pastel',
    'card.dutch.4.title': 'Dutch Still Life with a Bowl',      'card.dutch.4.mat': 'Canvas, oil, pastel',
    'card.dutch.5.title': 'Dutch Still Life with Fruit',       'card.dutch.5.mat': 'Canvas, oil',
    'card.dutch.6.title': 'Dutch Still Life with Nautilus Cup','card.dutch.6.mat': 'Canvas, oil, pastel',

    'card.wind.1.title': 'Sun Bunnies',            'card.wind.1.mat': 'Canvas, oil',
    'card.wind.2.title': 'Conversation with the Wind 1', 'card.wind.2.mat': 'Paper, pencil',
    'card.wind.3.title': 'Free Wind',              'card.wind.3.mat': 'Paper, pencil',
    'card.wind.4.title': 'Conversation with the Wind 2', 'card.wind.4.mat': 'Paper, pencil',
    'card.wind.5.title': 'Storm Warning',          'card.wind.5.mat': 'Paper, pencil',
    'card.wind.6.title': 'Conversation with the Wind 3', 'card.wind.6.mat': 'Paper, pencil',
    'card.wind.7.title': 'Spring Wind',            'card.wind.7.mat': 'Canvas, oil, acrylic',
    'card.wind.8.title': 'Secret Movement',        'card.wind.8.mat': 'Canvas, oil, acrylic',

    'card.egg.1.title': 'Mothers and Daughters', 'card.egg.1.mat': 'Canvas on board, oil, acrylic',
    'card.egg.2.title': 'Alien',                 'card.egg.2.mat': 'Canvas on board, oil',
    'card.egg.3.title': 'Precious',              'card.egg.3.mat': 'Canvas on board, oil',
    'card.egg.4.title': 'Little Birds',          'card.egg.4.mat': 'Canvas on board, oil, acrylic',

    'card.life.1.title': 'Form of Life',         'card.life.1.mat': 'Canvas, oil, pastel',
    'card.life.2.title': 'Supernova Colourstar', 'card.life.2.mat': 'Canvas, oil',
    'card.life.3.title': 'Silence',              'card.life.3.mat': 'Canvas, oil',
    'card.life.4.title': 'Depth',                'card.life.4.mat': 'Canvas, oil',
    'card.life.5.title': 'Wonder-Working',       'card.life.5.mat': 'Canvas, acrylic, pastel',

    'card.miracle.0.title': 'The Last Supper',              'card.miracle.0.mat': 'Canvas, oil, pencil, pastel',
    'card.miracle.1.title': 'Seven Moons',                  'card.miracle.1.mat': 'Canvas, oil, acrylic, pastel',
    'card.miracle.2.title': 'Dance of Life',                'card.miracle.2.mat': 'Canvas, oil, acrylic',
    'card.miracle.3.title': 'Analemma',                     'card.miracle.3.mat': 'Canvas, oil, acrylic, pastel',
    'card.miracle.4.title': 'Butterfly Catcher',            'card.miracle.4.mat': 'Canvas, acrylic, oil pastel',
    'card.miracle.5.title': 'In Search of a Miracle',       'card.miracle.5.mat': 'Canvas, oil, oil pencil',
    'card.miracle.6.title': 'Pearl',                        'card.miracle.6.mat': 'Canvas, oil, acrylic',
    'card.miracle.7.title': 'Rain of Light in Dawn\'s Echo','card.miracle.7.mat': 'Canvas on board, watercolour, acrylic',
    'card.miracle.8.title': 'Above the Ceiling',            'card.miracle.8.mat': 'Canvas, oil',
    'card.miracle.9.title': 'Miraculous Sign',              'card.miracle.9.mat': 'Acrylic, gouache',
    'card.miracle.10.title': 'Another Dimension',           'card.miracle.10.mat': 'Canvas, acrylic, pastel',
    'card.miracle.11.title': 'Tenderness',                  'card.miracle.11.mat': 'Canvas on board, acrylic',

    'card.graphics.1.title': 'Somewhere Up There', 'card.graphics.1.mat': 'Paper, watercolour, gouache',
    'card.graphics.2.title': 'Shards',             'card.graphics.2.mat': 'Paper, gouache, pastel',
    'card.graphics.3.title': 'The Otherworldly',   'card.graphics.3.mat': 'Paper, watercolour, pastel',

    'card.lucism.1.title': 'Birds',        'card.lucism.1.mat': 'Paper, watercolour, pencil',
    'card.lucism.2.title': 'The Cat Smiles','card.lucism.2.mat': 'Paper, watercolour, pencil',
    'card.lucism.3.title': 'Dreamy Dragon','card.lucism.3.mat': 'Paper, watercolour, pencil',
    'card.lucism.4.title': 'Sphere',       'card.lucism.4.mat': 'Paper, watercolour, pencil',
    'card.lucism.5.title': 'Pure Ray',     'card.lucism.5.mat': 'Paper, watercolour, pencil',
    'card.lucism.6.title': 'LED',          'card.lucism.6.mat': 'Paper, watercolour, pencil',
    'card.lucism.7.title': 'Ribbons',      'card.lucism.7.mat': 'Paper, watercolour, pencil',
    'card.lucism.8.title': 'Spring',       'card.lucism.8.mat': 'Paper, watercolour, pencil',
    'card.lucism.9.title': 'Garlic',       'card.lucism.9.mat': 'Paper, watercolour, pencil',

    'card.music.1.title': 'Mozart',                       'card.music.1.mat': 'Paper, acrylic',
    'card.music.2.title': 'Fire',                         'card.music.2.mat': 'Score sheet, pencil',
    'card.music.3.title': 'Wind',                         'card.music.3.mat': 'Score paper, acrylic, pencil',
    'card.music.4.title': 'Philip Glass «Morning Passages»', 'card.music.4.mat': 'Score paper, acrylic',
    'card.music.5.title': 'Water',                        'card.music.5.mat': 'Paper, watercolour',

    'card.ceramics.1.title': 'Pandora\'s Box',        'card.ceramics.1.mat': 'Chamotte clay, glaze, glass',
    'card.ceramics.2.title': 'Life Is a Game',        'card.ceramics.2.mat': 'Chamotte, glaze',
    'card.ceramics.3.title': 'Fruit of Fantasy',      'card.ceramics.3.mat': 'Chamotte, glaze',
    'card.ceramics.4.title': 'Love Rules the World',  'card.ceramics.4.mat': 'Chamotte clay, glaze. On metal stands',
    'card.ceramics.5.title': 'Without Censorship',    'card.ceramics.5.mat': 'Chamotte clay, glaze',
    'card.ceramics.6.title': 'Gaze',                  'card.ceramics.6.mat': 'Chamotte clay, glaze',
    'card.ceramics.7.title': 'Lost Time',             'card.ceramics.7.mat': 'Chamotte clay, glaze',

    'contacts.label': 'Contact',
    'contacts.heading': 'Get in Touch',
    'contacts.inn': 'Tax ID:',
    'footer.name': 'Ekaterina Lapteva',
  }
};

let currentLang = 'ru';

function applyLang(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  const t = translations[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key] !== undefined) el.textContent = t[key];
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    const pressed = btn.dataset.lang === lang;
    btn.classList.toggle('active', pressed);
    btn.setAttribute('aria-pressed', pressed);
  });
}

document.addEventListener('click', e => {
  const btn = e.target.closest('.lang-btn');
  if (btn) applyLang(btn.dataset.lang);
});

/* ============================================================
   NAVBAR SCROLL + ACTIVE SECTION
   ============================================================ */
const navbar = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-link');
const sections = ['hero', 'about', 'works', 'contacts'].map(id => document.getElementById(id));

function onScroll() {
  navbar.classList.toggle('scrolled', window.scrollY > 30);

  // Active nav link
  const midY = window.scrollY + window.innerHeight * 0.45;
  let active = sections[0];
  for (const sec of sections) {
    if (sec && sec.offsetTop <= midY) active = sec;
  }
  navLinks.forEach(link => {
    link.classList.toggle('active', active && link.getAttribute('href') === '#' + active.id);
  });
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ============================================================
   MOBILE MENU
   ============================================================ */
const burger = document.getElementById('burger');
const overlay = document.getElementById('mobileOverlay');
const overlayClose = document.getElementById('overlayClose');

function openMenu() {
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  burger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}
function closeMenu() {
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  burger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

burger.addEventListener('click', openMenu);
overlayClose.addEventListener('click', closeMenu);
overlay.querySelectorAll('.overlay-link').forEach(link => {
  link.addEventListener('click', closeMenu);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

/* ============================================================
   PARALLAX HERO
   ============================================================ */
const heroBg = document.getElementById('heroBg');

function heroParallax() {
  const scrolled = window.scrollY;
  if (scrolled < window.innerHeight * 1.5) {
    heroBg.querySelector('img').style.transform =
      `scale(1.08) translateY(${scrolled * 0.28}px)`;
  }
}
window.addEventListener('scroll', heroParallax, { passive: true });

// Subtle cursor parallax on hero
const heroSection = document.getElementById('hero');
heroSection.addEventListener('mousemove', e => {
  const { clientX, clientY } = e;
  const dx = (clientX / window.innerWidth  - 0.5) * 14;
  const dy = (clientY / window.innerHeight - 0.5) * 10;
  heroBg.querySelector('img').style.transform =
    `scale(1.08) translate(${dx}px, ${dy}px)`;
});
heroSection.addEventListener('mouseleave', () => {
  heroBg.querySelector('img').style.transform = 'scale(1.08)';
});

/* ============================================================
   REVEAL ON SCROLL
   ============================================================ */
const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

/* ============================================================
   STAGGERED REVEAL WITHIN SERIES
   ============================================================ */
document.querySelectorAll('.series.reveal').forEach((series, i) => {
  series.style.transitionDelay = `${(i % 3) * 0.06}s`;
});

/* ============================================================
   SMOOTH ANCHOR SCROLL (override for nav-h offset)
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const id = anchor.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'));
    window.scrollTo({
      top: target.offsetTop - (id === 'hero' ? 0 : navH),
      behavior: 'smooth'
    });
  });
});

/* ============================================================
   TYPEWRITER HERO
   ============================================================ */
function typewriterHero() {
  const spanFirst = document.querySelector('.hero-title [data-i18n="hero.name.first"]');
  const spanLast  = document.querySelector('.hero-title [data-i18n="hero.name.last"]');
  if (!spanFirst || !spanLast) return;

  const textFirst = spanFirst.textContent;
  const textLast  = spanLast.textContent;
  const SPEED = 75; // мс на символ

  spanFirst.textContent = '';
  spanLast.textContent  = '';

  // Сразу показываем заголовок (без ожидания reveal) и включаем курсор
  const heroTitle = document.querySelector('.hero-title');
  heroTitle.classList.add('visible', 'typing');

  let i = 0;
  function typeFirst() {
    if (i < textFirst.length) {
      spanFirst.textContent += textFirst[i++];
      setTimeout(typeFirst, SPEED);
    } else {
      // Пауза перед второй строкой
      setTimeout(typeLast, SPEED * 3);
    }
  }

  let j = 0;
  function typeLast() {
    if (j < textLast.length) {
      spanLast.textContent += textLast[j++];
      setTimeout(typeLast, SPEED);
    } else {
      // Курсор мигает ещё секунду, затем исчезает
      setTimeout(() => heroTitle.classList.remove('typing'), 1000);
      // Подпись под именем появляется после завершения печати
      const tagline = document.querySelector('.hero-tagline');
      if (tagline) setTimeout(() => tagline.classList.add('visible'), 350);
    }
  }

  // Небольшая задержка перед стартом
  setTimeout(typeFirst, 400);
}

/* ============================================================
   CAROUSEL CARD LINKS → series page anchors
   ============================================================ */
(function () {
  const pageMap = {
    fate:     'series-fate.html',
    dutch:    'series-dutch.html',
    wind:     'series-wind.html',
    egg:      'series-egg.html',
    life:     'series-life.html',
    miracle:  'series-miracle.html',
    graphics: 'series-graphics.html',
    lucism:   'series-lucism.html',
    music:    'series-music.html',
    ceramics: 'series-ceramica.html',
  };
  document.querySelectorAll('.series[data-series]').forEach(seriesEl => {
    const page = pageMap[seriesEl.dataset.series];
    if (!page) return;
    seriesEl.querySelectorAll('.card img').forEach((img, i) => {
      const a = document.createElement('a');
      a.href = `${page}#work-${i + 1}`;
      a.style.display = 'block';
      img.parentNode.insertBefore(a, img);
      a.appendChild(img);
    });
  });
})();

/* ============================================================
   STATEMENT TOGGLE (index.html)
   ============================================================ */
(function () {
  const sc = document.getElementById('statementCollapse');
  const st = document.getElementById('statementToggle');
  if (!sc || !st) return;
  const txt = st.querySelector('.statement-toggle-text');
  st.addEventListener('click', () => {
    const open = sc.classList.contains('expanded');
    sc.classList.toggle('collapsed', open);
    sc.classList.toggle('expanded', !open);
    st.classList.toggle('open', !open);
    st.setAttribute('aria-expanded', String(!open));
    if (txt) txt.textContent = open ? 'Читать полностью' : 'Свернуть';
  });
})();

/* ============================================================
   INIT
   ============================================================ */
applyLang('ru');
typewriterHero();
