document.addEventListener('DOMContentLoaded', function () {
  const searchInput = document.getElementById('searchInput');
  const cards = document.querySelectorAll('.card');
  const emptyState = document.getElementById('emptyState');
  const cardsContainer = document.getElementById('cardsContainer');

  searchInput?.addEventListener('input', function () {
    const term = this.value.toLowerCase();
    let hasResults = false;

    cards.forEach(card => {
      const title = card.getAttribute('data-title');
      const match = title.includes(term);
      card.classList.toggle('hidden', !match);
      if (match) hasResults = true;
    });

    if (hasResults || term === '') {
      emptyState.classList.add('hidden');
      cardsContainer.classList.remove('hidden');
    } else {
      emptyState.classList.remove('hidden');
      cardsContainer.classList.add('hidden');
    }
  });
});
