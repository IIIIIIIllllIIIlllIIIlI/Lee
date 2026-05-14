const flashcard = document.getElementById('flashcard');
const cardFront = document.getElementById('cardFront');
const cardBack = document.getElementById('cardBack');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const flipButton = document.getElementById('flipButton');
const currentIndex = document.getElementById('currentIndex');
const totalCount = document.getElementById('totalCount');

const cards = [
  { en: 'apple', zh: '蘋果' },
  { en: 'garden', zh: '花園' },
  { en: 'library', zh: '圖書館' },
  { en: 'teacher', zh: '老師' },
  { en: 'friend', zh: '朋友' },
  { en: 'beautiful', zh: '美麗的' },
  { en: 'language', zh: '語言' },
  { en: 'journey', zh: '旅程' },
  { en: 'music', zh: '音樂' },
  { en: 'science', zh: '科學' },
];

let currentCard = 0;
let isFlipped = false;

totalCount.textContent = cards.length;

function renderCard() {
  const card = cards[currentCard];
  cardFront.textContent = card.en;
  cardBack.textContent = card.zh;
  currentIndex.textContent = currentCard + 1;

  if (isFlipped) {
    flashcard.classList.add('flipped');
  } else {
    flashcard.classList.remove('flipped');
  }
}

function showNextCard() {
  currentCard = (currentCard + 1) % cards.length;
  isFlipped = false;
  renderCard();
}

function showPrevCard() {
  currentCard = (currentCard - 1 + cards.length) % cards.length;
  isFlipped = false;
  renderCard();
}

function flipCard() {
  isFlipped = !isFlipped;
  renderCard();
}

prevButton.addEventListener('click', showPrevCard);
nextButton.addEventListener('click', showNextCard);
flipButton.addEventListener('click', flipCard);
flashcard.addEventListener('click', flipCard);

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'arrowright' || key === 'd') {
    showNextCard();
  }
  if (key === 'arrowleft' || key === 'a') {
    showPrevCard();
  }
  if (key === ' ' || key === 'enter') {
    flipCard();
  }
});

renderCard();
