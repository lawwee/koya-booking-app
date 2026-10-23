import { route } from './router.js';

window.addEventListener('hashchange', route);
route();
