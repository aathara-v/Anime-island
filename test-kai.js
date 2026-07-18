import { ANIME } from "@consumet/extensions";
const kai = new ANIME.AnimeKai();
kai.fetchRecentlyUpdated(1).then(r => console.log(r)).catch(e => console.error(e));
