// stats.js

// asynchronous function to fetch JSON
async function get_json(url) {
  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error();
    }

    return await res.json();
  } catch (err) {
    return {}; // empty object
  }
}

// get GitHub statistics and write to element with id="stats"
async function get_stats() {
  try {
    // all repos on micahdbak
    let repos = await fetch("https://api.github.com/users/micahdbak/repos");

    if (!repos.ok) {
      throw new Error();
    }

    repos = await repos.json();

    // extra repos, not under micahdbak
    repos.push(...[
      { "languages_url": "https://api.github.com/repos/csss/csss-site-frontend/languages" },
      { "languages_url": "https://api.github.com/repos/csss/csss-site-backend/languages" },
      { "languages_url": "https://api.github.com/repos/Vixlump/GG/languages" },
      { "languages_url": "https://api.github.com/repos/AntTracker/AntTracker/languages" }
    ]);

    let languages = {};
    let requests = [];

    // accumulate languages used in all repos
    repos.forEach(repo => {
      requests.push(get_json(repo.languages_url));
    });

    // wait for all requests to resolve
    requests = await Promise.all(requests);

    // accumulate stats for all fetched languages
    requests.forEach(_languages => {
      Object.keys(_languages).forEach(lang => {
        if (languages[lang] === undefined) {
          languages[lang] = _languages[lang];
        } else {
          languages[lang] += _languages[lang];
        }
      });
    });

    // make languages an array, then sort by amount used
    languages = Object.entries(languages);
    languages.sort((a, b) => b[1] - a[1]);

    // get percentage of language usage
    const sum = languages.reduce((a, it) => a + it[1], 0);

    // map to percentage
    languages = languages.map(
      it => [it[0], ((it[1] / sum) * 100).toFixed(0)]
    );

    // map to displayable string
    languages = languages.map(
      it => `<b>${it[0]}</b> ` + (it[1] < 1 ? "(<1%)" : `(${it[1]}%)`)
    );

    // display language stats on page
    const stats = document.getElementById("stats");
    stats.innerHTML = languages.join("<br />\n");
  } catch (err) {
    console.log(err);
  }
}

get_stats();
