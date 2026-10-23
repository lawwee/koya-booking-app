import { renderBookPage } from './pages/book.page.js';
import { renderBookingDetailPage } from './pages/booking-detail.page.js';
import { renderMyBookingsPage } from './pages/my-bookings.page.js';
import { renderResetPage } from './pages/reset.page.js';
import { renderSettingsPage } from './pages/settings.page.js';
import { renderSlotsPage } from './pages/slots.page.js';
import { render } from './utils/view.js';

const DEFAULT_PAGE = 'slots';

const routes = {
  slots: ({ query }) => renderSlotsPage(query),
  book: ({ query }) => renderBookPage(query),
  bookings: ({ id }) => renderBookingDetailPage(id),
  my: ({ query }) => renderMyBookingsPage(query),
  reset: () => renderResetPage(),
  settings: () => renderSettingsPage(),
};

function renderNotFound() {
  render('<h1>Page not found</h1><p><a href="#/slots">Back to slots</a></p>');
}

// Hashes look like "#/page/id?key=value".
function parseHash(hash) {
  const route = hash.startsWith('#/') ? hash.slice(2) : DEFAULT_PAGE;
  const [path, queryString = ''] = route.split('?');
  const segments = path.split('/').filter(Boolean);

  return {
    page: segments[0] || DEFAULT_PAGE,
    id: segments[1] ? decodeURIComponent(segments[1]) : '',
    query: new URLSearchParams(queryString),
  };
}

function highlightNav(page) {
  document.querySelectorAll('#nav a').forEach((link) => {
    link.classList.toggle('on', link.dataset.page === page);
  });
}

export function route() {
  const { page, id, query } = parseHash(location.hash);
  highlightNav(page);

  const renderPage = routes[page];
  if (renderPage) {
    renderPage({ id, query });
  } else {
    renderNotFound();
  }
}
