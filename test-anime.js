import { ANIME } from "@consumet/extensions";

const hianime = new ANIME.Hianime();
const animepahe = new ANIME.AnimePahe();
const animesaturn = new ANIME.AnimeSaturn();

console.log("Hianime:", !!hianime.fetchTopAiring);
console.log("Animepahe:", !!animepahe.fetchTopAiring);
console.log("AnimeSaturn:", !!animesaturn.fetchTopAiring);
