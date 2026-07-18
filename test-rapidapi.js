const url = 'https://crunchyroll-top-anime-api-by-apirobots.p.rapidapi.com/v1/crunchyroll-top/random';
const options = {
  method: 'GET',
  headers: {
    'x-rapidapi-key': '62c48c6157msha30d00c7e9c20dcp1b8058jsn3aa2d22e2151',
    'x-rapidapi-host': 'crunchyroll-top-anime-api-by-apirobots.p.rapidapi.com',
    'Content-Type': 'application/json'
  }
};

fetch(url, options)
  .then(res => res.json())
  .then(res => console.log(res))
  .catch(console.error);
