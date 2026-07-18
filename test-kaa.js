import { ANIME } from "@consumet/extensions";
const kaa = new ANIME.KickAssAnime();
kaa.search("naruto").then(r => console.log(r)).catch(e => console.error(e));
