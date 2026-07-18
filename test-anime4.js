import { ANIME } from "@consumet/extensions";

const animepahe = new ANIME.AnimePahe();
let proto = Object.getPrototypeOf(animepahe);
while (proto && proto.constructor.name !== 'Object') {
    console.log(proto.constructor.name, Object.getOwnPropertyNames(proto));
    proto = Object.getPrototypeOf(proto);
}
