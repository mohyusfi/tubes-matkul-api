/**
 * [DEPRECATED] Layanan ini telah dimigrasikan ke Kitsu API (src/services/kitsu.js).
 * Berkas ini dipertahankan sebagai backward-compatible bridge / alias.
 */
import kitsuService from './kitsu.js';

export const jikanService = kitsuService;
export default kitsuService;
