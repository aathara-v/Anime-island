import { ANIME } from "@consumet/extensions";

async function testProvider(name, P) {
    try {
        const p = new P();
        const r = await p.search("naruto");
        console.log(name, "SUCCESS", r.results.length);
    } catch (e) {
        console.log(name, "FAILED", e.message);
    }
}

async function run() {
    for (const key of Object.keys(ANIME)) {
        await testProvider(key, ANIME[key]);
    }
}
run();
