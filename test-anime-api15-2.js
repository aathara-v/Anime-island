const options = {
  method: 'GET',
  headers: {
    'x-rapidapi-key': '62c48c6157msha30d00c7e9c20dcp1b8058jsn3aa2d22e2151',
    'x-rapidapi-host': 'anime-api15.p.rapidapi.com',
    'Content-Type': 'application/json'
  }
};

async function test() {
    try {
        let res = await fetch('https://anime-api15.p.rapidapi.com/anime/search/naruto', options);
        console.log("search/naruto:", res.status);
        console.log(await res.text());
    } catch (e) {
        console.error(e);
    }
}
test();
