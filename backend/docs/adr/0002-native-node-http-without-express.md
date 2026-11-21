# Native Node.js HTTP Module without Express

Untuk arsitektur API proyek ini, kami memutuskan untuk tidak menggunakan framework web eksternal (seperti Express.js atau Fastify), melainkan mengandalkan modul bawaan standar Node.js (`node:http`).

Keputusan ini diambil untuk menunjukkan penguasaan fundamental protokol HTTP tingkat rendah (parsing URL, handling request streams, manual header dispatching, dan status codes) tanpa ketergantungan pada middleware eksternal.
