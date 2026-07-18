import { ANIME } from "@consumet/extensions";

const hianime = new ANIME.Hianime();
hianime.search("naruto").then(res => {
  console.log("Search Success");
}).catch(e => {
  console.log("Search failed:", e.message);
});
