# Anime & Manga Watchlist Tracker

REST API yang mengintegrasikan Kitsu API (Edge Specification) untuk pencarian katalog publik dengan database lokal untuk melacak status tontonan dan bacaan pengguna.

## Language

**WatchlistItem**:
Entitas anime atau manga yang disimpan oleh user ke dalam daftar pantau pribadinya.
_Avoid_: Bookmark, favorite, saved_item

**ItemType**:
Klasifikasi media dari entitas yang dilacak, terbatas pada `anime` atau `manga`.
_Avoid_: Category, media_kind

**WatchStatus**:
Status progres tontonan atau bacaan pengguna, dengan nilai: `plan_to_watch`, `watching`, `completed`, `dropped`.
_Avoid_: State, condition

**Progress**:
Jumlah unit yang telah diselesaikan oleh pengguna (episode untuk anime, bab/chapter untuk manga).
_Avoid_: Current_episode, step

**Score**:
Penilaian numerik pribadi pengguna terhadap suatu entitas dengan rentang skala 1 hingga 10.
_Avoid_: Rating, stars, grade

**PublicCatalog**:
Data referensi asli anime/manga yang diambil secara langsung dari Kitsu API (Edge Specification).
_Avoid_: ExternalDB, MALData, JikanData
