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
        let res = await fetch('https://anime-api15.p.rapidapi.com/anime/search?query=naruto', options);
        console.log("search?query=naruto:", res.status);
        if (res.ok) console.log((await res.text()).slice(0, 200));

        res = await fetch('https://anime-api15.p.rapidapi.com/anime/search/naruto', options);
        console.log("search/naruto:", res.status);
        if (res.ok) console.log((await res.text()).slice(0, 200));
        
        res = await fetch('https://anime-api15.p.rapidapi.com/anime/trending', options);
        console.log("trending:", res.status);
        if (res.ok) console.log((await res.text()).slice(0, 200));
        
        res = await fetch('https://anime-api15.p.rapidapi.com/anime/home', options);
        console.log("home:", res.status);
        if (res.ok) console.log((await res.text()).slice(0, 200));
    } catch (e) {
        console.error(e);
    }
}
test();
