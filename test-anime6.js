import { ANIME } from "@consumet/extensions";

const obj = new ANIME.Hianime();
let proto = Object.getPrototypeOf(obj);
while (proto && proto.constructor.name !== 'Object') {
    console.log(proto.constructor.name, Object.getOwnPropertyNames(proto));
    proto = Object.getPrototypeOf(proto);
}
